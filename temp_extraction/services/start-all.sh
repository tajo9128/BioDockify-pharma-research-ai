#!/bin/bash

# PharmaResearch AI - Service Startup Script
# Starts all mini-services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$PROJECT_ROOT/tmp/service-pids.pid"

# Create tmp directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/tmp"

echo "🚀 PharmaResearch AI - Starting all mini-services..."
echo "📁 Project root: $PROJECT_ROOT"
echo ""

# Function to start a service in background
start_service() {
  local service_name=$1
  local service_dir=$2
  local service_command=$3

  echo "🔌 Starting $service_name..."

  cd "$service_dir"

  if [ -f "bun.lockb" ] || [ -f "bun.lock" ]; then
    # Start with bun
    bun run dev > "$PROJECT_ROOT/tmp/${service_name}.log" 2>&1 &
  elif [ -f "package.json" ]; then
    # Start with bun
    bun run dev > "$PROJECT_ROOT/tmp/${service_name}.log" 2>&1 &
  else
    echo "❌ No package.json found in $service_dir"
    return 1
  fi

  local pid=$!

  # Save PID
  echo "$pid" >> "$PID_FILE"

  echo "✅ $service_name started (PID: $pid)"
  echo "   Logs: $PROJECT_ROOT/tmp/${service_name}.log"

  # Wait a moment to see if it starts successfully
  sleep 2

  if ps -p $pid > /dev/null; then
    echo "   ✓ $service_name is running"
  else
    echo "   ✗ $service_name failed to start"
    return 1
  fi

  cd "$PROJECT_ROOT"
  echo ""
}

# Clear old PID file
if [ -f "$PID_FILE" ]; then
  echo "🧹 Clearing old PID file..."
  rm -f "$PID_FILE"
fi

# Check if services are already running
if [ -f "$PID_FILE" ]; then
  echo "⚠️  Warning: PID file exists. Checking for running services..."
  while read pid; do
    if ps -p $pid > /dev/null; then
      echo "  ⚠️  Service with PID $pid is already running"
    fi
  done < "$PID_FILE"
  echo ""
fi

# Start Research Updater Service (port 3003)
if [ -d "$PROJECT_ROOT/mini-services/research-updater" ]; then
  start_service "research-updater" "$PROJECT_ROOT/mini-services/research-updater" "dev"
else
  echo "⚠️  research-updater service not found, skipping..."
  echo ""
fi

# Add more services here as needed:
# if [ -d "$PROJECT_ROOT/mini-services/another-service" ]; then
#   start_service "another-service" "$PROJECT_ROOT/mini-services/another-service" "dev"
# fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All mini-services started!"
echo ""
echo "📋 Running services:"
while read pid; do
  if ps -p $pid > /dev/null; then
    echo "  ✓ PID: $pid - Running"
  fi
done < "$PID_FILE"
echo ""
echo "📝 PIDs saved to: $PID_FILE"
echo "📊 To check status, run: ./services/status.sh"
echo "🛑 To stop all services, run: ./services/stop-all.sh"
echo ""
