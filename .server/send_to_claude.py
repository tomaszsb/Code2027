#!/usr/bin/env python3
"""
Unified message sending function with console notification
Usage: send_to_claude.py TYPE "CONTENT"
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

def send_to_claude(msg_type: str, content: str):
    """Send a message to Claude with proper JSON encoding"""
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    message_id = f"gemini-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}"

    message = {
        "message_id": message_id,
        "timestamp": timestamp,
        "sender": "gemini",
        "recipient": "claude",
        "type": msg_type,
        "payload": {
            "content": content
        }
    }

    # Write JSON message
    filepath = Path(f".server/gemini-outbox/{message_id}.json")
    with open(filepath, 'w') as f:
        json.dump(message, f, indent=2)

    # Print notification
    preview = content[:80] + "..." if len(content) > 80 else content
    print(f"📤 Gemini → Claude [{msg_type}]: {message_id}")
    print(f"   Content: {preview}")

    return message_id

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("❌ Error: TYPE and CONTENT required")
        print("Usage: send_to_claude.py TYPE \"CONTENT\"")
        sys.exit(1)

    msg_type = sys.argv[1]
    content = sys.argv[2]
    send_to_claude(msg_type, content)
