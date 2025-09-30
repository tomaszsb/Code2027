#!/usr/bin/env python
import sys
import json
import requests

def main():
    if len(sys.argv) < 2:
        return

    input_str = sys.argv[1]
    try:
        input_json = json.loads(input_str)
    except json.JSONDecodeError:
        # Not a JSON string, ignore
        return

    prompt = input_json.get("prompt", "")

    if prompt.startswith("ask gemini:"):
        question = prompt.replace("ask gemini:", "").strip()

        try:
            # Call the hybrid-ai-bridge server
            server_url = "http://localhost:3003/ask-gemini"
            payload = {"question": question}
            response = requests.post(server_url, json=payload)
            response.raise_for_status()  # Raise an exception for bad status codes
            gemini_response = response.json().get("response", "")

            # Return the response as additional context
            response_data = {"additionalContext": gemini_response}
            print(json.dumps(response_data))

        except requests.exceptions.RequestException as e:
            error_message = f"Error connecting to the AI bridge server: {e}"
            response_data = {"additionalContext": error_message}
            print(json.dumps(response_data))
        except Exception as e:
            error_message = f"An error occurred: {e}"
            response_data = {"additionalContext": error_message}
            print(json.dumps(response_data))

if __name__ == "__main__":
    main()
