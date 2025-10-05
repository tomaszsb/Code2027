#!/bin/bash

# AI Collaboration Stop Script
# Stops both Claude bridge server and Gemini watcher

echo "🛑 Stopping AI Collaboration System..."

cd /mnt/d/unravel/current_game/code2027

# Read PIDs from files
if [ -f .server/bridge.pid ]; then
    BRIDGE_PID=$(cat .server/bridge.pid)
    if kill -0 $BRIDGE_PID 2>/dev/null; then
        kill $BRIDGE_PID
        echo "✓ Bridge server stopped (PID: $BRIDGE_PID)"
    else
        echo "⚠ Bridge server not running (PID: $BRIDGE_PID)"
    fi
    rm -f .server/bridge.pid
else
    echo "⚠ No bridge PID file found"
fi

if [ -f .server/gemini.pid ]; then
    GEMINI_PID=$(cat .server/gemini.pid)
    if kill -0 $GEMINI_PID 2>/dev/null; then
        kill $GEMINI_PID
        echo "✓ Gemini watcher stopped (PID: $GEMINI_PID)"
    else
        echo "⚠ Gemini watcher not running (PID: $GEMINI_PID)"
    fi
    rm -f .server/gemini.pid
else
    echo "⚠ No gemini PID file found"
fi

# Cleanup any orphaned processes
pkill -f "node .server/hybrid-ai-bridge.js" 2>/dev/null && echo "✓ Cleaned up orphaned bridge processes"
pkill -f "gemini-watcher-simple.py" 2>/dev/null && echo "✓ Cleaned up orphaned watcher processes"

echo ""
echo "✅ AI Collaboration System Stopped"
echo ""
