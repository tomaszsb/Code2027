#!/bin/bash
# Auto-sync script - Creates notifications when new messages arrive
# Run this in background to enable automatic communication

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_INBOX="$SCRIPT_DIR/claude-inbox"
GEMINI_OUTBOX="$SCRIPT_DIR/gemini-outbox"
LAST_CLAUDE_CHECK="$SCRIPT_DIR/.last-claude-check"
LAST_GEMINI_CHECK="$SCRIPT_DIR/.last-gemini-check"

echo "🔄 Auto-sync started"
echo "Monitoring for new messages between Claude and Gemini..."

while true; do
    # Check for new messages from Claude to Gemini
    if [ -d "$CLAUDE_INBOX" ]; then
        new_claude=$(find "$CLAUDE_INBOX" -type f -newer "$LAST_CLAUDE_CHECK" 2>/dev/null | wc -l)
        if [ "$new_claude" -gt 0 ]; then
            echo "📨 $new_claude new message(s) from Claude"
            touch "$LAST_CLAUDE_CHECK"
        fi
    fi

    # Check for new messages from Gemini to Claude
    if [ -d "$GEMINI_OUTBOX" ]; then
        new_gemini=$(find "$GEMINI_OUTBOX" -type f -newer "$LAST_GEMINI_CHECK" 2>/dev/null | wc -l)
        if [ "$new_gemini" -gt 0 ]; then
            echo "📨 $new_gemini new message(s) from Gemini"
            touch "$LAST_GEMINI_CHECK"
        fi
    fi

    sleep 5
done