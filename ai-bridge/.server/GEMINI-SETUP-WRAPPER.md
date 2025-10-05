# Setting Up Gemini → Claude Communication

## The Problem
- Gemini is PM, handles strategic discussions
- Sometimes needs implementation details from Claude (developer)
- Currently can only ask via user copy-paste

## The Solution
Use the Gemini wrapper script that enables:
- `ask claude: <question>`
- `discuss: <topic>` (both respond)
- `@claude` mentions

## Setup (One-Time)

### Option A: Alias (Recommended)
Add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
alias gemini-collab='/mnt/d/unravel/current_game/code2027/.server/gemini-with-claude.sh'
```

Then reload: `source ~/.bashrc`

### Option B: PATH
```bash
ln -s /mnt/d/unravel/current_game/code2027/.server/gemini-with-claude.sh ~/bin/gemini-collab
chmod +x ~/bin/gemini-collab
```

### Option C: Direct Use
```bash
cd /mnt/d/unravel/current_game/code2027/.server
./gemini-with-claude.sh "your question"
```

## Usage

### 1. Ask Claude for Technical Details
```bash
# From Gemini's terminal
gemini-collab "ask claude: What's the current state of the card service refactor?"
```

**What happens:**
1. Question sent to bridge with conversation history
2. Saved to `.server/gemini-outbox/`
3. You see: "Question saved for Claude"
4. Relay to Claude Code or he'll see it in files

### 2. Discuss Mode (Both Perspectives)
```bash
gemini-collab "discuss: Should we prioritize testing or new features?"
```

**What happens:**
1. Gemini responds with PM perspective
2. Question forwarded to Claude
3. Both perspectives shown

### 3. Regular Gemini (No Claude)
```bash
gemini-collab "What are the TODO priorities?"
```

**What happens:**
- Acts like normal `gemini` command
- No bridge involvement

## Current Limitations

### Claude Code API
Claude Code doesn't expose an HTTP API for external prompts. The wrapper:
- ✅ Saves questions to files
- ✅ Maintains conversation context
- ⚠️  Requires manual relay to Claude

### Workarounds:

**Method 1: File Monitoring**
Claude can monitor `.server/gemini-outbox/` for questions:
```bash
# In Claude's terminal
watch -n 2 'ls -t .server/gemini-outbox/*gemini-to-claude* 2>/dev/null | head -1 | xargs cat'
```

**Method 2: Manual Relay**
```bash
# You copy question and ask Claude directly
cat .server/gemini-outbox/latest-gemini-to-claude.txt
# Then ask Claude in his interface
```

**Method 3: Future Integration**
When Claude Code adds API support, wrapper will directly invoke Claude.

## Examples

### PM → Developer Workflow

```bash
# Start strategic discussion with Gemini
gemini "We need to improve test coverage"

# Gemini suggests approach
# You want implementation details

gemini-collab "ask claude: How long would it take to add tests to CardService?"

# Question saved, relay to Claude
# Claude responds with estimate

# Continue discussion with both
gemini-collab "discuss: Based on Claude's estimate, should we do this sprint?"
```

### Architecture Discussion

```bash
gemini-collab "discuss: Should we use React Context or Redux for state?"

# Gemini: PM perspective on team complexity, timeline
# Claude: Technical perspective on implementation, testing
# You: See both, make informed decision
```

## Files Created

- `.server/gemini-outbox/*-gemini-to-claude.txt` - Questions for Claude
- `.server/conversation-context.json` - Shared history
- Bridge server logs show `[ASK-CLAUDE]` events

## Testing

```bash
# Test the wrapper
gemini-collab "ask claude: Hello, can you hear me?"

# Check it saved
ls -la .server/gemini-outbox/*gemini-to-claude*

# View the question
cat .server/gemini-outbox/*gemini-to-claude.txt | tail -20
```

## Future Enhancements (v3.0)

When these are ready:
- Direct Claude Code API integration
- Automatic bidirectional flow
- No manual relay needed
- Real-time responses

For now, the wrapper provides:
✅ Natural syntax from Gemini's side
✅ Conversation context
✅ File-based handoff to Claude
✅ Foundation for future automation