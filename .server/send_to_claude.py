#!/usr/bin/env python3
"""
Unified message sending function with console notification
Usage: send_to_claude.py MSG_TYPE
Reads message content from stdin.
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

    # Correctly resolve the path relative to the script's location
    script_dir = Path(__file__).parent
    filepath = script_dir / f"gemini-outbox/{message_id}.json"
    
    # Ensure the directory exists
    filepath.parent.mkdir(parents=True, exist_ok=True)

    with open(filepath, 'w') as f:
        json.dump(message, f, indent=2)

    # Print notification
    preview = content.strip().split('\n')[0]
    preview = preview[:80] + "..." if len(preview) > 80 else preview
    print(f"📤 Gemini → Claude [{msg_type}]: {message_id}")
    print(f"   Content: {preview}")

    return message_id

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("❌ Error: MSG_TYPE required")
        print("Usage: send_to_claude.py MSG_TYPE < /path/to/message.txt")
        print("   (Message content is read from stdin)")
        sys.exit(1)

    msg_type = sys.argv[1]
    content = sys.stdin.read()
    
    if not content:
        print("❌ Error: Message content cannot be empty. Pipe content via stdin.")
        sys.exit(1)

    send_to_claude(msg_type, content)