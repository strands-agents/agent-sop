"""Tests for MCP tools functionality."""

from unittest.mock import MagicMock

import pytest

from strands_agents_sops.mcp.server import AgentSOPMCPServer


@pytest.fixture
def test_sops():
    """Create minimal test SOP data"""
    return {
        "test-sop-b": {
            "name": "test-sop-b",
            "description": "Second test SOP",
            "content": """# Test SOP B
## Overview
Test SOP B for testing.
## Parameters
- **param1** (required): Test parameter
""",
        },
        "test-sop-a": {
            "name": "test-sop-a",
            "description": "First test SOP",
            "content": """# Test SOP A
## Overview
Test SOP A for testing.
## Parameters
- **param2** (optional, default: value): Optional parameter
## Examples
Example usage of test-sop-a.
## Troubleshooting
Common issues and solutions.
""",
        },
    }


@pytest.fixture
def registered_tools(test_sops):
    """Create server and capture registered tool functions"""
    server = AgentSOPMCPServer()
    server.sops = test_sops
    captured_functions = {}

    # Mock tool() decorator to capture registered functions
    def mock_tool_decorator():
        def decorator(func):
            captured_functions[func.__name__] = func
            return func

        return decorator

    server.mcp.tool = mock_tool_decorator
    server._register_sop_tools()

    return captured_functions


class TestListAgentSOPs:
    """Test list_agent_sops tool functionality"""

    def test_list_agent_sops_returns_all_sops(self, registered_tools):
        """Test that list_agent_sops returns all SOPs with name and description"""
        result = registered_tools["list_agent_sops"]()

        # Verify count
        assert len(result) == 2

        # Verify all SOPs are present
        names = {sop["name"] for sop in result}
        assert names == {"test-sop-a", "test-sop-b"}

        # Verify structure (only name and description)
        for sop in result:
            assert "name" in sop
            assert "description" in sop
            assert len(sop) == 2  # Only name and description

    def test_list_agent_sops_returns_correct_descriptions(self, registered_tools):
        """Test that list_agent_sops returns correct descriptions"""
        result = registered_tools["list_agent_sops"]()

        descriptions = {sop["name"]: sop["description"] for sop in result}
        assert descriptions["test-sop-a"] == "First test SOP"
        assert descriptions["test-sop-b"] == "Second test SOP"


class TestGetAgentSOP:
    """Test get_agent_sop tool functionality"""

    def test_get_agent_sop_returns_full_content(self, registered_tools, test_sops):
        """Test that get_agent_sop returns name, description, and full content"""
        result = registered_tools["get_agent_sop"]("test-sop-a")

        # Verify structure
        assert result["name"] == "test-sop-a"
        assert result["description"] == "First test SOP"
        assert "content" in result

        # Verify content is the full SOP content
        expected_content = test_sops["test-sop-a"]["content"]
        assert result["content"] == expected_content

    def test_get_agent_sop_raises_error_for_invalid_name(self, registered_tools):
        """Test that get_agent_sop raises ValueError for non-existent SOP"""
        with pytest.raises(ValueError) as exc_info:
            registered_tools["get_agent_sop"]("non-existent-sop")

        # Verify error message includes the invalid name and available SOPs
        error_msg = str(exc_info.value)
        assert "non-existent-sop" in error_msg
        assert "test-sop-a" in error_msg
        assert "test-sop-b" in error_msg
