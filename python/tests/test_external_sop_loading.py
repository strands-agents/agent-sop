import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

from strands_agents_sops.mcp import run_mcp_server
from strands_agents_sops.utils import expand_sop_paths, load_external_sops


class TestPathExpansion:
    """Test path expansion and validation utilities"""

    def test_expand_tilde_path(self):
        """Test tilde expansion to user home directory"""
        paths = expand_sop_paths("~/test-sops")
        assert len(paths) == 1
        assert str(paths[0]).startswith(str(Path.home()))
        assert str(paths[0]).endswith("test-sops")

    def test_expand_relative_path(self):
        """Test relative path resolution"""
        paths = expand_sop_paths("./custom-sops")
        assert len(paths) == 1
        assert paths[0].is_absolute()
        assert str(paths[0]).endswith("custom-sops")

    def test_expand_absolute_path(self):
        """Test absolute path handling"""
        test_path = "/absolute/path/to/sops"
        paths = expand_sop_paths(test_path)
        assert len(paths) == 1
        assert str(paths[0]) == test_path

    def test_expand_multiple_paths(self):
        """Test colon-separated multiple paths"""
        paths = expand_sop_paths("~/path1:./path2:/absolute/path3")
        assert len(paths) == 3
        assert str(paths[0]).startswith(str(Path.home()))
        assert paths[1].is_absolute()
        assert str(paths[2]) == "/absolute/path3"


class TestSOPDiscovery:
    """Test SOP file discovery and loading"""

    def test_discover_valid_sop_files(self):
        """Test discovery of valid .sop.md files"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create test SOP file
            sop_content = """# Test SOP

## Overview
This is a test SOP for external loading.

## Parameters
- **test_param** (required): Test parameter

## Steps
### 1. Test Step
Test step content.
"""
            sop_file = Path(temp_dir) / "test.sop.md"
            sop_file.write_text(sop_content)

            # Create non-SOP files that should be ignored
            (Path(temp_dir) / "readme.md").write_text("Not a SOP")
            (Path(temp_dir) / "other.txt").write_text("Not a SOP")

            sops = load_external_sops([Path(temp_dir)])
            assert len(sops) == 1
            assert sops[0]["name"] == "test"
            assert "This is a test SOP for external loading." in sops[0]["description"]

    def test_handle_invalid_sop_format(self):
        """Test handling of SOP files without Overview section"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create invalid SOP file (missing Overview)
            invalid_content = """# Invalid SOP

## Parameters
- **param** (required): Test parameter
"""
            sop_file = Path(temp_dir) / "invalid.sop.md"
            sop_file.write_text(invalid_content)

            sops = load_external_sops([Path(temp_dir)])
            assert len(sops) == 0  # Invalid SOP should be skipped

    def test_handle_empty_directory(self):
        """Test handling of directory with no SOP files"""
        with tempfile.TemporaryDirectory() as temp_dir:
            sops = load_external_sops([Path(temp_dir)])
            assert len(sops) == 0

    def test_handle_nonexistent_directory(self):
        """Test handling of non-existent directory"""
        nonexistent_path = Path("/nonexistent/directory")
        sops = load_external_sops([nonexistent_path])
        assert len(sops) == 0  # Should handle gracefully


class TestMCPIntegration:
    """Test MCP server integration with external SOPs"""

    @patch("strands_agents_sops.mcp.FastMCP")
    def test_mcp_server_with_external_sops(self, mock_fastmcp):
        """Test MCP server initialization with external SOPs"""
        mock_mcp_instance = MagicMock()
        mock_fastmcp.return_value = mock_mcp_instance

        with tempfile.TemporaryDirectory() as temp_dir:
            # Create test SOP
            sop_content = """# External Test SOP

## Overview
External SOP for testing MCP integration.

## Steps
### 1. Test Step
Test content.
"""
            sop_file = Path(temp_dir) / "external-test.sop.md"
            sop_file.write_text(sop_content)

            # Run MCP server with external paths
            run_mcp_server(sop_paths=f"{temp_dir}")

            # Verify MCP server was created and run
            mock_fastmcp.assert_called_once_with("agent-sop-prompt-server")
            mock_mcp_instance.run.assert_called_once()

            # Verify prompt registration was called (built-in + external SOPs)
            assert (
                mock_mcp_instance.prompt.call_count >= 1
            )  # At least external SOP registered

    @patch("strands_agents_sops.mcp.FastMCP")
    def test_external_sops_override_builtin(self, mock_fastmcp):
        """Test that external SOPs override built-in SOPs with same name"""
        mock_mcp_instance = MagicMock()
        mock_fastmcp.return_value = mock_mcp_instance

        with tempfile.TemporaryDirectory() as temp_dir:
            # Create external SOP with same name as built-in
            sop_content = """# Code Assist Override

## Overview
This is a custom version of the code-assist SOP that overrides the built-in one.

## Steps
### 1. Custom Step
Custom implementation.
"""
            sop_file = Path(temp_dir) / "code-assist.sop.md"
            sop_file.write_text(sop_content)

            # Run MCP server with external paths
            run_mcp_server(sop_paths=f"{temp_dir}")

            # Verify MCP server was created and run
            mock_fastmcp.assert_called_once_with("agent-sop-prompt-server")
            mock_mcp_instance.run.assert_called_once()

            # Check that prompt was registered (external should win over built-in)
            prompt_calls = [
                call
                for call in mock_mcp_instance.prompt.call_args_list
                if call[1]["name"] == "code-assist"
            ]
            assert len(prompt_calls) == 1  # Only one code-assist should be registered

            # Verify it's the external version by checking description
            registered_description = prompt_calls[0][1]["description"]
            assert "custom version" in registered_description.lower()

    @patch("strands_agents_sops.mcp.FastMCP")
    def test_first_external_sop_wins_conflict(self, mock_fastmcp):
        """Test that first external SOP wins when multiple external SOPs have same name"""
        mock_mcp_instance = MagicMock()
        mock_fastmcp.return_value = mock_mcp_instance

        with (
            tempfile.TemporaryDirectory() as temp_dir1,
            tempfile.TemporaryDirectory() as temp_dir2,
        ):
            # Create first SOP
            sop1_content = """# Test SOP First

## Overview
This is the first version that should win.
"""
            (Path(temp_dir1) / "test.sop.md").write_text(sop1_content)

            # Create second SOP with same name
            sop2_content = """# Test SOP Second

## Overview
This is the second version that should be ignored.
"""
            (Path(temp_dir2) / "test.sop.md").write_text(sop2_content)

            # Run MCP server with both paths (first should win)
            run_mcp_server(sop_paths=f"{temp_dir1}:{temp_dir2}")

            # Check that only one test SOP was registered
            prompt_calls = [
                call
                for call in mock_mcp_instance.prompt.call_args_list
                if call[1]["name"] == "test"
            ]
            assert len(prompt_calls) == 1  # Only one test SOP should be registered

            # Verify it's the first version
            registered_description = prompt_calls[0][1]["description"]
            assert "first version" in registered_description.lower()

    @patch("strands_agents_sops.mcp.FastMCP")
    def test_mcp_server_without_external_sops(self, mock_fastmcp):
        """Test MCP server works without external SOPs (backward compatibility)"""
        mock_mcp_instance = MagicMock()
        mock_fastmcp.return_value = mock_mcp_instance

        # Run MCP server without external paths
        run_mcp_server()

        # Verify MCP server was created and run
        mock_fastmcp.assert_called_once_with("agent-sop-prompt-server")
        mock_mcp_instance.run.assert_called_once()

        # Verify built-in SOPs were registered
        assert (
            mock_mcp_instance.prompt.call_count >= 4
        )  # Built-in SOPs (code-assist, etc.)
