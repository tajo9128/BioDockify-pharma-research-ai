#!/bin/bash

# BioDockify AI - Quick Development Start
# Starts both Next.js dev server and Tauri app

set -e  # Exit on error

echo "🚀 Starting BioDockify AI - Development Mode"
echo "=========================================="
echo ""

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    # Kill background processes
    kill %1 %2 2>/dev/null || true
    exit
}

# Set up trap to cleanup on exit
trap cleanup EXIT INT TERM

# Check if Next.js dev server is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 3000 is already in use."
    echo "Killing existing process..."
    kill -9 $(lsof -ti :3000 -sTCP:LISTEN -t) 2>/dev/null || true
    sleep 2
fi

echo "📦 Starting Next.js dev server on port 3000..."
cd /home/z/my-project

# Start Next.js in background
bun run dev > /dev/null 2>&1 &
NEXT_PID=$!

# Wait a moment for Next.js to start
sleep 3

# Check if Next.js started successfully
if ps -p $NEXT_PID > /dev/null; then
    echo "✅ Next.js dev server started (PID: $NEXT_PID)"
else
    echo "❌ Failed to start Next.js dev server"
    exit 1
fi

echo ""
echo "🖥️  Starting Tauri application..."
echo "   The app will open a new window with the Next.js app embedded."
echo "   Make changes to src/ for hot reload."
echo "   Press Ctrl+C to stop both servers."
echo ""
echo "=========================================="

# Start Tauri (this will block)
cd /home/z/my-project
bun run tauri

# Cleanup will be called automatically on exit
