#!/bin/bash

# Kanghan POS Health Check Script
# Usage: ./health-check.sh [url]

URL=${1:-http://localhost:3000}

echo "🏥 Running health check for Kanghan POS..."
echo "URL: $URL"

# Check if app is responding
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL/kanghan/login")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Application is healthy (HTTP $HTTP_CODE)"
    
    # Check database connection
    if docker-compose ps | grep -q "kanghan_mysql.*Up"; then
        echo "✅ MySQL container is running"
    else
        echo "⚠️  MySQL container is not running"
        exit 1
    fi
    
    # Check app container
    if docker-compose ps | grep -q "kanghan_pos.*Up"; then
        echo "✅ App container is running"
    else
        echo "⚠️  App container is not running"
        exit 1
    fi
    
    echo "✅ All systems operational"
    exit 0
else
    echo "❌ Application is not responding (HTTP $HTTP_CODE)"
    echo "📋 Recent logs:"
    docker-compose logs --tail=20 app
    exit 1
fi
