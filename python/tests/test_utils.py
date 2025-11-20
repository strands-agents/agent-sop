from unittest.mock import MagicMock, patch

from strands_agents_sops.utils import expand_sop_paths, load_external_sops


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
