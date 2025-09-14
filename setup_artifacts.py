import pickle
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

# Mock agriculture Q&A data (same as in agriculture-data.ts)
agriculture_qa = [
    {
        "question": "How often should I water my tomato plants?",
        "answer": "Tomato plants need consistent moisture. Water them deeply 1-2 times per week, providing about 1-2 inches of water weekly. Water at the base of the plant to avoid wetting the leaves, which can lead to disease. During hot weather or if plants are in containers, you may need to water daily.",
        "category": "irrigation"
    },
    {
        "question": "What is the best fertilizer for corn crops?",
        "answer": "Corn requires high nitrogen levels. Use a balanced fertilizer with an NPK ratio of 10-10-10 or 12-12-12 at planting, followed by side-dressing with nitrogen fertilizer (such as 46-0-0 urea) when plants are 12-18 inches tall. Apply approximately 150-200 pounds of nitrogen per acre for optimal yield.",
        "category": "fertilization"
    },
    {
        "question": "How do I control aphids on my vegetable garden?",
        "answer": "Control aphids using integrated pest management: 1) Spray plants with water to dislodge aphids, 2) Use insecticidal soap or neem oil, 3) Encourage beneficial insects like ladybugs and lacewings, 4) Plant companion plants like marigolds or catnip, 5) Apply reflective mulch around plants to confuse aphids.",
        "category": "pest_control"
    },
    {
        "question": "When is the best time to plant wheat?",
        "answer": "Plant winter wheat in fall (September-November in the Northern Hemisphere) to allow for vernalization during winter. Plant spring wheat in early spring (March-May) as soon as soil can be worked. Soil temperature should be above 40°F (4°C) for germination.",
        "category": "planting"
    },
    {
        "question": "How deep should I plant corn seeds?",
        "answer": "Plant corn seeds 1.5-2 inches deep in optimal conditions. In cooler soils or early season planting, plant 1-1.5 inches deep. In sandy soils or dry conditions, plant up to 2.5 inches deep. Space seeds 4-6 inches apart in rows 30-36 inches apart.",
        "category": "planting"
    },
    {
        "question": "What causes yellowing leaves in plants?",
        "answer": "Yellow leaves can indicate several issues: 1) Nitrogen deficiency (starts with older leaves), 2) Overwatering or poor drainage, 3) Natural aging of older leaves, 4) Iron deficiency (chlorosis), 5) Disease or pest problems, 6) pH imbalance affecting nutrient uptake. Examine the pattern of yellowing to identify the cause.",
        "category": "plant_health"
    },
    {
        "question": "How do I improve clay soil for farming?",
        "answer": "Improve clay soil by: 1) Adding organic matter like compost, aged manure, or leaf mold annually, 2) Avoiding working soil when wet, 3) Adding coarse sand (not fine sand), 4) Installing drainage systems if needed, 5) Using cover crops to improve soil structure, 6) Adding gypsum to help clay particles aggregate.",
        "category": "soil_management"
    },
    {
        "question": "What is crop rotation and why is it important?",
        "answer": "Crop rotation is the practice of growing different crops in sequence on the same land. Benefits include: 1) Reduced pest and disease buildup, 2) Improved soil fertility, 3) Better weed control, 4) Enhanced soil structure, 5) Reduced need for chemical inputs. A typical rotation might be corn-soybeans-wheat or include legumes to fix nitrogen.",
        "category": "crop_management"
    },
    {
        "question": "How do I know if my soil pH is correct?",
        "answer": "Test soil pH using a digital pH meter, test strips, or professional soil testing. Most crops prefer pH 6.0-7.0. Symptoms of wrong pH: stunted growth, yellowing leaves, poor nutrient uptake. To raise pH, add lime; to lower pH, add sulfur or organic matter like peat moss. Retest annually and adjust gradually.",
        "category": "soil_testing"
    },
    {
        "question": "What are the signs of plant nutrient deficiency?",
        "answer": "Signs include: 1) Yellowing leaves (nitrogen), 2) Purple stems (phosphorus), 3) Brown leaf edges (potassium), 4) Stunted growth (multiple deficiencies), 5) Poor fruit set. Conduct soil tests to confirm and apply appropriate fertilizers.",
        "category": "plant_health"
    }
]

# Extract questions and answers
questions = [item["question"] for item in agriculture_qa]
answers = [item["answer"] for item in agriculture_qa]

# Save meta data
meta = {
    "questions": questions,
    "answers": answers
}

with open("artifacts/qa_meta.pkl", "wb") as f:
    pickle.dump(meta, f)

# Create embeddings
embed_model = SentenceTransformer("all-MiniLM-L6-v2")
embeddings = embed_model.encode(questions, convert_to_numpy=True)

# Normalize embeddings
faiss.normalize_L2(embeddings)

# Create FAISS index
dimension = embeddings.shape[1]
index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
index.add(embeddings)

# Save index
faiss.write_index(index, "artifacts/qa_index.faiss")

print("Artifacts created successfully!")