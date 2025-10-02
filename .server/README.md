# AI-to-AI Communication System

**Complete Documentation:** See `COMMUNICATION-SYSTEM.md` for detailed workflow and troubleshooting.

---

## 🎯 Overview

The system provides **two complementary methods** for Claude to receive messages from Gemini:

1. **MCP Server** (Recommended) - Native Claude Code integration via tools
2. **Bridge Server** - HTTP-based message management with web UI

---

## 🚀 Quick Start

### 1. Start the Bridge Server

**Auto-started by Claude on session initialization:**
```bash
cd code2027
node .server/hybrid-ai-bridge.js &
```

- **Port:** localhost:3003
- **Web UI:** http://localhost:3003/index.html
- **Purpose:** Message storage, approval workflow, conversation history

### 2. Configure MCP Server

**Already configured in `.claude/settings.local.json`:**
```json
{
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["gemini-bridge"]
}
```

**Installation:**
```bash
cd gemini-mcp-server
pip install -r requirements.txt
```

### 3. Start Gemini Watcher (for Gemini's side)

```bash
cd .server
python3 gemini-watcher-simple.py
```

---

## 📡 Communication Methods

### Method 1: MCP Server (Claude reads Gemini)

**Claude's side:**
- Use MCP tool: `read_gemini_messages()`
- Returns new messages from `.server/gemini-outbox/`
- Tracks last check in `.server/.claude-mcp-last-check`

**Advantages:**
- Native Claude Code tool integration
- On-demand message checking
- Clean separation of concerns

### Method 2: Bridge Server (Message Management)

**Endpoints:**
- `GET /messages` - All messages with metadata
- `POST /communicate` - Send message (supports modes: claude/gemini/both/mention)
- `POST /message/approve` - Approve a message
- `POST /message/reject` - Reject a message
- `GET /context` - Conversation history (last 10 messages)
- `POST /context/clear` - Clear conversation history

**Advantages:**
- Web-based message oversight
- Approve/reject workflow
- Conversation history tracking
- Message metadata management

---

## 🔄 Message Workflow

### Claude → Gemini

**1. Claude writes message:**
```bash
echo "Message content" > ".server/claude-inbox/$(date -u +%Y-%m-%dT%H-%M-%S%z)-claude.txt"
```

**2. Gemini watcher detects:**
- Monitors `claude-inbox/` directory
- Processes new messages
- (Placeholder: Would call Gemini API/CLI here)

**3. Gemini responds:**
```bash
echo "Response" > ".server/gemini-outbox/$(date -u +%Y-%m-%dT%H-%M-%S%z)-gemini.txt"
```

### Gemini → Claude

**1. Gemini writes message** (to `gemini-outbox/`)

**2. Claude reads via:**
- **Option A:** MCP tool `read_gemini_messages()`
- **Option B:** Web UI at http://localhost:3003/index.html

**3. User reviews** (Web UI):
- Approve/reject messages
- Add comments
- Track conversation

---

## 🗂️ Directory Structure

```
.server/
├── claude-inbox/          # Messages from Claude → Gemini
├── gemini-outbox/         # Messages from Gemini → Claude
├── gemini-notifications/  # Notification triggers for watcher
├── archive/              # Approved messages >3 days old
├── message-metadata.json # Message status (pending/approved/rejected)
└── conversation-context.json # Last 10 messages
```

---

## 🛠️ Components

### Active Components

1. **hybrid-ai-bridge.js** - HTTP server, file watching, message management
2. **gemini-mcp-server/server.py** - MCP tool for reading Gemini messages
3. **gemini-watcher-simple.py** - Gemini-side message processor

### Optional Components

4. **claude-watcher.py** - Terminal display of Gemini messages (optional monitoring)

### Legacy Components (Inactive)

5. **check-mailbox.py** - Hook-based auto-check (not configured)
6. **gemini-context.py** - Hook for `ask gemini:` syntax (not configured)

---

## 📊 Web Interface

**URL:** http://localhost:3003/index.html

**Features:**
- View all messages chronologically
- Color-coded by sender (Claude = blue, Gemini = pink)
- Status badges (Approved/Pending/Rejected)
- Approve/reject pending messages
- Add comments to messages
- Filter by status
- Auto-refresh every 2 seconds

---

## 🧹 Message Cleanup

**Automatic cleanup runs on bridge startup:**
- Approved messages → archived after 3 days
- Archived messages → deleted after 10 days total
- Pending/rejected → never auto-deleted

**Manual cleanup:**
```bash
node .server/cleanup-messages.js
```

---

## 🔧 Current Configuration Status

✅ **Bridge Server:** Running on localhost:3003
⚠️ **MCP Server:** Configured but SDK not installed (needs `pip install mcp`)
✅ **Gemini Watcher:** Running (monitors claude-inbox/)
❌ **Hook System:** Disabled (hooks: {} in settings)
❌ **Claude Watcher:** Not running (optional)

---

## 📖 Next Steps

1. **For Gemini setup:** See `GEMINI-SETUP.md`
2. **For complete workflow:** See `COMMUNICATION-SYSTEM.md`
3. **For MCP details:** See `../gemini-mcp-server/README.md`

---

**Version:** 3.0 (MCP + Bridge Hybrid)
**Last Updated:** October 2, 2025
