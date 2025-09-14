# app.py
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import faiss
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
from langdetect import detect, LangDetectException
from transformers import pipeline
from pathlib import Path
import uvicorn
import torch
import json
import threading
from typing import AsyncGenerator, List, Optional
import logging  # Added for logging
from huggingface_hub import hf_hub_download
from datetime import datetime, timedelta
import os
import time
from dotenv import load_dotenv
from llama_cpp import Llama
from redis.asyncio import Redis
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, DateTime, Text, func
from sqlalchemy.dialects.postgresql import VECTOR
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from jose import JWTError, jwt
from passlib.context import CryptContext
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="QA Backend with Telugu Support", description="Multilingual (te/en/hi) Voice/Chat QA with On-Demand Translation")

# Rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS origins from env
allow_origins = os.getenv("ALLOW_ORIGINS", "http://localhost:8000,http://localhost:8001,http://localhost:8002,http://localhost:8003,http://localhost:8004,http://localhost:8005,http://127.0.0.1:8000,http://127.0.0.1:8001,http://127.0.0.1:8002,http://127.0.0.1:8003,http://127.0.0.1:8004,http://127.0.0.1:8005").split(",")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup with PostgreSQL and asyncpg
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost/dbname")
engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)
Base = declarative_base()

# Redis for caching
redis = Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models for database
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=func.now())

class CommunityQuestion(Base):
    __tablename__ = "community_questions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False)
    user_name = Column(String, nullable=False)
    question = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    language = Column(String, default='en')
    image_data = Column(Text)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now())

class CommunityAnswer(Base):
    __tablename__ = "community_answers"
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("community_questions.id"), nullable=False)
    user_id = Column(String, nullable=False)
    user_name = Column(String, nullable=False)
    answer = Column(Text, nullable=False)
    is_ai_answer = Column(Boolean, default=False)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())

class UserVote(Base):
    __tablename__ = "user_votes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False)
    target_type = Column(String, nullable=False)
    target_id = Column(Integer, nullable=False)
    vote_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, nullable=False)
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now())

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.session_id"), nullable=False)
    user_id = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    language = Column(String, default='en')
    message_type = Column(String, default='user')
    created_at = Column(DateTime, default=func.now())

class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    language = Column(String, default='en')
    embedding = Column(VECTOR(768))  # Adjust dimension based on embed_model
    source = Column(String)  # e.g., 'kaggle_farming_faq'
    created_at = Column(DateTime, default=func.now())

# Create tables and install pgvector
async def init_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Install pgvector if not installed
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")

# Call on startup
@app.on_event("startup")
async def startup():
    await init_database()

# Global loads
ARTIFACTS_DIR = Path("artifacts")
try:
    # Use multilingual embedding model
    embed_model = SentenceTransformer("sentence-transformers/distiluse-base-multilingual-cased-v1")
except Exception as e:
    logger.error(f"Failed to load embed model: {str(e)}")
    raise RuntimeError("Embed model loading failed.")

# Model setup
model_repo = "QuantFactory/Phi-3-mini-4k-instruct-GGUF"
model_filename = "Phi-3-mini-4k-instruct.Q4_0.gguf"
model_path = ARTIFACTS_DIR / model_filename
if not model_path.exists():
    logger.info(f"Downloading GGUF model: {model_filename}")
    hf_hub_download(repo_id=model_repo, filename=model_filename, local_dir=ARTIFACTS_DIR)

logger.info(f"Using model file: {model_path}")

# Supported languages
SUPPORTED_LANGS = {'en', 'hi', 'te'}

# Translation pipelines
translator_to_en = {}
translator_from_en = {}

def get_translator(from_lang: str, to_lang: str):
    key = f"{from_lang}-{to_lang}"
    if key not in translator_to_en:
        try:
            if from_lang == 'hi' and to_lang == 'en':
                model_name = "Helsinki-NLP/opus-mt-hi-en"
            elif from_lang == 'te' and to_lang == 'en':
                model_name = "Helsinki-NLP/opus-mt-mul-en"  # Mul supports te → en
            else:
                model_name = f"Helsinki-NLP/opus-mt-{from_lang}-{to_lang}"
            translator_to_en[key] = pipeline("translation", model=model_name)
        except Exception as e:
            logger.error(f"Failed to load translator {key}: {str(e)}")
            raise RuntimeError(f"Translator loading failed for {key}")
    return translator_to_en[key]

def get_translator_from_en(to_lang: str):
    key = f"en-{to_lang}"
    if key not in translator_from_en:
        try:
            if to_lang == 'hi':
                model_name = "Helsinki-NLP/opus-mt-en-hi"
            elif to_lang == 'te':
                model_name = "Helsinki-NLP/opus-mt-en-mul"  # Mul supports en → te
            else:
                model_name = f"Helsinki-NLP/opus-mt-en-{to_lang}"
            translator_from_en[key] = pipeline("translation", model=model_name)
        except Exception as e:
            logger.error(f"Failed to load translator {key}: {str(e)}")
            raise RuntimeError(f"Translator loading failed for {key}")
    return translator_from_en[key]

# JWT functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return username

class RegisterUser(BaseModel):
    username: str
    password: str
    email: str

# Pydantic models (keep same as before for others)

# Lazy-loaded LLM
llm_model = None
llm_lock = threading.Lock()

async def get_db():
    async with SessionLocal() as session:
        yield session

# Replace FAISS with pgvector in retrieval
async def retrieve_from_pgvector(emb: np.ndarray, top_k: int = 3, db: AsyncSession = Depends(get_db)):
    # Query using cosine similarity (assuming L2 normalized)
    query_emb = emb.tolist()[0]
    results = await db.execute(
        "SELECT id, question, answer FROM knowledge_base ORDER BY embedding <=> :emb LIMIT :top_k",
        {"emb": query_emb, "top_k": top_k}
    )
    return results.fetchall()

# stream_query with caching and pgvector
async def stream_query(q: Query, top_k: int = 3):
    cache_key = f"query:{q.text}:{q.lang}:{q.translate_to}"
    cached = await redis.get(cache_key)
    if cached:
        yield json.dumps(json.loads(cached)) + "\n"
        return

    # ... (language detection and translation logic same)

    # Embed
    emb = await run_in_threadpool(
        embed_model.encode, [english_query], convert_to_numpy=True
    )

    # Retrieve from pgvector
    try:
        results = await retrieve_from_pgvector(emb, top_k)
        contexts = []
        for res in results:
            context = f"Q: {res[1]}\nA: {res[2]}\n"
            contexts.append(context)
        # Compute avg_score if needed, but pgvector gives similarity
    except Exception as e:
        logger.error(f"Retrieval error: {str(e)}")
        yield json.dumps({"error": "Retrieval failed", "status": "error"}) + "\n"
        return

    # ... (generation logic same)

    # Cache final
    final_response = {
        "generated_answer": llm_response,
        "status": "complete"
    }
    await redis.set(cache_key, json.dumps(final_response), ex=3600)
    yield json.dumps(final_response) + "\n"

# Community endpoints with auth and rate limit
@app.post("/community/questions")
@limiter.limit("5/minute")
async def post_question(question: CommunityQuestion, current_user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    new_question = CommunityQuestion(**question.dict(), user_id=current_user)
    db.add(new_question)
    await db.commit()
    await db.refresh(new_question)
    return {"status": "success", "question_id": new_question.id, "message": "Question posted successfully"}

# Similar adaptations for other endpoints using AsyncSession

# Registration
@app.post("/register")
async def register(user: RegisterUser, db: AsyncSession = Depends(get_db)):
    existing = await db.execute("SELECT * FROM users WHERE username = :username", {"username": user.username})
    if existing.fetchone():
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed = get_password_hash(user.password)
    new_user = User(username=user.username, hashed_password=hashed, email=user.email)
    db.add(new_user)
    await db.commit()
    return {"status": "success", "message": "User registered"}

# Login endpoint
@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user_query = await db.execute("SELECT * FROM users WHERE username = :username", {"username": form_data.username})
    user = user_query.fetchone()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = jwt.encode({"sub": form_data.username, "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": access_token, "token_type": "bearer"}

# ... (keep other endpoints, adapt to async db)

# Script for populating knowledge base (run separately)
# Example script to load dataset and insert
# Assuming CSV from Kaggle Farming FAQ
import pandas as pd
from sqlalchemy import create_engine

def populate_knowledge_base():
    df = pd.read_csv("farming_faq_dataset.csv")  # Download from Kaggle
    engine = create_engine(DATABASE_URL.replace("+asyncpg", ""))
    with engine.connect() as conn:
        for _, row in df.iterrows():
            emb = embed_model.encode(row['question'])
            conn.execute(
                "INSERT INTO knowledge_base (question, answer, embedding, source) VALUES (%s, %s, %s, %s)",
                (row['question'], row['answer'], emb.tolist(), 'kaggle_farming_faq')
            )
    # Similarly for other datasets like Agronomic QA

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8005)