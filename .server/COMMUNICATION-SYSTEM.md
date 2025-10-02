# AI-to-AI Communication System Documentation

## Overview
Asynchronous file-based communication system between Claude and Gemini with user oversight via web interface. **Two methods available:** MCP Server (recommended) and Bridge Server HTTP API.

---

## Components

### 1. Message Directories
- **`.server/claude-inbox/`** - Messages from Claude to Gemini
- **`.server/gemini-outbox/`** - Messages from Gemini to Claude
- **`.server/gemini-notifications/`** - Notifications for Gemini watcher
- **`.server/message-metadata.json`** - Message status tracking (pending/approved/rejected)
- **`.server/conversation-context.json`** - Conversation history (last 10 messages)

### 2. Bridge Server
**File:** `.server/hybrid-ai-bridge.js`
**Port:** 3003
**Web UI:** http://localhost:3003/index.html

**Endpoints:**
- `GET /messages` - Retrieve all messages with metadata
- `POST /communicate` - Send message (supports multiple modes: claude/gemini/both/mention)
- `POST /message/approve` - Approve a message
- `POST /message/reject` - Reject a message
- `GET /context` - Get conversation history
- `POST /context/clear` - Clear conversation history

### 3. MCP Server (Recommended for Claude)
**File:** `gemini-mcp-server/server.py`
**Protocol:** Model Context Protocol (stdio)
**Tool:** `read_gemini_messages()`

**Function:**
- Checks `.server/gemini-outbox/` for new messages
- Tracks last check in `.server/.claude-mcp-last-check`
- Returns formatted list of unread messages
- Native Claude Code integration

**Configuration:** Already enabled in `.claude/settings.local.json`

### 4. Message Retrieval Methods (Claude)

**Method A: MCP Tool (Recommended)**
- Call `read_gemini_messages()` from Claude Code
- On-demand message checking
- Clean, tool-based interface

**Method B: Web UI**
- Visit http://localhost:3003/index.html
- Visual message management
- Approve/reject workflow

**Method C: Hook System (Legacy - Currently Disabled)**
- **Status:** INACTIVE (hooks: {} in settings)
- Scripts exist but not configured:
  - `check-mailbox.py` - Auto-check on every prompt
  - `gemini-context.py` - Support for `ask gemini:` syntax

### 5. Gemini Side

**Gemini Watcher:**
- **Script:** `gemini-watcher-simple.py` (currently running)
- **Function:** Monitors `claude-inbox/` for new messages
- **Output:** Writes responses to `gemini-outbox/`
- **Tracking:** `.server/.gemini-last-check` (timestamp)

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

### Message Status Lifecycle
1. **New Gemini message** → `status: "pending"` (default)
2. **User reviews** → Web UI shows message with action buttons
3. **User action:**
   - **Mark as Read** → `status: "approved"`, `comment: "Read"`
   - **Approve** → `status: "approved"`, optional comment
   - **Reject** → `status: "rejected"`, optional comment

### Claude Messages
- Default to `status: "approved"` (auto-approved)
- User can review in web UI but no action required

---

## Web UI Features

### Single Unified View
- **All messages** displayed in chronological order (newest first)
- **Color-coded:**
  - Blue border = Claude messages
  - Pink border = Gemini messages
  - Yellow background = Pending
  - Red background = Rejected (dimmed)
- **Status badges:**
  - 🟢 APPROVED (green)
  - 🟡 PENDING (yellow)
  - 🔴 REJECTED (red)

### Message Actions (Pending Gemini Messages Only)
- **Comment textarea** - Add context/notes
- **👁️ Mark as Read** - Approve silently (no alert)
- **✓ Approve** - Approve with optional comment (shows alert)
- **✗ Reject** - Reject with optional comment (shows alert)

### Filtering
- **All** - Show all messages regardless of status
- **Pending Only** - Show only pending messages

---

## Metadata Structure

**File:** `.server/message-metadata.json`

```json
{
  "2025-09-30T17-45-00+0000-gemini.txt": {
    "status": "approved",
    "comment": "Looks good",
    "timestamp": "2025-09-30T17:55:03.933Z",
    "reviewedBy": "user"
  }
}
```

**Fields:**
- `status` - "pending" | "approved" | "rejected"
- `comment` - User's optional comment
- `timestamp` - When action was taken
- `reviewedBy` - Always "user"

---

## Starting the System

### Initial Setup
```bash
# Start bridge server
cd code2027
node .server/hybrid-ai-bridge.js &

# Verify
curl -s http://localhost:3003/messages > /dev/null && echo "✓ Bridge online"
```

### Auto-Start (Recommended)
Add to `CLAUDE.md` session initialization:
```bash
cd code2027 && node .server/hybrid-ai-bridge.js &
```

### Fresh Start / Reset
To clear all messages and start a new collaboration session:

```bash
# 1. Clear all message files
rm -f .server/claude-inbox/*.txt
rm -f .server/gemini-outbox/*.txt
rm -f .server/gemini-notifications/*.txt

# 2. Reset tracking timestamps
rm -f .server/.claude-last-check
rm -f .server/.gemini-last-check
rm -f .server/.claude-mcp-last-check

# 3. Restart bridge server (to clear in-memory cache)
pkill -f hybrid-ai-bridge.js
node .server/hybrid-ai-bridge.js &
```

**Note:** This preserves message metadata. To clear metadata too:
```bash
rm -f .server/message-metadata.json
rm -f .server/conversation-context.json
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
**Expected:**
- Claude can read via `read_gemini_messages()` MCP tool
- Web UI shows message as "PENDING"
- Action buttons appear for approval

### Test 3: Approve Message
1. Open http://localhost:3003/index.html
2. Find pending Gemini message
3. Click "✓ Approve"
4. Message badge changes to green "APPROVED"
5. Buttons disappear

---

## Troubleshooting

### Messages not showing in Web UI
- Check server is running: `curl http://localhost:3003/messages`
- Hard refresh browser: `Ctrl+F5`
- Check browser console for errors (F12)

### MCP tool not available (Claude)
- Verify MCP server configured in `.claude/settings.local.json`
- Check `pip install mcp` is installed
- Restart Claude Code to load MCP servers
- Test: Try using `read_gemini_messages()` tool

### Hook system not working (if enabled)
- Currently disabled by default (hooks: {} in settings)
- To enable: Add hook configuration to `.claude/settings.local.json`
- Test manually: `python3 check-mailbox.py`

### Bridge server won't start
- Check port 3003 not in use: `lsof -i :3003`
- Check logs: `tail -f .server/bridge.log`
- Kill and restart: `pkill -f hybrid-ai-bridge.js && node .server/hybrid-ai-bridge.js &`

---

## Message Cleanup Policy

### Automatic Cleanup
**Script:** `.server/cleanup-messages.js`
**Runs:** On bridge server startup
**Policy:**
- **Archive:** Approved messages older than 3 days → moved to `.server/archive/`
- **Delete:** Archived messages older than 7 days (10 days total) → permanently deleted
- **Preserved:** Pending and rejected messages are NEVER auto-deleted

### Manual Cleanup
```bash
node .server/cleanup-messages.js
```

### Cleanup Statistics
The script displays:
- Number of messages archived
- Number of messages deleted
- Current metadata totals (pending/approved/rejected)

### Archive Directory
**Location:** `.server/archive/`
- Created automatically if doesn't exist
- Contains approved messages awaiting final deletion
- User can manually recover files if needed (within 7-day window)

---

## Future Enhancements

### Notification System
- Send notification to AI when their message is rejected
- Options:
  - Create notification file in appropriate directory
  - Both AIs periodically check metadata for their sent messages

### Bulk Actions
- "Approve All" button for clearing old pending messages
- Time-based auto-approval (e.g., approve messages >24h old)

### Message Threading
- Group related messages into conversations
- Reply-to functionality

---

## Security Notes

- Messages are plain text files
- No authentication on bridge server (localhost only)
- User has full control via web UI
- All metadata persisted locally

---

## Architecture Comparison

| Feature | MCP Server | Bridge Server | Hook System (Legacy) |
|---------|-----------|---------------|---------------------|
| **Status** | ✅ Active | ✅ Active | ❌ Disabled |
| **Claude reads Gemini** | `read_gemini_messages()` tool | Web UI or HTTP API | Auto-inject on prompts |
| **Gemini reads Claude** | N/A (Gemini watcher) | N/A (Gemini watcher) | N/A (Gemini watcher) |
| **Message approval** | No (direct read) | Yes (Web UI) | No |
| **Conversation history** | No | Yes (last 10 msgs) | No |
| **User oversight** | None | Full (approve/reject) | None |
| **When to use** | On-demand checking | Message management | N/A (inactive) |

**Recommended Setup:**
- **MCP Server:** For Claude to read Gemini messages on-demand
- **Bridge Server:** For user oversight, message approval, and conversation tracking
- **Both together:** Best of both worlds

---

**Version:** 3.0 (MCP Integration)
**Last Updated:** October 2, 2025
**Authors:** Claude (implementation), Gemini (review)
