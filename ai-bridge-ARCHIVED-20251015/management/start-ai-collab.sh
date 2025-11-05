#!/bin/bash

# AI Collaboration Startup Script
# Starts both Claude bridge server and Gemini watcher with persistence

echo "🚀 Starting AI Collaboration System..."

# Navigate to project root
cd /mnt/d/unravel/current_game/code2027

# Ensure log directory exists
mkdir -p .server/logs

# Start the bridge server in background with nohup
echo "📡 Starting bridge server..."
nohup node .server/hybrid-ai-bridge.js > .server/logs/bridge.log 2>&1 &
BRIDGE_PID=$!

# Wait for bridge to initialize with retry logic
echo "⏳ Waiting for bridge server to initialize..."
MAX_RETRIES=10
RETRY_COUNT=0
RETRY_DELAY=1

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3003/messages > /dev/null 2>&1; then
        echo "✓ Bridge server online (PID: $BRIDGE_PID)"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        sleep $RETRY_DELAY
    fi
done

# Final check
if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "✗ Bridge server failed to start after ${MAX_RETRIES} retries"
    echo "Check logs: tail .server/logs/bridge.log"
    kill $BRIDGE_PID 2>/dev/null
    exit 1
fi

# Start Gemini watcher in background with nohup
echo "🤖 Starting Gemini watcher..."
cd .server
nohup python3 gemini-watcher-simple.py > logs/gemini.log 2>&1 &
GEMINI_PID=$!
cd ..

sleep 1
echo "✓ Gemini watcher online (PID: $GEMINI_PID)"

# Save PIDs for later shutdown
echo "$BRIDGE_PID" > .server/bridge.pid
echo "$GEMINI_PID" > .server/gemini.pid

echo ""
echo "✅ AI Collaboration System Ready!"
echo ""
echo "Bridge Server: http://localhost:3003"
echo "Web UI: http://localhost:3003/index.html"
echo "Process IDs: Bridge=$BRIDGE_PID, Gemini=$GEMINI_PID"
echo ""
echo "Logs:"
echo "  Bridge: tail -f .server/logs/bridge.log"
echo "  Gemini: tail -f .server/logs/gemini.log"
echo ""
echo "To stop: kill $BRIDGE_PID $GEMINI_PID"
echo "Or use: kill \$(cat .server/bridge.pid) \$(cat .server/gemini.pid)"
echo ""