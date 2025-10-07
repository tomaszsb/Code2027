# Bidirectional AI Bridge MCP Server

**Unified MCP server for Claude ↔ Gemini communication**

---

## IMPORTANT CLARIFICATION: Primary Communication System

This `ai-bridge-mcp-server` describes an **alternative** communication system based on MCP tools.

The **primary and currently active communication system** between Gemini and Claude is based on **polling clients** (`mcp_client.py` and `mcp_client_gemini.py`) and email-style `.txt` files.

Please refer to `docs/project/CLAUDE.md` and `docs/project/GEMINI.md` for the most up-to-date documentation on the primary communication workflow.

---

## Overview

Single MCP server that provides both AIs with tools to read each other's messages:
- **Claude** uses `read_gemini_messages()`
- **Gemini** uses `read_claude_messages()`

---

## Installation

**Prerequisites:**
```bash
pip3 install mcp
```

**Verify installation:**
```bash
pip show mcp
```

---

## Configuration

### For Claude Code

**Option A: Update existing .mcp.json**

Edit `/mnt/d/unravel/current_game/code2027/.mcp.json`:

```json
{
  "mcpServers": {
    "ai-bridge": {
      "command": "python3",
      "args": ["/mnt/d/unravel/current_game/code2027/ai-bridge-mcp-server/server.py"]
    }
  }
}
```

**Option B: Use CLI**
```bash
claude mcp add ai-bridge python3 /mnt/d/unravel/current_game/code2027/ai-bridge-mcp-server/server.py
```

### For Gemini CLI

```bash
gemini mcp add ai-bridge python3 /mnt/d/unravel/current_game/code2027/ai-bridge-mcp-server/server.py
```

**Verify:**
```bash
gemini mcp list
```

---

## Usage

### From Claude Code

```
read_gemini_messages()
```

Returns all new messages from Gemini since last check.

### From Gemini CLI

Use the tool in your prompts or via:
```
read_claude_messages()
```

Returns all new messages from Claude since last check.

---

## Architecture

### Message Flow

```
Claude writes → .server/claude-inbox/*.txt
                         ↓
                Gemini reads via read_claude_messages()

Gemini writes → .server/gemini-outbox/*.txt
                         ↓
                Claude reads via read_gemini_messages()
```

### Tracking Files

- `.server/.claude-mcp-last-check` - Claude's last check timestamp
- `.server/.gemini-mcp-last-check` - Gemini's last check timestamp

Each AI tracks messages independently.

---

## Features

✅ **Bidirectional:** Both AIs can read messages
✅ **Unified:** Single codebase, easier maintenance
✅ **Independent tracking:** Each AI has own "last read" timestamp
✅ **Message truncation:** Long messages (>1000 chars) truncated for preview
✅ **Chronological:** Messages sorted oldest-first

---

## Testing

### Test from Claude side

1. Create test message from Gemini:
   ```bash
   echo "Test from Gemini" > .server/gemini-outbox/$(date -u +%Y-%m-%dT%H-%M-%S%z)-gemini.txt
   ```

2. In Claude Code:
   ```
   read_gemini_messages()
   ```

### Test from Gemini side

1. Create test message from Claude:
   ```bash
   echo "Test from Claude" > .server/claude-inbox/$(date -u +%Y-%m-%dT%H-%M-%S%z)-claude.txt
   ```

2. In Gemini CLI:
   ```
   read_claude_messages()
   ```

---

## Troubleshooting

### Tool not available

**Check MCP server is registered:**
```bash
# For Claude
cat .mcp.json

# For Gemini
gemini mcp list
```

**Restart your AI client** to load MCP configuration.

### No messages returned

**Check directories exist:**
```bash
ls .server/gemini-outbox/
ls .server/claude-inbox/
```

**Reset tracking (force re-read all):**
```bash
rm .server/.claude-mcp-last-check
rm .server/.gemini-mcp-last-check
```

### Import errors

**Verify MCP SDK installed:**
```bash
pip3 show mcp
```

**Reinstall if needed:**
```bash
pip3 install mcp --break-system-packages
```

---

## Comparison to Previous Systems

| Feature | Old (2 servers) | New (unified) |
|---------|-----------------|---------------|
| **Servers** | gemini-mcp + claude-mcp | ai-bridge-mcp |
| **Codebases** | 2 separate files | 1 shared file |
| **Maintenance** | Update both | Update once |
| **Tools** | 1 per server | 2 in one server |
| **Efficiency** | Duplicate logic | Shared logic |

---

## Migration from Old Setup

If you were using `gemini-mcp-server/`:

1. Update `.mcp.json` to point to `ai-bridge-mcp-server/`
2. Claude will use `read_gemini_messages()` (same tool name)
3. Gemini gets new `read_claude_messages()` tool
4. Old tracking files still work (`.claude-mcp-last-check`)

**No data loss** - messages and timestamps preserved.

---

## Files

```
ai-bridge-mcp-server/
├── server.py          # Main unified MCP server
└── README.md         # This file
```

---

**Version:** 1.0 (Unified Bidirectional)
**Last Updated:** October 2, 2025
**Status:** ✅ Ready for both Claude and Gemini
