import json
import sys

# This script prints a simple JSON object with a systemMessage.
# It is used to test the basic functionality of the Claude Code hook system.

if __name__ == "__main__":
    output = {
        "systemMessage": "This is a simple, direct test of the systemMessage hook.",
        "continue": False
    }
    print(json.dumps(output))
