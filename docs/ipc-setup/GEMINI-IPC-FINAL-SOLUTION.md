# Gemini IPC Setup - Final Solution

## The Complete Answer (Discovered by Gemini)

Gemini successfully figured out the correct setup! Here's the complete process:

## Prerequisites
✅ Gemini CLI installed (version 0.7.0 confirmed)
✅ Claude IPC MCP repository cloned
✅ Dependencies installed with `uv sync`

## Configuration Steps

### 1. Add MCP Server to Gemini CLI
```bash
gemini mcp add -s user claude-ipc uvx --from /mnt/d/unravel/current_game/code2027/claude-ipc-mcp claude-ipc-mcp
```

Output: `MCP server "claude-ipc" added to user settings. (stdio)`

### 2. Verify Configuration
```bash
gemini mcp list
```

Expected output:
```
✓ claude-ipc: uvx --from /mnt/d/unravel/current_game/code2027/claude-ipc-mcp claude-ipc-mcp (stdio) - Connected
```

### 3. Use Natural Language Commands via Gemini CLI

**Key Discovery:** Natural language commands must be passed to the `gemini` CLI tool, not executed directly in the shell!

#### Correct Syntax:
```bash
gemini Register this instance as gemini
gemini Send message to claude: Hello from Gemini!
gemini Check messages
gemini List instances
```

#### ❌ Incorrect (won't work):
```bash
Register this instance as gemini  # This is not a shell command!
```

## Why This Works

1. **Gemini CLI** acts as the interpreter for natural language commands
2. **MCP Server** (claude-ipc) provides the tools/capabilities
3. **Natural language prompts** are processed by Gemini CLI, which then calls the appropriate MCP tools

## Architecture

```
User Command:
  gemini Register this instance as gemini
       ↓
  Gemini CLI interprets natural language
       ↓
  Calls MCP tool: claude-ipc.register("gemini")
       ↓
  SQLite database stores registration
       ↓
  TCP socket ready for communication
```

## Common Usage Patterns

```bash
# Register instance
gemini Register this instance as gemini

# Send a message
gemini Send message to claude: Can you review the database schema?

# Check for new messages
gemini Check messages

# List all registered instances
gemini List instances

# Broadcast to all instances
gemini Broadcast message: System maintenance in 10 minutes
```

## Alternative Methods

### Option 1: Interactive Mode
```bash
gemini
# Then type commands interactively:
> Register this instance as gemini
> Send message to claude: Hello!
```

### Option 2: Direct Python Scripts (No Gemini CLI interpretation)
If you want to bypass natural language:
```bash
python3 /mnt/d/unravel/current_game/code2027/claude-ipc-mcp/tools/ipc_register.py gemini
python3 /mnt/d/unravel/current_game/code2027/claude-ipc-mcp/tools/ipc_send.py claude "Hello!"
python3 /mnt/d/unravel/current_game/code2027/claude-ipc-mcp/tools/ipc_check.py
```

## Troubleshooting

**"Connection refused" error:**
- MCP server not running
- Check: `gemini mcp list` (should show "Connected")

**"Command not found" error:**
- You forgot to prefix with `gemini`
- Use: `gemini <command>` not just `<command>`

**Server disconnected:**
- Restart configuration: `gemini mcp remove claude-ipc` then re-add
- Check server path is correct

## What's Next

1. ✅ Gemini registers as "gemini"
2. ✅ Gemini sends test message to Claude
3. ⏳ Claude restarts and registers as "claude"
4. ⏳ Claude checks messages and responds
5. ⏳ Bidirectional communication verified!
