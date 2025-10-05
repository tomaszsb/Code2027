#!/usr/bin/env python3
"""
Simplified Gemini-side watcher - works without external dependencies.
Uses file-based responses for testing or manual Gemini integration.
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
    Simple response handler - can be replaced with actual Gemini integration.

    Options for integration:
    1. Call an external script: subprocess.run(['your-gemini-script.sh', question])
    2. HTTP request to Gemini API (requires requests library)
    3. Call Google's Gemini API (requires google-generativeai library)
    """

    # Option 1: Return acknowledgment (for testing)
    return f"[Gemini received]: {question}\n\nTo enable real responses, integrate Gemini API by modifying the get_gemini_response() function."

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
        print(f"📨 New message from Claude")
        print(f"Time: {notification.get('timestamp')}")
        print(f"{'='*60}")
        print(f"Message: {claude_message}")
        print(f"{'='*60}\n")

        # Get Gemini's response
        print("⚙️  Generating response...")
        gemini_response = get_gemini_response(claude_message)

        print(f"\n📤 Response:\n{gemini_response}\n")

        # Save response to outbox
        timestamp = datetime.now().isoformat().replace(':', '-').replace('.', '-')
        response_file = OUTBOX_DIR / f"{timestamp}-gemini.txt"
        with open(response_file, 'w') as f:
            f.write(gemini_response)

        print(f"✅ Response saved to: {response_file.name}\n")

    except Exception as e:
        print(f"❌ Error processing notification {notification_file}: {e}")

def watch_notifications():
    """Main watching loop."""
    print("="*60)
    print("🤖 Gemini Watcher Started (Simple Mode)")
    print("="*60)
    print(f"📁 Monitoring: {NOTIFICATIONS_DIR}")
    print(f"📁 Inbox: {INBOX_DIR}")
    print(f"📁 Outbox: {OUTBOX_DIR}")
    print("\nPress Ctrl+C to stop\n")
    print("💡 Tip: Modify get_gemini_response() to integrate with real Gemini API")
    print("="*60 + "\n")

    # Ensure directories exist
    NOTIFICATIONS_DIR.mkdir(exist_ok=True)
    OUTBOX_DIR.mkdir(exist_ok=True)

    processed = load_processed_notifications()
    check_count = 0

    try:
        while True:
            # Check for new notification files
            notification_files = list(NOTIFICATIONS_DIR.glob("*.json"))

            new_files = [f for f in notification_files if f.name not in processed]

            if new_files:
                for notification_file in new_files:
                    process_notification(notification_file)
                    processed.add(notification_file.name)
                    save_processed_notifications(processed)
            else:
                check_count += 1
                if check_count % 15 == 0:  # Every 30 seconds
                    print(f"⏳ Still watching... (checked {check_count} times)")

            # Sleep for a bit before checking again
            time.sleep(2)

    except KeyboardInterrupt:
        print("\n\n" + "="*60)
        print("🛑 Stopping Gemini Watcher...")
        save_processed_notifications(processed)
        print(f"📊 Processed {len(processed)} message(s)")
        print("👋 Goodbye!")
        print("="*60)

if __name__ == "__main__":
    watch_notifications()