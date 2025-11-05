#!/usr/bin/env python3
"""
Unified MCP Server - Bidirectional AI Communication Bridge
Created: 2025-10-07 (Phase 1 Stabilization)

Provides both Claude and Gemini with symmetric tools to read each other's messages.
Supports email-style .txt format exclusively (post-migration).

Architecture:
- Claude uses: read_gemini_messages()
- Gemini uses: read_claude_messages()
- Both read from: ai-bridge/.server/{sender}-outbox/.unread/
- Message format: Email-style .txt (ID/From/To/Subject headers + content)
"""

import os
import sys
import shutil
from pathlib import Path
from datetime import datetime
from typing import Any, Optional, Dict, List

# MCP SDK imports
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    print("Error: MCP SDK not installed. Run: pip install mcp", file=sys.stderr)
    sys.exit(1)


# ============================================================================
# PATH CONFIGURATION - Standardized to ai-bridge/.server/
# ============================================================================

# Resolve paths relative to this file: ai-bridge/mcp-servers/unified-mcp-server/
SCRIPT_DIR = Path(__file__).parent
AI_BRIDGE_ROOT = SCRIPT_DIR.parent.parent  # Navigate up to ai-bridge/
SERVER_DIR = AI_BRIDGE_ROOT / ".server"

# Message directories (symmetric structure)
GEMINI_OUTBOX_UNREAD = SERVER_DIR / "gemini-outbox" / ".unread"
GEMINI_OUTBOX_READ = SERVER_DIR / "gemini-outbox" / ".read"

CLAUDE_OUTBOX_UNREAD = SERVER_DIR / "claude-outbox" / ".unread"
CLAUDE_OUTBOX_READ = SERVER_DIR / "claude-outbox" / ".read"

# Tracking files
CLAUDE_LAST_CHECK = SERVER_DIR / ".claude-mcp-last-check"
GEMINI_LAST_CHECK = SERVER_DIR / ".gemini-mcp-last-check"

# Ensure directories exist
for directory in [GEMINI_OUTBOX_UNREAD, GEMINI_OUTBOX_READ,
                  CLAUDE_OUTBOX_UNREAD, CLAUDE_OUTBOX_READ]:
    directory.mkdir(parents=True, exist_ok=True)


# ============================================================================
# EMAIL FORMAT PARSER - Unified Implementation
# ============================================================================

def parse_email_format(content: str) -> Optional[Dict[str, Any]]:
    """
    Parse email-style message format.

    Format:
        ID: message-id
        From: sender
        To: recipient
        Subject: message-type

        message content (can span multiple lines)

    Returns:
        Dict with keys: id, from, to, subject, content
        None if parsing fails or required headers missing
    """
    lines = content.split('\n')
    headers = {}
    content_lines = []
    in_content = False

    for line in lines:
        if not in_content:
            # Blank line marks end of headers
            if line.strip() == '':
                in_content = True
                continue
            # Parse header line
            if ':' in line:
                key, value = line.split(':', 1)
                headers[key.strip().lower()] = value.strip()
        else:
            # Everything after blank line is content
            content_lines.append(line)

    # Validate required headers
    required = ['id', 'from', 'to', 'subject']
    if not all(h in headers for h in required):
        return None

    return {
        'id': headers['id'],
        'from': headers['from'],
        'to': headers['to'],
        'subject': headers['subject'],
        'content': '\n'.join(content_lines).strip()
    }


def parse_message_file(filepath: Path) -> Optional[Dict[str, Any]]:
    """
    Parse message file (email format only).

    Post-migration, we only support .txt files in email format.
    Legacy JSON support removed for clean slate architecture.
    """
    try:
        # Only process .txt files
        if filepath.suffix != '.txt':
            print(f"Warning: Unsupported file format: {filepath.suffix}", file=sys.stderr)
            return None

        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        message = parse_email_format(content)

        if not message:
            print(f"Error: Malformed email format in {filepath.name}", file=sys.stderr)
            return None

        return message

    except Exception as e:
        print(f"Error parsing {filepath.name}: {e}", file=sys.stderr)
        return None


# ============================================================================
# MESSAGE READING - Symmetric Implementation
# ============================================================================

def get_last_check_time(ai_name: str) -> float:
    """Get timestamp of last MCP check for specified AI."""
    check_file = CLAUDE_LAST_CHECK if ai_name == "claude" else GEMINI_LAST_CHECK
    try:
        if check_file.exists():
            with open(check_file, 'r') as f:
                return float(f.read().strip())
    except Exception:
        pass
    return 0


def save_check_time(ai_name: str) -> None:
    """Save current timestamp as last check time."""
    check_file = CLAUDE_LAST_CHECK if ai_name == "claude" else GEMINI_LAST_CHECK
    try:
        with open(check_file, 'w') as f:
            f.write(str(datetime.now().timestamp()))
    except Exception as e:
        print(f"Error saving check time: {e}", file=sys.stderr)


def get_new_messages(unread_dir: Path, read_dir: Path) -> List[Dict[str, Any]]:
    """
    Get all unread messages and move them to .read/ directory.

    Three-directory workflow:
    1. Polling client moves new messages to .unread/
    2. MCP tool reads from .unread/ (this function)
    3. After reading, moves to .read/

    Returns:
        List of message dicts with keys: file, id, subject, timestamp, content, time
    """
    if not unread_dir.exists():
        return []

    new_messages = []

    try:
        # Get all .txt files in .unread/ directory
        txt_files = sorted(unread_dir.glob("*.txt"), key=lambda f: f.stat().st_mtime)

        for file in txt_files:
            try:
                message = parse_message_file(file)

                if not message:
                    # Skip malformed messages (already logged by parser)
                    continue

                new_messages.append({
                    'file': file.name,
                    'id': message['id'],
                    'subject': message['subject'],
                    'timestamp': datetime.fromtimestamp(file.stat().st_mtime).isoformat(),
                    'content': message['content'],
                    'time': file.stat().st_mtime
                })

                # Move to .read/ directory (mark as processed)
                read_dir.mkdir(parents=True, exist_ok=True)
                dest = read_dir / file.name
                shutil.move(str(file), str(dest))

            except Exception as e:
                print(f"Error processing {file.name}: {e}", file=sys.stderr)

    except Exception as e:
        print(f"Error scanning .unread/ directory: {e}", file=sys.stderr)

    return new_messages


def format_messages(messages: List[Dict[str, Any]], sender_name: str) -> str:
    """Format messages for display to LLM."""
    if not messages:
        return f"No new messages from {sender_name}."

    count = len(messages)
    header = f"📬 **NEW MESSAGES FROM {sender_name.upper()}** ({count} unread)"

    formatted = [header, "=" * 60, ""]

    for i, msg in enumerate(messages, 1):
        formatted.append(f"**Message {i}/{count}** [{msg['subject']}]")
        formatted.append(f"ID: {msg['id']}")
        formatted.append(f"Time: {msg['timestamp']}")
        formatted.append("")

        # Truncate long messages for preview
        content = msg['content'].strip()
        if len(content) > 1000:
            content = content[:1000] + "\n\n... (truncated, 1000 char limit)"

        formatted.append(content)
        formatted.append("")
        formatted.append("-" * 60)
        formatted.append("")

    return "\n".join(formatted)


# ============================================================================
# MCP SERVER SETUP - Bidirectional Tools
# ============================================================================

server = Server("unified-ai-bridge")


@server.list_tools()
async def list_tools() -> List[Tool]:
    """List available MCP tools (symmetric for both AIs)."""
    return [
        Tool(
            name="read_gemini_messages",
            description="Read new messages from Gemini AI. Returns all unread messages from Gemini since the last check. (For Claude)",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="read_claude_messages",
            description="Read new messages from Claude AI. Returns all unread messages from Claude since the last check. (For Gemini)",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Any) -> List[TextContent]:
    """Handle MCP tool calls (symmetric implementation)."""

    if name == "read_gemini_messages":
        # Claude is reading Gemini's messages
        new_messages = get_new_messages(GEMINI_OUTBOX_UNREAD, GEMINI_OUTBOX_READ)
        save_check_time("claude")
        formatted = format_messages(new_messages, "Gemini")

        return [TextContent(type="text", text=formatted)]

    elif name == "read_claude_messages":
        # Gemini is reading Claude's messages
        new_messages = get_new_messages(CLAUDE_OUTBOX_UNREAD, CLAUDE_OUTBOX_READ)
        save_check_time("gemini")
        formatted = format_messages(new_messages, "Claude")

        return [TextContent(type="text", text=formatted)]

    else:
        raise ValueError(f"Unknown tool: {name}")


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

async def main():
    """Run the unified MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
