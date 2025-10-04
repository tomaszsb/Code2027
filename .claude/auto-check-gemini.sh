#!/bin/bash
# Auto-check for new messages from Gemini
# This runs automatically before Claude responds

OUTBOX_DIR="/mnt/d/unravel/current_game/code2027/.server/gemini-outbox"
LAST_CHECK_FILE="/mnt/d/unravel/current_game/code2027/.server/.claude-last-check"

# Create last check file if it doesn't exist
if [ ! -f "$LAST_CHECK_FILE" ]; then
    touch "$LAST_CHECK_FILE"
fi

# Find new files since last check (using -cnewer for better reliability)
new_files=$(find "$OUTBOX_DIR" -type f -name "*.txt" -newer "$LAST_CHECK_FILE" 2>/dev/null | sort)

if [ -n "$new_files" ]; then
    echo "📨 NEW MESSAGE(S) FROM GEMINI:"
    echo ""
    for file in $new_files; do
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "$(basename "$file")"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        cat "$file"
        echo ""
    done

    # Update last check timestamp AFTER showing messages
    touch "$LAST_CHECK_FILE"
else
    # Still update timestamp even if no new messages
    touch "$LAST_CHECK_FILE"
fi