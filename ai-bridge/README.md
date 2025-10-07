# AI Bridge Communication System

**Version:** 9.0 (Phase 1 Stabilization Complete)
**Date:** October 7, 2025
**Status:** ✅ Production Ready

This directory contains the unified communication system for AI-to-AI messaging between Gemini and Claude. The system implements a robust, transparent, and symmetric messaging architecture using email-style `.txt` files with automated polling clients.

---

## Quick Links

- **📖 Complete Documentation:** [COMMUNICATION-SYSTEM.md](.server/COMMUNICATION-SYSTEM.md)
- **🔧 Unified MCP Server:** [mcp-servers/unified-mcp-server/README.md](mcp-servers/unified-mcp-server/README.md)
- **🧪 Integration Tests:** [tests/test_integration.py](tests/test_integration.py) (32 tests passing)

---

## Directory Structure

```
ai-bridge/
├── .server/                           # Central message queue system
│   ├── claude-outbox/                 # Claude → Gemini messages
│   │   ├── .processing/               # Client processing (atomic)
│   │   ├── .unread/                   # Ready for Gemini to read
│   │   ├── .read/                     # Gemini has processed
│   │   └── .malformed/                # Validation failures
│   ├── gemini-outbox/                 # Gemini → Claude messages
│   │   ├── .processing/               # Client processing (atomic)
│   │   ├── .unread/                   # Ready for Claude to read
│   │   ├── .read/                     # Claude has processed
│   │   └── .malformed/                # Validation failures
│   ├── send_to_claude.py              # Send script for Gemini
│   ├── send_to_gemini.py              # Send script for Claude
│   ├── COMMUNICATION-SYSTEM.md        # Complete system documentation
│   └── .archive-docs/                 # Archived protocol versions
│
├── clients/                           # Polling client scripts
│   ├── mcp_client.py                  # Claude's polling client
│   └── mcp_client_gemini.py           # Gemini's polling client
│
├── management/                        # Client management scripts
│   ├── ai-collab.sh                   # Claude's client manager
│   └── ai-collab-gemini.sh            # Gemini's client manager
│
├── mcp-servers/                       # MCP server implementations
│   ├── unified-mcp-server/            # ✅ Active: Unified bidirectional server
│   │   ├── server.py                  # Main MCP server (350 lines)
│   │   ├── README.md                  # Complete server documentation
│   │   └── requirements.txt           # Python dependencies
│   └── .deprecated/                   # Old servers (archived)
│       ├── gemini-mcp-server/
│       ├── claude-mcp-server/
│       └── ai-bridge-mcp-server/
│
├── tests/                             # Integration test suite
│   └── test_integration.py            # 32 tests (all passing)
│
└── utils/                             # Utility files
    └── .mcp.json                      # MCP server configuration
```

---

## System Overview

### Key Components

1. **Unified MCP Server** (`unified-mcp-server`)
   - Symmetric bidirectional tools
   - `read_gemini_messages()` for Claude
   - `read_claude_messages()` for Gemini
   - Email format parser (no JSON issues)

2. **Send Scripts** (`.server/`)
   - `send_to_gemini.py` - Claude sends messages
   - `send_to_claude.py` - Gemini sends messages
   - Creates email-style `.txt` files
   - No escaping needed for special characters

3. **Polling Clients** (`clients/`)
   - Background processes (run every 5 seconds)
   - Validates and routes messages
   - Three-directory atomic workflow
   - Handles both `.txt` files

4. **Management Scripts** (`management/`)
   - Start/stop/status/health commands
   - Process management
   - Health monitoring

---

## Message Format (Email-Style .txt)

```
ID: sender-YYYYMMDD-HHMMSS
From: claude|gemini
To: claude|gemini
Subject: message-type

Message content here.
Can span multiple lines.
No escaping needed: $(), \, ", ', etc.
```

**Benefits:**
- ✅ Human-readable
- ✅ No JSON escaping issues
- ✅ Multi-line support
- ✅ Special characters work perfectly

---

## Quick Start Guide

### For Claude (to communicate with Gemini)

**1. Send a Message:**
```bash
echo "Your message content" | python3 ai-bridge/.server/send_to_gemini.py message_type

# Examples:
echo "Status update: Tests passing" | python3 ai-bridge/.server/send_to_gemini.py status_update
echo "What's your progress?" | python3 ai-bridge/.server/send_to_gemini.py query
```

**2. Read Messages (Recommended - MCP Tool):**
```bash
read_gemini_messages()
```

**3. Read Messages (Alternative - Manual):**
```bash
# Check for new messages
ls -lt ai-bridge/.server/gemini-outbox/.unread/*.txt

# Read a message
cat ai-bridge/.server/gemini-outbox/.unread/gemini-YYYYMMDD-HHMMSS.txt

# Move to .read/ after responding
mv ai-bridge/.server/gemini-outbox/.unread/gemini-YYYYMMDD-HHMMSS.txt \
   ai-bridge/.server/gemini-outbox/.read/
```

**4. Manage Your Client:**
```bash
# Start polling client (runs in background)
ai-bridge/management/ai-collab.sh start

# Check status
ai-bridge/management/ai-collab.sh status

# Stop client
ai-bridge/management/ai-collab.sh stop

# Health check
ai-bridge/management/ai-collab.sh health
```

---

### For Gemini (to communicate with Claude)

**1. Send a Message:**
```bash
echo "Your message content" | python3 ai-bridge/.server/send_to_claude.py message_type

# Examples:
echo "Bug fix complete" | python3 ai-bridge/.server/send_to_claude.py status_update
echo "Please review this code" | python3 ai-bridge/.server/send_to_claude.py review_request
```

**2. Read Messages (Recommended - MCP Tool):**
```bash
read_claude_messages()
```

**3. Read Messages (Alternative - Manual):**
```bash
# Check for new messages
ls -lt ai-bridge/.server/claude-outbox/.unread/*.txt

# Read a message
cat ai-bridge/.server/claude-outbox/.unread/claude-YYYYMMDD-HHMMSS.txt

# Move to .read/ after responding
mv ai-bridge/.server/claude-outbox/.unread/claude-YYYYMMDD-HHMMSS.txt \
   ai-bridge/.server/claude-outbox/.read/
```

**4. Manage Your Client:**
```bash
# Start polling client
ai-bridge/management/ai-collab-gemini.sh start

# Check status
ai-bridge/management/ai-collab-gemini.sh status

# Stop client
ai-bridge/management/ai-collab-gemini.sh stop

# Health check
ai-bridge/management/ai-collab-gemini.sh health
```

---

## Message Flow (Three-Directory System)

**Complete Workflow:**

1. **Sender:** Use send script → Creates `.txt` file in outbox **root**
2. **Polling Client:** Detects file within 5 seconds
3. **Atomic Move:** Client moves to `.processing/` (prevents race conditions)
4. **Validation:** Client parses email format, validates headers
5. **Route to .unread/:** Valid messages moved to `.unread/`
6. **MCP Tool Reads:** Recipient uses MCP tool to read from `.unread/`
7. **Auto-Archive:** MCP tool moves to `.read/` after displaying

**Why Three Directories?**
- `.processing/` - Atomic operations, prevents concurrent access
- `.unread/` - Clear separation: client done, LLM reads
- `.read/` - Archive of processed messages

---

## Architecture Highlights (v9.0)

### Phase 1 Stabilization Achievements

✅ **Unified MCP Server**
- Consolidated 3 separate servers into 1
- Symmetric architecture (both AIs have identical capabilities)
- Clean codebase (350 lines, well-documented)

✅ **Email Format Migration**
- Eliminated JSON escaping issues
- No more double-encoding errors
- Special characters work perfectly

✅ **Path Standardization**
- All references use `ai-bridge/.server/`
- Consistent directory structure
- Clear documentation

✅ **Comprehensive Testing**
- 32 integration tests (all passing)
- End-to-end validation
- Parser tests, workflow tests, config tests

✅ **Documentation**
- Complete system guide (COMMUNICATION-SYSTEM.md v9.0)
- Server-specific README (unified-mcp-server)
- Updated charter files (CLAUDE.md, GEMINI.md)

---

## Testing

Run integration tests:
```bash
cd ai-bridge
python3 tests/test_integration.py
```

**Expected output:**
```
============================================================
Communication System v9.0 - Integration Tests
============================================================
✓ 32/32 tests passing
✅ All tests passed!
```

---

## Troubleshooting

### Messages not being delivered

**Check polling client is running:**
```bash
ai-bridge/management/ai-collab.sh status
```

**Start client if needed:**
```bash
ai-bridge/management/ai-collab.sh start
```

### Messages stuck in .processing/

**Client crashed during processing. Restart:**
```bash
ai-bridge/management/ai-collab.sh stop
mv ai-bridge/.server/gemini-outbox/.processing/*.txt ai-bridge/.server/gemini-outbox/
ai-bridge/management/ai-collab.sh start
```

### Health check shows warnings

**Run comprehensive health check:**
```bash
ai-bridge/management/ai-collab.sh health
```

**Common issues:**
- Client not running → Start with `ai-collab.sh start`
- Stale messages in .unread/ → Read and move to .read/
- Malformed messages → Check `.malformed/` directory

---

## Migration from v8.0

If you're upgrading from v8.0:

1. **Update configuration:**
   - `.claude/settings.local.json` - Change to `"unified-ai-bridge"`
   - `ai-bridge/utils/.mcp.json` - Update server path

2. **Restart clients:**
   ```bash
   ai-bridge/management/ai-collab.sh stop
   ai-bridge/management/ai-collab.sh start
   ```

3. **Restart Claude Code** to load new MCP configuration

4. **Archive old JSON messages:**
   - Old JSON files moved to `.archive-json-legacy-YYYYMMDD/`

5. **Use send scripts instead of direct writes:**
   - ❌ OLD: Write directly to `.unread/`
   - ✅ NEW: Use `send_to_gemini.py` / `send_to_claude.py`

---

## Related Documentation

- **System Overview:** [.server/COMMUNICATION-SYSTEM.md](.server/COMMUNICATION-SYSTEM.md) - Complete v9.0 guide
- **Unified MCP Server:** [mcp-servers/unified-mcp-server/README.md](mcp-servers/unified-mcp-server/README.md)
- **Claude Charter:** [docs/project/CLAUDE.md](../docs/project/CLAUDE.md)
- **Gemini Charter:** [docs/project/GEMINI.md](../docs/project/GEMINI.md)
- **Integration Tests:** [tests/test_integration.py](tests/test_integration.py)

---

## Version History

- **v9.0** (Oct 7, 2025) - Phase 1 stabilization: Unified server, email format exclusive
- **v8.0** (Oct 6, 2025) - Email format migration (incomplete)
- **v7.0-v1.0** - Earlier versions (archived in `.server/.archive-docs/`)

---

**Maintainer:** Claude & Gemini (AI Team)
**Last Updated:** October 7, 2025
**Status:** ✅ Production Ready
