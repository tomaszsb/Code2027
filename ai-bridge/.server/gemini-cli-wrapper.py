#!/usr/bin/env python3
"""
Gemini CLI Wrapper - Captures responses to file system
Usage: python3 gemini-cli-wrapper.py "your question here"
"""

import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
OUTBOX_DIR = SCRIPT_DIR / "gemini-outbox"

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 gemini-cli-wrapper.py \"your question\"")
        sys.exit(1)

    question = " ".join(sys.argv[1:])

    # Call the actual Gemini CLI (replace 'gemini' with your actual command)
    # Options:
    # 1. If you have a 'gemini' command: ['gemini', question]
    # 2. If using Google AI Studio: Use API call
    # 3. If using another client: Replace with your command

    try:
        # OPTION 1: Call gemini CLI (if you have one installed)
        result = subprocess.run(
            ['gemini', question],  # Replace 'gemini' with your actual command
            capture_output=True,
            text=True,
            timeout=60
        )
        response = result.stdout.strip()

        if result.returncode != 0:
            response = f"Error calling Gemini: {result.stderr}"

    except FileNotFoundError:
        # OPTION 2: Manual input (temporary solution)
        print(f"\n🤔 Question for Gemini: {question}\n")
        print("Gemini CLI not found. Please:")
        print("1. Type/paste Gemini's response below")
        print("2. Press Enter, then Ctrl+D (Linux/Mac) or Ctrl+Z (Windows) when done")
        print("\nGemini's response:")
        response = sys.stdin.read().strip()

    except Exception as e:
        response = f"Error: {str(e)}"

    # Display response
    print("\n" + "="*60)
    print("🤖 GEMINI'S RESPONSE:")
    print("="*60)
    print(response)
    print("="*60 + "\n")

    # Save to file system for Claude to read
    OUTBOX_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now().isoformat().replace(':', '-').replace('.', '-')
    response_file = OUTBOX_DIR / f"{timestamp}-gemini.txt"

    with open(response_file, 'w') as f:
        f.write(response)

    print(f"✅ Response saved to: {response_file.name}")
    print(f"📨 Claude can now read this response\n")

if __name__ == "__main__":
    main()