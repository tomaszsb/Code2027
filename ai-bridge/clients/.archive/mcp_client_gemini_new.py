#!/usr/bin/env python3
"""
MCP Client - Email-style messaging system with backward JSON compatibility
Polls for messages from Gemini and sends acknowledgments
"""

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional

# Get script directory and resolve paths relative to ai-bridge/.server/
SCRIPT_DIR = Path(__file__).parent.parent  # Go up to ai-bridge/
SERVER_DIR = SCRIPT_DIR / ".server"

# Debug Log
DEBUG_LOG_PATH = SERVER_DIR / "mcp_client_gemini_debug.log"

def log_debug(message: str) -> None:
    with open(DEBUG_LOG_PATH, "a") as log_file:
        log_file.write(f"[{datetime.now(timezone.utc).isoformat()}] DEBUG: {message}\n")

# Directories
INBOX_DIR = SERVER_DIR / "claude-outbox"  # Gemini's inbox is Claude's outbox
OUTBOX_DIR = SERVER_DIR / "gemini-outbox"  # Gemini's outbox
PROCESSING_DIR = INBOX_DIR / ".processing"  # Temporary during client processing
UNREAD_DIR = INBOX_DIR / ".unread"  # Client processed, waiting for LLM
READ_DIR = INBOX_DIR / ".read"  # LLM has read and responded
MALFORMED_DIR = INBOX_DIR / ".malformed"  # Invalid messages
PROCESSED_DIR = INBOX_DIR / ".processed"  # Legacy - deprecated

# Ensure directories exist
for directory in [INBOX_DIR, OUTBOX_DIR, PROCESSING_DIR, UNREAD_DIR, READ_DIR, MALFORMED_DIR, PROCESSED_DIR]:
    directory.mkdir(parents=True, exist_ok=True)


def parse_email_format(content: str) -> Optional[Dict[str, Any]]:
    """Parse email-style message format

    Format:
    ID: message-id
    From: sender
    To: recipient
    Subject: title

    message content
    """
    lines = content.split('\n')
    headers = {}
    content_lines = []
    in_content = False

    for line in lines:
        if not in_content:
            if line.strip() == '':
                in_content = True
                continue
            if ':' in line:
                key, value = line.split(':', 1)
                headers[key.strip().lower()] = value.strip()
        else:
            content_lines.append(line)

    # Validate required headers
    required = ['id', 'from', 'to', 'subject']
    if not all(h in headers for h in required):
        return None

    return {
        'id': headers['id'],
        'from': headers['from'],
        'to': headers['to'],
        't': headers['subject'],
        'c': '\n'.join(content_lines).strip()
    }


def parse_json_format(content: str) -> Optional[Dict[str, Any]]:
    """Parse JSON message format (backward compatibility)"""
    try:
        message = json.loads(content)
        # Support both compact and old format
        if 'id' in message and 'to' in message and 't' in message and 'c' in message:
            return message
        # Old format - normalize
        if 'message_id' in message:
            return {
                'id': message['message_id'],
                'from': message.get('sender', 'unknown'),
                'to': message.get('recipient', 'unknown'),
                't': message.get('type', 'unknown'),
                'c': message.get('payload', {}).get('content', '')
            }
        return None
    except json.JSONDecodeError:
        return None


def parse_message_file(filepath: Path) -> Optional[Dict[str, Any]]:
    """Parse message file - supports both email and JSON formats"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Try email format first
        if filepath.suffix == '.txt':
            message = parse_email_format(content)
            if message:
                return message

        # Try JSON format (backward compatibility)
        if filepath.suffix == '.json':
            message = parse_json_format(content)
            if message:
                return message

        # Try JSON even for .txt files during transition
        message = parse_json_format(content)
        if message:
            return message

        # Try email format even for .json files during transition
        message = parse_email_format(content)
        if message:
            return message

        return None
    except Exception as e:
        log_debug(f"Error parsing file {filepath}: {e}")
        return None


def create_message_email_format(msg_id: str, from_agent: str, to_agent: str, subject: str, content: str) -> str:
    """Create email-style message"""
    return f"""ID: {msg_id}
From: {from_agent}
To: {to_agent}
Subject: {subject}

{content}"""


def send_message(msg_id: str, to_agent: str, subject: str, content: str) -> None:
    """Write message to outbox in email format"""
    filename = f"{msg_id}.txt"
    filepath = OUTBOX_DIR / filename

    message_content = create_message_email_format(msg_id, "gemini", to_agent, subject, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(message_content)

    log_debug(f"Sent message: {msg_id}")


def send_ack(original_message_id: str) -> None:
    """Send acknowledgment for received message"""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    msg_id = f"gemini-ack-{timestamp}"
    send_message(msg_id, "claude", "ACK", f"Acknowledged message {original_message_id}")


def send_error(original_message_id: str, error_content: str) -> None:
    """Send error message"""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    msg_id = f"gemini-error-{timestamp}"
    send_message(msg_id, "claude", "ERROR", f"Error processing {original_message_id}: {error_content}")


def process_message(filepath: Path) -> None:
    """Process a single message file - Three-directory system with atomicity"""

    # Move to .processing for atomic operation
    processing_path = PROCESSING_DIR / filepath.name
    filepath.rename(processing_path)

    try:
        # Parse message (supports both formats)
        message = parse_message_file(processing_path)

        if not message:
            # Move malformed messages
            malformed_path = MALFORMED_DIR / processing_path.name
            processing_path.rename(malformed_path)
            print(f"✗ Malformed message: {filepath.name}")
            return

        # Process valid message
        log_debug(f"Received {message['t']} from {message['from']}: {message['id']}")
        log_debug(f"Content: {message['c'][:100]}...")

        # Display message received notification
        print(f"✓ Received {message['t']} from {message['from']}: {message['id']}")
        print(f"  Content: {message['c'][:100]}...")

        # Three-directory system: Move to .unread/ for LLM to read
        # Keep original extension during transition
        unread_path = UNREAD_DIR / processing_path.name
        processing_path.rename(unread_path)
        log_debug(f"Message moved to .unread/ for LLM: {processing_path.name}")

    except Exception as e:
        error_log_path = SERVER_DIR / "mcp_client_error.log"
        with open(error_log_path, "a") as log_file:
            log_file.write(f"[{datetime.now(timezone.utc).isoformat()}] Error processing {filepath.name}: {e}\n")
        log_debug(f"Error processing {filepath.name}: {e}")


def poll_inbox() -> None:
    """Poll inbox for new messages"""
    # Accept both .json and .txt files during transition
    message_files = list(INBOX_DIR.glob("*.json")) + list(INBOX_DIR.glob("*.txt"))
    message_files = [f for f in message_files if not f.name.startswith('.')]

    if message_files:
        log_debug(f"Found {len(message_files)} new message(s)")
        for filepath in message_files:
            process_message(filepath)
    else:
        log_debug(".")


def main():
    """Main polling loop"""
    log_debug("🤖 MCP Client (Gemini) started - polling for messages from Claude...")
    log_debug("   Supports both email-style (.txt) and JSON (.json) formats")
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
