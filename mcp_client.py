#!/usr/bin/env python3
"""
MCP Client - JSON-based messaging system with ACK workflow
Polls for messages from Gemini and sends acknowledgments
"""

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional
import jsonschema

# Directories
INBOX_DIR = Path(".server/gemini-outbox")
OUTBOX_DIR = Path(".server/claude-inbox")
PROCESSING_DIR = INBOX_DIR / ".processing"
PROCESSED_DIR = INBOX_DIR / ".processed"
MALFORMED_DIR = INBOX_DIR / ".malformed"

# Ensure directories exist
for directory in [INBOX_DIR, OUTBOX_DIR, PROCESSING_DIR, PROCESSED_DIR, MALFORMED_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# JSON Schema for message validation
MESSAGE_SCHEMA = {
    "type": "object",
    "properties": {
        "message_id": {"type": "string"},
        "timestamp": {"type": "string", "format": "date-time"},
        "sender": {"enum": ["gemini", "claude"]},
        "recipient": {"enum": ["gemini", "claude"]},
        "type": {"enum": ["task", "status_update", "query", "ack", "error"]},
        "payload": {
            "type": "object",
            "properties": {
                "content": {"type": "string"},
                "original_message_id": {"type": "string"}
            },
            "required": ["content"]
        }
    },
    "required": ["message_id", "timestamp", "sender", "recipient", "type", "payload"]
}


def validate_message(message: Dict[str, Any]) -> bool:
    """Validate message against JSON schema"""
    try:
        jsonschema.validate(instance=message, schema=MESSAGE_SCHEMA)
        return True
    except jsonschema.exceptions.ValidationError as e:
        print(f"Validation error: {e}")
        return False


def create_message(msg_type: str, content: str, original_message_id: Optional[str] = None) -> Dict[str, Any]:
    """Create a new message following the schema"""
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    message_id = f"claude-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}"

    message = {
        "message_id": message_id,
        "timestamp": timestamp,
        "sender": "claude",
        "recipient": "gemini",
        "type": msg_type,
        "payload": {
            "content": content
        }
    }

    if original_message_id:
        message["payload"]["original_message_id"] = original_message_id

    return message


def send_message(message: Dict[str, Any]) -> None:
    """Write message to outbox"""
    filename = f"{message['message_id']}.json"
    filepath = OUTBOX_DIR / filename

    with open(filepath, 'w') as f:
        json.dump(message, f, indent=2)

    print(f"✓ Sent {message['type']} message: {message['message_id']}")


def send_ack(original_message_id: str) -> None:
    """Send acknowledgment for received message"""
    ack_message = create_message(
        msg_type="ack",
        content=f"Acknowledged message {original_message_id}",
        original_message_id=original_message_id
    )
    send_message(ack_message)


def send_error(original_message_id: str, error_content: str) -> None:
    """Send error message"""
    error_message = create_message(
        msg_type="error",
        content=error_content,
        original_message_id=original_message_id
    )
    send_message(error_message)


def process_message(filepath: Path) -> None:
    """Process a single message file"""
    # Move to processing directory
    processing_path = PROCESSING_DIR / filepath.name
    filepath.rename(processing_path)

    try:
        # Read and parse message
        with open(processing_path, 'r') as f:
            message = json.load(f)

        # Validate message
        if not validate_message(message):
            # Move to malformed directory
            malformed_path = MALFORMED_DIR / filepath.name
            processing_path.rename(malformed_path)
            send_error(
                message.get('message_id', 'unknown'),
                f"Message failed validation: {filepath.name}"
            )
            print(f"✗ Malformed message: {filepath.name}")
            return

        # Process valid message
        print(f"✓ Received {message['type']} from {message['sender']}: {message['message_id']}")
        print(f"  Content: {message['payload']['content'][:100]}...")

        # Send acknowledgment
        send_ack(message['message_id'])

        # Move to processed directory
        processed_path = PROCESSED_DIR / filepath.name
        processing_path.rename(processed_path)
        print(f"✓ Processed and archived: {filepath.name}")

    except Exception as e:
        print(f"✗ Error processing {filepath.name}: {e}")
        # Move back to inbox for retry
        filepath_retry = INBOX_DIR / filepath.name
        if processing_path.exists():
            processing_path.rename(filepath_retry)


def poll_inbox() -> None:
    """Poll inbox for new messages"""
    json_files = list(INBOX_DIR.glob("*.json"))

    if json_files:
        print(f"\n📬 Found {len(json_files)} new message(s)")
        for filepath in json_files:
            process_message(filepath)
    else:
        print(".", end="", flush=True)


def main():
    """Main polling loop"""
    print("🤖 MCP Client started - polling for messages from Gemini...")
    print(f"   Inbox: {INBOX_DIR}")
    print(f"   Outbox: {OUTBOX_DIR}")
    print()

    while True:
        try:
            poll_inbox()
            time.sleep(5)  # Poll every 5 seconds
        except KeyboardInterrupt:
            print("\n\n✓ MCP Client stopped")
            break
        except Exception as e:
            print(f"\n✗ Polling error: {e}")
            time.sleep(5)


if __name__ == "__main__":
    main()
