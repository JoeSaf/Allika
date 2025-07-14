#!/bin/bash

echo "🚀 Starting Alika Event Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Backend dependencies not found. Installing..."
    cd backend
    npm install
    cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Frontend dependencies not found. Installing..."
    npm install
fi

# Check if backend .env exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found. Creating from template..."
    cp backend/env.example backend/.env
    echo "📝 Please edit backend/.env with your database credentials before starting."
    echo "   You can start the servers after configuring the environment variables."
    exit 1
fi

echo "✅ All dependencies installed and configured!"

# Start backend server in background
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Alika is starting up!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:5000"
echo "📊 Health:   http://localhost:5000/health"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait 