# IPC Communication - Quick Start Guide

> **Primary AI-to-AI Communication System for Code2027**

## Overview

Claude and Gemini communicate via the **claude-ipc-mcp** system - an industry-standard MCP-based IPC protocol using TCP sockets and SQLite.

## Setup Status

✅ **Claude:** Configured and ready
✅ **Gemini:** Configured and ready
✅ **Server:** Auto-starts on first use

## For Claude

### Every Session Startup

```javascript
// 1. Register
mcp__claude-ipc__register(instance_id="claude")

// 2. Check for messages
mcp__claude-ipc__check(instance_id="claude")
```

### Send Message to Gemini

```javascript
mcp__claude-ipc__send(
  from_id="claude",
  to_id="gemini-cli",
  content="Your message here"
)
```

### Check Active Instances

```javascript
mcp__claude-ipc__list_instances()
```

## For Gemini

### Every Session Startup

```javascript
// 1. Register
mcp__claude-ipc__register(instance_id="gemini-cli")

// 2. Check for messages
mcp__claude-ipc__check(instance_id="gemini-cli")
```

### Send Message to Claude

```javascript
mcp__claude-ipc__send(
  from_id="gemini-cli",
  to_id="claude",
  content="Your message here"
)
```

## Key Principles

### ✅ DO

- **Register and check at every session start**
- **Trust "No new messages" result** - it's correct, not an error
- **Use IPC as default** - it's the primary system
- **Check after completing major tasks** - good collaboration practice

### ❌ DON'T

- **Don't debug file systems** when IPC says "No messages"
- **Don't mix IPC with file-based system** - they're completely separate
- **Don't assume IPC is broken** if no messages - it's working correctly
- **Don't investigate `.unread/` directories** unless explicitly told IPC is down

## Troubleshooting

### "No new messages"
✅ **This is success!** There are no messages waiting. Move on with your work.

### "Invalid or missing session token"
Register again: `mcp__claude-ipc__register(instance_id="your-id")`

### Connection issues
The server auto-starts. If truly broken, check `claude-ipc-mcp/TROUBLESHOOTING.md`

## Architecture

```
Claude                          Gemini
  |                               |
  | mcp__claude-ipc__send         | mcp__claude-ipc__send
  v                               v
  ┌─────────────────────────────┐
  │   TCP Socket (localhost)    │
  │   SQLite Message Queue      │
  │   Auto-starting Server      │
  └─────────────────────────────┘
  ^                               ^
  | mcp__claude-ipc__check        | mcp__claude-ipc__check
  |                               |
```

## Configuration Files

- **Claude:** `.claude/settings.local.json` (claude-ipc-mcp auto-enabled)
- **Gemini:** `.gemini/settings.json` + `~/.gemini/GEMINI.md`
- **Server:** `claude-ipc-mcp/` (submodule)

## Related Documentation

- **Full IPC Docs:** `claude-ipc-mcp/README.md`
- **Claude Charter:** `CLAUDE.md`
- **Gemini Memory:** `~/.gemini/GEMINI.md`
- **Troubleshooting:** `claude-ipc-mcp/TROUBLESHOOTING.md`

## Legacy System

The old file-based system has been **ARCHIVED** to `ai-bridge-ARCHIVED-20251015/` and is no longer active.

- ❌ System is completely disabled
- ❌ No file-based tools available
- ✅ IPC is the only communication method

---

**Last Updated:** October 15, 2025
**System Status:** Production Ready
**Communication Protocol:** claude-ipc-mcp v2.0+
