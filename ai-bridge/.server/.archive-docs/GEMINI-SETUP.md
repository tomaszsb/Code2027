# Gemini Setup Guide for Bidirectional Communication

## Problem: pip/pip3 not available

Since pip is not installed in your environment, here are alternative approaches:

## Option 1: Use Simple Watcher (No Dependencies) ✅ RECOMMENDED

Use `gemini-watcher-simple.py` which works without external libraries:

```bash
cd .server
python3 gemini-watcher-simple.py
```

This will:
- ✅ Monitor notifications from Claude
- ✅ Display messages in your terminal
- ✅ Save acknowledgment responses to outbox
- ⚠️  Responses will be test messages until you integrate real Gemini

### To Add Real Gemini Integration:

Edit `.server/gemini-watcher-simple.py` line 39-48:

**Method A - Call Gemini CLI:**
```python
def get_gemini_response(question):
    import subprocess
    result = subprocess.run(['gemini', question], capture_output=True, text=True)
    return result.stdout.strip()
```

**Method B - Use HTTP Request to Gemini API:**
```python
def get_gemini_response(question):
    import urllib.request
    import json

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    api_key = "YOUR_API_KEY_HERE"

    data = {
        "contents": [{"parts": [{"text": question}]}]
    }

    req = urllib.request.Request(
        f"{url}?key={api_key}",
        data=json.dumps(data).encode(),
        headers={'Content-Type': 'application/json'}
    )

    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read())
        return result['candidates'][0]['content']['parts'][0]['text']
```

**Method C - Manual Response File:**
Create a script that reads questions and lets you manually type responses:
```python
def get_gemini_response(question):
    print("\n🤔 Please provide your response:")
    response = input("> ")
    return response
```

## Option 2: Install pip First

If you have sudo/admin access:

```bash
# On Ubuntu/Debian
sudo apt-get update
sudo apt-get install python3-pip

# On Windows (WSL)
sudo apt install python3-pip

# Then install the library
pip3 install google-generativeai
```

Then use the full `gemini-watcher.py` script.

## Option 3: Use System Python with Built-in Libraries Only

The simple watcher only uses Python standard library:
- `os`, `sys`, `json`, `time`, `pathlib`, `datetime`

All of these are built-in, no installation needed.

## Quick Test

1. Start the simple watcher:
   ```bash
   python3 gemini-watcher-simple.py
   ```

2. In another terminal, test the system:
   ```bash
   cd .server
   echo "Test from Claude" > claude-inbox/test-$(date -Iseconds).txt
   echo '{"message":"test","file":"claude-inbox/test.txt","timestamp":"'$(date -Iseconds)'"}' > gemini-notifications/test.json
   ```

3. You should see the watcher process the message!

## Integration with Google AI Studio (No pip required)

If you have Google AI Studio API key, use Method B above with `urllib.request` (built-in).

Get your API key from: https://makersuite.google.com/app/apikey

## File Locations

- **Your watcher reads from**: `.server/gemini-notifications/`
- **Claude's questions are in**: `.server/claude-inbox/`
- **Your responses go to**: `.server/gemini-outbox/`

## Still Stuck?

Tell me:
1. Can you run: `python3 --version`?
2. Can you run: `which python3`?
3. Do you have sudo/admin access?
4. Which OS are you on? (Linux, WSL, Mac, etc.)

I'll help find the best solution for your environment.