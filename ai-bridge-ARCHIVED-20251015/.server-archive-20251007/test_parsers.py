#!/usr/bin/env python3
"""Test script for email-style and JSON message parsers"""

import sys
from pathlib import Path

# Add clients directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "clients"))

from mcp_client_new import parse_email_format, parse_json_format, parse_message_file

def test_email_parser():
    """Test email format parsing"""
    print("=" * 60)
    print("Testing Email Format Parser")
    print("=" * 60)

    test_file = Path(__file__).parent / "test-email-format.txt"
    result = parse_message_file(test_file)

    if result:
        print("✓ Successfully parsed email format")
        print(f"  ID: {result['id']}")
        print(f"  From: {result['from']}")
        print(f"  To: {result['to']}")
        print(f"  Subject: {result['t']}")
        print(f"  Content (first 100 chars): {result['c'][:100]}...")
        print(f"  Content length: {len(result['c'])} characters")
        return True
    else:
        print("✗ Failed to parse email format")
        return False

def test_json_parser():
    """Test JSON format parsing"""
    print("\n" + "=" * 60)
    print("Testing JSON Format Parser")
    print("=" * 60)

    test_file = Path(__file__).parent / "test-json-format.json"
    result = parse_message_file(test_file)

    if result:
        print("✓ Successfully parsed JSON format")
        print(f"  ID: {result['id']}")
        print(f"  From: {result['from']}")
        print(f"  To: {result['to']}")
        print(f"  Subject: {result['t']}")
        print(f"  Content: {result['c']}")
        return True
    else:
        print("✗ Failed to parse JSON format")
        return False

def test_special_characters():
    """Test that special characters don't break parsing"""
    print("\n" + "=" * 60)
    print("Testing Special Characters in Email Format")
    print("=" * 60)

    test_file = Path(__file__).parent / "test-email-format.txt"
    result = parse_message_file(test_file)

    if result:
        content = result['c']
        tests = [
            ("Dollar signs", "$100" in content),
            ("Shell syntax", "$(command)" in content),
            ("Backslashes", "C:\\path\\to\\file" in content),
            ("Quotes", '"Quotes"' in content),
            ("Apostrophes", "'apostrophes'" in content),
        ]

        all_passed = True
        for test_name, passed in tests:
            status = "✓" if passed else "✗"
            print(f"  {status} {test_name}: {'preserved' if passed else 'missing'}")
            all_passed = all_passed and passed

        return all_passed
    else:
        print("✗ Could not test - parsing failed")
        return False

if __name__ == "__main__":
    results = []

    results.append(("Email Parser", test_email_parser()))
    results.append(("JSON Parser", test_json_parser()))
    results.append(("Special Characters", test_special_characters()))

    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    for test_name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{status}: {test_name}")

    all_passed = all(passed for _, passed in results)
    print("\n" + ("=" * 60))
    if all_passed:
        print("✓ ALL TESTS PASSED")
    else:
        print("✗ SOME TESTS FAILED")
    print("=" * 60)

    sys.exit(0 if all_passed else 1)
