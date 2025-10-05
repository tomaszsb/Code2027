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
    python3 "$PYTHON_SCRIPT" > /dev/null 2>&1 &
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
    *)
        echo "Usage: $0 {start|stop|status}"
        exit 1
        ;;
esac

exit 0
