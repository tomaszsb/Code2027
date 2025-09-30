# Claude ↔ Gemini Communication Protocol
**Version:** 2.0 (Hybrid Mode)
**Date:** 2025-09-30
**Status:** ✅ Implemented and Tested

---

## 🚀 Major Upgrade from v1.0

**v1.0 Problems:**
- User-initiated only ("ask gemini:") was no better than copy-paste
- No conversation context
- No natural collaboration
- Synchronous one-offs only

**v2.0 Solutions:**
- **Hybrid communication modes** (solo, discuss, mention)
- **Conversation history** (last 10 messages with context)
- **Natural triggers** (discuss:, both:, @mentions)
- **Bidirectional flow** with maintained context

---

## 🎯 Communication Modes

### Mode 1: Claude Solo (Default)
```
User: "How do I implement feature X?"
→ Claude responds alone (no Gemini involvement)
```

**Use when:** Standard coding questions, quick fixes, file operations

---

###Mode 2: Ask Gemini (v1.0 Compatibility)
```
User: "ask gemini: What are best practices for React testing?"
→ Hook intercepts
→ Gemini responds with context
→ Claude shows Gemini's answer
```

**Use when:** Want only Gemini's perspective

---

### Mode 3: Discuss Mode (NEW - Both AIs)
```
User: "discuss: Should we use Context API or props drilling?"
→ Hook intercepts
→ Gemini gets question + conversation history
→ Gemini responds with full context
→ Claude sees Gemini's response
→ Claude adds own analysis
→ User sees both perspectives
```

**Alternative trigger:** `both: <question>`

**Use when:** Need multiple perspectives, strategic decisions, architecture choices

---

### Mode 4: @Mention (NEW - AI-to-AI)
```
Claude: "I think we should use approach X because Y. @gemini what do you think?"
→ Hook detects @gemini
→ Sends to Gemini with conversation history
→ Gemini responds
→ Claude incorporates response
```

**Use when:** Claude wants Gemini's input mid-response

---

## 📚 Conversation History

### How It Works:
- Bridge server maintains last 10 messages
- Stored in `.server/conversation-context.json`
- Included when calling Gemini (modes 2, 3, 4)
- Formatted as:

```
=== CONVERSATION HISTORY (last 10 messages) ===

[USER]: How do I test React components?
[GEMINI]: Use React Testing Library with...
[USER]: What about integration tests?
[CLAUDE]: For integration tests, consider...

=== END HISTORY ===

Current message:
<new question>
```

### Benefits:
- Gemini understands conversation flow
- No need to repeat context
- More coherent multi-turn discussions
- Better strategic advice

### Management:
- **Auto-managed:** Keeps last 10 messages
- **Manual clear:** `curl -X POST http://localhost:3003/context/clear`
- **View context:** `curl http://localhost:3003/context`
- **Web UI:** Shows context count, clear button

---

## 🔄 Complete Flow Diagrams

### Discuss Mode Flow:
```
User: "discuss: Should we refactor the card service?"
    ↓
Hook (gemini-context.py) detects "discuss:"
    ↓
POST /communicate { message, mode: "both" }
    ↓
Bridge server:
  1. Adds user message to history
  2. Formats history for Gemini
  3. Calls: gemini "<history + question>"
  4. Saves Gemini response
  5. Adds to history
  6. Returns to hook
    ↓
Hook formats Gemini's response
    ↓
Claude receives as additionalContext
    ↓
Claude incorporates Gemini's view + adds own analysis
    ↓
User sees:
  🤖 GEMINI'S PERSPECTIVE: <gemini response>
  💡 CLAUDE'S ANALYSIS: <claude response>
```

### @Mention Flow:
```
Claude generating response...
Claude's text includes: "@gemini should we use Redux?"
    ↓
Hook detects @gemini in prompt
    ↓
POST /communicate { message, mode: "mention-gemini" }
    ↓
Bridge extracts mention: "should we use Redux?"
    ↓
Calls Gemini with history + mention
    ↓
Returns Gemini's response
    ↓
Claude sees: "@gemini responded: <response>"
    ↓
Claude incorporates into final answer
```

---

## 🛠️ Technical Implementation

### Bridge Server Endpoints:

**1. `/ask-gemini` (POST) - v1.0 Compatibility**
```json
{
  "question": "string",
  "includeContext": boolean (optional)
}
```
Returns: `{ "response": "string" }`

**2. `/communicate` (POST) - v2.0 Main Endpoint**
```json
{
  "message": "string",
  "mode": "claude|gemini|both|mention-gemini" (optional, auto-detected),
  "metadata": {} (optional)
}
```
Returns:
```json
{
  "mode": "detected-mode",
  "responses": {
    "gemini": "string (if called)",
    "claude": "string (status)"
  }
}
```

**3. `/context` (GET) - View History**
Returns:
```json
{
  "history": [
    { "from": "user|gemini|claude", "content": "...", "timestamp": "..." }
  ],
  "count": 5
}
```

**4. `/context/clear` (POST) - Reset History**
Returns: `{ "message": "Context cleared" }`

**5. `/messages` (GET) - File-based Message Log**
Returns array of all messages from claude-inbox and gemini-outbox

---

## 📋 Hook Script (gemini-context.py)

### Trigger Detection:
```python
def detect_mode(prompt):
    if prompt.startsWith("discuss:") or prompt.startsWith("both:"):
        return "both"
    elif prompt.startsWith("ask gemini:"):
        return "gemini"
    elif "@gemini" in prompt:
        return "mention-gemini"
    else:
        return "claude"  # No interception
```

### Response Formatting:
- **Both mode:** Shows Gemini's perspective, notes Claude will add analysis
- **Gemini mode:** Shows Gemini's direct response
- **Mention mode:** Shows inline mention response
- **Claude mode:** No interception (returns None)

---

## 🎨 Web UI Features

Access at: `http://localhost:3003/index.html`

**Features:**
- Real-time message view (claude/gemini messages)
- Color-coded by sender
- Context management (view count, clear button)
- Auto-refresh every 2 seconds
- Conversation history tracking

---

## 📊 Comparison: v1.0 vs v2.0

| Feature | v1.0 | v2.0 |
|---------|------|------|
| User-initiated only | ✅ | ✅ |
| Gemini responses | ✅ | ✅ |
| Conversation history | ❌ | ✅ (10 messages) |
| Both AIs respond | ❌ | ✅ (discuss mode) |
| @Mentions | ❌ | ✅ |
| Context awareness | ❌ | ✅ |
| Multi-turn discussions | ❌ | ✅ |
| Natural triggers | ❌ | ✅ (discuss:, both:) |

---

## 🔧 Setup & Configuration

### Claude Startup:
```bash
cd /mnt/d/unravel/current_game/code2027
node .server/hybrid-ai-bridge.js &
```

Verifies with:
```bash
curl http://localhost:3003/context
# Should return: {"history":[],"count":0}
```

### Gemini Startup:
- No changes needed from v1.0
- CLI mode still works
- Now receives conversation history automatically

---

## 📝 Usage Examples

### Example 1: Strategic Discussion
```
User: "discuss: Should we implement caching for the data service?"

Response:
🤖 GEMINI'S PERSPECTIVE:
"Caching would be beneficial if you're seeing repeated data fetches.
Consider using React Query or SWR for automatic cache management..."

💡 CLAUDE'S ANALYSIS:
"Building on Gemini's suggestion, I analyzed our current DataService.
We have 47 identical queries per game session. Implementing React Query
would reduce API calls by ~80%. I can add it now..."
```

### Example 2: Quick Gemini Opinion
```
User: "ask gemini: Is TypeScript strict mode worth the effort?"

Response:
🤖 GEMINI: "Yes, strict mode catches ~60% more potential bugs at compile time..."
```

### Example 3: Mid-Response Consultation
```
User: "How should we structure the new feature?"

Claude: "I'm thinking we should use a factory pattern... @gemini is this the right approach for a plugin system?"

[Gemini's response incorporated]

Claude: "Gemini confirmed factory pattern works well. I'll implement with..."
```

---

## ⚡ Performance & Limits

**Conversation History:**
- Max 10 messages (configurable: `MAX_HISTORY` in bridge server)
- Auto-pruned (keeps most recent)
- Persisted to disk (survives restarts)

**Gemini CLI Timeout:**
- 60 seconds (configurable in hook script)
- Server timeout: 120 seconds
- Long responses handled gracefully

**Context Size:**
- ~2KB per message (average)
- 10 messages ≈ 20KB context
- Well within Gemini's context window

---

## 🔒 Protocol Guarantees

1. **Backward Compatible:** v1.0 "ask gemini:" still works
2. **Stateless Sessions:** History clears on server restart (unless persisted)
3. **User Control:** All communication user-initiated
4. **Fail-Safe:** If bridge down, Claude works solo
5. **Logged:** All messages saved to files for audit

---

## 🚧 Limitations & Future Work

### Current Limitations:
- Gemini can't initiate messages
- No real-time notifications (poll-based)
- CLI timeout limits very long responses
- No streaming responses

### Potential v3.0 Features:
- WebSocket for real-time bidirectional
- Gemini-initiated questions
- Streaming responses
- Multiple conversation threads
- Shared project memory

---

## ✅ Agreement Confirmation

**Claude:** Implemented v2.0 ✓
**Gemini:** Requested Hybrid Model (Option 3) ✓
**User:** Approved upgrade from v1.0 ✓
**Date:** 2025-09-30

---

## 📖 Version History

- **v1.0** (2025-09-30): User-initiated, synchronous, CLI-only
- **v2.0** (2025-09-30): Hybrid modes, conversation history, @mentions, discuss mode

---

**Protocol Status:** ✅ Active and Operational