# Claude MCP Server

**MCP-based communication bridge for Gemini CLI to receive messages from Claude.**

---

## 🎯 Purpose

Provides a **native Gemini CLI tool** (`read_claude_messages`) that allows Gemini to check for new messages from Claude without watchers or manual file checking.

**Part of the symmetric AI-to-AI communication system** - see `.server/COMMUNICATION-SYSTEM.md` for complete documentation.

---

## 📦 Installation

**For Gemini's environment:**

```bash
cd claude-mcp-server
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

### For Gemini CLI

Add to your Gemini CLI `settings.json` (or equivalent MCP configuration file):

```json
{
  "mcpServers": {
    "claude-bridge": {
      "command": "python3",
      "args": ["/mnt/d/unravel/current_game/code2027/claude-mcp-server/server.py"]
    }
  }
}
```

**Note:** Update the path to match your actual installation location.

---

## 🚀 Usage

### From Gemini CLI

Use the MCP tool directly:

```
read_claude_messages()
```

**Returns:**
- Formatted list of new messages from Claude
- Truncates long messages (>1000 chars) for preview
- Shows message count and filenames
- Automatically updates last-check timestamp

**Example output:**
```
📬 **NEW MESSAGES FROM CLAUDE** (2 unread)
============================================================

**Message 1/2** (from 2025-10-02T08-30-00-0000-claude.txt):

Your message content here...

------------------------------------------------------------

**Message 2/2** (from 2025-10-02T09-00-00-0000-claude.txt):

Another message...

------------------------------------------------------------
```

---

## 🏗️ Architecture

### Protocol
- **Type:** MCP stdio server
- **Transport:** Standard input/output
- **Communication:** Gemini CLI ↔ MCP Server ↔ File System

### Tool Details

**Tool Name:** `read_claude_messages`

**Input:** None (no parameters required)

**Output:** Formatted text with all unread messages

**Tracking:**
- Last check timestamp stored in `.server/.gemini-mcp-last-check`
- Only returns messages modified after last check
- Messages sorted chronologically (oldest first)

### File System

**Message Source:** `.server/claude-inbox/*.txt`

**Message Format:**
- Filename pattern: `YYYY-MM-DDTHH-MM-SS[Z/±HHMM]-claude.txt`
- Content: Plain text messages from Claude
- Modified time: Used to determine "new" messages

---

## 🔄 Symmetric Architecture

This server is the **mirror** of `gemini-mcp-server/`:

```
Claude Code                    Gemini CLI
    ↓                              ↓
gemini-mcp-server          claude-mcp-server
    ↓                              ↓
read_gemini_messages()     read_claude_messages()
    ↓                              ↓
gemini-outbox/             claude-inbox/
```

Both AIs have native, tool-based access to check each other's messages!

---

## 🧪 Testing

### Test 1: Send a message from Claude

```bash
echo "Test message from Claude" > ".server/claude-inbox/$(date -u +%Y-%m-%dT%H-%M-%S%z)-claude.txt"
```

### Test 2: Read with MCP tool

In Gemini CLI, use:
```
read_claude_messages()
```

**Expected:** Should display the test message

### Test 3: Verify tracking

```bash
cat .server/.gemini-mcp-last-check
```

**Expected:** Should show updated timestamp

---

## 🐛 Troubleshooting

### Tool not available in Gemini CLI

**Check:**
1. MCP SDK installed: `pip show mcp`
2. Configuration in Gemini's `settings.json` exists
3. Gemini CLI supports MCP (should be built-in)
4. Restart Gemini CLI to load MCP configuration

**Test manually:**
```bash
cd claude-mcp-server
python3 server.py
# (Should start stdio server, wait for input)
```

### No messages returned

**Check:**
1. Messages exist in `.server/claude-inbox/`
2. Messages are newer than `.server/.gemini-mcp-last-check`
3. Message filenames match pattern `*-claude.txt`

**Reset tracking:**
```bash
rm .server/.gemini-mcp-last-check
```

### Messages not from Claude

**Verify:**
- Claude is writing to `.server/claude-inbox/`
- File permissions allow reading
- Path configuration is correct

---

## 📁 Files

```
claude-mcp-server/
├── server.py          # Main MCP server implementation
├── requirements.txt   # Python dependencies (mcp>=1.2.0)
└── README.md         # This file
```

---

## 🔐 Security Notes

- Reads files from local filesystem only
- No network access (besides stdio to Gemini CLI)
- No authentication required (trusted local environment)
- Messages are plain text

---

## 📖 Related Documentation

- **Complete System:** `.server/COMMUNICATION-SYSTEM.md`
- **Bridge Server:** `.server/README.md`
- **Mirror Server (for Claude):** `gemini-mcp-server/README.md`
- **Gemini Setup:** `.server/GEMINI-SETUP.md`

---

**Version:** 1.0
**Last Updated:** October 2, 2025
**Configuration Status:** ✅ Built and ready for Gemini
**Installation Status:** ⚠️ Requires MCP SDK on Gemini's side
