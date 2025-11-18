from unittest.mock import MagicMock, patch

from strands_agents_sops.rules import output_rules


def test_output_rules_no_directory(capsys):
    """Test output_rules when rules directory doesn't exist"""
    with patch("strands_agents_sops.rules.Path") as mock_path:
        mock_rules_dir = MagicMock()
        mock_rules_dir.exists.return_value = False
        mock_path.return_value.parent.__truediv__.return_value = mock_rules_dir

        output_rules()

        captured = capsys.readouterr()
        assert "Rules directory not found" in captured.out


def test_output_rules_no_files(capsys):
    """Test output_rules when no rule files exist"""
    with patch("strands_agents_sops.rules.Path") as mock_path:
        mock_rules_dir = MagicMock()
        mock_rules_dir.exists.return_value = True
        mock_rules_dir.glob.return_value = []
        mock_path.return_value.parent.__truediv__.return_value = mock_rules_dir

        output_rules()

        captured = capsys.readouterr()
        assert "No rule files found" in captured.out


def test_output_rules_with_files(capsys):
    """Test output_rules with rule files"""
    with patch("strands_agents_sops.rules.Path") as mock_path:
        mock_file = MagicMock()
        mock_file.name = "test.md"
        mock_file.read_text.return_value = "Test content"

        mock_rules_dir = MagicMock()
        mock_rules_dir.exists.return_value = True
        mock_rules_dir.glob.return_value = [mock_file]
        mock_path.return_value.parent.__truediv__.return_value = mock_rules_dir

        output_rules()

        captured = capsys.readouterr()
        assert "=== test.md ===" in captured.out
        assert "Test content" in captured.out
