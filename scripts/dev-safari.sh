#!/bin/bash

# Start development server in Safari
echo "🚀 Starting development server..."
echo "📱 Opening Safari browser..."

# Start Vite dev server in background
npm run dev &
DEV_PID=$!

# Wait a moment for server to start
sleep 3

# Open Safari with the local development URL
open -a Safari "http://localhost:8080"

# Keep the dev server running
wait $DEV_PID 