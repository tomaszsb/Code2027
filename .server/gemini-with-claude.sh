#!/bin/bash
# Gemini CLI Wrapper - Enables asking Claude
# Usage: ./gemini-with-claude.sh "your question"
#        ./gemini-with-claude.sh "ask claude: technical question"
#        ./gemini-with-claude.sh "discuss: topic"

BRIDGE_URL="http://localhost:3003"
QUESTION="$1"

# Check if bridge is running
if ! curl -s "$BRIDGE_URL/context" > /dev/null 2>&1; then
    echo "⚠️  Bridge server not running. Starting..."
    cd "$(dirname "$0")/.."
    node .server/hybrid-ai-bridge.js > /dev/null 2>&1 &
    sleep 2
fi

# Detect mode from question
if [[ "$QUESTION" =~ ^"ask claude:" ]]; then
    MODE="ask-claude"
    CLEAN_QUESTION="${QUESTION#ask claude:}"
    CLEAN_QUESTION="${CLEAN_QUESTION# }"
elif [[ "$QUESTION" =~ ^"discuss:" ]] || [[ "$QUESTION" =~ ^"both:" ]]; then
    MODE="discuss"
    CLEAN_QUESTION="${QUESTION#discuss:}"
    CLEAN_QUESTION="${CLEAN_QUESTION#both:}"
    CLEAN_QUESTION="${CLEAN_QUESTION# }"
elif [[ "$QUESTION" =~ "@claude" ]]; then
    MODE="mention-claude"
    CLEAN_QUESTION="$QUESTION"
else
    # Just call regular Gemini CLI
    exec gemini "$QUESTION"
    exit $?
fi

# Call bridge server
case "$MODE" in
    "ask-claude")
        echo "📞 Asking Claude..."
        RESPONSE=$(curl -s -X POST "$BRIDGE_URL/ask-claude" \
            -H "Content-Type: application/json" \
            -d "{\"question\": $(echo "$CLEAN_QUESTION" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read().strip()))")}")

        if echo "$RESPONSE" | grep -q "error"; then
            echo "❌ Error from bridge:"
            echo "$RESPONSE" | python3 -m json.tool
            exit 1
        else
            CLAUDE_RESPONSE=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('response', 'No response'))")
            echo ""
            echo "🤖 CLAUDE'S RESPONSE:"
            echo "$CLAUDE_RESPONSE"
            echo ""
            echo "💡 GEMINI'S ANALYSIS:"
            gemini "Claude said: $CLAUDE_RESPONSE. My analysis:"
        fi
        ;;

    "discuss")
        echo "💬 Discuss mode: Getting both perspectives..."

        # Call Gemini first
        echo ""
        echo "🤖 GEMINI'S PERSPECTIVE:"
        GEMINI_RESPONSE=$(gemini "$CLEAN_QUESTION")
        echo "$GEMINI_RESPONSE"

        # Then ask Claude via bridge
        echo ""
        echo "📞 Getting Claude's perspective..."
        RESPONSE=$(curl -s -X POST "$BRIDGE_URL/communicate" \
            -H "Content-Type: application/json" \
            -d "{\"message\": \"Gemini said: $GEMINI_RESPONSE. Question: $CLEAN_QUESTION\", \"mode\": \"claude-perspective\"}")

        echo ""
        echo "⚙️  CLAUDE'S PERSPECTIVE:"
        echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('responses', {}).get('claude', 'Processing...'))" 2>/dev/null || echo "(Claude will need to be invoked separately)"
        ;;

    "mention-claude")
        echo "📞 Calling Claude via @mention..."
        # Extract @claude mention
        MENTION=$(echo "$QUESTION" | grep -oP '@claude\s+\K.*')

        RESPONSE=$(curl -s -X POST "$BRIDGE_URL/ask-claude" \
            -H "Content-Type: application/json" \
            -d "{\"question\": $(echo "$MENTION" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read().strip()))")}")

        CLAUDE_RESPONSE=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('response', 'No response'))")
        echo ""
        echo "@claude responded: $CLAUDE_RESPONSE"
        echo ""

        # Let Gemini incorporate
        gemini "Incorporating Claude's response: $CLAUDE_RESPONSE. Original context: $QUESTION"
        ;;
esac