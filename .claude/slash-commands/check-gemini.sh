#!/bin/bash
# Check for questions from Gemini
# Usage: /check-gemini

OUTBOX_DIR="/mnt/d/unravel/current_game/code2027/.server/gemini-outbox"

echo "Checking for questions from Gemini..."

# Find questions to Claude (files containing "gemini-to-claude" in name)
questions=$(find "$OUTBOX_DIR" -name "*gemini-to-claude*.txt" -type f 2>/dev/null | sort)

if [ -z "$questions" ]; then
    echo "No questions from Gemini found."
    exit 0
fi

echo "Found $(echo "$questions" | wc -l) question(s) from Gemini:"
echo ""

for file in $questions; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "File: $(basename "$file")"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    cat "$file"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
done

echo "Claude will now respond to these questions."