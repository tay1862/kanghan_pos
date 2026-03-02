#!/bin/bash

# Kanghan POS Deployment Script
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Deploying Kanghan POS to $ENVIRONMENT..."

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
    echo "✓ Loaded .env.$ENVIRONMENT"
else
    echo "⚠️  Warning: .env.$ENVIRONMENT not found, using .env"
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✓ Docker is running"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose up -d --build

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
until docker-compose exec -T mysql mysqladmin ping -h localhost --silent; do
    echo "   MySQL is unavailable - sleeping"
    sleep 2
done

echo "✓ MySQL is ready"

# Run migrations
echo "🔄 Running database migrations..."
docker-compose exec -T app npx prisma migrate deploy

# Seed database (only if needed)
if [ "$ENVIRONMENT" = "development" ] || [ "$2" = "--seed" ]; then
    echo "🌱 Seeding database..."
    docker-compose exec -T app npx prisma db seed
fi

# Show logs
echo "📋 Application logs:"
docker-compose logs -f --tail=50 app

echo "✅ Deployment complete!"
echo "🌐 Application running at: $NEXT_PUBLIC_APP_URL"
