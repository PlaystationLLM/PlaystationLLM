#!/bin/bash

echo "Setting up PS5-PC Bridge..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    echo "NODE_ENV=development" > .env
    echo "ELIZA_API_KEY=" >> .env
    echo "DEFAULT_GAME=fortnite" >> .env
fi

# Build TypeScript
echo "Building TypeScript..."
npm run build

echo "Setup complete! Please edit .env file to add your Eliza API key."
echo "Run 'npm start' to launch the bridge."
