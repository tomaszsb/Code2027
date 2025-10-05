#!/usr/bin/env python3
"""
Gemini-side watcher script for bidirectional AI communication.
Monitors the gemini-notifications directory for new messages from Claude.
"""

import os
import sys
import json
import time
from pathlib import Path
from datetime import datetime

# Configuration
SCRIPT_DIR = Path(__file__).parent
NOTIFICATIONS_DIR = SCRIPT_DIR / "gemini-notifications"
INBOX_DIR = SCRIPT_DIR / "claude-inbox"
OUTBOX_DIR = SCRIPT_DIR / "gemini-outbox"
PROCESSED_FILE = SCRIPT_DIR / ".gemini-processed.json"

def load_processed_notifications():
    """Load the set of already processed notification files."""
    if PROCESSED_FILE.exists():
        with open(PROCESSED_FILE, 'r') as f:
            return set(json.load(f))
    return set()

def save_processed_notifications(processed):
    """Save the set of processed notification files."""
    with open(PROCESSED_FILE, 'w') as f:
        json.dump(list(processed), f, indent=2)

def get_gemini_response(question):
    """
    Get a response from Gemini CLI.
    Replace this with your actual Gemini CLI command or API call.
    """
    try:
        import subprocess
        # Option 1: If you have a 'gemini' CLI command
        result = subprocess.run(
            ['gemini', question],
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0:
            return result.stdout.strip()
        else:
            return f"Error from Gemini CLI: {result.stderr}"

    except FileNotFoundError:
        # Option 2: Fallback - use Google's Gemini API
        # Uncomment and configure if using the API:
        """
        try:
            import google.generativeai as genai

            # Configure with your API key
            genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(question)
            return response.text
        except Exception as e:
            return f"Error calling Gemini API: {e}"
        """
        return "Gemini CLI not found. Please install or configure API access."

    except Exception as e:
        return f"Error getting Gemini response: {e}"

def process_notification(notification_file):
    """Process a notification from Claude."""
    try:
        with open(notification_file, 'r') as f:
            notification = json.load(f)

        message_file = notification.get('file')
        if not message_file or not os.path.exists(message_file):
            print(f"Warning: Message file not found: {message_file}")
            return

        # Read Claude's message
        with open(message_file, 'r') as f:
            claude_message = f.read().strip()

        print(f"\n{'='*60}")
        print(f"New message from Claude at {notification.get('timestamp')}")
        print(f"{'='*60}")
        print(f"Message: {claude_message}")
        print(f"{'='*60}\n")

        # Get Gemini's response
        print("Generating response...")
        gemini_response = get_gemini_response(claude_message)

        print(f"Response: {gemini_response}\n")

        # Save response to outbox
        timestamp = datetime.now().isoformat().replace(':', '-').replace('.', '-')
        response_file = OUTBOX_DIR / f"{timestamp}-gemini.txt"
        with open(response_file, 'w') as f:
            f.write(gemini_response)

        print(f"Response saved to: {response_file.name}")

    except Exception as e:
        print(f"Error processing notification {notification_file}: {e}")

def watch_notifications():
    """Main watching loop."""
    print("Gemini Watcher Started")
    print(f"Monitoring: {NOTIFICATIONS_DIR}")
    print(f"Press Ctrl+C to stop\n")

    # Ensure directories exist
    NOTIFICATIONS_DIR.mkdir(exist_ok=True)
    OUTBOX_DIR.mkdir(exist_ok=True)

    processed = load_processed_notifications()

    try:
        while True:
            # Check for new notification files
            notification_files = list(NOTIFICATIONS_DIR.glob("*.json"))

            for notification_file in notification_files:
                file_name = notification_file.name

                if file_name not in processed:
                    process_notification(notification_file)
                    processed.add(file_name)
                    save_processed_notifications(processed)

            # Sleep for a bit before checking again
            time.sleep(2)

    except KeyboardInterrupt:
        print("\n\nStopping Gemini Watcher...")
        save_processed_notifications(processed)
        print("Goodbye!")

if __name__ == "__main__":
    watch_notifications()