#!/bin/bash

echo "🚀 Installing Alika Backend Dependencies..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
else
    echo "✅ .env file already exists"
fi

# Create uploads directory if it doesn't exist
if [ ! -d uploads ]; then
    echo "📁 Creating uploads directory..."
    mkdir -p uploads
    echo "✅ Uploads directory created"
else
    echo "✅ Uploads directory already exists"
fi

echo ""
echo "🎉 Installation completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your database and API credentials"
echo "2. Set up MySQL database"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "For more information, see README.md" 