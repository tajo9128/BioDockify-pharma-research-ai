#!/bin/bash

# PharmaResearch AI - Service Status Script
# Checks status of all mini-services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$PROJECT_ROOT/tmp/service-pids.pid"

echo "📊 PharmaResearch AI - Service Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
  echo "❌ No services are currently running"
  echo "   No PID file found at: $PID_FILE"
  echo ""
  echo "💡 To start services, run: ./services/start-all.sh"
  exit 0
fi

# Read and check each service
service_count=0
running_count=0

while read pid; do
  if [ -z "$pid" ]; then
    continue
  fi

  service_count=$((service_count + 1))

  # Check if process is running
  if ps -p $pid > /dev/null 2>&1; then
    running_count=$((running_count + 1))

    # Get process name and info
    local process_info=$(ps -p $pid -o comm= 2>/dev/null | tr -d ' ' || echo "unknown")

    # Get port (if available)
    local port=""
    if [ "$process_info" = "bun" ] || [ "$process_info" = "node" ]; then
      port=$(lsof -p $pid 2>/dev/null | grep LISTEN | awk '{print $9}' | sed 's/.*://*://' | sort -u | head -n1)
    fi

    echo "✅ Service $service_count"
    echo "   PID: $pid"
    echo "   Process: $process_info"
    [ -n "$port" ] && echo "   Port: $port"
    echo "   Status: RUNNING"
  else
    echo "❌ Service $service_count"
    echo "   PID: $pid"
    echo "   Status: STOPPED (stale PID)"
  fi

  echo ""
done < "$PID_FILE"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📈 Summary: $running_count / $service_count services running"
echo ""

# Check specific ports
echo "🔌 Port Checks:"
if curl -s http://localhost:3003 > /dev/null 2>&1; then
  echo "  ✓ Port 3003 (Research Updater): OPEN"
else
  echo "  ✗ Port 3003 (Research Updater): CLOSED"
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "  ✓ Port 3000 (Next.js): OPEN"
else
  echo "  ✗ Port 3000 (Next.js): CLOSED"
fi

echo ""
echo "📁 Log files:"
if [ -d "$PROJECT_ROOT/tmp" ]; then
  for log_file in "$PROJECT_ROOT/tmp"/*.log; do
    if [ -f "$log_file" ]; then
      local log_name=$(basename "$log_file")
      local lines=$(wc -l < "$log_file")
      echo "  📝 $log_name ($lines lines)"
    fi
  done
fi

echo ""

# Show recent logs for each service
echo "📋 Recent Logs (last 5 lines each):"
echo ""
for log_file in "$PROJECT_ROOT/tmp"/*.log; do
  if [ -f "$log_file" ]; then
    local log_name=$(basename "$log_file")
    echo "━━━ $log_name ━━━"
    tail -n 5 "$log_file" 2>/dev/null || echo "No logs available"
    echo ""
  fi
done
