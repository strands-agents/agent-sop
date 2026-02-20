from pathlib import Path
from unittest.mock import MagicMock, patch

from strands_agents_sops.utils import (
    expand_sop_paths,
    load_builtin_sops,
    load_external_sops,
    load_sops,
)


def test_expand_sop_paths_empty():
    """Test expand_sop_paths with empty string"""
    result = expand_sop_paths("")
    assert result == []


def test_expand_sop_paths_with_empty_parts():
    """Test expand_sop_paths with empty parts in colon-separated string"""
    result = expand_sop_paths(":/path1: :/path2:")
    assert len(result) == 2


def test_load_external_sops_nonexistent_directory():
    """Test load_external_sops with non-existent directory"""
    with patch("strands_agents_sops.utils.logger") as mock_logger:
        mock_dir = MagicMock()
        mock_dir.exists.return_value = False

        result = load_external_sops([mock_dir])

        assert result == []
        mock_logger.warning.assert_called()


def test_load_external_sops_not_directory():
    """Test load_external_sops with path that's not a directory"""
    with patch("strands_agents_sops.utils.logger") as mock_logger:
        mock_dir = MagicMock()
        mock_dir.exists.return_value = True
        mock_dir.is_dir.return_value = False

        result = load_external_sops([mock_dir])

        assert result == []
        mock_logger.warning.assert_called()


def test_load_external_sops_no_overview():
    """Test load_external_sops with SOP file missing Overview section"""
    with patch("strands_agents_sops.utils.logger") as mock_logger:
        mock_file = MagicMock()
        mock_file.is_file.return_value = True
        mock_file.read_text.return_value = "# Title\nNo overview section"
        mock_file.stem = "test.sop"

        mock_dir = MagicMock()
        mock_dir.exists.return_value = True
        mock_dir.is_dir.return_value = True
        mock_dir.glob.return_value = [mock_file]

        result = load_external_sops([mock_dir])

        assert result == []
        mock_logger.warning.assert_called()


def test_load_external_sops_file_error():
    """Test load_external_sops with file read error"""
    with patch("strands_agents_sops.utils.logger") as mock_logger:
        mock_file = MagicMock()
        mock_file.is_file.return_value = True
        mock_file.read_text.side_effect = Exception("Read error")

        mock_dir = MagicMock()
        mock_dir.exists.return_value = True
        mock_dir.is_dir.return_value = True
        mock_dir.glob.return_value = [mock_file]

        result = load_external_sops([mock_dir])

        assert result == []
        mock_logger.error.assert_called()


def test_load_external_sops_directory_error():
    """Test load_external_sops with directory scan error"""
    with patch("strands_agents_sops.utils.logger") as mock_logger:
        mock_dir = MagicMock()
        mock_dir.exists.return_value = True
        mock_dir.is_dir.return_value = True
        mock_dir.glob.side_effect = Exception("Scan error")

        result = load_external_sops([mock_dir])

        assert result == []
        mock_logger.error.assert_called()


def test_expand_sop_paths_with_tilde():
    """Test expand_sop_paths with tilde expansion"""
    with patch("pathlib.Path.expanduser") as mock_expanduser:
        mock_path = MagicMock()
        mock_expanduser.return_value.resolve.return_value = mock_path

        result = expand_sop_paths("~/test")

        assert len(result) == 1
        assert result[0] == mock_path


def test_load_external_sops_success():
    """Test successful loading of external SOPs"""
    sop_content = """# Test SOP

## Overview
This is a test SOP for testing purposes.

## Parameters
- **param1** (required): Test parameter
"""

    mock_file = MagicMock()
    mock_file.is_file.return_value = True
    mock_file.read_text.return_value = sop_content
    mock_file.stem = "test.sop"

    mock_dir = MagicMock()
    mock_dir.exists.return_value = True
    mock_dir.is_dir.return_value = True
    mock_dir.glob.return_value = [mock_file]

    result = load_external_sops([mock_dir])

    assert len(result) == 1
    assert result[0]["name"] == "test"
    assert result[0]["content"] == sop_content
    assert "test SOP for testing purposes" in result[0]["description"]


def test_load_builtin_sops_no_directory():
    """Test load_builtin_sops when sops directory doesn't exist"""
    with patch("strands_agents_sops.utils.logger") as mock_logger:
        with patch("pathlib.Path.exists", return_value=False):
            result = load_builtin_sops()

            assert result == []
            mock_logger.warning.assert_called()


def test_load_builtin_sops_success():
    """Test successful loading of builtin SOPs"""
    sop_content = """# Builtin SOP

## Overview
This is a builtin SOP for testing.
"""

    mock_file = MagicMock()
    mock_file.is_file.return_value = True
    mock_file.read_text.return_value = sop_content
    mock_file.stem = "builtin.sop"

    with patch("pathlib.Path.exists", return_value=True):
        with patch("pathlib.Path.glob", return_value=[mock_file]):
            result = load_builtin_sops()

            assert len(result) == 1
            assert result[0]["name"] == "builtin"
            assert result[0]["content"] == sop_content


def test_load_builtin_sops_file_error():
    """Test load_builtin_sops with file read error"""
    with patch("strands_agents_sops.utils.logger") as mock_logger:
        mock_file = MagicMock()
        mock_file.is_file.return_value = True
        mock_file.read_text.side_effect = Exception("Read error")

        with patch("pathlib.Path.exists", return_value=True):
            with patch("pathlib.Path.glob", return_value=[mock_file]):
                result = load_builtin_sops()

                assert result == []
                mock_logger.error.assert_called()


def test_load_sops_builtin_only():
    """Test load_sops with only builtin SOPs"""
    builtin_sop = {"name": "builtin", "content": "test", "description": "test"}

    with patch(
        "strands_agents_sops.utils.load_builtin_sops", return_value=[builtin_sop]
    ):
        result = load_sops()

        assert len(result) == 1
        assert result[0] == builtin_sop


def test_load_sops_with_external():
    """Test load_sops with external SOPs taking precedence"""
    external_sop = {"name": "test", "content": "external", "description": "external"}
    builtin_sop = {"name": "test", "content": "builtin", "description": "builtin"}
    other_builtin = {"name": "other", "content": "other", "description": "other"}

    with patch(
        "strands_agents_sops.utils.expand_sop_paths", return_value=[Path("/test")]
    ):
        with patch(
            "strands_agents_sops.utils.load_external_sops", return_value=[external_sop]
        ):
            with patch(
                "strands_agents_sops.utils.load_builtin_sops",
                return_value=[builtin_sop, other_builtin],
            ):
                result = load_sops("/test")

                assert len(result) == 2
                # External SOP should take precedence
                assert result[0] == external_sop
                assert result[1] == other_builtin
