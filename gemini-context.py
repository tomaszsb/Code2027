#!/usr/bin/env python
"""
Gemini Context Hook - Protocol v2.0 (Hybrid Mode)

Supports:
- ask gemini: <question> (v1.0 compatibility)
- discuss: <topic> (both AIs respond)
- both: <question> (both AIs respond)
- @gemini mentions (in Claude responses)
"""
import sys
import json
import requests

def detect_mode(prompt):
    """Detect communication mode from prompt"""
    if prompt.startswith("discuss:") or prompt.startswith("both:"):
        return "both"
    elif prompt.startswith("ask gemini:"):
        return "gemini"
    elif "@gemini" in prompt:
        return "mention-gemini"
    else:
        return "claude"

def call_bridge(prompt, mode):
    """Call the v2.0 bridge server"""
    try:
        # Use new /communicate endpoint for v2.0
        server_url = "http://localhost:3003/communicate"
        payload = {
            "message": prompt,
            "mode": mode
        }

        response = requests.post(server_url, json=payload, timeout=60)
        response.raise_for_status()
        return response.json()

    except requests.exceptions.RequestException as e:
        return {"error": f"Bridge server error: {e}"}
    except Exception as e:
        return {"error": f"Unexpected error: {e}"}

def format_response(result):
    """Format the response based on mode"""
    if "error" in result:
        return {"additionalContext": f"⚠️ {result['error']}"}

    mode = result.get("mode", "claude")
    responses = result.get("responses", {})

    if mode == "both" or mode == "discuss":
        # Both AIs responding
        gemini_resp = responses.get("gemini", "")
        context = f"""
🤖 GEMINI'S PERSPECTIVE:
{gemini_resp}

💡 (Claude will provide analysis incorporating Gemini's input)
"""
        return {"additionalContext": context}

    elif mode == "gemini":
        # Only Gemini responding
        gemini_resp = responses.get("gemini", "")
        return {"additionalContext": f"🤖 GEMINI: {gemini_resp}"}

    elif mode == "mention-gemini":
        # @mention response
        gemini_resp = responses.get("gemini", "")
        return {"additionalContext": f"@gemini responded: {gemini_resp}"}

    else:
        # Claude only (default)
        return None

def main():
    if len(sys.argv) < 2:
        return

    input_str = sys.argv[1]
    try:
        input_json = json.loads(input_str)
    except json.JSONDecodeError:
        return

    prompt = input_json.get("prompt", "")

    # Detect mode
    mode = detect_mode(prompt)

    # If Claude-only mode, don't intercept
    if mode == "claude":
        return

    # Call bridge server with detected mode
    result = call_bridge(prompt, mode)

    # Format and return response
    response_data = format_response(result)
    if response_data:
        print(json.dumps(response_data))

if __name__ == "__main__":
    main()
