#!/bin/bash

# Stop dev server als die draait (optioneel, afhankelijk van je setup)
if pgrep -f "npm run dev" > /dev/null; then
  echo "Stop dev server..."
  pkill -f "npm run dev"
fi

# Opruimen
rm -rf node_modules .vite .next dist build

# Herinstalleren
npm install

# Start dev server
npm run dev 