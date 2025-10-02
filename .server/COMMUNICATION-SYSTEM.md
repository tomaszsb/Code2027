# AI-to-AI Communication System Documentation

## Overview
Bidirectional MCP-based communication system between Claude and Gemini using native Model Context Protocol servers for real-time message exchange.

---

## Components

### 1. Message Directories
- **`.server/claude-inbox/`** - Messages from Claude to Gemini
- **`.server/gemini-outbox/`** - Messages from Gemini to Claude
- **`.server/gemini-notifications/`** - Notifications for Gemini watcher
- **`.server/message-metadata.json`** - Message status tracking (pending/approved/rejected)
- **`.server/conversation-context.json`** - Conversation history (last 10 messages)

### 2. Gemini MCP Server (for Claude to read Gemini's messages)
**Location:** `gemini-mcp-server/`
**File:** `server.py`
**Protocol:** Model Context Protocol (stdio)
**Tool Provided:** `read_gemini_messages()`

**Function:**
- Checks `.server/gemini-outbox/` for new messages from Gemini
- Tracks last check in `.server/.claude-mcp-last-check`
- Returns formatted list of unread messages
- Native Claude Code integration

**Configuration:** Enabled in `.claude/settings.local.json` and `.mcp.json`

**Usage (Claude side):**
```python
# Call the MCP tool to check for new messages
read_gemini_messages()
```

### 3. Claude MCP Server (for Gemini to read Claude's messages)
**Location:** `claude-mcp-server/`
**File:** `server.py`
**Protocol:** Model Context Protocol (stdio)
**Tool Provided:** `read_claude_messages()`

**Function:**
- Checks `.server/claude-inbox/` for new messages from Claude
- Tracks last check in `.server/.gemini-mcp-last-check`
- Returns formatted list of unread messages
- Native Gemini integration

**Configuration:** Gemini configures this in his `settings.json`

**Usage (Gemini side):**
```python
# Call the MCP tool to check for new messages
read_claude_messages()
```

---

## Message Workflow

### Sending a Message (Claude → Gemini)
```bash
echo "Message content" > ".server/claude-inbox/$(date -u +%Y-%m-%dT%H-%M-%S%z)-claude.txt"
```

### Sending a Message (Gemini → Claude)
```bash
echo "Message content" > ".server/gemini-outbox/$(date -u +%Y-%m-%dT%H-%M-%S%z)-gemini.txt"
```

### Message Reading
- **Claude:** Calls `read_gemini_messages()` to check for new messages from Gemini
- **Gemini:** Calls `read_claude_messages()` to check for new messages from Claude
- Both AIs can check on-demand, no automatic polling

---

## Starting the System

### MCP Servers (Auto-load)
Both MCP servers are automatically loaded when Claude Code and Gemini start:

**Claude's configuration (`.claude/settings.local.json` and `.mcp.json`):**
- Loads `gemini-mcp-server` at startup
- Provides `read_gemini_messages()` tool

**Gemini's configuration (his `settings.json`):**
- Loads `claude-mcp-server` at startup
- Provides `read_claude_messages()` tool

**No manual startup required** - MCP servers are managed by the respective AI environments.

### Fresh Start / Reset
To clear all messages and start fresh:

```bash
# 1. Clear all message files
rm -f .server/claude-inbox/*.txt
rm -f .server/gemini-outbox/*.txt

# 2. Reset tracking timestamps
rm -f .server/.claude-mcp-last-check
rm -f .server/.gemini-mcp-last-check
```

---

## Testing the System

### Test 1: Send Message (Claude → Gemini)
```bash
echo "Test message from Claude" > ".server/claude-inbox/$(date -u +%Y-%m-%dT%H-%M-%S%z)-claude.txt"
```
**Expected:** Gemini should see this on next turn

### Test 2: Send Message (Gemini → Claude)
```bash
echo "Test message from Gemini" > ".server/gemini-outbox/$(date -u +%Y-%m-%dT%H-%M-%S%z)-gemini.txt"
```
**Expected:** Claude can read via `read_gemini_messages()` MCP tool

### Test 3: Read Messages (Claude)
Use the MCP tool in Claude Code:
```python
read_gemini_messages()
```
**Expected:** Returns formatted list of new messages from Gemini

### Test 4: Read Messages (Gemini)
Use the MCP tool in Gemini:
```python
read_claude_messages()
```
**Expected:** Returns formatted list of new messages from Claude

---

## Troubleshooting

### MCP tool not available (Claude)
- Verify `gemini-mcp-server` configured in `.claude/settings.local.json` and `.mcp.json`
- Check dependencies: MCP server should have all required packages
- Restart Claude Code to load MCP servers
- Test: Try calling `read_gemini_messages()` tool

### MCP tool not available (Gemini)
- Verify `claude-mcp-server` configured in Gemini's `settings.json`
- Check server path is correct
- Restart Gemini to load MCP servers
- Test: Try calling `read_claude_messages()` tool

### Messages not appearing
- Check message files exist in appropriate directory:
  - `.server/claude-inbox/` for Claude's messages
  - `.server/gemini-outbox/` for Gemini's messages
- Check timestamp tracking files:
  - `.server/.claude-mcp-last-check` (Claude's last read)
  - `.server/.gemini-mcp-last-check` (Gemini's last read)
- Messages are only shown once (new messages since last check)

---

## Message Cleanup

Manual cleanup only:
```bash
# Clear all messages
rm -f .server/claude-inbox/*.txt
rm -f .server/gemini-outbox/*.txt

# Reset tracking
rm -f .server/.claude-mcp-last-check
rm -f .server/.gemini-mcp-last-check
```

---

## Architecture Overview

**Bidirectional MCP Communication:**

```
Claude                              Gemini
  |                                   |
  | read_gemini_messages()           | read_claude_messages()
  | (via gemini-mcp-server)          | (via claude-mcp-server)
  |                                   |
  v                                   v
.server/gemini-outbox/          .server/claude-inbox/
  ^                                   ^
  |                                   |
  | (writes messages)                 | (writes messages)
  |                                   |
Gemini                             Claude
```

**Key Features:**
- ✅ **Symmetric architecture:** Both AIs have identical capabilities
- ✅ **Native MCP integration:** No external servers or processes needed
- ✅ **On-demand checking:** AIs check for messages when needed
- ✅ **File-based exchange:** Simple, reliable text file messaging
- ✅ **Timestamp tracking:** Each AI tracks their own last check time

---

**Version:** 4.0 (Pure MCP Architecture)
**Last Updated:** October 2, 2025
**Authors:** Claude (implementation), Gemini (review)
