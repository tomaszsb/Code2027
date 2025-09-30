#!/bin/bash
# Test script for bidirectional communication

echo "Testing Bidirectional AI Communication"
echo "======================================"
echo ""

# Test 1: Check if bridge server is running
echo "Test 1: Checking bridge server..."
if curl -s http://localhost:3003/messages > /dev/null 2>&1; then
    echo "✓ Bridge server is running on port 3003"
else
    echo "✗ Bridge server is NOT running"
    echo "  Start it with: node hybrid-ai-bridge.js &"
    exit 1
fi

# Test 2: Send a test message via the API
echo ""
echo "Test 2: Sending test message via API..."
RESPONSE=$(curl -s -X POST http://localhost:3003/ask-gemini \
    -H "Content-Type: application/json" \
    -d '{"question": "Test message from bidirectional test script"}')

if echo "$RESPONSE" | grep -q "error"; then
    echo "✗ API returned an error:"
    echo "$RESPONSE" | python3 -m json.tool
    echo ""
    echo "This is expected if Gemini CLI/API is not configured."
    echo "The message was still saved to claude-inbox/"
else
    echo "✓ API call successful"
fi

# Test 3: Check if message files were created
echo ""
echo "Test 3: Checking message files..."
INBOX_COUNT=$(ls -1 claude-inbox/*.txt 2>/dev/null | wc -l)
NOTIFICATION_COUNT=$(ls -1 gemini-notifications/*.json 2>/dev/null | wc -l)

echo "  Claude inbox messages: $INBOX_COUNT"
echo "  Gemini notifications: $NOTIFICATION_COUNT"

if [ "$INBOX_COUNT" -gt 0 ]; then
    echo "✓ Messages are being saved to claude-inbox/"
    echo "  Latest: $(ls -t claude-inbox/*.txt | head -1 | xargs basename)"
fi

if [ "$NOTIFICATION_COUNT" -gt 0 ]; then
    echo "✓ Notifications are being created"
    echo "  Latest: $(ls -t gemini-notifications/*.json | head -1 | xargs basename)"
fi

# Test 4: Check web interface
echo ""
echo "Test 4: Web interface..."
echo "  URL: http://localhost:3003/"
echo "  Open in browser to view conversation history"

# Summary
echo ""
echo "======================================"
echo "Setup Status:"
echo "======================================"
echo "✓ Bridge server: Running"
echo "? Gemini watcher: Run 'python3 gemini-watcher.py' to start"
echo "? Claude watcher: Run 'python3 claude-watcher.py' to monitor"
echo ""
echo "To test from Claude Code, type:"
echo "  ask gemini: Hello, can you hear me?"
echo ""