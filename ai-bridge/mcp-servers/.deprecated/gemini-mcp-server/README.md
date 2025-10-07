# Gemini MCP Server

**MCP-based communication bridge for Claude Code to receive messages from Gemini.**

---

## 🎯 Purpose

Provides a **native Claude Code tool** (`read_gemini_messages`) that allows Claude to check for new messages from Gemini without hooks or manual intervention.

**Part of the larger AI-to-AI communication system** - see `.server/COMMUNICATION-SYSTEM.md` for complete documentation.

---

## 📦 Installation

**Status:** ⚠️ MCP SDK not currently installed

To install:
```bash
cd gemini-mcp-server
pip install -r requirements.txt
```

**Requirements:**
- Python 3.8+
- `mcp>=1.2.0` (Model Context Protocol SDK)

**Check installation:**
```bash
pip show mcp
```

---

## ⚙️ Configuration

### Automatic (Already Configured)

The MCP server is already configured in `.claude/settings.local.json`:

```json
{
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["gemini-bridge"]
}
```

And referenced in `../.mcp.json`:

```json
{
  "mcpServers": {
    "gemini-bridge": {
      "command": "python3",
      "args": ["/mnt/d/unravel/current_game/code2027/gemini-mcp-server/server.py"]
    }
  }
}
```

### Manual Configuration

If not already configured, add via CLI:

```bash
claude mcp add gemini-bridge python3 /mnt/d/unravel/current_game/code2027/gemini-mcp-server/server.py
```

---

## 🚀 Usage

### From Claude Code

Use the MCP tool directly:

```
read_gemini_messages()
```

**Returns:**
- Formatted list of new messages from Gemini
- Truncates long messages (>1000 chars) for preview
- Shows message count and filenames
- Automatically updates last-check timestamp

**Example output:**
```
📬 **NEW MESSAGES FROM GEMINI** (2 unread)
============================================================

**Message 1/2** (from 2025-10-02T14-30-00Z-gemini.txt):

Your message content here...

------------------------------------------------------------

**Message 2/2** (from 2025-10-02T14-45-00Z-gemini.txt):

Another message...

------------------------------------------------------------
```

---

## 🏗️ Architecture

### Protocol
- **Type:** MCP stdio server
- **Transport:** Standard input/output
- **Communication:** Claude Code ↔ MCP Server ↔ File System

### Tool Details

**Tool Name:** `read_gemini_messages`

**Input:** None (no parameters required)

**Output:** Formatted text with all unread messages

**Tracking:**
- Last check timestamp stored in `.server/.claude-mcp-last-check`
- Only returns messages modified after last check
- Messages sorted chronologically (oldest first)

### File System

**Message Source:** `.server/gemini-outbox/*.txt`

**Message Format:**
- Filename pattern: `YYYY-MM-DDTHH-MM-SS[Z/±HHMM]-gemini.txt`
- Content: Plain text messages from Gemini
- Modified time: Used to determine "new" messages

---

## 🔄 Relationship to Other Systems

### Bridge Server (Complementary)
- **Bridge:** HTTP server for message management and web UI
- **MCP Server:** Tool-based message reading for Claude
- **Both can coexist:** Bridge provides oversight, MCP provides on-demand access

### Gemini Watcher (Required for Gemini → Claude)
- Gemini's side must run `gemini-watcher-simple.py`
- Monitors `claude-inbox/` for messages from Claude
- Writes responses to `gemini-outbox/`
- MCP server reads from `gemini-outbox/`

### Hook System (Legacy - Disabled)
- Old approach: Auto-inject messages on every prompt
- **Status:** Inactive (replaced by MCP approach)
- MCP provides same functionality with better control

---

## 🧪 Testing

### Test 1: Send a message from Gemini

```bash
echo "Test message from Gemini" > ".server/gemini-outbox/$(date -u +%Y-%m-%dT%H-%M-%S%z)-gemini.txt"
```

### Test 2: Read with MCP tool

In Claude Code, use:
```
read_gemini_messages()
```

**Expected:** Should display the test message

### Test 3: Verify tracking

```bash
cat .server/.claude-mcp-last-check
```

**Expected:** Should show updated timestamp

---

## 🐛 Troubleshooting

### Tool not available in Claude Code

**Check:**
1. MCP SDK installed: `pip show mcp`
2. Configuration in `.mcp.json` exists
3. Settings in `.claude/settings.local.json` enable MCP servers
4. Restart Claude Code to load MCP configuration

**Test manually:**
```bash
cd gemini-mcp-server
python3 server.py
# (Should start stdio server, wait for input)
```

### No messages returned

**Check:**
1. Messages exist in `.server/gemini-outbox/`
2. Messages are newer than `.server/.claude-mcp-last-check`
3. Message filenames match pattern `*-gemini.txt`

**Reset tracking:**
```bash
rm .server/.claude-mcp-last-check
```

### Messages not from Gemini

**Verify:**
- Gemini watcher is running: `ps aux | grep gemini-watcher`
- Start if needed: `cd .server && python3 gemini-watcher-simple.py &`

---

## 📁 Files

```
gemini-mcp-server/
├── server.py          # Main MCP server implementation
├── requirements.txt   # Python dependencies (mcp>=1.2.0)
└── README.md         # This file
```

---

## 🔐 Security Notes

- Reads files from local filesystem only
- No network access (besides stdio to Claude Code)
- No authentication required (trusted local environment)
- Messages are plain text

---

## 🔮 Future Enhancements

- [ ] Support for message filtering by date range
- [ ] Mark messages as read/unread
- [ ] Delete old messages via tool
- [ ] Send messages to Gemini (currently Gemini watcher only)

---

## 📖 Related Documentation

- **Complete System:** `.server/COMMUNICATION-SYSTEM.md`
- **Bridge Server:** `.server/README.md`
- **Gemini Setup:** `.server/GEMINI-SETUP.md`
- **Claude Charter:** `CLAUDE.md` (session initialization)

---

**Version:** 1.0
**Last Updated:** October 2, 2025
**Configuration Status:** ✅ Configured in settings
**Installation Status:** ⚠️ MCP SDK requires `pip install mcp`
