#!/bin/bash
# AI Collaboration Manager - Control script for Claude's MCP communication client

SCRIPT_DIR="/mnt/d/unravel/current_game/code2027"
PID_FILE="$SCRIPT_DIR/.server/claude_client.pid"
PYTHON_SCRIPT="$SCRIPT_DIR/mcp_client.py"

start_client() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "Claude's communication client is already running (PID: $PID)"
            exit 1
        else
            # Stale PID file, remove it
            rm -f "$PID_FILE"
        fi
    fi

    # Start mcp_client.py in background with correct working directory
    cd "$SCRIPT_DIR" || exit 1
    python3 "$PYTHON_SCRIPT" &
    PID=$!

    # Save PID to file
    echo "$PID" > "$PID_FILE"
    echo "Claude's communication client started."
}

stop_client() {
    if [ ! -f "$PID_FILE" ]; then
        echo "Claude's communication client is not running (no PID file found)."
        exit 1
    fi

    PID=$(cat "$PID_FILE")

    if ps -p "$PID" > /dev/null 2>&1; then
        kill "$PID"
        rm -f "$PID_FILE"
        echo "Claude's communication client stopped."
    else
        echo "Claude's communication client is not running (stale PID file removed)."
        rm -f "$PID_FILE"
    fi
}

status_client() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "Claude's communication client is running."
        else
            echo "Claude's communication client is not running."
        fi
    else
        echo "Claude's communication client is not running."
    fi
}

health_check() {
    echo "=== Message Queue Health Check ==="
    echo ""

    WARN_COUNT=0
    STALE_THRESHOLD=10  # minutes

    # Check Claude's inbox (from Gemini)
    echo "📬 Claude's Inbox (from Gemini):"

    # Check for messages in inbox root (client not processing)
    ROOT_COUNT=$(find "$SCRIPT_DIR/.server/gemini-outbox" -maxdepth 1 -name "*.json" -type f 2>/dev/null | wc -l)
    if [ "$ROOT_COUNT" -gt 0 ]; then
        echo "  ⚠️  WARNING: $ROOT_COUNT messages in inbox root (client not processing)"
        WARN_COUNT=$((WARN_COUNT + 1))
    else
        echo "  ✓ Inbox root clear"
    fi

    # Check for stuck messages in .processing/
    PROC_COUNT=$(find "$SCRIPT_DIR/.server/gemini-outbox/.processing" -name "*.json" -type f 2>/dev/null | wc -l)
    if [ "$PROC_COUNT" -gt 0 ]; then
        echo "  ⚠️  WARNING: $PROC_COUNT messages stuck in .processing/"
        WARN_COUNT=$((WARN_COUNT + 1))
    else
        echo "  ✓ No stuck messages in .processing/"
    fi

    # Check for stale messages in .unread/
    UNREAD_COUNT=$(find "$SCRIPT_DIR/.server/gemini-outbox/.unread" -name "*.json" -type f 2>/dev/null | wc -l)
    if [ "$UNREAD_COUNT" -gt 0 ]; then
        STALE_COUNT=$(find "$SCRIPT_DIR/.server/gemini-outbox/.unread" -name "*.json" -type f -mmin +$STALE_THRESHOLD 2>/dev/null | wc -l)
        if [ "$STALE_COUNT" -gt 0 ]; then
            echo "  ⚠️  WARNING: $STALE_COUNT/$UNREAD_COUNT unread messages older than ${STALE_THRESHOLD}min"
            WARN_COUNT=$((WARN_COUNT + 1))
        else
            echo "  ℹ️  $UNREAD_COUNT unread messages (all recent)"
        fi
    else
        echo "  ✓ No unread messages"
    fi

    # Check for malformed messages
    MALFORMED_COUNT=$(find "$SCRIPT_DIR/.server/gemini-outbox/.malformed" -name "*.json" -type f 2>/dev/null | wc -l)
    if [ "$MALFORMED_COUNT" -gt 0 ]; then
        echo "  ⚠️  WARNING: $MALFORMED_COUNT malformed messages"
        WARN_COUNT=$((WARN_COUNT + 1))
    else
        echo "  ✓ No malformed messages"
    fi

    echo ""
    echo "📤 Claude's Outbox (to Gemini):"

    # Check Gemini's inbox (Claude's outbox)
    ROOT_COUNT=$(find "$SCRIPT_DIR/.server/claude-outbox" -maxdepth 1 -name "*.json" -type f 2>/dev/null | wc -l)
    if [ "$ROOT_COUNT" -gt 0 ]; then
        echo "  ⚠️  WARNING: $ROOT_COUNT messages in outbox root (Gemini's client not processing)"
        WARN_COUNT=$((WARN_COUNT + 1))
    else
        echo "  ✓ Outbox root clear"
    fi

    PROC_COUNT=$(find "$SCRIPT_DIR/.server/claude-outbox/.processing" -name "*.json" -type f 2>/dev/null | wc -l)
    if [ "$PROC_COUNT" -gt 0 ]; then
        echo "  ⚠️  WARNING: $PROC_COUNT messages stuck in .processing/"
        WARN_COUNT=$((WARN_COUNT + 1))
    else
        echo "  ✓ No stuck messages in .processing/"
    fi

    UNREAD_COUNT=$(find "$SCRIPT_DIR/.server/claude-outbox/.unread" -name "*.json" -type f 2>/dev/null | wc -l)
    if [ "$UNREAD_COUNT" -gt 0 ]; then
        STALE_COUNT=$(find "$SCRIPT_DIR/.server/claude-outbox/.unread" -name "*.json" -type f -mmin +$STALE_THRESHOLD 2>/dev/null | wc -l)
        if [ "$STALE_COUNT" -gt 0 ]; then
            echo "  ⚠️  WARNING: $STALE_COUNT/$UNREAD_COUNT messages unread by Gemini for >${STALE_THRESHOLD}min"
            WARN_COUNT=$((WARN_COUNT + 1))
        else
            echo "  ℹ️  $UNREAD_COUNT unread by Gemini (all recent)"
        fi
    else
        echo "  ✓ No unread messages"
    fi

    MALFORMED_COUNT=$(find "$SCRIPT_DIR/.server/claude-outbox/.malformed" -name "*.json" -type f 2>/dev/null | wc -l)
    if [ "$MALFORMED_COUNT" -gt 0 ]; then
        echo "  ⚠️  WARNING: $MALFORMED_COUNT malformed messages"
        WARN_COUNT=$((WARN_COUNT + 1))
    else
        echo "  ✓ No malformed messages"
    fi

    echo ""
    echo "🔧 Client Status:"
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "  ✓ Communication client running (PID: $PID)"
        else
            echo "  ⚠️  WARNING: Client not running (stale PID file)"
            WARN_COUNT=$((WARN_COUNT + 1))
        fi
    else
        echo "  ⚠️  WARNING: Client not running (no PID file)"
        WARN_COUNT=$((WARN_COUNT + 1))
    fi

    echo ""
    echo "==================================="
    if [ "$WARN_COUNT" -eq 0 ]; then
        echo "✅ All systems healthy"
    else
        echo "⚠️  $WARN_COUNT warning(s) detected"
    fi
}

# Main command handling
case "$1" in
    start)
        start_client
        ;;
    stop)
        stop_client
        ;;
    status)
        status_client
        ;;
    health)
        health_check
        ;;
    *)
        echo "Usage: $0 {start|stop|status|health}"
        exit 1
        ;;
esac

exit 0
