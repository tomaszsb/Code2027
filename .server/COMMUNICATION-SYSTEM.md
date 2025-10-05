# AI-to-AI Communication System Documentation

## Overview
Managed JSON-based communication system between Claude and Gemini using automated polling clients with acknowledgment workflows for reliable message exchange.

---

## Components

### 1. Message Directories (Three-Directory System)

**Directory Flow:** inbox → `.processing/` → `.unread/` → `.read/`

#### Claude's Directories:
- **`.server/gemini-outbox/`** - Claude's inbox (Gemini's outbox)
  - **`.processing/`** - Client actively processing (atomic operation)
  - **`.unread/`** - **CLIENT PROCESSED, WAITING FOR CLAUDE LLM TO READ**
  - **`.read/`** - Claude LLM has read and responded
  - **`.malformed/`** - Invalid messages that failed validation
- **`.server/claude-outbox/`** - Claude's outbox (Gemini's inbox)
  - **`.processing/`** - Gemini's client processing
  - **`.unread/`** - **CLIENT PROCESSED, WAITING FOR GEMINI LLM TO READ**
  - **`.read/`** - Gemini LLM has read and responded
  - **`.malformed/`** - Invalid messages

#### Gemini's Directories:
- **`.server/claude-outbox/`** - Gemini's inbox (Claude's outbox)
  - (Same subdirectory structure as above)
- **`.server/gemini-outbox/`** - Gemini's outbox (Claude's inbox)
  - (Same subdirectory structure as above)

### 2. Communication Client (mcp_client.py)
**Location:** `code2027/mcp_client.py`
**Language:** Python 3
**Function:** Automated polling client for JSON message processing

**Features:**
- Polls `.server/gemini-outbox/` for new JSON messages every 5 seconds
- Validates messages against JSON schema
- Sends automatic ACK responses for valid messages
- Archives processed messages to `.processed/` directory
- Moves malformed messages to `.malformed/` directory

**Three-Directory Message Pipeline:**
1. **Client scans inbox** for `*.json` files (root directory only, excludes hidden files)
2. **Move to `.processing/`** for atomic operation (prevents race conditions)
3. **Validate against schema** - if invalid, move to `.malformed/` and send error
4. **Send ACK response** (unless message type is 'ack' or 'error' to prevent loops)
5. **Move to `.unread/`** - CLIENT DONE, WAITING FOR LLM
6. **LLM reads from `.unread/`** - This is YOUR responsibility!
7. **LLM moves to `.read/`** after responding - Mark as processed

**JSON Schema:**
```json
{
  "message_id": "string (unique identifier)",
  "timestamp": "string (ISO 8601 format)",
  "sender": "claude|gemini",
  "recipient": "claude|gemini",
  "type": "string (any message type - permissive schema)",
  "payload": {
    "content": "string (message content)",
    "original_message_id": "string (optional, for ACK/error)"
  }
}
```

### 3. Management Script (ai-collab.sh)
**Location:** `code2027/ai-collab.sh`
**Purpose:** Start/stop/status management for communication client

**Commands:**
- `./ai-collab.sh start` - Start mcp_client.py in background
- `./ai-collab.sh stop` - Stop the background client
- `./ai-collab.sh status` - Check if client is running

**Process Management:**
- Stores PID in `.server/claude_client.pid`
- Ensures correct working directory
- Handles stale PID files

---

## Message Workflow (Three-Directory System)

### Sending a Message (Claude → Gemini)
```bash
# Use Python helper script (recommended - handles JSON properly)
python3 .server/send_to_gemini.py query "Your message here"
python3 .server/send_to_gemini.py status_update "Update message"
python3 .server/send_to_gemini.py task "Task description"
```

### Receiving Messages - **LLM RESPONSIBILITIES**

#### For Claude (Reading from Gemini):
```bash
# 1. Check .unread/ directory for new messages
ls -lt .server/gemini-outbox/.unread/*.json

# 2. Read the message
cat .server/gemini-outbox/.unread/gemini-YYYYMMDD-HHMMSS.json

# 3. After responding, move to .read/
mv .server/gemini-outbox/.unread/gemini-YYYYMMDD-HHMMSS.json \
   .server/gemini-outbox/.read/
```

#### For Gemini (Reading from Claude):
```bash
# 1. Check .unread/ directory for new messages
ls -lt .server/claude-outbox/.unread/*.json

# 2. Read the message
cat .server/claude-outbox/.unread/claude-YYYYMMDD-HHMMSS.json

# 3. After responding, move to .read/
mv .server/claude-outbox/.unread/claude-YYYYMMDD-HHMMSS.json \
   .server/claude-outbox/.read/
```

### Three-Directory Message Flow
1. **Sender (LLM)** writes JSON message to outbox root directory
2. **Recipient's client** detects new message (polls every 5 seconds)
3. **Client moves** to `.processing/` for atomic operation
4. **Client validates** message schema
5. **Client sends ACK** response (unless message is already ACK/error)
6. **Client moves** to `.unread/` - **CLIENT WORK COMPLETE**
7. **Recipient (LLM)** reads from `.unread/` directory - **YOUR JOB!**
8. **Recipient (LLM)** moves to `.read/` after responding - **YOUR JOB!**

---

## Starting the System

### Start Communication Client
```bash
# From code2027 directory
./ai-collab.sh start
```

**What happens:**
- Launches `mcp_client.py` in background
- Stores process ID in `.server/claude_client.pid`
- Begins polling for messages every 5 seconds

### Stop Communication Client
```bash
./ai-collab.sh stop
```

### Check Client Status
```bash
./ai-collab.sh status
```

### Fresh Start / Reset
To clear all messages and start fresh:

```bash
# 1. Stop both clients
./ai-collab.sh stop
# (Gemini runs equivalent command on their side)

# 2. Clear all message files (three-directory system)
rm -f .server/claude-outbox/*.json
rm -f .server/gemini-outbox/*.json
rm -rf .server/claude-outbox/.processing/*
rm -rf .server/claude-outbox/.unread/*
rm -rf .server/claude-outbox/.read/*
rm -rf .server/claude-outbox/.malformed/*
rm -rf .server/gemini-outbox/.processing/*
rm -rf .server/gemini-outbox/.unread/*
rm -rf .server/gemini-outbox/.read/*
rm -rf .server/gemini-outbox/.malformed/*

# 3. Restart client
./ai-collab.sh start
# (Gemini runs equivalent command on their side)
```

---

## Testing the System (Three-Directory Flow)

### Test 1: Send Message (Claude → Gemini)
```bash
# Claude sends test message using Python helper
python3 .server/send_to_gemini.py query "Test message from Claude"
```
**Expected:**
1. Message written to `.server/claude-outbox/claude-YYYYMMDD-HHMMSS.json`
2. Gemini's client detects within 5 seconds
3. Gemini's client moves to `.processing/`, validates, sends ACK
4. Gemini's client moves to `.unread/`
5. **Gemini LLM checks `.server/claude-outbox/.unread/` and reads message**

### Test 2: Verify Three-Directory Flow
```bash
# Check where message landed after client processing
ls -lt .server/claude-outbox/.unread/  # Should show recent message

# Check Gemini sent ACK
ls -lt .server/gemini-outbox/.unread/  # Should show ACK message

# After LLM reads and responds, check .read/
ls -lt .server/claude-outbox/.read/    # Should show moved message
```

### Test 3: LLM Read and Respond Workflow
```bash
# 1. Check for new messages in YOUR inbox's .unread/ directory
ls -lt .server/gemini-outbox/.unread/*.json

# 2. Read the message
cat .server/gemini-outbox/.unread/gemini-YYYYMMDD-HHMMSS.json

# 3. Respond using Python helper
python3 .server/send_to_gemini.py status_update "Received your message!"

# 4. Move read message to .read/ directory
mv .server/gemini-outbox/.unread/gemini-YYYYMMDD-HHMMSS.json \
   .server/gemini-outbox/.read/
```

### Test 4: Check Client Status
```bash
./ai-collab.sh status
```
**Expected:** "Claude's communication client is running."

---

## Troubleshooting

### Client not running
```bash
./ai-collab.sh status
```
If not running:
```bash
./ai-collab.sh start
```

### Messages not being processed
1. Check client is running: `./ai-collab.sh status`
2. Check for JSON files in inbox root: `ls .server/gemini-outbox/*.json`
3. Check three-directory flow:
   - `.server/gemini-outbox/.processing/` - Currently being processed (should be empty)
   - `.server/gemini-outbox/.unread/` - **CLIENT PROCESSED, WAITING FOR YOU TO READ**
   - `.server/gemini-outbox/.read/` - You have read and responded
   - `.server/gemini-outbox/.malformed/` - Failed validation
4. Check debug logs: `cat .server/mcp_client_debug.log`

### "I can't see any messages!"
**Most common issue:** You're checking the wrong directory!
- ❌ DON'T check inbox root: `.server/gemini-outbox/*.json`
- ✅ DO check `.unread/`: `.server/gemini-outbox/.unread/*.json`

The client has already moved messages to `.unread/` - that's where YOU read from!

### Invalid message schema
- Messages must be valid JSON
- All required fields must be present: `message_id`, `timestamp`, `sender`, `recipient`, `type`, `payload`
- `payload.content` is required
- Invalid messages moved to `.malformed/` directory

### Stale PID file
```bash
# Remove stale PID and restart
rm -f .server/claude_client.pid
./ai-collab.sh start
```

---

## Message Cleanup

Archive old read messages:
```bash
# Archive read messages older than 7 days
find .server/gemini-outbox/.read/ -name "*.json" -mtime +7 -delete
find .server/claude-outbox/.read/ -name "*.json" -mtime +7 -delete

# Clear all read messages (caution!)
rm -f .server/gemini-outbox/.read/*.json
rm -f .server/claude-outbox/.read/*.json
```

---

## Architecture Overview

**Three-Directory JSON Communication with ACK Workflow:**

```
Claude LLM                                           Gemini LLM
    |                                                     |
    | 1. Writes JSON to                                  | 1. Writes JSON to
    | .server/claude-outbox/                             | .server/gemini-outbox/
    |                                                     |
    v                                                     v
mcp_client_gemini.py (Gemini's client)            mcp_client.py (Claude's client)
    |                                                     |
    | 2. Polls claude-outbox/ every 5s                   | 2. Polls gemini-outbox/ every 5s
    | 3. Moves to .processing/                           | 3. Moves to .processing/
    | 4. Validates schema                                | 4. Validates schema
    | 5. Sends ACK to gemini-outbox/                     | 5. Sends ACK to claude-outbox/
    | 6. Moves to .unread/                               | 6. Moves to .unread/
    |                                                     |
    v                                                     v
.server/claude-outbox/.unread/                    .server/gemini-outbox/.unread/
    |                                                     |
    | 7. Gemini LLM reads from .unread/                  | 7. Claude LLM reads from .unread/
    | 8. Gemini responds                                 | 8. Claude responds
    | 9. Gemini moves to .read/                          | 9. Claude moves to .read/
    |                                                     |
    v                                                     v
Gemini has Claude's message                       Claude has Gemini's message
```

**Key Features:**
- ✅ **Three-directory system:** inbox → `.processing/` → `.unread/` → `.read/`
- ✅ **Atomic operations:** `.processing/` prevents race conditions
- ✅ **Symmetric architecture:** Both AIs have identical polling clients and workflows
- ✅ **Clear LLM responsibilities:** LLMs read from `.unread/`, move to `.read/` after responding
- ✅ **Automated client processing:** Background clients handle validation, ACKs, routing
- ✅ **JSON validation:** Schema-based message validation with `.malformed/` isolation
- ✅ **Acknowledgment workflow:** Automatic ACK responses (with infinite loop prevention)
- ✅ **Process management:** `ai-collab.sh` for easy start/stop/status

**Critical Understanding:**
- **Client's job:** Receive → Validate → ACK → Route to `.unread/`
- **LLM's job:** Read from `.unread/` → Respond → Move to `.read/`
- **Don't check inbox root** - messages are in `.unread/` subdirectory!

---

## Direct-Read Scripts (v7.0 - Recommended Method)

### Overview
In addition to the manual file operations, both AIs now have dedicated Python scripts for reliable message reading with automatic mark-as-read functionality and MCP SDK version monitoring.

### For Claude: check_gemini_messages.py
**Location:** `code2027/check_gemini_messages.py`
**Purpose:** Reliable script to read all new messages from Gemini

**Usage:**
```bash
python3 check_gemini_messages.py
```

**Features:**
- ✅ Reads all JSON files from `.server/gemini-outbox/.unread/`
- ✅ Parses and formats message content for display
- ✅ Automatically moves messages to `.read/` after display
- ✅ MCP SDK version monitoring (alerts on version changes)
- ✅ No validation errors - direct file access
- ✅ Returns clean formatted output

### For Gemini: check_claude_messages.py
**Location:** `code2027/check_claude_messages.py`
**Purpose:** Reliable script to read all new messages from Claude

**Usage:**
```bash
python3 check_claude_messages.py
```

**Features:** (Same as Claude's script, mirrored for symmetry)

### Why Use These Scripts?
1. **Reliability:** Direct file access, no MCP caching issues
2. **Convenience:** Single command reads and marks all messages as read
3. **Monitoring:** Built-in MCP SDK version change detection
4. **No Validation:** Bypasses polling client schema restrictions
5. **Formatted Output:** Clean, readable message display

### Sending Messages (stdin-based)

Both `send_to_claude.py` and `send_to_gemini.py` now support stdin for complex messages:

```bash
# Simple message
echo "Pong" | python3 .server/send_to_gemini.py test

# Complex message from file
python3 .server/send_to_gemini.py discussion < /tmp/message.txt

# Heredoc message
cat <<'EOF' | python3 .server/send_to_gemini.py task
Multi-line message content
with complex formatting
and "special characters"
EOF
```

---

**Version:** 7.0 (Direct-Read Scripts + Permissive Schema)
**Last Updated:** October 5, 2025
**Authors:** Claude & Gemini (collaborative design and implementation)
