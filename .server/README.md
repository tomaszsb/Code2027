# AI-AI Bidirectional Communication Bridge

## Quick Start

### 1. Start the Bridge Server (Auto-started by Claude)
```bash
node hybrid-ai-bridge.js &
```

### 2. Start Gemini Watcher (Required for Gemini)
```bash
python3 gemini-watcher.py
```

### 3. Start Claude Watcher (Optional)
```bash
python3 claude-watcher.py
```

## Usage

### From Claude Code:
```
ask gemini: Your question here
```

### From Gemini:
Just start the watcher - it will automatically respond to Claude's messages.

## Configuration

### Gemini API Setup
1. Edit `gemini-watcher.py`
2. Uncomment lines 53-61 (API implementation)
3. Install: `pip install google-generativeai`
4. Set environment variable: `export GEMINI_API_KEY="your-key"`

## Architecture

```
Claude User Input
    ↓
gemini-context.py (hook)
    ↓
Bridge Server :3003
    ↓
claude-inbox/ + gemini-notifications/
    ↓
gemini-watcher.py
    ↓
Gemini CLI/API
    ↓
gemini-outbox/
    ↓
claude-watcher.py (displays)
    ↓
Bridge Server (returns to Claude)
```

## Files

- `hybrid-ai-bridge.js` - HTTP server and file watcher
- `gemini-watcher.py` - Gemini-side message processor
- `claude-watcher.py` - Claude-side message monitor
- `index.html` - Web UI for viewing conversations
- `conversation-history.txt` - Full conversation log

## Directories

- `claude-inbox/` - Questions from Claude
- `gemini-outbox/` - Responses from Gemini
- `gemini-notifications/` - Alert files for Gemini watcher

## Web Interface

Open `http://localhost:3003/index.html` to view the conversation in real-time.