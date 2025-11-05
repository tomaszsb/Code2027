# ⚠️ DEPRECATED - Unified MCP Server

> **🚫 DO NOT USE - File-Based System is Deprecated**
>
> **Status:** DEPRECATED - Use claude-ipc-mcp Instead
> **Version:** 1.0 (Frozen)
> **Created:** 2025-10-07

---

## ❌ THIS SERVER IS DEPRECATED

**Use IPC System:** `claude-ipc-mcp` provides real-time messaging without file polling.

### Migration Path

Replace file-based tools with IPC tools:

| Old (Deprecated) | New (IPC) |
|-----------------|-----------|
| `read_gemini_messages()` | `mcp__claude-ipc__check(instance_id="claude")` |
| `read_claude_messages()` | `mcp__claude-ipc__check(instance_id="gemini-cli")` |
| File polling clients | Built-in TCP sockets |
| `.txt` files in directories | SQLite message queue |

See `claude-ipc-mcp/README.md` for setup.

---

## 🔒 Legacy Documentation

The **Unified MCP Server** was a file-based communication tool that consolidated three previous implementations:

- ~~`gemini-mcp-server/`~~ (deprecated)
- ~~`claude-mcp-server/`~~ (deprecated)
- ~~`ai-bridge-mcp-server/`~~ (deprecated)

---

## Key Features

✅ **Symmetric Architecture** - Both AIs have identical capabilities
✅ **Email Format Only** - Clean, escape-free message format
✅ **Standardized Paths** - All references use `ai-bridge/.server/`
✅ **Three-Directory Workflow** - Atomic message processing
✅ **Bidirectional Tools** - Single server, two tools

---

## Installation

### Prerequisites

```bash
pip install mcp>=1.2.0
```

### Verify Installation

```bash
pip show mcp
```

---

## Configuration

### For Claude Code

Update `.claude/settings.local.json`:

```json
{
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["unified-ai-bridge"]
}
```

Update `ai-bridge/utils/.mcp.json`:

```json
{
  "mcpServers": {
    "unified-ai-bridge": {
      "command": "python3",
      "args": ["/mnt/d/unravel/current_game/code2027/ai-bridge/mcp-servers/unified-mcp-server/server.py"]
    }
  }
}
```

### For Gemini CLI

Add to Gemini's MCP configuration file:

```json
{
  "mcpServers": {
    "unified-ai-bridge": {
      "command": "python3",
      "args": ["/mnt/d/unravel/current_game/code2027/ai-bridge/mcp-servers/unified-mcp-server/server.py"]
    }
  }
}
```

---

## Usage

### Claude Reading Gemini's Messages

```python
read_gemini_messages()
```

**Returns:** Formatted list of all unread messages from Gemini

### Gemini Reading Claude's Messages

```python
read_claude_messages()
```

**Returns:** Formatted list of all unread messages from Claude

---

## Architecture

### Message Flow

```
Claude sends message
    ↓
ai-bridge/.server/claude-outbox/message.txt
    ↓
Polling client (mcp_client_gemini.py) moves to .unread/
    ↓
Gemini calls: read_claude_messages()
    ↓
MCP server reads from .unread/, moves to .read/
    ↓
Gemini receives formatted message
```

(Symmetric process for Gemini → Claude)

### Directory Structure

```
ai-bridge/.server/
├── claude-outbox/
│   ├── .unread/          # Waiting for Gemini to read
│   └── .read/            # Gemini has processed
├── gemini-outbox/
│   ├── .unread/          # Waiting for Claude to read
│   └── .read/            # Claude has processed
├── .claude-mcp-last-check
└── .gemini-mcp-last-check
```

### Message Format (Email-Style .txt)

```
ID: claude-20251007-123456
From: claude
To: gemini
Subject: status_update

This is the message content.
It can span multiple lines.
No JSON escaping needed!
```

---

## Symmetric Design

Both tools use **identical logic**:

| Feature | read_gemini_messages() | read_claude_messages() |
|---------|------------------------|------------------------|
| Read from | `gemini-outbox/.unread/` | `claude-outbox/.unread/` |
| Move to | `gemini-outbox/.read/` | `claude-outbox/.read/` |
| Tracking | `.claude-mcp-last-check` | `.gemini-mcp-last-check` |
| Format | Email .txt only | Email .txt only |
| Parser | `parse_email_format()` | `parse_email_format()` |

**No asymmetries. No inconsistencies.**

---

## Testing

### Test 1: Send Message (Email Format)

```bash
cat > ai-bridge/.server/claude-outbox/test-$(date +%Y%m%d-%H%M%S).txt << 'EOF'
ID: test-message-001
From: claude
To: gemini
Subject: test

This is a test message.
EOF
```

### Test 2: Simulate Polling Client

```bash
# Move to .unread/ (simulates polling client's job)
mv ai-bridge/.server/claude-outbox/test-*.txt ai-bridge/.server/claude-outbox/.unread/
```

### Test 3: Read via MCP Tool

In Gemini CLI or via MCP client:

```python
read_claude_messages()
```

**Expected Output:**
```
📬 **NEW MESSAGES FROM CLAUDE** (1 unread)
============================================================

**Message 1/1** [test]
ID: test-message-001
Time: 2025-10-07T00:00:00

This is a test message.

------------------------------------------------------------
```

### Test 4: Verify File Movement

```bash
# Message should now be in .read/
ls ai-bridge/.server/claude-outbox/.read/test-*.txt
```

---

## Troubleshooting

### Tool not available

**Check MCP server is running:**

```bash
ps aux | grep unified-mcp-server
```

**Restart Claude Code** to reload MCP configuration.

### No messages returned

**Check messages exist:**

```bash
ls ai-bridge/.server/gemini-outbox/.unread/
```

**Reset tracking:**

```bash
rm ai-bridge/.server/.claude-mcp-last-check
```

### Unsupported file format warning

**Problem:** Server only accepts `.txt` files (email format)

**Solution:** Use updated send scripts that create `.txt` files:

```bash
python3 ai-bridge/.server/send_to_gemini.py status_update "Your message"
```

---

## Migration from Legacy Servers

### Deprecated Servers

The following servers are **no longer maintained**:

- `gemini-mcp-server/server.py` - Moved to `mcp-servers/.deprecated/`
- `claude-mcp-server/server.py` - Moved to `mcp-servers/.deprecated/`
- `ai-bridge-mcp-server/server.py` - Moved to `mcp-servers/.deprecated/`

### Configuration Changes Required

1. Update `.mcp.json` server name: `gemini-bridge` → `unified-ai-bridge`
2. Update server path to new location
3. Restart Claude Code/Gemini CLI
4. Verify tools available: `read_gemini_messages`, `read_claude_messages`

### Breaking Changes from Legacy

- **JSON format removed** - Only email `.txt` format supported
- **Inbox root reading removed** - Only reads from `.unread/` subdirectories
- **Asymmetric features removed** - Both tools now identical in capability

---

## Files

```
unified-mcp-server/
├── server.py           # Main MCP server (350 lines)
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

---

## Related Documentation

- **Communication System:** `ai-bridge/.server/COMMUNICATION-SYSTEM.md`
- **Polling Clients:** `ai-bridge/clients/mcp_client.py`
- **Send Scripts:** `ai-bridge/.server/send_to_*.py`

---

**Maintainer:** Claude (AI Lead Programmer)
**Last Updated:** 2025-10-07
**Phase:** 1 - Stabilization Complete
