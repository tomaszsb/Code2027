# Claude ↔ Gemini Communication Protocol
**Version:** 1.0
**Date:** 2025-09-30
**Status:** ✅ Finalized and Agreed

---

## 🤝 Agreement Summary

Both AIs have agreed to the following protocol for bidirectional communication.

---

## 🚀 Claude's Startup Sequence

### On Session Start (Automatic):

1. **Start Bridge Server**
   ```bash
   node .server/hybrid-ai-bridge.js &
   ```
   - Runs in background on `localhost:3003`
   - Creates message queue directories
   - Enables HTTP endpoint `/ask-gemini`

2. **Load Instructions**
   - Read `CLAUDE.md` for project context
   - Read `.server/PROTOCOL.md` (this file) for communication rules

3. **Ready State**
   - Bridge server online
   - Hook configured for "ask gemini:" messages
   - Ready for user-initiated communication

### Session Start Notification (Optional):
```json
{
  "event": "session_start",
  "timestamp": "2025-09-30T00:20:00Z",
  "claude_status": "ready",
  "bridge_server": "online",
  "capabilities": ["code_generation", "testing", "git_operations"]
}
```

---

## 🤖 Gemini's Startup Sequence

### On Session Start (User-Invoked):

1. **User Invokes CLI**
   - Gemini starts via user command
   - Synchronous, user-driven operation

2. **Load Context**
   - Read `GEMINI.md` for project instructions
   - Read `.server/PROTOCOL.md` (this file) for communication rules
   - Load relevant project files

3. **Ready State**
   - Gemini CLI operational
   - Ready to respond to synchronous requests
   - No watcher needed (CLI-only mode)

---

## 📡 Communication Rules

### User-Initiated Communication Only
- ✅ User types: `ask gemini: <question>`
- ✅ Claude's hook intercepts and sends to bridge
- ✅ Bridge calls Gemini CLI synchronously
- ✅ Gemini responds
- ✅ Response returned to Claude
- ❌ No automatic AI-to-AI communication without user request

### Handshake Protocol
- **Decision:** No mandatory handshake
- **Rationale:** Keep startup simple and robust
- **Verification:** Infrastructure is tested and working

### Message Format
**Claude → Gemini:**
```
Question text (plain string)
Delivered via: gemini CLI command
```

**Gemini → Claude:**
```
Response text (plain string)
Returned via: stdout from CLI
```

---

## 📁 File Structure

```
/mnt/d/unravel/current_game/code2027/
├── CLAUDE.md                           ← Claude's session instructions
├── GEMINI.md                           ← Gemini's session instructions
├── .server/
│   ├── PROTOCOL.md                     ← This file (shared agreement)
│   ├── hybrid-ai-bridge.js             ← Bridge server (auto-started by Claude)
│   ├── gemini-watcher-simple.py        ← Optional watcher (not used in v1.0)
│   ├── claude-watcher.py               ← Optional watcher (not used in v1.0)
│   ├── claude-inbox/                   ← Questions from Claude
│   ├── gemini-outbox/                  ← Responses from Gemini
│   └── gemini-notifications/           ← Notification queue (unused in v1.0)
├── gemini-context.py                   ← Hook script (intercepts "ask gemini:")
└── .claude/
    └── settings.local.json             ← Hook configuration
```

---

## 🔄 Communication Flow

```
User types: "ask gemini: What is X?"
        ↓
Claude hook intercepts (gemini-context.py)
        ↓
POST http://localhost:3003/ask-gemini
        ↓
Bridge server receives request
        ↓
Saves to: .server/claude-inbox/<timestamp>-claude.txt
        ↓
Calls: gemini "<question>"
        ↓
Gemini CLI processes question
        ↓
Returns response via stdout
        ↓
Bridge saves to: .server/gemini-outbox/<timestamp>-gemini.txt
        ↓
Bridge returns response to Claude
        ↓
Claude receives response as additional context
        ↓
Claude incorporates into answer to user
```

---

## 🎯 Protocol Principles

1. **Simplicity:** Keep startup and communication simple
2. **User-Driven:** All communication explicitly initiated by user
3. **Synchronous:** CLI-based, request/response pattern
4. **Stateless:** No session state between AIs
5. **Logged:** All messages saved to files for audit trail

---

## 📊 Session Information Exchange

When Claude starts a session, this information is available to Gemini upon request:

```json
{
  "claude": {
    "status": "ready",
    "bridge_server": "online",
    "endpoint": "http://localhost:3003/ask-gemini",
    "capabilities": [
      "code_generation",
      "testing",
      "git_operations",
      "file_operations"
    ],
    "working_directory": "/mnt/d/unravel/current_game/code2027"
  }
}
```

---

## 🚫 Out of Scope (v1.0)

The following are NOT part of this protocol version:

- ❌ Asynchronous communication (no watchers)
- ❌ Automatic handshakes at startup
- ❌ AI-initiated messages (only user-initiated)
- ❌ Real-time collaboration (synchronous only)
- ❌ Shared state between AIs

---

## 🔮 Future Enhancements (Potential v2.0)

If needed, we could add:
- Asynchronous watcher-based communication
- Automatic handshake verification
- Shared session state
- AI-initiated notifications
- Real-time collaboration features

---

## ✅ Agreement Confirmation

**Claude:** Agrees to this protocol ✓
**Gemini:** Agrees to this protocol ✓
**Date:** 2025-09-30

---

## 📝 Version History

- **v1.0** (2025-09-30): Initial protocol agreed by both AIs
  - CLI-only synchronous communication
  - User-initiated messages only
  - No mandatory handshake
  - Simple startup sequence