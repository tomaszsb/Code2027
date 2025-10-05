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

# Debug Log
DEBUG_LOG_PATH = Path(".server/mcp_client_debug.log")

def log_debug(message: str) -> None:
    with open(DEBUG_LOG_PATH, "a") as log_file:
        log_file.write(f"[{datetime.now(timezone.utc).isoformat()}] DEBUG: {message}\n")

# Directories
INBOX_DIR = Path(".server/gemini-outbox")  # Gemini's outbox is Claude's inbox
OUTBOX_DIR = Path(".server/claude-outbox")  # Claude's outbox
PROCESSING_DIR = INBOX_DIR / ".processing"  # Temporary during client processing
UNREAD_DIR = INBOX_DIR / ".unread"  # Client processed, waiting for LLM
READ_DIR = INBOX_DIR / ".read"  # LLM has read and responded
MALFORMED_DIR = INBOX_DIR / ".malformed"  # Invalid messages
PROCESSED_DIR = INBOX_DIR / ".processed"  # Legacy - deprecated

# Ensure directories exist
for directory in [INBOX_DIR, OUTBOX_DIR, PROCESSING_DIR, UNREAD_DIR, READ_DIR, MALFORMED_DIR, PROCESSED_DIR]:
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
        log_debug(f"Validation error: {e}")
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

    log_debug(f"Sent {message['type']} message: {message['message_id']}")


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
    """Process a single message file - Three-directory system with atomicity"""

    # Move to .processing for atomic operation
    processing_path = PROCESSING_DIR / filepath.name
    filepath.rename(processing_path)

    try:
        # Read and parse message from .processing
        with open(processing_path, 'r') as f:
            message = json.load(f)

        # Validate message
        if not validate_message(message):
            # Move ONLY malformed messages
            malformed_path = MALFORMED_DIR / processing_path.name
            processing_path.rename(malformed_path)
            send_error(
                message.get('message_id', 'unknown'),
                f"Message failed validation: {filepath.name}"
            )
            print(f"✗ Malformed message: {filepath.name}")
            return

        # Process valid message
        log_debug(f"Received {message['type']} from {message['sender']}: {message['message_id']}")
        log_debug(f"Content: {message['payload']['content'][:100]}...")

        # Send acknowledgment (but don't ACK an ACK - prevents infinite loop!)
        if message['type'] not in ['ack', 'error']:
            send_ack(message['message_id'])

        # Display message received notification (non-conversational)
        print(f"✓ Received {message['type']} from {message['sender']}: {message['message_id']}")
        print(f"  Content: {message['payload']['content'][:100]}...")

        # Three-directory system: Move to .unread/ for LLM to read
        unread_path = UNREAD_DIR / processing_path.name
        processing_path.rename(unread_path)
        log_debug(f"Message ACKed and moved to .unread/ for LLM: {processing_path.name}")

    except Exception as e:
        error_log_path = Path(".server/mcp_client_error.log")
        with open(error_log_path, "a") as log_file:
            log_file.write(f"[{datetime.now(timezone.utc).isoformat()}] Error processing {filepath.name}: {e}\n")
        log_debug(f"Error processing {filepath.name}: {e}")


def poll_inbox() -> None:
    """Poll inbox for new messages"""
    # Exclude .acked_ marker files and hidden files
    json_files = [f for f in INBOX_DIR.glob("*.json") if not f.name.startswith('.')]
    log_debug(f"Files found in {INBOX_DIR}: {[f.name for f in json_files]}")

    if json_files:
        log_debug(f"Found {len(json_files)} new message(s)")
        for filepath in json_files:
            process_message(filepath)
    else:
        log_debug(".")


def main():
    """Main polling loop"""
    log_debug("Hello from MCP Client!") # Debug test
    log_debug("🤖 MCP Client started - polling for messages from Gemini...")
    log_debug(f"   Inbox: {INBOX_DIR}")
    log_debug(f"   Outbox: {OUTBOX_DIR}")

    while True:
        try:
            poll_inbox()
            time.sleep(5)  # Poll every 5 seconds
        except KeyboardInterrupt:
            log_debug("MCP Client stopped")
            break
        except Exception as e:
            log_debug(f"Polling error: {e}")
            time.sleep(5)


if __name__ == "__main__":
    main()
