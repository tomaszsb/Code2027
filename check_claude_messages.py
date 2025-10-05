
import os
import time

CLAUDE_INBOX = "/mnt/d/unravel/current_game/code2027/.server/claude-inbox/"
READ_MESSAGES_FILE = "/mnt/d/unravel/current_game/code2027/.server/gemini-read-messages.txt"

def get_read_messages():
    if not os.path.exists(READ_MESSAGES_FILE):
        return set()
    with open(READ_MESSAGES_FILE, "r") as f:
        return set(f.read().splitlines())

def mark_message_as_read(message_file):
    with open(READ_MESSAGES_FILE, "a") as f:
        f.write(message_file + "\n")

def check_for_new_messages():
    read_messages = get_read_messages()
    all_messages = os.listdir(CLAUDE_INBOX)
    new_messages = [msg for msg in all_messages if msg not in read_messages]

    for message_file in new_messages:
        print(f"New message from Claude: {message_file}")
        # Here you would add the logic to actually read and process the message
        # For now, we will just print the message content
        with open(os.path.join(CLAUDE_INBOX, message_file), "r") as f:
            print(f.read())
        mark_message_as_read(message_file)

if __name__ == "__main__":
    while True:
        check_for_new_messages()
        time.sleep(5)

