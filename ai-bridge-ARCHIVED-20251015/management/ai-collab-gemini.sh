#!/bin/bash
# AI Collaboration Manager - Control script for Gemini's MCP communication client

SCRIPT_DIR="$(dirname "$0")"
PID_FILE="$SCRIPT_DIR/../.server/gemini_client.pid" # Changed PID file
PYTHON_SCRIPT="$SCRIPT_DIR/../clients/mcp_client_gemini.py" # Changed Python script

start_client() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "Gemini's communication client is already running (PID: $PID)" # Changed message
            exit 1
        else
            # Stale PID file, remove it
            rm -f "$PID_FILE"
        fi
    fi

    # Start mcp_client_gemini.py in background
    python3 "$PYTHON_SCRIPT" > "$SCRIPT_DIR/../.server/gemini_client.log" 2>&1 &
    PID=$!

    # Save PID to file
    echo "$PID" > "$PID_FILE"
    echo "Gemini's communication client started." # Changed message
}

stop_client() {
    if [ ! -f "$PID_FILE" ]; then
        echo "Gemini's communication client is not running (no PID file found)." # Changed message
        exit 1
    fi

    PID=$(cat "$PID_FILE")

    if ps -p "$PID" > /dev/null 2>&1; then
        kill "$PID"
        rm -f "$PID_FILE"
        echo "Gemini's communication client stopped." # Changed message
    else
        echo "Gemini's communication client is not running (stale PID file removed)." # Changed message
        rm -f "$PID_FILE"
    fi
}

status_client() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "Gemini's communication client is running." # Changed message
        else
            echo "Gemini's communication client is not running." # Changed message
        fi
    else
        echo "Gemini's communication client is not running." # Changed message
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
