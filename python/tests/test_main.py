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


@patch("strands_agents_sops.mcp.server.AgentSOPMCPServer.run")
@patch("strands_agents_sops.mcp.server.AgentSOPMCPServer.__init__", return_value=None)
@patch("sys.argv", ["strands-agents-sops"])
def test_main_default_mcp(mock_init, mock_run):
    """Test main function defaults to MCP server"""
    main()
    mock_init.assert_called_once_with(sop_paths=None)
    mock_run.assert_called_once()


@patch("strands_agents_sops.mcp.server.AgentSOPMCPServer.run")
@patch("strands_agents_sops.mcp.server.AgentSOPMCPServer.__init__", return_value=None)
@patch("sys.argv", ["strands-agents-sops", "mcp", "--sop-paths", "/test/path"])
def test_main_mcp_with_paths(mock_init, mock_run):
    """Test main function with MCP and sop-paths"""
    main()
    mock_init.assert_called_once_with(sop_paths="/test/path")
    mock_run.assert_called_once()


@patch("strands_agents_sops.__main__.generate_cursor_commands")
@patch("sys.argv", ["strands-agents-sops", "commands", "--type", "cursor", "--output-dir", "test-dir"])
def test_main_commands_cursor(mock_generate):
    """Test main function with commands --type cursor"""
    main()
    mock_generate.assert_called_once_with("test-dir", sop_paths=None)


@patch("strands_agents_sops.__main__.generate_cursor_commands")
@patch("sys.argv", ["strands-agents-sops", "commands", "--type", "cursor", "--sop-paths", "/test/path"])
def test_main_commands_cursor_with_paths(mock_generate):
    """Test main function with commands --type cursor and sop-paths"""
    main()
    mock_generate.assert_called_once_with(".cursor/commands", sop_paths="/test/path")
