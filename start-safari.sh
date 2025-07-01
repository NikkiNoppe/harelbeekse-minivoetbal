#!/bin/bash

echo "🚀 Starting Harelbeekse Minivoetbal in Safari..."
echo "📍 Location: $(pwd)"

# Start development server in background
npm run dev &
DEV_PID=$!

# Wait for server to start
sleep 3

# Open Safari
echo "🌐 Opening Safari..."
open -a Safari "http://localhost:8080"

echo "✅ Development server running! (PID: $DEV_PID)"
echo "🔗 URL: http://localhost:8080"
echo "⚠️  Press Ctrl+C to stop the server"

# Wait for the background process
wait $DEV_PID 