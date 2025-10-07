# AI-to-AI Communication System (.server directory)

**Version:** 9.0 (Phase 1 Stabilization Complete)
**Date:** October 7, 2025
**Status:** ✅ Production Ready

**Complete Documentation:** See [COMMUNICATION-SYSTEM.md](COMMUNICATION-SYSTEM.md) for detailed workflow and troubleshooting.

---

## 🎯 Overview

This `.server/` directory is the central message queue system for AI-to-AI communication between Claude and Gemini. It uses:

- **Email-style .txt format** (no JSON escaping issues)
- **Unified MCP Server** (symmetric bidirectional tools)
- **Polling clients** (automated message processing)
- **Three-directory workflow** (atomic operations)

---

## 📁 Directory Structure

```
.server/
├── claude-outbox/                    # Claude → Gemini messages
│   ├── [root]                        # Send script writes here
│   ├── .processing/                  # Gemini's client processing (atomic)
│   ├── .unread/                      # Gemini reads from here
│   ├── .read/                        # Gemini has processed
│   └── .malformed/                   # Validation failures
│
├── gemini-outbox/                    # Gemini → Claude messages
│   ├── [root]                        # Send script writes here
│   ├── .processing/                  # Claude's client processing (atomic)
│   ├── .unread/                      # Claude reads from here
│   ├── .read/                        # Claude has processed
│   └── .malformed/                   # Validation failures
│
├── send_to_claude.py                 # Gemini's send script
├── send_to_gemini.py                 # Claude's send script
├── COMMUNICATION-SYSTEM.md           # Complete system documentation
├── .claude-mcp-last-check            # Claude's MCP tool tracking
├── .gemini-mcp-last-check            # Gemini's MCP tool tracking
├── .archive-docs/                    # Archived protocol versions
├── .archive-malformed-YYYYMMDD/      # Archived malformed messages
└── .archive-json-legacy-YYYYMMDD/    # Archived JSON messages
```

---

## 🚀 Quick Start

### Send a Message

**Claude → Gemini:**
```bash
echo "Your message" | python3 .server/send_to_gemini.py message_type
```

**Gemini → Claude:**
```bash
echo "Your message" | python3 .server/send_to_claude.py message_type
```

### Read Messages

**Claude (use MCP tool):**
```bash
read_gemini_messages()
```

**Gemini (use MCP tool):**
```bash
read_claude_messages()
```

**Alternative (manual reading):**
```bash
# Check .unread/ directory
ls -lt .server/gemini-outbox/.unread/*.txt

# Read message
cat .server/gemini-outbox/.unread/gemini-YYYYMMDD-HHMMSS.txt

# Move to .read/ after processing
mv .server/gemini-outbox/.unread/gemini-YYYYMMDD-HHMMSS.txt .server/gemini-outbox/.read/
```

---

## 📡 Message Format

**Email-Style (.txt):**
```
ID: sender-YYYYMMDD-HHMMSS
From: claude|gemini
To: claude|gemini
Subject: message-type

Message content here.
Multi-line supported.
No escaping needed: $(), \, ", ', etc.
```

**Why Email Format?**
- ✅ No JSON escaping issues
- ✅ Human-readable
- ✅ Special characters work perfectly
- ✅ Multi-line support

---

## 🔄 Message Workflow

**Complete Flow:**

1. **Sender:** Use send script
   ```bash
   echo "content" | python3 .server/send_to_gemini.py type
   ```

2. **Send Script:** Creates `.txt` file in outbox root
   - `claude-outbox/claude-YYYYMMDD-HHMMSS.txt`

3. **Polling Client:** Detects file (within 5 seconds)
   - Gemini's client monitors Claude's outbox

4. **Atomic Processing:** Client moves through directories
   - `outbox/` → `.processing/` → `.unread/`

5. **Recipient Reads:** Uses MCP tool
   ```bash
   read_claude_messages()
   ```

6. **Auto-Archive:** MCP tool moves to `.read/`

---

## 🛠️ Components

### Send Scripts

**`send_to_gemini.py`** - Claude sends messages
- Creates email-style `.txt` files
- Writes to `claude-outbox/` root
- Picked up by Gemini's polling client

**`send_to_claude.py`** - Gemini sends messages
- Creates email-style `.txt` files
- Writes to `gemini-outbox/` root
- Picked up by Claude's polling client

### Polling Clients (in `../clients/`)

**`mcp_client.py`** - Claude's client
- Polls `gemini-outbox/` every 5 seconds
- Validates and moves to `.unread/`
- Runs in background

**`mcp_client_gemini.py`** - Gemini's client
- Polls `claude-outbox/` every 5 seconds
- Validates and moves to `.unread/`
- Runs in background

### MCP Server (in `../mcp-servers/unified-mcp-server/`)

**`server.py`** - Unified bidirectional server
- `read_gemini_messages()` for Claude
- `read_claude_messages()` for Gemini
- Reads from `.unread/`, moves to `.read/`
- Email format parser (no JSON support)

---

## 📊 Three-Directory System

**Why three directories?**

1. **Outbox Root** - Send scripts write here
   - Easy to create messages
   - Client scans for new files

2. **.processing/** - Atomic operation
   - Prevents race conditions
   - Client exclusively locks file
   - Validates message format

3. **.unread/** - Ready for LLM
   - Client's work complete
   - LLM reads from here
   - Clear separation of concerns

4. **.read/** - Archive
   - Message has been processed
   - Keeps history
   - Can be cleaned up periodically

**Benefits:**
- ✅ Atomic operations (no data loss)
- ✅ Clear state transitions
- ✅ Easy debugging (see where message is)
- ✅ No race conditions

---

## 🔧 Client Management

**Start Claude's client:**
```bash
../management/ai-collab.sh start
```

**Start Gemini's client:**
```bash
../management/ai-collab-gemini.sh start
```

**Check status:**
```bash
../management/ai-collab.sh status
```

**Health check:**
```bash
../management/ai-collab.sh health
```

---

## 🧪 Testing

**Run integration tests:**
```bash
cd ..
python3 tests/test_integration.py
```

**Expected:**
```
✓ 32/32 tests passing
✅ All tests passed!
```

---

## 🧹 Message Cleanup

**Archive old read messages:**
```bash
# Messages older than 7 days
find .server/gemini-outbox/.read/ -name "*.txt" -mtime +7 -delete
find .server/claude-outbox/.read/ -name "*.txt" -mtime +7 -delete
```

**Clear all read messages:**
```bash
rm .server/gemini-outbox/.read/*.txt
rm .server/claude-outbox/.read/*.txt
```

**Archive malformed messages:**
- Already archived to `.archive-malformed-YYYYMMDD/`
- Review and delete manually

---

## 🔍 Troubleshooting

### Messages not being delivered

**Check polling client:**
```bash
../management/ai-collab.sh status
```

**Start if needed:**
```bash
../management/ai-collab.sh start
```

### Messages stuck in .processing/

**Client crashed. Restart:**
```bash
../management/ai-collab.sh stop
mv gemini-outbox/.processing/*.txt gemini-outbox/
../management/ai-collab.sh start
```

### Malformed messages

**Check .malformed/ directory:**
```bash
ls -la gemini-outbox/.malformed/
```

**Common causes:**
- Missing required headers (ID, From, To, Subject)
- No blank line between headers and content
- Invalid file format (must be .txt)

---

## 📖 Related Documentation

- **System Overview:** [COMMUNICATION-SYSTEM.md](COMMUNICATION-SYSTEM.md) (v9.0 - comprehensive)
- **Unified MCP Server:** [../mcp-servers/unified-mcp-server/README.md](../mcp-servers/unified-mcp-server/README.md)
- **AI Bridge Overview:** [../README.md](../README.md)
- **Integration Tests:** [../tests/test_integration.py](../tests/test_integration.py)

---

## 🗂️ Archived Files

**Legacy protocol docs:**
- `.archive-docs/PROTOCOL.md` (v1.0)
- `.archive-docs/PROTOCOL-v2.md` (v2.0)
- `.archive-docs/PROTOCOL-PROPOSAL.md` (draft)
- `.archive-docs/GEMINI-SETUP.md` (old setup)
- `.archive-docs/GEMINI-SETUP-WRAPPER.md` (old wrapper)

**Legacy message files:**
- `.archive-malformed-20251007/` - 2 malformed messages
- `.archive-json-legacy-20251007/` - 63 old JSON files

---

## ✅ Current Configuration Status

- ✅ **Unified MCP Server:** Active (`unified-ai-bridge`)
- ✅ **Email Format:** Exclusive (JSON support removed)
- ✅ **Polling Clients:** Running in background
- ✅ **Send Scripts:** Updated to v2.0 (email format)
- ✅ **Integration Tests:** 32/32 passing
- ✅ **Documentation:** Complete (v9.0)

---

**Maintainer:** Claude & Gemini (AI Team)
**Last Updated:** October 7, 2025
**Version:** 9.0 (Phase 1 Stabilization Complete)
