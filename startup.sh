#!/bin/bash

# =============================================================================
# Complete Startup Script for Agricultural Platform
# =============================================================================

set -e  # Exit on any error

echo "🚀 Starting Agricultural Platform Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_success "Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
        print_error "Neither docker-compose nor 'docker compose' is available"
        exit 1
    else
        COMPOSE_CMD="docker compose"
    fi
else
    COMPOSE_CMD="docker-compose"
fi

print_success "Docker Compose is available"

# =============================================================================
# Step 1: Environment Setup
# =============================================================================

print_status "Setting up environment..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.example .env 2>/dev/null || echo "DATABASE_URL=postgresql+asyncpg://agri_user:agri_password@postgres:5432/agri_db" > .env
fi

# Create necessary directories
mkdir -p artifacts uploads cache logs

print_success "Environment setup complete"

# =============================================================================
# Step 2: Build and Start Services
# =============================================================================

print_status "Building Docker images..."

# Build the application
$COMPOSE_CMD build --no-cache

print_success "Docker images built successfully"

print_status "Starting services..."

# Start services in the correct order
$COMPOSE_CMD up -d postgres redis

print_status "Waiting for database to be ready..."

# Wait for PostgreSQL to be ready
timeout=60
counter=0
while ! $COMPOSE_CMD exec -T postgres pg_isready -U agri_user -d agri_db > /dev/null 2>&1; do
    if [ $counter -eq $timeout ]; then
        print_error "Database failed to start within $timeout seconds"
        $COMPOSE_CMD logs postgres
        exit 1
    fi
    counter=$((counter + 1))
    sleep 1
    echo -n "."
done

print_success "Database is ready"

print_status "Waiting for Redis to be ready..."

# Wait for Redis to be ready
counter=0
while ! $COMPOSE_CMD exec -T redis redis-cli ping > /dev/null 2>&1; do
    if [ $counter -eq $timeout ]; then
        print_error "Redis failed to start within $timeout seconds"
        $COMPOSE_CMD logs redis
        exit 1
    fi
    counter=$((counter + 1))
    sleep 1
    echo -n "."
done

print_success "Redis is ready"

# Start the backend
print_status "Starting backend service..."
$COMPOSE_CMD up -d backend

# Wait for backend to be ready
print_status "Waiting for backend to be ready..."
counter=0
while ! curl -f http://localhost:8005/health > /dev/null 2>&1; do
    if [ $counter -eq $timeout ]; then
        print_error "Backend failed to start within $timeout seconds"
        $COMPOSE_CMD logs backend
        exit 1
    fi
    counter=$((counter + 1))
    sleep 2
    echo -n "."
done

print_success "Backend is ready"

# Start frontend (if configured)
if [ -f nginx.conf ]; then
    print_status "Starting frontend service..."
    $COMPOSE_CMD up -d frontend
    print_success "Frontend is ready"
fi

# =============================================================================
# Step 3: Initialize Application Data
# =============================================================================

print_status "Initializing application data..."

# Run database migrations (if you have them)
if [ -f "migrations.py" ]; then
    print_status "Running database migrations..."
    $COMPOSE_CMD exec backend python migrations.py
fi

# Setup ML artifacts
if [ -f "setup_artifacts.py" ]; then
    print_status "Setting up ML artifacts..."
    $COMPOSE_CMD exec backend python setup_artifacts.py
fi

print_success "Application data initialized"

# =============================================================================
# Step 4: Health Checks and Status
# =============================================================================

print_status "Performing health checks..."

# Check all services
services=("postgres" "redis" "backend")
if [ -f nginx.conf ]; then
    services+=("frontend")
fi

for service in "${services[@]}"; do
    if $COMPOSE_CMD ps | grep -q "$service.*Up"; then
        print_success "$service is running"
    else
        print_error "$service is not running"
        $COMPOSE_CMD logs "$service"
    fi
done

# =============================================================================
# Step 5: Display Connection Information
# =============================================================================

echo ""
echo "🎉 Agricultural Platform is now running!"
echo ""
echo "📋 Service URLs:"
echo "   🗄️  Database:  localhost:5432"
echo "   🔴 Redis:     localhost:6379"
echo "   🚀 Backend:   http://localhost:8005"
echo "   📖 API Docs:  http://localhost:8005/docs"
if [ -f nginx.conf ]; then
    echo "   🌐 Frontend:  http://localhost:8080"
fi
echo ""
echo "🔧 Useful Commands:"
echo "   View logs:           $COMPOSE_CMD logs -f [service_name]"
echo "   Stop all services:   $COMPOSE_CMD down"
echo "   Restart service:     $COMPOSE_CMD restart [service_name]"
echo "   Access database:     $COMPOSE_CMD exec postgres psql -U agri_user -d agri_db"
echo "   Access backend:      $COMPOSE_CMD exec backend bash"
echo ""
echo "🧪 Test the setup:"
echo "   curl http://localhost:8005/health"
echo "   curl http://localhost:8005/docs"
echo ""

# =============================================================================
# Step 6: Optional - Run Tests
# =============================================================================

if [ "$1" = "--test" ]; then
    print_status "Running tests..."
    
    # Test database connection
    if $COMPOSE_CMD exec -T backend python -c "
import asyncio
import asyncpg
async def test_db():
    conn = await asyncpg.connect('postgresql://agri_user:agri_password@postgres:5432/agri_db')
    result = await conn.fetchval('SELECT 1')
    await conn.close()
    print(f'Database test: {result}')
asyncio.run(test_db())
    "; then
        print_success "Database connection test passed"
    else
        print_error "Database connection test failed"
    fi
    
    # Test Redis connection
    if $COMPOSE_CMD exec -T backend python -c "
import redis
r = redis.Redis(host='redis', port=6379, db=0)
r.set('test', 'value')
result = r.get('test')
print(f'Redis test: {result}')
    "; then
        print_success "Redis connection test passed"
    else
        print_error "Redis connection test failed"
    fi
    
    # Test API endpoint
    if curl -f http://localhost:8005/health > /dev/null 2>&1; then
        print_success "API health check passed"
    else
        print_error "API health check failed"
    fi
fi

print_success "Setup complete! 🎉"