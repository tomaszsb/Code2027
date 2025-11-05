#!/usr/bin/env python3
"""
Reliable script for Gemini to check for new messages from Claude.
Reads directly from the claude-outbox/.unread directory.
Includes MCP SDK version check as discussed.
"""
import os
import sys
import json
import shutil
from pathlib import Path
from datetime import datetime
from typing import Any, List, Dict

# Define Paths
SCRIPT_DIR = Path(__file__).parent
SERVER_DIR = SCRIPT_DIR / ".server"
CLAUDE_OUTBOX_UNREAD = SERVER_DIR / "claude-outbox" / ".unread"
CLAUDE_OUTBOX_READ = SERVER_DIR / "claude-outbox" / ".read"

LAST_MCP_VERSION_FILE = SERVER_DIR / ".gemini-last-mcp-version"

def check_mcp_sdk_version():
    """Checks for MCP SDK version and notifies if it has changed."""
    current_version = "unknown"
    try:
        from mcp import __version__ as mcp_version
        current_version = mcp_version
    except ImportError:
        # MCP SDK not available in this script's environment
        return

    last_version = ""
    if LAST_MCP_VERSION_FILE.exists():
        with open(LAST_MCP_VERSION_FILE, 'r') as f:
            last_version = f.read().strip()

    if current_version != last_version:
        print("-" * 60)
        print(f"🔔 MCP SDK Version Change Detected: {last_version or '(none)'} → {current_version}")
        print("   Consider re-testing the native 'read_claude_messages()' tool.")
        print("-" * 60)
        with open(LAST_MCP_VERSION_FILE, 'w') as f:
            f.write(current_version)

def get_new_messages() -> List[Dict[str, Any]]:
    """Gets all JSON messages from .unread/ and moves them to .read/."""
    if not CLAUDE_OUTBOX_UNREAD.exists():
        return []

    new_messages = []
    json_files = sorted(CLAUDE_OUTBOX_UNREAD.glob("*.json"), key=lambda f: f.stat().st_mtime)

    for file in json_files:
        try:
            with open(file, 'r') as f:
                new_messages.append(json.load(f))
            
            # Move to .read/ directory
            CLAUDE_OUTBOX_READ.mkdir(parents=True, exist_ok=True)
            shutil.move(str(file), str(CLAUDE_OUTBOX_READ / file.name))
        except Exception as e:
            print(f"Error processing {file.name}: {e}", file=sys.stderr)
    
    return new_messages

def format_messages(messages: List[Dict[str, Any]]) -> str:
    """Formats messages for display."""
    if not messages:
        return "No new messages from Claude."

    count = len(messages)
    header = f"📬 **NEW MESSAGES FROM CLAUDE** ({count} unread)"
    formatted = [header, "=" * 60, ""]

    for i, msg in enumerate(messages, 1):
        # Try compact schema first
        message_id = msg.get('id', msg.get('message_id', 'N/A'))
        msg_type = msg.get('t', msg.get('type', 'unknown'))
        content = msg.get('c', '')
        timestamp = msg.get('timestamp', 'N/A')

        if not content: # Fallback to old schema if compact content not found
            payload = msg.get('payload', {})
            content = payload.get('content', '(no content)').strip()
            if message_id == 'N/A': # Only update if not already set by compact schema
                message_id = msg.get('message_id', 'N/A')
            if msg_type == 'unknown': # Only update if not already set by compact schema
                msg_type = msg.get('type', 'unknown')
            if timestamp == 'N/A':
                timestamp = msg.get('timestamp', 'N/A')
        
        formatted.append(f"**Message {i}/{count}** [{msg_type}]")
        formatted.append(f"ID: {message_id}")
        formatted.append(f"Time: {timestamp}")
        formatted.append("")
        formatted.append(content)
        formatted.append("\n" + "-" * 60 + "\n")

    return "\n".join(formatted)

if __name__ == "__main__":
    check_mcp_sdk_version()
    messages = get_new_messages()
    print(format_messages(messages))