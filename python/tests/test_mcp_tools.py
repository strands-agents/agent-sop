"""Tests for MCP tools functionality."""

from unittest.mock import MagicMock

import pytest

from strands_agents_sops.mcp.tools import register_sop_tools
from strands_agents_sops.utils import create_sop_metadata


@pytest.fixture
def test_sops():
    """Create minimal test SOP data"""
    return [
        {
            "name": "test-sop-b",
            "description": "Second test SOP",
            "content": """# Test SOP B
## Overview
Test SOP B for testing.
## Parameters
- **param1** (required): Test parameter
""",
        },
        {
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
    ]


@pytest.fixture
def registered_tools(test_sops):
    """Register tools and capture registered functions"""
    mock_mcp = MagicMock()
    captured_functions = {}

    # Mock tool() decorator to capture registered functions
    def mock_tool_decorator():
        def decorator(func):
            captured_functions[func.__name__] = func
            return func

        return decorator

    mock_mcp.tool = mock_tool_decorator

    register_sop_tools(mock_mcp, test_sops)

    return {
        "list_agent_sops": captured_functions["list_agent_sops"],
        "get_agent_sop": captured_functions["get_agent_sop"],
    }


@pytest.fixture
def expected_metadata(test_sops):
    """Create expected metadata for test SOPs using create_sop_metadata"""
    return {
        sop["name"]: create_sop_metadata(sop["name"], sop["content"])
        for sop in test_sops
    }


class TestSOPToolsRegistration:
    """Test SOP tools registration with MCP server"""

    def test_register_sop_tools_creates_two_tools(self, test_sops):
        """Verify that register_sop_tools registers list and get tools"""
        mock_mcp = MagicMock()
        register_sop_tools(mock_mcp, test_sops)

        # Verify tool() was called twice
        assert mock_mcp.tool.call_count == 2


class TestListAgentSOPs:
    """Test list_agent_sops tool functionality"""

    def test_list_agent_sops_returns_sorted_metadata(
        self, registered_tools, expected_metadata
    ):
        """Test that list_agent_sops returns sorted SOPs with metadata only"""
        result = registered_tools["list_agent_sops"]()

        # Verify count
        assert len(result) == 2

        # Verify alphabetical sorting
        assert result[0]["name"] == "test-sop-a"
        assert result[1]["name"] == "test-sop-b"

        # Verify metadata structure
        for sop in result:
            assert "name" in sop
            assert "description" in sop
            assert "parameters" in sop

        # Verify metadata matches expected values
        for sop in result:
            expected = expected_metadata[sop["name"]]
            assert sop["name"] == expected["name"]
            assert sop["description"] == expected["description"]
            assert sop["parameters"] == expected["parameters"]


class TestGetAgentSOP:
    """Test get_agent_sop tool functionality"""

    def test_get_agent_sop_returns_full_metadata(
        self, registered_tools, expected_metadata
    ):
        """Test that get_agent_sop returns complete SOP metadata"""
        result = registered_tools["get_agent_sop"]("test-sop-a")

        # Verify it returns the expected metadata structure
        expected = expected_metadata["test-sop-a"]
        assert result["name"] == expected["name"]
        assert result["description"] == expected["description"]
        assert result["parameters"] == expected["parameters"]

        # Verify optional sections are included when present
        assert "examples" in result
        assert "troubleshooting" in result
        assert result["examples"] == expected["examples"]
        assert result["troubleshooting"] == expected["troubleshooting"]

    def test_get_agent_sop_raises_error_for_invalid_name(self, registered_tools):
        """Test that get_agent_sop raises ValueError for non-existent SOP"""
        with pytest.raises(ValueError) as exc_info:
            registered_tools["get_agent_sop"]("non-existent-sop")

        # Verify error message includes the invalid name and available SOPs
        error_msg = str(exc_info.value)
        assert "non-existent-sop" in error_msg
        assert "test-sop-a" in error_msg
        assert "test-sop-b" in error_msg
