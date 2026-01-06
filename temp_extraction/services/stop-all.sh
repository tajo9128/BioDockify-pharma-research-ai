#!/bin/bash

# PharmaResearch AI - Service Stop Script
# Stops all running mini-services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$PROJECT_ROOT/tmp/service-pids.pid"

echo "🛑 PharmaResearch AI - Stopping all mini-services..."
echo ""

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
  echo "❌ No PID file found. No services to stop."
  echo "   PID file: $PID_FILE"
  exit 0
fi

# Read and kill each service
stopped_count=0
total_count=0

while read pid; do
  if [ -z "$pid" ]; then
    continue
  fi

  total_count=$((total_count + 1))

  # Check if process exists
  if ps -p $pid > /dev/null 2>&1; then
    echo "🛑 Stopping service (PID: $pid)..."

    # Try graceful shutdown first
    kill -TERM $pid 2>/dev/null

    # Wait a moment
    sleep 2

    # If still running, force kill
    if ps -p $pid > /dev/null 2>&1; then
      echo "  Force killing (PID: $pid)..."
      kill -KILL $pid 2>/dev/null
    fi

    stopped_count=$((stopped_count + 1))
    echo "  ✓ Service stopped"
  else
    echo "⊘ Service (PID: $pid) already stopped"
  fi

  echo ""
done < "$PID_FILE"

# Remove PID file
rm -f "$PID_FILE"
echo "✅ PID file removed"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Stopped $stopped_count / $total_count services"
echo ""
echo "💡 To restart services, run: ./services/start-all.sh"
echo "💡 To check status, run: ./services/status.sh"
echo ""
