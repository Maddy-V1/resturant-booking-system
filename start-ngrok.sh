#!/bin/bash

# College Canteen - Ngrok Setup Script
echo "🍽️  College Canteen - Starting with Ngrok"
echo "========================================"

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Please install it first:"
    echo "   brew install ngrok"
    exit 1
fi

echo "✅ ngrok is installed"

# Function to start backend
start_backend() {
    echo "🚀 Starting backend server..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    echo "Backend started with PID: $BACKEND_PID"
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting frontend server..."
    cd frontend-user
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    echo "Frontend started with PID: $FRONTEND_PID"
}

# Function to start ngrok for frontend
start_ngrok_frontend() {
    echo "🌐 Starting ngrok for frontend (port 3000)..."
    ngrok http 3000 &
    NGROK_FRONTEND_PID=$!
    echo "Frontend ngrok started with PID: $NGROK_FRONTEND_PID"
}

# Function to start ngrok for backend
start_ngrok_backend() {
    echo "🔗 Starting ngrok for backend (port 5001)..."
    ngrok http 5001 &
    NGROK_BACKEND_PID=$!
    echo "Backend ngrok started with PID: $NGROK_BACKEND_PID"
}

# Cleanup function
cleanup() {
    echo "🛑 Stopping all services..."
    kill $BACKEND_PID $FRONTEND_PID $NGROK_FRONTEND_PID $NGROK_BACKEND_PID 2>/dev/null
    echo "All services stopped."
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start all services
start_backend
sleep 3
start_frontend
sleep 3
start_ngrok_frontend
sleep 2
start_ngrok_backend

echo ""
echo "🎉 All services started!"
echo "📱 Check your ngrok dashboard at: http://localhost:4040"
echo "🔗 Use the HTTPS ngrok URL for your frontend on your phone"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait