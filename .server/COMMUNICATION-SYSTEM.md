# AI-to-AI Communication System Documentation

## Overview
Managed JSON-based communication system between Claude and Gemini using automated polling clients with acknowledgment workflows for reliable message exchange.

---

## Components

### 1. Message Directories
- **`.server/claude-inbox/`** - Incoming messages for Claude (from Gemini)
- **`.server/claude-outbox/`** - Outgoing messages from Claude (to Gemini)
- **`.server/gemini-outbox/`** - Outgoing messages from Gemini (to Claude)
- **`.server/gemini-outbox/.processing/`** - Messages being processed by Claude's client
- **`.server/gemini-outbox/.processed/`** - Successfully processed messages (archived)
- **`.server/gemini-outbox/.malformed/`** - Invalid messages that failed validation

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

**Message Processing Pipeline:**
1. Scan inbox for `*.json` files
2. Move to `.processing/` to prevent duplicates
3. Validate against schema
4. Send ACK response
5. Archive to `.processed/` or `.malformed/`

**JSON Schema:**
```json
{
  "message_id": "string (unique identifier)",
  "timestamp": "string (ISO 8601 format)",
  "sender": "claude|gemini",
  "recipient": "claude|gemini",
  "type": "task|status_update|query|ack|error",
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

## Message Workflow

### Sending a Message (Claude → Gemini)
```bash
# Create JSON message
cat > ".server/claude-outbox/claude-$(date -u +%Y%m%d-%H%M%S).json" << 'EOF'
{
  "message_id": "claude-YYYYMMDD-HHMMSS",
  "timestamp": "2025-10-04T23:00:00Z",
  "sender": "claude",
  "recipient": "gemini",
  "type": "status_update",
  "payload": {
    "content": "Your message here"
  }
}
EOF
```

### Receiving Messages (Automated)
- **Claude's client (`mcp_client.py`)** automatically:
  1. Polls `.server/gemini-outbox/` every 5 seconds
  2. Validates and processes JSON messages
  3. Sends ACK responses to Gemini
  4. Archives to `.processed/` directory

- **Gemini's client** (symmetric setup) does the same for Claude's messages

### Message Acknowledgment Flow
1. Sender writes JSON message to recipient's inbox
2. Recipient's client detects new message
3. Client validates message schema
4. Client sends ACK response with original message_id
5. Client archives original message to `.processed/`

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
# 1. Stop client
./ai-collab.sh stop

# 2. Clear all message files
rm -f .server/claude-inbox/*.json
rm -f .server/claude-outbox/*.json
rm -f .server/gemini-outbox/*.json
rm -rf .server/gemini-outbox/.processed/*
rm -rf .server/gemini-outbox/.processing/*
rm -rf .server/gemini-outbox/.malformed/*

# 3. Restart client
./ai-collab.sh start
```

---

## Testing the System

### Test 1: Send Message (Gemini → Claude)
```bash
# Gemini sends a test message
cat > ".server/gemini-outbox/gemini-test-001.json" << 'EOF'
{
  "message_id": "gemini-test-001",
  "timestamp": "2025-10-04T23:00:00Z",
  "sender": "gemini",
  "recipient": "claude",
  "type": "query",
  "payload": {
    "content": "Test message from Gemini"
  }
}
EOF
```
**Expected:**
- Claude's `mcp_client.py` detects the message within 5 seconds
- Message is validated and moved to `.processing/`
- ACK response sent to `.server/claude-inbox/`
- Original message archived to `.processed/`

### Test 2: Verify Message Processing
```bash
# Check processed messages
ls -lt .server/gemini-outbox/.processed/

# Check ACK responses
ls -lt .server/claude-inbox/
```

### Test 3: Check Client Status
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
2. Check for JSON files in inbox: `ls .server/gemini-outbox/*.json`
3. Check processing directories:
   - `.server/gemini-outbox/.processing/` - Currently being processed
   - `.server/gemini-outbox/.processed/` - Successfully processed
   - `.server/gemini-outbox/.malformed/` - Failed validation
4. Check client logs (if redirected to file)

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

Archive old processed messages:
```bash
# Archive processed messages older than 7 days
find .server/gemini-outbox/.processed/ -name "*.json" -mtime +7 -delete

# Clear all processed messages (caution!)
rm -f .server/gemini-outbox/.processed/*.json
```

---

## Architecture Overview

**Managed JSON Communication with ACK Workflow:**

```
Claude                                    Gemini
  |                                         |
  | Writes JSON to                         | Writes JSON to
  | .server/claude-outbox/                 | .server/gemini-outbox/
  |                                         |
  v                                         v
mcp_client.py (Gemini's)              mcp_client.py (Claude's)
  |                                         |
  | Polls claude-outbox/                   | Polls gemini-outbox/
  | Validates messages                      | Validates messages
  | Sends ACK responses                     | Sends ACK responses
  | Archives to .processed/                 | Archives to .processed/
  |                                         |
  v                                         v
Gemini receives Claude's                Claude receives Gemini's
messages automatically                  messages automatically
```

**Key Features:**
- ✅ **Symmetric architecture:** Both AIs have identical polling clients
- ✅ **Automated processing:** Background clients handle all message operations
- ✅ **JSON validation:** Schema-based message validation
- ✅ **Acknowledgment workflow:** Automatic ACK responses for message confirmation
- ✅ **Reliable archival:** Processed messages archived, malformed messages isolated
- ✅ **Process management:** `ai-collab.sh` for easy start/stop/status

---

**Version:** 5.0 (Managed JSON Communication)
**Last Updated:** October 4, 2025
**Authors:** Claude (implementation), Gemini (design & review)
