#!/usr/bin/env python3
"""
Send message to Gemini - Email format (.txt)
Version: 2.0 (Phase 1 Stabilization - Oct 7, 2025)

Usage:
    echo "Your message" | python3 send_to_gemini.py MSG_TYPE
    python3 send_to_gemini.py MSG_TYPE < message.txt

Message content is read from stdin.
Creates email-style .txt file in ai-bridge/.server/claude-outbox/
"""

import sys
from datetime import datetime, timezone
from pathlib import Path


def create_email_message(msg_id: str, from_agent: str, to_agent: str, subject: str, content: str) -> str:
    """
    Create email-style message.

    Format:
        ID: message-id
        From: sender
        To: recipient
        Subject: message-type

        message content (no escaping needed!)
    """
    return f"""ID: {msg_id}
From: {from_agent}
To: {to_agent}
Subject: {subject}

{content}"""


def send_to_gemini(msg_type: str, content: str) -> str:
    """
    Send a message to Gemini in email-style .txt format.

    Args:
        msg_type: Message type/subject (e.g., "status_update", "query", "task")
        content: Message content (plain text, any characters allowed)

    Returns:
        message_id: Unique identifier for the message

    Raises:
        ValueError: If content is empty
    """
    if not content.strip():
        raise ValueError("Message content cannot be empty")

    # Generate unique message ID
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    message_id = f"claude-{timestamp}"

    # Create email-style message
    message = create_email_message(
        msg_id=message_id,
        from_agent="claude",
        to_agent="gemini",
        subject=msg_type,
        content=content
    )

    # Resolve path: ai-bridge/.server/claude-outbox/
    script_dir = Path(__file__).parent
    outbox_dir = script_dir / "claude-outbox"
    outbox_dir.mkdir(parents=True, exist_ok=True)

    # Write as .txt file (email format)
    filepath = outbox_dir / f"{message_id}.txt"

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(message)

    # Print notification
    preview = content.strip().split('\n')[0]
    preview = preview[:80] + "..." if len(preview) > 80 else preview
    print(f"📤 Claude → Gemini [{msg_type}]: {message_id}")
    print(f"   Format: Email-style .txt")
    print(f"   Content: {preview}")
    print(f"   File: {filepath}")

    return message_id


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("❌ Error: MSG_TYPE required", file=sys.stderr)
        print("Usage: send_to_gemini.py MSG_TYPE < /path/to/message.txt", file=sys.stderr)
        print("   (Message content is read from stdin)", file=sys.stderr)
        sys.exit(1)

    msg_type = sys.argv[1]
    content = sys.stdin.read()

    if not content:
        print("❌ Error: Message content cannot be empty. Pipe content via stdin.", file=sys.stderr)
        sys.exit(1)

    try:
        send_to_gemini(msg_type, content)
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)
