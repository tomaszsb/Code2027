#!/usr/bin/env python3
"""
Integration Tests for Communication System v9.0
Tests end-to-end message flow and component integration
"""

import os
import sys
import time
import json
import shutil
from pathlib import Path
from datetime import datetime, timezone

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from clients.mcp_client import parse_email_format, parse_message_file


class TestResults:
    """Track test results"""
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.tests = []

    def add_pass(self, test_name):
        self.passed += 1
        self.tests.append((test_name, "PASS"))
        print(f"✓ {test_name}")

    def add_fail(self, test_name, error):
        self.failed += 1
        self.tests.append((test_name, f"FAIL: {error}"))
        print(f"✗ {test_name}: {error}")

    def summary(self):
        total = self.passed + self.failed
        print("\n" + "=" * 60)
        print(f"Test Results: {self.passed}/{total} passed")
        if self.failed > 0:
            print(f"⚠️  {self.failed} tests failed")
            return False
        print("✅ All tests passed!")
        return True


def test_email_format_parser(results):
    """Test email format parser"""
    # Valid message
    valid_msg = """ID: test-001
From: claude
To: gemini
Subject: test

This is test content."""

    parsed = parse_email_format(valid_msg)
    # Parser returns 'c' for content (compact format)
    if parsed and parsed.get('id') == 'test-001':
        results.add_pass("Email parser - valid message")
    else:
        results.add_fail("Email parser - valid message", f"Got: {parsed}")

    # Missing header
    invalid_msg = """From: claude
To: gemini

Missing ID header"""

    parsed = parse_email_format(invalid_msg)
    if parsed is None:
        results.add_pass("Email parser - rejects missing headers")
    else:
        results.add_fail("Email parser - rejects missing headers", f"Should be None, got: {parsed}")

    # Multi-line content
    multiline_msg = """ID: test-002
From: gemini
To: claude
Subject: multiline

Line 1
Line 2
Line 3"""

    parsed = parse_email_format(multiline_msg)
    content = parsed.get('c', '') if parsed else ''
    if parsed and "Line 1" in content and "Line 2" in content:
        results.add_pass("Email parser - multiline content")
    else:
        results.add_fail("Email parser - multiline content", f"Got: {parsed}")

    # Special characters (no escaping needed)
    special_msg = """ID: test-003
From: claude
To: gemini
Subject: special

Content with $(), "quotes", 'apostrophes'"""

    parsed = parse_email_format(special_msg)
    content = parsed.get('c', '') if parsed else ''
    if parsed and '$()' in content and '"quotes"' in content:
        results.add_pass("Email parser - special characters")
    else:
        results.add_fail("Email parser - special characters", f"Got: {parsed}")


def test_send_scripts(results):
    """Test send script functionality"""
    # Import send functions
    sys.path.insert(0, str(Path(__file__).parent.parent / ".server"))
    from send_to_gemini import create_email_message

    # Test email creation
    msg = create_email_message(
        msg_id="test-123",
        from_agent="claude",
        to_agent="gemini",
        subject="test",
        content="Test content"
    )

    if "ID: test-123" in msg and "From: claude" in msg and "Test content" in msg:
        results.add_pass("Send script - email message creation")
    else:
        results.add_fail("Send script - email message creation", f"Malformed: {msg}")

    # Test .txt format (not .json)
    if ".txt" not in msg and ".json" not in msg:  # Email format, not JSON
        results.add_pass("Send script - email format (no JSON)")
    else:
        results.add_fail("Send script - email format", "Contains JSON markers")


def test_directory_structure(results):
    """Test directory structure exists"""
    server_dir = Path(__file__).parent.parent / ".server"

    required_dirs = [
        "claude-outbox",
        "claude-outbox/.unread",
        "claude-outbox/.read",
        "claude-outbox/.processing",
        "claude-outbox/.malformed",
        "gemini-outbox",
        "gemini-outbox/.unread",
        "gemini-outbox/.read",
        "gemini-outbox/.processing",
        "gemini-outbox/.malformed",
    ]

    for dir_name in required_dirs:
        dir_path = server_dir / dir_name
        if dir_path.exists():
            results.add_pass(f"Directory exists: {dir_name}")
        else:
            results.add_fail(f"Directory exists: {dir_name}", "Not found")


def test_unified_mcp_server_exists(results):
    """Test unified MCP server file exists"""
    server_path = Path(__file__).parent.parent / "mcp-servers" / "unified-mcp-server" / "server.py"

    if server_path.exists():
        results.add_pass("Unified MCP server exists")

        # Check for key functions
        with open(server_path, 'r') as f:
            content = f.read()

        if "read_gemini_messages" in content and "read_claude_messages" in content:
            results.add_pass("Unified MCP server - has both tools")
        else:
            results.add_fail("Unified MCP server - has both tools", "Missing tool definitions")

        if "parse_email_format" in content:
            results.add_pass("Unified MCP server - has email parser")
        else:
            results.add_fail("Unified MCP server - has email parser", "Missing parser")

    else:
        results.add_fail("Unified MCP server exists", "File not found")


def test_deprecated_servers_moved(results):
    """Test old servers are deprecated"""
    deprecated_dir = Path(__file__).parent.parent / "mcp-servers" / ".deprecated"

    if deprecated_dir.exists():
        results.add_pass("Deprecated directory exists")

        old_servers = ["gemini-mcp-server", "claude-mcp-server", "ai-bridge-mcp-server"]
        for server in old_servers:
            if (deprecated_dir / server).exists():
                results.add_pass(f"Old server deprecated: {server}")
            else:
                results.add_fail(f"Old server deprecated: {server}", "Not in .deprecated/")
    else:
        results.add_fail("Deprecated directory exists", "Not found")


def test_configuration_updated(results):
    """Test MCP configuration points to new server"""
    config_path = Path(__file__).parent.parent / "utils" / ".mcp.json"

    if config_path.exists():
        with open(config_path, 'r') as f:
            config = json.load(f)

        if "unified-ai-bridge" in config.get("mcpServers", {}):
            results.add_pass("MCP config - has unified-ai-bridge")

            server_path = config["mcpServers"]["unified-ai-bridge"]["args"][0]
            if "unified-mcp-server/server.py" in server_path:
                results.add_pass("MCP config - correct server path")
            else:
                results.add_fail("MCP config - correct server path", f"Wrong path: {server_path}")
        else:
            results.add_fail("MCP config - has unified-ai-bridge", "Not found in config")
    else:
        results.add_fail("MCP config exists", "File not found")


def test_documentation_updated(results):
    """Test documentation references v9.0"""
    doc_path = Path(__file__).parent.parent / ".server" / "COMMUNICATION-SYSTEM.md"

    if doc_path.exists():
        with open(doc_path, 'r') as f:
            content = f.read()

        if "Version:** 9.0" in content:
            results.add_pass("Documentation - version 9.0")
        else:
            results.add_fail("Documentation - version 9.0", "Wrong version")

        if "unified-mcp-server" in content:
            results.add_pass("Documentation - references unified server")
        else:
            results.add_fail("Documentation - references unified server", "No reference found")

        if "Email-Style Format (.txt)" in content:
            results.add_pass("Documentation - describes email format")
        else:
            results.add_fail("Documentation - describes email format", "No email format section")
    else:
        results.add_fail("Documentation exists", "COMMUNICATION-SYSTEM.md not found")


def test_legacy_docs_archived(results):
    """Test old protocol docs are archived"""
    archive_dir = Path(__file__).parent.parent / ".server" / ".archive-docs"

    if archive_dir.exists():
        results.add_pass("Archive directory exists")

        old_docs = ["PROTOCOL.md", "PROTOCOL-v2.md", "PROTOCOL-PROPOSAL.md"]
        for doc in old_docs:
            if (archive_dir / doc).exists():
                results.add_pass(f"Archived: {doc}")
            else:
                results.add_fail(f"Archived: {doc}", "Not in .archive-docs/")
    else:
        results.add_fail("Archive directory exists", "Not found")


def main():
    """Run all integration tests"""
    print("=" * 60)
    print("Communication System v9.0 - Integration Tests")
    print("=" * 60)
    print()

    results = TestResults()

    print("Testing Email Format Parser...")
    test_email_format_parser(results)

    print("\nTesting Send Scripts...")
    test_send_scripts(results)

    print("\nTesting Directory Structure...")
    test_directory_structure(results)

    print("\nTesting Unified MCP Server...")
    test_unified_mcp_server_exists(results)

    print("\nTesting Deprecated Servers...")
    test_deprecated_servers_moved(results)

    print("\nTesting Configuration...")
    test_configuration_updated(results)

    print("\nTesting Documentation...")
    test_documentation_updated(results)

    print("\nTesting Archive...")
    test_legacy_docs_archived(results)

    # Summary
    success = results.summary()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
