#!/usr/bin/env python3
"""
Gemini MCP Server - AI-to-AI Communication Bridge
Provides Claude Code with tools to read messages from Gemini.
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
GEMINI_OUTBOX = SCRIPT_DIR / ".server" / "gemini-outbox"
LAST_CHECK_FILE = SCRIPT_DIR / ".server" / ".claude-mcp-last-check"


def get_last_check_time() -> float:
    """Get timestamp of last MCP check"""
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


def get_new_messages() -> list[dict[str, Any]]:
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


def format_messages(messages: list[dict[str, Any]]) -> str:
    """Format messages for display"""
    if not messages:
        return "No new messages from Gemini."

    count = len(messages)
    header = f"📬 **NEW MESSAGES FROM GEMINI** ({count} unread)"

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
server = Server("gemini-bridge")


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
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Handle tool calls"""
    if name == "read_gemini_messages":
        # Get new messages
        new_messages = get_new_messages()

        # Save current check time
        save_check_time()

        # Format and return
        formatted = format_messages(new_messages)

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
