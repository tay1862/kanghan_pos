#!/bin/bash

# Kanghan POS Deployment Script
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Deploying Kanghan POS to $ENVIRONMENT..."

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    set -a
    source ".env.$ENVIRONMENT"
    set +a
    echo "✓ Loaded .env.$ENVIRONMENT"
elif [ -f ".env" ]; then
    set -a
    source ".env"
    set +a
    echo "✓ Loaded .env"
else
    echo "⚠️  Warning: No .env file found. Make sure MYSQL_ROOT_PASSWORD, JWT_SECRET, NEXT_PUBLIC_APP_URL are exported."
fi

# Check required environment variables
if [ -z "$MYSQL_ROOT_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
    echo "❌ Missing required environment variables: MYSQL_ROOT_PASSWORD, JWT_SECRET"
    echo "   Please export them or create a .env.production file"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✓ Docker is running"

# Check if MariaDB/MySQL is running on host
if ! mysqladmin ping --silent 2>/dev/null; then
    echo "⚠️  Warning: MySQL/MariaDB may not be running on host port 3306"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans

# Build and start containers
echo "🔨 Building and starting containers (this may take a few minutes)..."
docker-compose up -d --build

# Wait for app to start
echo "⏳ Waiting for application to start..."
sleep 10

# Show recent logs
echo "� Recent logs:"
docker-compose logs --tail=30 app

echo ""
echo "✅ Deployment complete!"
echo "� Application running at: ${NEXT_PUBLIC_APP_URL:-http://localhost:3006}"
echo ""
echo "To follow live logs: docker-compose logs -f app"
echo "To seed database manually: docker-compose exec app node node_modules/.bin/prisma db seed"
