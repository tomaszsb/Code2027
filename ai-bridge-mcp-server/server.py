#!/usr/bin/env python3
"""
Bidirectional AI Bridge MCP Server
Provides both Claude and Gemini with tools to read each other's messages.
"""
import os
import sys
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


# Paths
SCRIPT_DIR = Path(__file__).parent.parent
SERVER_DIR = SCRIPT_DIR / ".server"
GEMINI_OUTBOX = SERVER_DIR / "gemini-outbox"
CLAUDE_INBOX = SERVER_DIR / "claude-inbox"
CLAUDE_LAST_CHECK = SERVER_DIR / ".claude-mcp-last-check"
GEMINI_LAST_CHECK = SERVER_DIR / ".gemini-mcp-last-check"


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


def get_new_messages(inbox_dir: Path, file_pattern: str, last_check: float) -> list[dict[str, Any]]:
    """Get all messages newer than last check from specified inbox"""
    if not inbox_dir.exists():
        return []

    new_messages = []

    try:
        for file in inbox_dir.glob(file_pattern):
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
        print(f"Error scanning inbox: {e}", file=sys.stderr)

    # Sort by time (oldest first)
    new_messages.sort(key=lambda x: x['time'])
    return new_messages


def format_messages(messages: list[dict[str, Any]], sender_name: str) -> str:
    """Format messages for display"""
    if not messages:
        return f"No new messages from {sender_name}."

    count = len(messages)
    header = f"📬 **NEW MESSAGES FROM {sender_name.upper()}** ({count} unread)"

    formatted = [header, "=" * 60, ""]

    for i, msg in enumerate(messages, 1):
        formatted.append(f"**Message {i}/{count}** (from {msg['file']}):")
        formatted.append("")
        # Truncate long messages for preview
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
        # Claude is reading Gemini's messages
        last_check = get_last_check_time("claude")
        new_messages = get_new_messages(GEMINI_OUTBOX, "*-gemini.txt", last_check)
        save_check_time("claude")
        formatted = format_messages(new_messages, "Gemini")

        return [
            TextContent(
                type="text",
                text=formatted
            )
        ]

    elif name == "read_claude_messages":
        # Gemini is reading Claude's messages
        last_check = get_last_check_time("gemini")
        new_messages = get_new_messages(CLAUDE_INBOX, "*-claude.txt", last_check)
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
