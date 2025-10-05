# AI Bridge Communication Protocol

This directory contains the core components for the AI-to-AI communication protocol between Gemini and Claude. It implements a robust, transparent, and conversational messaging system based on a three-directory JSON file structure.

## Directory Structure

- **`clients/`**: Contains the Python client scripts responsible for polling inboxes, processing messages, and sending responses.
  - `mcp_client.py`: Claude's Message Communication Protocol client.
  - `mcp_client_gemini.py`: Gemini's Message Communication Protocol client.
  - `check_claude_messages.py`: Script for Gemini to check Claude's messages.
  - `check_gemini_messages.py`: Script for Claude to check Gemini's messages.
  - `check-mailbox.py`: General mailbox checking script.

- **`management/`**: Contains shell scripts for managing the AI clients (starting, stopping, checking status).
  - `ai-collab.sh`: Management script for Claude's client.
  - `ai-collab-gemini.sh`: Management script for Gemini's client.
  - `start-ai-collab.bat`, `start-ai-collab.sh`: Scripts to start both clients.
  - `stop-ai-collab.bat`, `stop-ai-collab.sh`: Scripts to stop both clients.

- **`.server/`**: This hidden directory acts as the central message queue system.
  - `claude-inbox/`: Claude's inbox (messages from Gemini).
  - `claude-outbox/`: Claude's outbox (messages to Gemini).
  - `gemini-inbox/`: Gemini's inbox (messages from Claude).
  - `gemini-outbox/`: Gemini's outbox (messages to Claude).
  - Each inbox/outbox contains subdirectories for message lifecycle management:
    - `.processing/`: Messages temporarily moved here during client processing.
    - `.unread/`: Processed messages waiting for the LLM to read.
    - `.read/`: Messages that have been read and responded to by the LLM.
    - `.malformed/`: Messages that failed JSON schema validation.
  - `send_to_claude.py`: Python helper script for sending messages to Claude.
  - `send_to_gemini.py`: Python helper script for sending messages to Gemini.
  - `COMMUNICATION-SYSTEM.md`: Detailed documentation of the communication system.
  - `PROTOCOL.md`, `PROTOCOL-v2.md`, `PROTOCOL-PROPOSAL.md`: Protocol evolution documents.
  - `README.md`: README for the .server directory (if any specific to it).
  - Other client-related files (PID files, logs, etc.).

- **`utils/`**: Contains utility files.
  - `.mcp.json`: Message Communication Protocol configuration.

## Three-Directory JSON Communication System

Claude and Gemini communicate by exchanging JSON files within a structured three-directory system. This ensures atomic operations and clear message lifecycle management.

**Message Flow:**
1.  A sender creates a JSON message file in the recipient's inbox root directory.
2.  The recipient's client (`mcp_client.py` or `mcp_client_gemini.py`) polls its inbox root.
3.  Upon detecting a new message, the client atomically moves it to the `.processing/` subdirectory.
4.  The client validates the message against a JSON schema. If valid, it moves the message to `.unread/`. If malformed, it moves to `.malformed/`.
5.  The respective LLM (Claude or Gemini) reads messages from its `.unread/` directory.
6.  After processing and generating a response, the LLM moves the original message to `.read/`.

## Quick Start Guide

### For Gemini (to communicate with Claude):

**1. Send a Message to Claude:**
```bash
python3 ai-bridge/.server/send_to_claude.py STATUS_UPDATE "Your message content here"
# Example: python3 ai-bridge/.server/send_to_claude.py query "What is the status of the game?"
```

**2. Check for Messages from Claude:**
```bash
ls -lt ai-bridge/.server/claude-outbox/.unread/*.json
# Read a message: cat ai-bridge/.server/claude-outbox/.unread/claude-YYYYMMDD-HHMMSS.json
# After processing, move to .read/: mv ai-bridge/.server/claude-outbox/.unread/claude-YYYYMMDD-HHMMSS.json ai-bridge/.server/claude-outbox/.read/
```

**3. Manage Gemini's Client:**
```bash
./ai-bridge/management/ai-collab-gemini.sh start
./ai-bridge/management/ai-collab-gemini.sh stop
./ai-bridge/management/ai-collab-gemini.sh status
```

### For Claude (to communicate with Gemini):

**1. Send a Message to Gemini:**
```bash
python3 ai-bridge/.server/send_to_gemini.py STATUS_UPDATE "Your message content here"
# Example: python3 ai-bridge/.server/send_to_gemini.py planning_response "Here is my plan..."
```

**2. Check for Messages from Gemini:**
```bash
ls -lt ai-bridge/.server/gemini-outbox/.unread/*.json
# Read a message: cat ai-bridge/.server/gemini-outbox/.unread/gemini-YYYYMMDD-HHMMSS.json
# After processing, move to .read/: mv ai-bridge/.server/gemini-outbox/.unread/gemini-YYYYMMDD-HHMMSS.json ai-bridge/.server/gemini-outbox/.read/
```

**3. Manage Claude's Client:**
```bash
./ai-bridge/management/ai-collab.sh start
./ai-bridge/management/ai-collab.sh stop
./ai-bridge/management/ai-collab.sh status
```

---

**Note:** The `ai-bridge/.server/` directory is a critical component of this communication system. It should not be directly modified or deleted without understanding its role in message routing and processing.