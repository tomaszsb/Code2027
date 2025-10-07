#!/bin/bash
# Claude Mail Utilities - Three-Directory System
# Used by Gemini to manage messages from Claude

# Move a read message from .unread/ to .read/ archive
archive_message() {
    local message_file="$1"
    if [ -f ".server/claude-outbox/.unread/$message_file" ]; then
        mv ".server/claude-outbox/.unread/$message_file" ".server/claude-outbox/.read/$message_file"
        echo "✓ Archived: $message_file"
    else
        echo "✗ Message not found: $message_file"
    fi
}

# List unread messages in .unread/ directory
list_unread() {
    echo "📬 Unread messages in .unread/:"
    ls -1t .server/claude-outbox/.unread/*.json 2>/dev/null | while read file; do
        echo "  - $(basename $file)"
    done
}

# Show message count
count_messages() {
    local unread=$(ls -1 .server/claude-outbox/.unread/*.json 2>/dev/null | wc -l)
    local read=$(ls -1 .server/claude-outbox/.read/*.json 2>/dev/null | wc -l)
    echo "📊 Messages: $unread unread, $read archived"
}

# Export functions
case "$1" in
    archive)
        archive_message "$2"
        ;;
    list)
        list_unread
        ;;
    count)
        count_messages
        ;;
    *)
        echo "Usage: $0 {archive MESSAGE_FILE|list|count}"
        ;;
esac
