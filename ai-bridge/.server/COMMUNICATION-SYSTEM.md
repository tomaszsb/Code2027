# AI-to-AI Communication System Documentation

## Overview
Email-style message format with backward JSON compatibility for communication between Claude and Gemini using automated polling clients with acknowledgment workflows for reliable message exchange.

**Migration Status (v8.0):** Transitioning from JSON to email-style format to eliminate escaping issues while maintaining backward compatibility.

---

## Components

### 1. Message Directories (Three-Directory System)

**Directory Flow:** inbox → `.processing/` → `.unread/` → `.read/`

#### Claude's Directories:
- **`ai-bridge/.server/gemini-outbox/`** - Claude's inbox (Gemini's outbox)
  - **`.processing/`** - Client actively processing (atomic operation)
  - **`.unread/`** - **CLIENT PROCESSED, WAITING FOR CLAUDE LLM TO READ**
  - **`.read/`** - Claude LLM has read and responded
  - **`.malformed/`** - Invalid messages that failed validation
- **`ai-bridge/.server/claude-outbox/`** - Claude's outbox (Gemini's inbox)
  - **`.processing/`** - Gemini's client processing
  - **`.unread/`** - **CLIENT PROCESSED, WAITING FOR GEMINI LLM TO READ**
  - **`.read/`** - Gemini LLM has read and responded
  - **`.malformed/`** - Invalid messages

#### Gemini's Directories:
- **`ai-bridge/.server/claude-outbox/`** - Gemini's inbox (Claude's outbox)
  - (Same subdirectory structure as above)
- **`ai-bridge/.server/gemini-outbox/`** - Gemini's outbox (Claude's inbox)
  - (Same subdirectory structure as above)

### 2. Communication Clients (mcp_client.py / mcp_client_gemini.py)
**Location:** `ai-bridge/clients/mcp_client.py` (Claude), `ai-bridge/clients/mcp_client_gemini.py` (Gemini)
**Language:** Python 3
**Function:** Automated polling clients supporting email-style and JSON message formats

**Features:**
- Polls inbox for new messages every 5 seconds (both `.txt` and `.json` files)
- Supports both email-style format and JSON format (backward compatibility)
- Validates messages and extracts metadata
- Sends automatic ACK responses for valid messages
- Moves malformed messages to `.malformed/` directory

**Three-Directory Message Pipeline:**
1. **Client scans inbox** for `*.txt` and `*.json` files (root directory only, excludes hidden files)
2. **Move to `.processing/`** for atomic operation (prevents race conditions)
3. **Parse message** - supports both email-style and JSON formats
4. **Validate required fields** - if invalid, move to `.malformed/`
5. **Move to `.unread/`** - CLIENT DONE, WAITING FOR LLM
6. **LLM reads from `.unread/`** - This is YOUR responsibility!
7. **LLM moves to `.read/`** after responding - Mark as processed

**Message Formats:**

**Email-Style Format (Recommended - v8.0):**
```
ID: message-id
From: sender
To: recipient
Subject: message-type

message content (any characters, no escaping needed)
```

**JSON Format (Backward Compatibility):**
```json
{
  "id": "message-id",
  "from": "sender",
  "to": "recipient",
  "t": "message-type",
  "c": "message content"
}
```

**Legacy JSON Format (Also Supported):**
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
- `./ai-collab.sh health` - Run comprehensive health check on message queues

**Process Management:**
- Stores PID in `ai-bridge/.server/claude_client.pid`
- Ensures correct working directory
- Handles stale PID files

---

## Message Workflow (Three-Directory System)

### Sending a Message (Claude → Gemini)

**New Email-Style Format (v8.0 - Recommended):**
Messages are automatically created in email format by the send scripts. The new format eliminates JSON escaping issues.

```bash
# Use Python helper script (recommended - handles formatting)
python3 ai-bridge/.server/send_to_gemini.py query "Your message here"
python3 ai-bridge/.server/send_to_gemini.py status_update "Update message"
python3 ai-bridge/.server/send_to_gemini.py task "Task description"

# Complex messages with special characters work perfectly in email format:
python3 ai-bridge/.server/send_to_gemini.py discussion "Messages with $(), \, quotes, etc."
```

**Message File Example (.txt):**
```
ID: claude-20251007-030000
From: claude
To: gemini
Subject: discussion

Your message content here.
Can include any characters: $(), \, ", ', newlines, etc.
No escaping needed!
```

### Receiving Messages - **LLM RESPONSIBILITIES**

#### For Claude (Reading from Gemini):
```bash
# 1. Check .unread/ directory for new messages (both formats supported)
ls -lt ai-bridge/.server/gemini-outbox/.unread/*.txt
ls -lt ai-bridge/.server/gemini-outbox/.unread/*.json

# 2. Read the message (email format is human-readable)
cat ai-bridge/.server/gemini-outbox/.unread/gemini-YYYYMMDD-HHMMSS.txt
# or
cat ai-bridge/.server/gemini-outbox/.unread/gemini-YYYYMMDD-HHMMSS.json

# 3. After responding, move to .read/
mv ai-bridge/.server/gemini-outbox/.unread/gemini-YYYYMMDD-HHMMSS.txt \
   ai-bridge/.server/gemini-outbox/.read/
```

#### For Gemini (Reading from Claude):
```bash
# 1. Check .unread/ directory for new messages (both formats supported)
ls -lt ai-bridge/.server/claude-outbox/.unread/*.txt
ls -lt ai-bridge/.server/claude-outbox/.unread/*.json

# 2. Read the message (email format is human-readable)
cat ai-bridge/.server/claude-outbox/.unread/claude-YYYYMMDD-HHMMSS.txt
# or
cat ai-bridge/.server/claude-outbox/.unread/claude-YYYYMMDD-HHMMSS.json

# 3. After responding, move to .read/
mv ai-bridge/.server/claude-outbox/.unread/claude-YYYYMMDD-HHMMSS.txt \
   ai-bridge/.server/claude-outbox/.read/
```

### Three-Directory Message Flow
1. **Sender (LLM)** writes message to outbox root directory (`.txt` email format or `.json`)
2. **Recipient's client** detects new message (polls every 5 seconds for both `.txt` and `.json`)
3. **Client moves** to `.processing/` for atomic operation
4. **Client parses** message (supports both email-style and JSON formats)
5. **Client validates** required fields (id, from, to, subject/type, content)
6. **Client moves** to `.unread/` - **CLIENT WORK COMPLETE**
7. **Recipient (LLM)** reads from `.unread/` directory - **YOUR JOB!**
8. **Recipient (LLM)** moves to `.read/` after responding - **YOUR JOB!**

**Note:** ACK responses removed in v8.0 to simplify protocol during format migration.

---

## Starting the System

### Start Communication Client
```bash
# From code2027 directory
./ai-collab.sh start
```

**What happens:**
- Launches `mcp_client.py` in background
- Stores process ID in `ai-bridge/.server/claude_client.pid`
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

# 2. Clear all message files (both .txt and .json formats)
rm -f ai-bridge/.server/claude-outbox/*.json ai-bridge/.server/claude-outbox/*.txt
rm -f ai-bridge/.server/gemini-outbox/*.json ai-bridge/.server/gemini-outbox/*.txt
rm -rf ai-bridge/.server/claude-outbox/.processing/*
rm -rf ai-bridge/.server/claude-outbox/.unread/*
rm -rf ai-bridge/.server/claude-outbox/.read/*
rm -rf ai-bridge/.server/claude-outbox/.malformed/*
rm -rf ai-bridge/.server/gemini-outbox/.processing/*
rm -rf ai-bridge/.server/gemini-outbox/.unread/*
rm -rf ai-bridge/.server/gemini-outbox/.read/*
rm -rf ai-bridge/.server/gemini-outbox/.malformed/*

# 3. Restart client
./ai-collab.sh start
# (Gemini runs equivalent command on their side)
```

---

## Testing the System (Three-Directory Flow)

### Test 1: Send Message (Claude → Gemini)
```bash
# Claude sends test message using Python helper (creates email-style .txt)
python3 ai-bridge/.server/send_to_gemini.py query "Test message from Claude"
```
**Expected:**
1. Message written to `ai-bridge/.server/claude-outbox/claude-YYYYMMDD-HHMMSS.txt` (email format)
2. Gemini's client detects within 5 seconds
3. Gemini's client moves to `.processing/`, parses email format
4. Gemini's client validates required fields and moves to `.unread/`
5. **Gemini LLM checks `ai-bridge/.server/claude-outbox/.unread/` and reads message**

### Test 2: Verify Three-Directory Flow
```bash
# Check where message landed after client processing (both formats)
ls -lt ai-bridge/.server/claude-outbox/.unread/*.txt  # Email format messages
ls -lt ai-bridge/.server/claude-outbox/.unread/*.json # JSON format messages

# After LLM reads and responds, check .read/
ls -lt ai-bridge/.server/claude-outbox/.read/    # Should show moved message
```

### Test 3: LLM Read and Respond Workflow
```bash
# 1. Check for new messages in YOUR inbox's .unread/ directory (both formats)
ls -lt ai-bridge/.server/gemini-outbox/.unread/*.txt
ls -lt ai-bridge/.server/gemini-outbox/.unread/*.json

# 2. Read the message (email format is human-readable)
cat ai-bridge/.server/gemini-outbox/.unread/gemini-YYYYMMDD-HHMMSS.txt
# or
cat ai-bridge/.server/gemini-outbox/.unread/gemini-YYYYMMDD-HHMMSS.json

# 3. Respond using Python helper (creates email-style message)
python3 ai-bridge/.server/send_to_gemini.py status_update "Received your message!"

# 4. Move read message to .read/ directory
mv ai-bridge/.server/gemini-outbox/.unread/gemini-YYYYMMDD-HHMMSS.txt \
   ai-bridge/.server/gemini-outbox/.read/
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
2. Check for message files in inbox root: `ls ai-bridge/.server/gemini-outbox/*.txt ai-bridge/.server/gemini-outbox/*.json`
3. Check three-directory flow:
   - `ai-bridge/.server/gemini-outbox/.processing/` - Currently being processed (should be empty)
   - `ai-bridge/.server/gemini-outbox/.unread/` - **CLIENT PROCESSED, WAITING FOR YOU TO READ**
   - `ai-bridge/.server/gemini-outbox/.read/` - You have read and responded
   - `ai-bridge/.server/gemini-outbox/.malformed/` - Failed validation
4. Check debug logs: `cat ai-bridge/.server/mcp_client_debug.log`

### "I can't see any messages!"
**Most common issue:** You're checking the wrong directory!
- ❌ DON'T check inbox root: `ai-bridge/.server/gemini-outbox/*.txt` or `*.json`
- ✅ DO check `.unread/`: `ai-bridge/.server/gemini-outbox/.unread/*.txt` or `*.json`

The client has already moved messages to `.unread/` - that's where YOU read from!

### Format Migration Issues
During the transition period (v8.0), both `.txt` (email) and `.json` formats are supported:
- **Check both formats:** `ls ai-bridge/.server/gemini-outbox/.unread/*.{txt,json}`
- **Email format preferred:** New messages should use `.txt` format
- **JSON still works:** Backward compatibility maintained for existing systems

### Invalid message schema
**Email format (.txt):**
- Must have required headers: ID, From, To, Subject
- Blank line separates headers from content
- Content can be any text (no escaping needed)

**JSON format (.json):**
- Must be valid JSON
- Compact format: `id`, `from`, `to`, `t`, `c`
- Legacy format: `message_id`, `timestamp`, `sender`, `recipient`, `type`, `payload`

Invalid messages moved to `.malformed/` directory

### Stale PID file
```bash
# Remove stale PID and restart
rm -f ai-bridge/.server/claude_client.pid
./ai-collab.sh start
```

---

## Message Cleanup

Archive old read messages:
```bash
# Archive read messages older than 7 days (both formats)
find ai-bridge/.server/gemini-outbox/.read/ \( -name "*.json" -o -name "*.txt" \) -mtime +7 -delete
find ai-bridge/.server/claude-outbox/.read/ \( -name "*.json" -o -name "*.txt" \) -mtime +7 -delete

# Clear all read messages (caution!)
rm -f ai-bridge/.server/gemini-outbox/.read/*.{json,txt}
rm -f ai-bridge/.server/claude-outbox/.read/*.{json,txt}
```

---

## Architecture Overview

**Three-Directory Email/JSON Hybrid Communication (v8.0):**

```
Claude LLM                                           Gemini LLM
    |                                                     |
    | 1. Writes email-style .txt to                      | 1. Writes email-style .txt to
    |    ai-bridge/.server/claude-outbox/                          |    ai-bridge/.server/gemini-outbox/
    |    (or .json for compat)                           |    (or .json for compat)
    |                                                     |
    v                                                     v
mcp_client_gemini.py (Gemini)                 mcp_client.py (Claude)
    |                                                     |
    | 2. Polls claude-outbox/ every 5s                   | 2. Polls gemini-outbox/ every 5s
    |    (.txt and .json files)                          |    (.txt and .json files)
    | 3. Moves to .processing/                           | 3. Moves to .processing/
    | 4. Parses email or JSON format                     | 4. Parses email or JSON format
    | 5. Validates required fields                       | 5. Validates required fields
    | 6. Moves to .unread/                               | 6. Moves to .unread/
    |                                                     |
    v                                                     v
ai-bridge/.server/claude-outbox/.unread/                    ai-bridge/.server/gemini-outbox/.unread/
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
- ✅ **Automated client processing:** Background clients handle parsing, validation, routing
- ✅ **Dual format support:** Email-style (.txt) and JSON (.json) with automatic detection
- ✅ **No escaping issues:** Email format eliminates JSON escape problems
- ✅ **Backward compatibility:** Both formats supported during transition
- ✅ **Validation:** Required field checks with `.malformed/` isolation
- ✅ **Process management:** `ai-collab.sh` for easy start/stop/status

**Critical Understanding:**
- **Client's job:** Receive → Parse (email or JSON) → Validate → Route to `.unread/`
- **LLM's job:** Read from `.unread/` → Respond → Move to `.read/`
- **Don't check inbox root** - messages are in `.unread/` subdirectory!
- **Email format preferred** - eliminates escaping issues with special characters

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
- ✅ Reads all JSON files from `ai-bridge/.server/gemini-outbox/.unread/`
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
echo "Pong" | python3 ai-bridge/.server/send_to_gemini.py test

# Complex message from file
python3 ai-bridge/.server/send_to_gemini.py discussion < /tmp/message.txt

# Heredoc message
cat <<'EOF' | python3 ai-bridge/.server/send_to_gemini.py task
Multi-line message content
with complex formatting
and "special characters"
EOF
```

---

## Health Monitoring (v7.0)

### Health Check Command
The `health` command provides comprehensive monitoring of message queues and system status:

```bash
./ai-collab.sh health
```

**Checks performed:**
1. **Inbox root messages** - Detects messages not being picked up by polling client
2. **Stuck messages in `.processing/`** - Identifies atomic operations that failed
3. **Stale messages in `.unread/`** - Warns if messages unread for >10 minutes
4. **Malformed messages** - Reports validation failures in `.malformed/`
5. **Client status** - Verifies polling client is running

**Example output:**
```
=== Message Queue Health Check ===

📬 Claude's Inbox (from Gemini):
  ✓ Inbox root clear
  ✓ No stuck messages in .processing/
  ⚠️  WARNING: 3/5 unread messages older than 10min
  ✓ No malformed messages

📤 Claude's Outbox (to Gemini):
  ✓ Outbox root clear
  ✓ No stuck messages in .processing/
  ℹ️  2 unread by Gemini (all recent)
  ✓ No malformed messages

🔧 Client Status:
  ✓ Communication client running (PID: 12345)

===================================
⚠️  1 warning(s) detected
```

**Staleness threshold:** 10 minutes (configurable in `ai-collab.sh`)

---

---

## Version 8.0 Changes (Email-Style Format Migration)

### What's New:
1. **Email-style message format** (.txt files) eliminates JSON escaping issues
2. **Backward compatibility** maintained - both .txt and .json formats supported
3. **New MCP clients:** `mcp_client_new.py` and `mcp_client_gemini_new.py`
4. **Hybrid parsing:** Automatic detection of email vs JSON format
5. **No more truncation errors:** Special characters like $(), \, quotes work perfectly

### Migration Path:
- **Phase 1 (current):** Both formats supported, email format preferred
- **Phase 2 (future):** Gradual migration to email-only after testing
- **Phase 3 (future):** Remove JSON support once fully migrated

### Why Email Format?
JSON messages frequently failed due to escape sequence errors when containing:
- Shell syntax: `$(command)`, backticks
- Backslashes: Windows paths, LaTeX
- Quotes and newlines in complex messages

Email format solves this by separating headers from content with a blank line, requiring no escaping.

---

**Version:** 8.0 (Email-Style Format with Backward JSON Compatibility)
**Last Updated:** October 7, 2025
**Authors:** Claude & Gemini (collaborative design and implementation)
