#!/usr/bin/env python3
"""
Bidirectional AI Bridge MCP Server
Provides both Claude and Gemini with tools to read each other's messages.
Updated for three-directory JSON communication system (Oct 5, 2025)
"""
import os
import sys
import json
import shutil
from pathlib import Path
from datetime import datetime
from typing import Any
import asyncio

# Add MCP SDK to path
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    print("Error: MCP SDK not installed. Run: pip install mcp", file=sys.stderr)
    sys.exit(1)


# Paths - Updated for three-directory JSON system
SCRIPT_DIR = Path(__file__).parent.parent.parent
SERVER_DIR = SCRIPT_DIR / ".server"

# Claude reads from Gemini's outbox
GEMINI_OUTBOX_UNREAD = SERVER_DIR / "gemini-outbox" / ".unread"
GEMINI_OUTBOX_READ = SERVER_DIR / "gemini-outbox" / ".read"

# Gemini reads from Claude's outbox
CLAUDE_OUTBOX_UNREAD = SERVER_DIR / "claude-outbox" / ".unread"
CLAUDE_OUTBOX_READ = SERVER_DIR / "claude-outbox" / ".read"

CLAUDE_LAST_CHECK = SERVER_DIR / ".claude-mcp-last-check"
GEMINI_LAST_CHECK = SERVER_DIR / ".gemini-mcp-last-check"


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
        # log_debug(f"Error parsing file {filepath}: {e}") # Removed log_debug as it's not defined here
        return None


def get_last_check_time(ai_name: str) -> float:
    """Get timestamp of last MCP check for specified AI"""
    check_file = CLAUDE_LAST_CHECK if ai_name == "claude" else GEMINI_LAST_CHECK
    try:
        if check_file.exists():
            with open(check_file, 'r') as f:
                return float(f.read().strip())
    except:
        pass
    return 0


def save_check_time(ai_name: str):
    """Save current timestamp as last check time"""
    check_file = CLAUDE_LAST_CHECK if ai_name == "claude" else GEMINI_LAST_CHECK
    try:
        with open(check_file, 'w') as f:
            f.write(str(datetime.now().timestamp()))
    except Exception as e:
        print(f"Error saving check time: {e}", file=sys.stderr)


def get_new_messages(unread_dir: Path, read_dir: Path) -> list[dict[str, Any]]:
    """Get all JSON messages from .unread/ directory and move them to .read/"""
    if not unread_dir.exists():
        return []

    new_messages = []

    try:
        # Get all JSON files in .unread/
        json_files = sorted(unread_dir.glob("*.txt"), key=lambda f: f.stat().st_mtime)

        for file in json_files:
            try:
                message = parse_message_file(file)

                if not message:
                    print(f"Error: Malformed message in {file.name}", file=sys.stderr)
                    continue

                new_messages.append({
                    'file': file.name,
                    'message_id': message['id'],
                    'type': message['t'], # 't' is subject/type
                    'timestamp': datetime.fromtimestamp(file.stat().st_mtime).isoformat(), # Use file modification time as timestamp
                    'content': message['c'],
                    'time': file.stat().st_mtime
                })

                # Move to .read/ directory
                read_dir.mkdir(parents=True, exist_ok=True)
                dest = read_dir / file.name
                shutil.move(str(file), str(dest))

            except Exception as e:
                print(f"Error processing {file.name}: {e}", file=sys.stderr)

    except Exception as e:
        print(f"Error scanning .unread/ directory: {e}", file=sys.stderr)

    return new_messages


def format_messages(messages: list[dict[str, Any]], sender_name: str) -> str:
    """Format messages for display"""
    if not messages:
        return f"No new messages from {sender_name}."

    count = len(messages)
    header = f"📬 **NEW MESSAGES FROM {sender_name.upper()}** ({count} unread)"

    formatted = [header, "=" * 60, ""]

    for i, msg in enumerate(messages, 1):
        formatted.append(f"**Message {i}/{count}** [{msg['type']}]")
        formatted.append(f"ID: {msg['message_id']}")
        formatted.append(f"Time: {msg['timestamp']}")
        formatted.append("")
        content = msg['content'].strip()
        if len(content) > 1000:
            content = content[:1000] + "\n\n... (truncated)"
        formatted.append(content)
        formatted.append("")
        formatted.append("-" * 60)
        formatted.append("")

    return "\n".join(formatted)


# Create MCP server
server = Server("ai-bridge")


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available MCP tools"""
    return [
        Tool(
            name="read_gemini_messages",
            description="Read new messages from Gemini AI. Returns all unread messages from Gemini since the last check.",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="read_claude_messages",
            description="Read new messages from Claude AI. Returns all unread messages from Claude since the last check.",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Handle tool calls"""
    if name == "read_gemini_messages":
        # Claude is reading Gemini's messages from gemini-outbox/.unread/
        new_messages = get_new_messages(GEMINI_OUTBOX_UNREAD, GEMINI_OUTBOX_READ)
        save_check_time("claude")
        formatted = format_messages(new_messages, "Gemini")

        return [
            TextContent(
                type="text",
                text=formatted
            )
        ]

    elif name == "read_claude_messages":
        # Gemini is reading Claude's messages from claude-outbox/.unread/
        new_messages = get_new_messages(CLAUDE_OUTBOX_UNREAD, CLAUDE_OUTBOX_READ)
        save_check_time("gemini")
        formatted = format_messages(new_messages, "Claude")

        return [
            TextContent(
                type="text",
                text=formatted
            )
        ]

    raise ValueError(f"Unknown tool: {name}")


async def main():
    """Run the MCP server"""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())