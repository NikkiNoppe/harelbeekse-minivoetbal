#!/bin/bash

echo "🚀 Starting Harelbeekse Minivoetbal Development Server..."
echo "📂 Working directory: $(pwd)"
echo "📦 Package manager: checking..."

# Check which package manager is available and use it
if command -v bun &> /dev/null; then
    echo "✅ Using Bun"
    bun run dev
elif command -v npm &> /dev/null; then
    echo "✅ Using npm"
    npm run dev
elif command -v yarn &> /dev/null; then
    echo "✅ Using Yarn"
    yarn dev
elif command -v pnpm &> /dev/null; then
    echo "✅ Using pnpm"
    pnpm run dev
else
    echo "❌ No package manager found! Please install npm, yarn, pnpm, or bun."
    exit 1
fi 