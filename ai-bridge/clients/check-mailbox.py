#!/usr/bin/env python3
"""
Auto-Check Mailbox Hook

Automatically checks for new messages from Gemini at the start of each prompt.
Displays unread messages as additional context for Claude.
"""
import os
import sys
import json
from pathlib import Path
from datetime import datetime

# Paths
SCRIPT_DIR = Path(__file__).parent
GEMINI_OUTBOX = SCRIPT_DIR / ".server" / "gemini-outbox"
LAST_CHECK_FILE = SCRIPT_DIR / ".server" / ".claude-last-check"

def get_last_check_time():
    """Get timestamp of last mailbox check"""
    try:
        if LAST_CHECK_FILE.exists():
            with open(LAST_CHECK_FILE, 'r') as f:
                return float(f.read().strip())
    except:
        pass
    return 0

def save_check_time():
    """Save current timestamp as last check time"""
    try:
        with open(LAST_CHECK_FILE, 'w') as f:
            f.write(str(datetime.now().timestamp()))
    except Exception as e:
        print(f"Error saving check time: {e}", file=sys.stderr)

def get_new_messages():
    """Get all Gemini messages newer than last check"""
    if not GEMINI_OUTBOX.exists():
        return []

    last_check = get_last_check_time()
    new_messages = []

    try:
        for file in GEMINI_OUTBOX.glob("*-gemini.txt"):
            # Check file modification time
            mtime = file.stat().st_mtime
            if mtime > last_check:
                try:
                    content = file.read_text()
                    new_messages.append({
                        'file': file.name,
                        'content': content,
                        'time': mtime
                    })
                except Exception as e:
                    print(f"Error reading {file.name}: {e}", file=sys.stderr)
    except Exception as e:
        print(f"Error scanning mailbox: {e}", file=sys.stderr)

    # Sort by time (oldest first)
    new_messages.sort(key=lambda x: x['time'])
    return new_messages

def format_messages(messages):
    """Format new messages for display"""
    if not messages:
        return None

    count = len(messages)
    header = f"📬 **NEW MESSAGES FROM GEMINI** ({count} unread)"

    formatted = [header, "=" * 60, ""]

    for i, msg in enumerate(messages, 1):
        formatted.append(f"**Message {i}/{count}** (from {msg['file']}):")
        formatted.append("")
        # Truncate long messages for preview
        content = msg['content'].strip()
        if len(content) > 500:
            content = content[:500] + "\n\n... (truncated)"
        formatted.append(content)
        formatted.append("")
        formatted.append("-" * 60)
        formatted.append("")

    return "\n".join(formatted)

def main():
    """Main hook execution"""
    # Check for new messages
    new_messages = get_new_messages()

    # Save current check time
    save_check_time()

    # If there are new messages, print them directly to the console.
    if new_messages:
        formatted = format_messages(new_messages)
        if formatted:
            print(formatted)
    else:
        print("No new messages from Gemini.")

if __name__ == "__main__":
    main()
