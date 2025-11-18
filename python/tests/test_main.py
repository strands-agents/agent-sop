from unittest.mock import patch

from strands_agents_sops.__main__ import main


@patch("strands_agents_sops.__main__.generate_anthropic_skills")
@patch("sys.argv", ["strands-agents-sops", "skills", "--output-dir", "test-dir"])
def test_main_skills_command(mock_generate):
    """Test main function with skills command"""
    main()
    mock_generate.assert_called_once_with("test-dir", sop_paths=None)


@patch("strands_agents_sops.__main__.output_rules")
@patch("sys.argv", ["strands-agents-sops", "rule"])
def test_main_rule_command(mock_output_rules):
    """Test main function with rule command"""
    main()
    mock_output_rules.assert_called_once()


@patch("strands_agents_sops.__main__.run_mcp_server")
@patch("sys.argv", ["strands-agents-sops"])
def test_main_default_mcp(mock_run_mcp):
    """Test main function defaults to MCP server"""
    main()
    mock_run_mcp.assert_called_once_with(sop_paths=None)


@patch("strands_agents_sops.__main__.run_mcp_server")
@patch("sys.argv", ["strands-agents-sops", "mcp", "--sop-paths", "/test/path"])
def test_main_mcp_with_paths(mock_run_mcp):
    """Test main function with MCP and sop-paths"""
    main()
    mock_run_mcp.assert_called_once_with(sop_paths="/test/path")
