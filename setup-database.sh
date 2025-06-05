#!/bin/bash

echo "🚀 Setting up TurboVets Database..."

# Stop any existing API processes
echo "🛑 Stopping existing API processes..."
pkill -f "api-api:serve" 2>/dev/null || true
sleep 2

# Remove existing database if it exists
if [ -f "db.sqlite" ]; then
    echo "🗑️  Removing existing database..."
    rm db.sqlite
fi

# Clear NX cache
echo "🧹 Clearing NX cache..."
npx nx reset

# Build the API
echo "📦 Building API with database configuration..."
npx nx run api-api:build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Start the API in background
echo "🚀 Starting API server..."
npx nx run api-api:serve > api.log 2>&1 &
API_PID=$!

# Wait for API to start
echo "⏳ Waiting for API to start..."
sleep 10

# Check if API is responding
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3001/api > /dev/null 2>&1; then
        echo "✅ API is responding!"
        break
    fi
    echo "⏳ Waiting for API... (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ API failed to start properly"
    kill $API_PID 2>/dev/null
    exit 1
fi

# Wait a bit more for database to be created
echo "⏳ Waiting for database file to be created..."
sleep 5

# Run bootstrap script
echo "📝 Populating database with initial data..."
node bootstrap-simple.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Database setup completed successfully!"
    echo ""
    echo "📊 Your database is ready with:"
    echo "   - SQLite file: ./db.sqlite"
    echo "   - 3 Organizations (No Substitutions + PHX & DAL branches)"
    echo "   - 3 Users with different roles"
    echo "   - Sample tasks for testing"
    echo ""
    echo "🔗 API running at: http://localhost:3001/api"
    echo "🌐 Dashboard at: http://localhost:4200"
    echo ""
    echo "🧪 Test endpoints:"
    echo "   curl http://localhost:3001/api/organizations"
    echo "   curl http://localhost:3001/api/users"
    echo "   curl http://localhost:3001/api/tasks"
    echo ""
    echo "✨ API will continue running in background (PID: $API_PID)"
else
    echo "❌ Database population failed"
    kill $API_PID 2>/dev/null
    exit 1
fi 