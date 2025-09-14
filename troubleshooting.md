# 🔧 Docker Connection Troubleshooting Guide

## Architecture Overview

```
Frontend (Port 8080) ↔ Backend (Port 8005) ↔ Database (Port 5432)
        │                       │                      │
        │                       │                      │
    JavaScript              FastAPI              PostgreSQL
    fetch() calls           Python app            + Redis (6379)
```

## 🚨 Most Common Mistakes

### 1. Using `localhost` in Docker Networks

❌ **WRONG** - This won't work inside containers:
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379/0
```

✅ **CORRECT** - Use Docker service names:
```bash
DATABASE_URL=postgresql://user:pass@postgres:5432/db
REDIS_URL=redis://redis:6379/0
```

### 2. Frontend API Calls to Wrong URLs

❌ **WRONG** - Hardcoded localhost:
```javascript
fetch('http://localhost:8005/api/users')
```

✅ **CORRECT** - Environment-aware configuration:
```javascript
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:8005' 
    : 'http://your-production-domain.com';
fetch(`${API_BASE}/api/users`)
```

### 3. Missing Docker Network Configuration

❌ **WRONG** - No network defined:
```yaml
services:
  backend:
    # ... no networks
  postgres:
    # ... no networks
```

✅ **CORRECT** - Explicit network:
```yaml
services:
  backend:
    networks:
      - app_network
  postgres:
    networks:
      - app_network
networks:
  app_network:
    driver: bridge
```

## 🔍 Step-by-Step Debugging

### Step 1: Check Docker Network Connectivity

```bash
# List running containers
docker ps

# Check if containers can reach each other
docker exec -it agri_backend ping postgres
docker exec -it agri_backend ping redis

# Test database connection from backend container
docker exec -it agri_backend python -c "
import asyncpg
import asyncio
async def test():
    conn = await asyncpg.connect('postgresql://agri_user:agri_password@postgres:5432/agri_db')
    result = await conn.fetchval('SELECT version()')
    print(result)
    await conn.close()
asyncio.run(test())
"
```

### Step 2: Verify Environment Variables

```bash
# Check backend environment
docker exec -it agri_backend env | grep DATABASE_URL
docker exec -it agri_backend env | grep REDIS_URL

# Test environment loading in Python
docker exec -it agri_backend python -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('DATABASE_URL:', os.getenv('DATABASE_URL'))
print('REDIS_URL:', os.getenv('REDIS_URL'))
"
```

### Step 3: Test API Endpoints

```bash
# Health check
curl http://localhost:8005/health

# Test with verbose output
curl -v http://localhost:8005/docs

# Test from inside backend container
docker exec -it agri_backend curl http://localhost:8005/health
```

### Step 4: Check Database Connectivity

```bash
# Connect to database directly
docker exec -it agri_postgres psql -U agri_user -d agri_db

# Test from backend container
docker exec -it agri_backend python -c "
from sqlalchemy import create_engine
engine = create_engine('postgresql://agri_user:agri_password@postgres:5432/agri_db')
with engine.connect() as conn:
    result = conn.execute('SELECT 1')
    print('Database connection successful:', result.fetchone())
"
```

## 🛠️ Common Fixes

### Fix 1: Database Connection Issues

If you see `connection refused` errors:

1. **Check service order in docker-compose.yml:**
```yaml
services:
  backend:
    depends_on:
      postgres:
        condition: service_healthy
```

2. **Add health checks:**
```yaml
postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U agri_user -d agri_db"]
    interval: 10s
    timeout: 5s
    retries: 5
```

### Fix 2: CORS Issues

If frontend can't reach backend:

1. **Update FastAPI CORS settings:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Fix 3: Port Conflicts

If ports are already in use:

```bash
# Check what's using the port
lsof -i :8005
netstat -tulpn | grep :8005

# Kill the process or change ports in docker-compose.yml
```

## 📋 Complete Startup Checklist

1. **Environment Setup:**
   - [ ] `.env` file exists with correct DATABASE_URL
   - [ ] Docker service names used (not localhost)
   - [ ] All required environment variables set

2. **Docker Configuration:**
   - [ ] `docker-compose.yml` has proper networks
   - [ ] Health checks configured
   - [ ] Correct service dependencies

3. **Database Setup:**
   - [ ] PostgreSQL container starts successfully
   - [ ] Database and user created
   - [ ] Extensions installed (PostGIS, vector)

4. **Backend Configuration:**
   - [ ] FastAPI app loads environment variables
   - [ ] Database connection works
   - [ ] Redis connection works
   - [ ] CORS properly configured

5. **Frontend Configuration:**
   - [ ] API base URL configured correctly
   - [ ] Authentication headers included
   - [ ] Error handling implemented

## 🚀 Quick Start Commands

```bash
# Complete setup
chmod +x startup.sh
./startup.sh

# Or manual steps:
docker-compose build
docker-compose up -d postgres redis
# Wait for services to be ready
docker-compose up -d backend
docker-compose up -d frontend

# Verify everything is working
curl http://localhost:8005/health
curl http://localhost:8005/docs
```

## 📊 Monitoring and Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Monitor resource usage
docker stats

# Check container health
docker-compose ps
```

## 🔒 Security Considerations

1. **Production Environment Variables:**
```bash
# Use strong passwords
POSTGRES_PASSWORD=your-strong-password
SECRET_KEY=your-secret-key-32-characters-long

# Restrict CORS origins
ALLOW_ORIGINS=https://yourdomain.com
```

2. **Network Security:**
```yaml
# Don't expose database ports in production
postgres:
  # ports:
  #   - "5432:5432"  # Remove this line
```

3. **SSL/TLS:**
```yaml
# Use HTTPS in production
nginx:
  volumes:
    - ./ssl:/etc/nginx/ssl
```

## 🆘 Emergency Debugging

If nothing works, try this nuclear option:

```bash
# Stop everything
docker-compose down -v

# Remove all containers and volumes
docker system prune -a --volumes

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d

# Check logs immediately
docker-compose logs -f
```

Remember: The key to Docker networking is using **service names** instead of `localhost` for inter-container communication!