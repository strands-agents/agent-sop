from unittest.mock import MagicMock, patch

import pytest

from strands_agents_sops.rules import get_sop_format, output_rules


def test_get_sop_format_file_not_found():
    """Test get_sop_format raises FileNotFoundError when rule file doesn't exist"""
    with patch("strands_agents_sops.rules.Path") as mock_path:
        mock_rule_file = MagicMock()
        mock_rule_file.read_text.side_effect = FileNotFoundError("No such file")
        mock_path.return_value.parent.__truediv__.return_value.__truediv__.return_value = mock_rule_file

        with pytest.raises(FileNotFoundError):
            get_sop_format()


def test_get_sop_format_file_exists():
    """Test get_sop_format when rule file exists"""
    with patch("strands_agents_sops.rules.Path") as mock_path:
        mock_rule_file = MagicMock()
        mock_rule_file.read_text.return_value = "Test rule content"
        mock_path.return_value.parent.__truediv__.return_value.__truediv__.return_value = mock_rule_file

        result = get_sop_format()
        assert result == "Test rule content"


def test_output_rules_with_content(capsys):
    """Test output_rules when get_sop_format returns content"""
    with patch("strands_agents_sops.rules.get_sop_format") as mock_get:
        mock_get.return_value = "Test rule content"

        output_rules()

        captured = capsys.readouterr()
        assert captured.out.strip() == "Test rule content"
