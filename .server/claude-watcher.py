#!/usr/bin/env python3
"""
Claude-side watcher script for bidirectional AI communication.
Monitors the gemini-outbox directory for new messages from Gemini.
Displays them in the terminal for Claude's awareness.
"""

import os
import sys
import json
import time
from pathlib import Path
from datetime import datetime

# Configuration
SCRIPT_DIR = Path(__file__).parent
OUTBOX_DIR = SCRIPT_DIR / "gemini-outbox"
PROCESSED_FILE = SCRIPT_DIR / ".claude-processed.json"

def load_processed_messages():
    """Load the set of already processed message files."""
    if PROCESSED_FILE.exists():
        with open(PROCESSED_FILE, 'r') as f:
            return set(json.load(f))
    return set()

def save_processed_messages(processed):
    """Save the set of processed message files."""
    with open(PROCESSED_FILE, 'w') as f:
        json.dump(list(processed), f, indent=2)

def display_message(message_file):
    """Display a message from Gemini."""
    try:
        with open(message_file, 'r') as f:
            gemini_message = f.read().strip()

        timestamp = message_file.stem.split('-gemini')[0]

        print(f"\n{'='*60}")
        print(f"📩 New message from Gemini")
        print(f"Timestamp: {timestamp}")
        print(f"{'='*60}")
        print(f"\n{gemini_message}\n")
        print(f"{'='*60}\n")

        # Log to a conversation history file
        history_file = SCRIPT_DIR / "conversation-history.txt"
        with open(history_file, 'a') as f:
            f.write(f"\n[{datetime.now().isoformat()}] GEMINI:\n")
            f.write(f"{gemini_message}\n")
            f.write(f"{'-'*60}\n")

    except Exception as e:
        print(f"Error displaying message {message_file}: {e}")

def watch_outbox():
    """Main watching loop."""
    print("Claude Watcher Started")
    print(f"Monitoring: {OUTBOX_DIR}")
    print(f"Watching for Gemini responses...")
    print(f"Press Ctrl+C to stop\n")

    # Ensure directory exists
    OUTBOX_DIR.mkdir(exist_ok=True)

    processed = load_processed_messages()

    try:
        while True:
            # Check for new message files
            message_files = sorted(OUTBOX_DIR.glob("*.txt"))

            for message_file in message_files:
                file_name = message_file.name

                if file_name not in processed:
                    display_message(message_file)
                    processed.add(file_name)
                    save_processed_messages(processed)

            # Sleep for a bit before checking again
            time.sleep(2)

    except KeyboardInterrupt:
        print("\n\nStopping Claude Watcher...")
        save_processed_messages(processed)
        print("Goodbye!")

if __name__ == "__main__":
    watch_outbox()