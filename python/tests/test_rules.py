from unittest.mock import MagicMock, patch

from strands_agents_sops.rules import get_sop_format, output_rules


def test_get_sop_format_file_not_found():
    """Test get_sop_format when rule file doesn't exist"""
    with patch("strands_agents_sops.rules.Path") as mock_path:
        mock_rule_file = MagicMock()
        mock_rule_file.exists.return_value = False
        mock_path.return_value.parent.__truediv__.return_value.__truediv__.return_value = mock_rule_file

        result = get_sop_format()
        assert result == ""


def test_get_sop_format_file_exists():
    """Test get_sop_format when rule file exists"""
    with patch("strands_agents_sops.rules.Path") as mock_path:
        mock_rule_file = MagicMock()
        mock_rule_file.exists.return_value = True
        mock_rule_file.read_text.return_value = "Test rule content"
        mock_path.return_value.parent.__truediv__.return_value.__truediv__.return_value = mock_rule_file

        result = get_sop_format()
        assert result == "Test rule content"


def test_output_rules_no_content(capsys):
    """Test output_rules when get_sop_format returns empty string"""
    with patch("strands_agents_sops.rules.get_sop_format") as mock_get:
        mock_get.return_value = ""

        output_rules()

        captured = capsys.readouterr()
        assert "Rules directory not found" in captured.out


def test_output_rules_with_content(capsys):
    """Test output_rules when get_sop_format returns content"""
    with patch("strands_agents_sops.rules.get_sop_format") as mock_get:
        mock_get.return_value = "Test rule content"

        output_rules()

        captured = capsys.readouterr()
        assert captured.out.strip() == "Test rule content"
