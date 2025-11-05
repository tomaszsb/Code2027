# AI-to-AI Communication System Documentation

**Version:** 9.0 (Phase 1 Stabilization Complete)
**Date:** October 7, 2025
**Status:** ✅ Production Ready

---

## Overview

The communication system enables reliable, bidirectional message exchange between Claude and Gemini using:
- **Unified MCP Server** - Single implementation, symmetric tools
- **Email-style .txt format** - No JSON escaping issues
- **Three-directory workflow** - Atomic message processing
- **Polling clients** - Automated background message routing

---

## Architecture

```
Claude LLM                                           Gemini LLM
    |                                                     |
    | send_to_gemini.py (creates .txt)                   | send_to_claude.py (creates .txt)
    v                                                     v
ai-bridge/.server/claude-outbox/                   ai-bridge/.server/gemini-outbox/
    |                                                     |
    | Polling client (mcp_client_gemini.py)              | Polling client (mcp_client.py)
    | polls every 5s, moves to .unread/                  | polls every 5s, moves to .unread/
    v                                                     v
.unread/ subdirectory                              .unread/ subdirectory
    |                                                     |
    | MCP tool: read_claude_messages()                   | MCP tool: read_gemini_messages()
    | Reads from .unread/, moves to .read/               | Reads from .unread/, moves to .read/
    v                                                     v
Gemini receives formatted message                  Claude receives formatted message
```

---

## Components

### 1. Unified MCP Server
**Location:** `ai-bridge/mcp-servers/unified-mcp-server/server.py`

**Tools Provided:**
- `read_gemini_messages()` - For Claude to read Gemini's messages
- `read_claude_messages()` - For Gemini to read Claude's messages

**Features:**
- Symmetric implementation (identical logic for both directions)
- Email format parser only (JSON support removed)
- Reads from `ai-bridge/.server/{sender}-outbox/.unread/`
- Moves processed messages to `.read/` directory

### 2. Polling Clients
**Location:** `ai-bridge/clients/`

**Files:**
- `mcp_client.py` - Claude's client (reads from gemini-outbox)
- `mcp_client_gemini.py` - Gemini's client (reads from claude-outbox)

**Responsibilities:**
1. Poll inbox root directory every 5 seconds
2. Move new messages to `.processing/` (atomic operation)
3. Parse and validate message format
4. Move valid messages to `.unread/` (ready for LLM)
5. Move invalid messages to `.malformed/`

### 3. Send Scripts
**Location:** `ai-bridge/.server/`

**Files:**
- `send_to_gemini.py` - Claude sends to Gemini
- `send_to_claude.py` - Gemini sends to Claude

**Usage:**
```bash
echo "Your message" | python3 ai-bridge/.server/send_to_gemini.py MSG_TYPE
```

**Output:** Creates `.txt` file in email format

### 4. Management Scripts
**Location:** `ai-bridge/management/`

**Files:**
- `ai-collab.sh` - Manage Claude's polling client
- `ai-collab-gemini.sh` - Manage Gemini's polling client

**Commands:**
```bash
./ai-bridge/management/ai-collab.sh start   # Start client
./ai-bridge/management/ai-collab.sh stop    # Stop client
./ai-bridge/management/ai-collab.sh status  # Check status
./ai-bridge/management/ai-collab.sh health  # Health check
```

---

## Message Format

### Email-Style Format (.txt)

**Structure:**
```
ID: message-id
From: sender (claude|gemini)
To: recipient (claude|gemini)
Subject: message-type

Message content goes here.
Can span multiple lines.
No escaping needed for special characters: $(), \, ", ', etc.
```

**Example:**
```
ID: claude-20251007-123456
From: claude
To: gemini
Subject: status_update

Phase 1 stabilization is complete!

Key improvements:
- Unified MCP server
- Email format migration
- Path standardization
```

**Why Email Format?**
- No JSON escaping issues with special characters
- Human-readable
- Simple to parse
- No nested encoding problems

---

## Directory Structure

```
ai-bridge/
├── .server/
│   ├── claude-outbox/           # Messages Claude → Gemini
│   │   ├── .processing/          # Client actively processing
│   │   ├── .unread/              # Waiting for Gemini to read
│   │   ├── .read/                # Gemini has processed
│   │   └── .malformed/           # Failed validation
│   ├── gemini-outbox/           # Messages Gemini → Claude
│   │   ├── .processing/          # Client actively processing
│   │   ├── .unread/              # Waiting for Claude to read
│   │   ├── .read/                # Claude has processed
│   │   └── .malformed/           # Failed validation
│   ├── .claude-mcp-last-check   # MCP tool tracking
│   ├── .gemini-mcp-last-check   # MCP tool tracking
│   └── send_to_*.py             # Send scripts
├── clients/
│   ├── mcp_client.py            # Claude's polling client
│   └── mcp_client_gemini.py     # Gemini's polling client
├── management/
│   ├── ai-collab.sh             # Claude's client manager
│   └── ai-collab-gemini.sh      # Gemini's client manager
├── mcp-servers/
│   └── unified-mcp-server/      # NEW: Consolidated MCP server
│       ├── server.py
│       ├── requirements.txt
│       └── README.md
└── utils/
    └── .mcp.json                # MCP server configuration
```

---

## Three-Directory Workflow

**Message Lifecycle:**

1. **Sender creates message** - Write .txt file to outbox root
2. **Polling client detects** - Within 5 seconds
3. **Move to .processing/** - Atomic operation (prevents race conditions)
4. **Parse and validate** - Check email format headers
5. **Move to .unread/** - Client's job complete
6. **LLM reads via MCP tool** - `read_{sender}_messages()`
7. **Move to .read/** - After LLM processes

**Why Three Directories?**
- **Atomic operations**: `.processing/` prevents concurrent access
- **Clear states**: Easy to see message status
- **Separation of concerns**: Client vs. LLM responsibilities
- **Error isolation**: Malformed messages don't block pipeline

---

## Complete Workflows

### Claude → Gemini

```bash
# 1. Claude sends message
echo "Status update" | python3 ai-bridge/.server/send_to_gemini.py status_update

# Creates: ai-bridge/.server/claude-outbox/claude-20251007-HHMMSS.txt

# 2. Gemini's polling client detects (within 5s)
# Moves to: ai-bridge/.server/claude-outbox/.unread/claude-20251007-HHMMSS.txt

# 3. Gemini reads via MCP tool
read_claude_messages()

# Returns formatted message, moves to .read/
```

### Gemini → Claude

```bash
# 1. Gemini sends message
echo "Acknowledged" | python3 ai-bridge/.server/send_to_claude.py ack

# Creates: ai-bridge/.server/gemini-outbox/gemini-20251007-HHMMSS.txt

# 2. Claude's polling client detects (within 5s)
# Moves to: ai-bridge/.server/gemini-outbox/.unread/gemini-20251007-HHMMSS.txt

# 3. Claude reads via MCP tool
read_gemini_messages()

# Returns formatted message, moves to .read/
```

---

## Setup & Installation

### Prerequisites

```bash
# Install MCP SDK
pip install mcp>=1.2.0

# Verify installation
pip show mcp
```

### Start Polling Clients

```bash
# Start Claude's client (reads from Gemini)
./ai-bridge/management/ai-collab.sh start

# Start Gemini's client (reads from Claude)
./ai-bridge/management/ai-collab-gemini.sh start
```

### Configure MCP Server (Already Done)

**Claude:** Configured in `.claude/settings.local.json`
```json
{
  "enabledMcpjsonServers": ["unified-ai-bridge"]
}
```

**MCP Path:** Configured in `ai-bridge/utils/.mcp.json`
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

## Testing

### End-to-End Test

```bash
# 1. Ensure clients are running
./ai-bridge/management/ai-collab.sh status

# 2. Claude sends test message
echo "Hello Gemini!" | python3 ai-bridge/.server/send_to_gemini.py test

# 3. Wait 5 seconds for polling
sleep 6

# 4. Check message in .unread/
ls ai-bridge/.server/claude-outbox/.unread/

# 5. Gemini reads via MCP tool
# (In Gemini CLI): read_claude_messages()

# 6. Verify message moved to .read/
ls ai-bridge/.server/claude-outbox/.read/
```

### Health Check

```bash
./ai-bridge/management/ai-collab.sh health
```

**Output Example:**
```
=== Message Queue Health Check ===

📬 Claude's Inbox (from Gemini):
  ✓ Inbox root clear
  ✓ No stuck messages in .processing/
  ✓ No unread messages
  ✓ No malformed messages

📤 Claude's Outbox (to Gemini):
  ✓ Outbox root clear
  ✓ No stuck messages in .processing/
  ℹ️  2 unread by Gemini (all recent)
  ✓ No malformed messages

🔧 Client Status:
  ✓ Communication client running (PID: 12345)

===================================
✅ All systems healthy
```

---

## Troubleshooting

### Messages not being delivered

**Check polling client:**
```bash
./ai-bridge/management/ai-collab.sh status
```

**If not running:**
```bash
./ai-bridge/management/ai-collab.sh start
```

### Messages stuck in .processing/

**Cause:** Client crashed during processing

**Solution:**
```bash
# Stop client
./ai-bridge/management/ai-collab.sh stop

# Move stuck messages back to inbox
mv ai-bridge/.server/gemini-outbox/.processing/*.txt ai-bridge/.server/gemini-outbox/

# Restart client
./ai-bridge/management/ai-collab.sh start
```

### MCP tool not available

**Check MCP SDK:**
```bash
pip show mcp
```

**Restart Claude Code** to reload MCP configuration

### Malformed messages

**Check malformed directory:**
```bash
ls ai-bridge/.server/gemini-outbox/.malformed/
```

**Common causes:**
- Missing required headers (ID, From, To, Subject)
- No blank line between headers and content
- File not in .txt format

**Fix:** Update send script, resend message

---

## Migration from v8.0

### Changes in v9.0

1. **Unified MCP Server** - Replaces 3 separate servers
2. **Email format exclusive** - JSON support removed
3. **Simplified paths** - All use `ai-bridge/.server/`
4. **Fixed double-encoding** - Send scripts create clean email format

### Deprecated Components

Moved to `ai-bridge/mcp-servers/.deprecated/`:
- `gemini-mcp-server/`
- `claude-mcp-server/`
- `ai-bridge-mcp-server/`

### Configuration Updates Required

1. Update `.claude/settings.local.json`:
   - Change `"gemini-bridge"` → `"unified-ai-bridge"`

2. Update `ai-bridge/utils/.mcp.json`:
   - Update server path to `unified-mcp-server/server.py`

3. Restart Claude Code and Gemini CLI

---

## Best Practices

### For Sending Messages

✅ **DO:**
- Use stdin for message content: `echo "msg" | send_to_gemini.py type`
- Keep subject types consistent: `status_update`, `query`, `task`, `ack`
- Include context in message body

❌ **DON'T:**
- Create files manually (use send scripts)
- Mix .json and .txt formats
- Write directly to .unread/ (use outbox root)

### For Reading Messages

✅ **DO:**
- Use MCP tools: `read_gemini_messages()`, `read_claude_messages()`
- Read regularly (messages accumulate in .unread/)
- Move processed messages to .read/

❌ **DON'T:**
- Read from inbox root (polling client's job)
- Delete messages from .unread/ (breaks workflow)
- Parse messages manually (use MCP tools)

---

## Performance

- **Latency:** ~5 seconds (polling interval)
- **Throughput:** Unlimited (no queuing bottleneck)
- **Message size:** No hard limit (1000 char truncation in MCP display only)
- **Concurrency:** Atomic operations prevent race conditions

---

## Related Documentation

- **Unified MCP Server:** `ai-bridge/mcp-servers/unified-mcp-server/README.md`
- **Protocol History:** `ai-bridge/.server/.archive-docs/` (v1.0-v8.0)
- **Claude Charter:** `CLAUDE.md`
- **Gemini Instructions:** `GEMINI.md`

---

## Support & Maintenance

**Maintainer:** Claude (AI Lead Programmer)
**Created:** October 7, 2025 (Phase 1 Stabilization)
**Last Updated:** October 7, 2025

**For issues:**
1. Check health: `./ai-bridge/management/ai-collab.sh health`
2. Review debug logs: `ai-bridge/.server/mcp_client_debug.log`
3. Test end-to-end workflow (see Testing section)

---

**Version History:**
- **v9.0** (Oct 7, 2025): Phase 1 stabilization - Unified server, email format exclusive
- **v8.0** (Oct 6, 2025): Email format migration (incomplete)
- **v7.0-v2.0**: Incremental feature additions (archived)
- **v1.0** (Sep 30, 2025): Initial protocol (archived)
