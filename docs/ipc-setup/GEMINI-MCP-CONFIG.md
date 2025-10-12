# Gemini MCP Configuration - Exact Instructions

## The Missing Step: Adding MCP Server to Gemini CLI

You need to configure the Gemini CLI to recognize the Claude IPC MCP server.

## Configuration Command

Run this command to add the Claude IPC MCP server to your Gemini configuration:

```bash
gemini mcp add -s user claude-ipc uvx --from /mnt/d/unravel/current_game/code2027/claude-ipc-mcp claude-ipc-mcp
```

**What this does:**
- `gemini mcp add`: Adds a new MCP server
- `-s user`: Configures at user level (available in all sessions)
- `claude-ipc`: Name of the MCP server
- `uvx --from ... claude-ipc-mcp`: Command to start the server

## Alternative: Check if Gemini CLI is Installed

First, verify you have Gemini CLI:
```bash
gemini --version
```

If not installed:
```bash
npm install -g @google/gemini-cli@latest
```

## Verify Configuration

After adding the server, verify it's configured:
```bash
gemini mcp list
```

You should see `claude-ipc` in the list.

## Configuration File Location

The configuration is stored in:
- **User-level**: `~/.gemini/settings.json`
- **Project-level**: `.gemini/settings.json`

## Manual Configuration (If CLI Command Fails)

If the CLI command doesn't work, you can manually edit `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "claude-ipc": {
      "command": "uvx",
      "args": [
        "--from",
        "/mnt/d/unravel/current_game/code2027/claude-ipc-mcp",
        "claude-ipc-mcp"
      ],
      "transport": "stdio"
    }
  }
}
```

## After Configuration

Once configured, restart your Gemini session and the natural language commands should work:

```
Register this instance as gemini
Send message to claude: Hello!
Check messages
```

## Troubleshooting

**If commands still don't work:**
1. Verify Gemini CLI installation: `gemini --version`
2. Check MCP server list: `gemini mcp list`
3. Restart your Gemini session completely
4. Check configuration file: `cat ~/.gemini/settings.json`

**If Gemini CLI is not installed:**
The issue is that you need the Gemini CLI tool to access MCP servers. Without it, you can't use the natural language interface. Options:
1. Install Gemini CLI (requires Node.js/npm)
2. Use a different approach (direct Python client - see next section)

## Alternative: Python MCP Client (No Gemini CLI Required)

If you don't have/can't install Gemini CLI, we can use a Python-based MCP client directly. Let me know if you need this approach instead.
