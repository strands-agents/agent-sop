"""Tests for the MCP server against the real ``mcp`` library (no mocks).

These exercise the ``mcp`` 1.x / 2.x compatibility shim: ``mcp`` 2.0.0 renamed
``FastMCP`` to ``MCPServer`` and removed ``mcp.server.fastmcp``, so both the
module-level import and the prompt registration/rendering API have to work
against whichever ``mcp`` version is resolved at install time.
"""

import asyncio
import inspect
import tempfile
from pathlib import Path
from unittest.mock import patch

import strands_agents_sops.mcp as sops_mcp
from strands_agents_sops.mcp import run_mcp_server

EXTERNAL_SOP = """# External Test SOP

## Overview
External SOP for testing the MCP server.

## Steps
### 1. Test Step
Test content.
"""


def _build_server(sop_paths):
    """Call run_mcp_server with .run() patched out, return the server instance."""
    captured = {}

    def fake_run(self):
        captured["server"] = self

    with patch.object(sops_mcp.MCPServer, "run", fake_run):
        run_mcp_server(sop_paths=sop_paths)

    return captured["server"]


def test_server_class_resolves_from_installed_mcp():
    """The server class is importable whatever mcp version is installed."""
    assert sops_mcp.MCPServer.__module__.startswith("mcp.server.")
    assert sops_mcp.MCPServer.__name__ in ("FastMCP", "MCPServer")
    assert callable(sops_mcp.MCPServer.prompt)
    assert callable(sops_mcp.MCPServer.run)


def test_server_constructor_kwargs_match_installed_mcp():
    """version= is passed only to the mcp majors whose constructor accepts it.

    mcp 2.x's MCPServer defaults version to "" (so clients see an empty
    serverInfo.version unless it is passed), while mcp 1.x's FastMCP raises
    TypeError on the kwarg. This pins that gating so a future constructor
    argument cannot silently break one major.
    """
    parameters = inspect.signature(sops_mcp.MCPServer.__init__).parameters
    accepted = {name for name in sops_mcp.SERVER_KWARGS if name not in parameters}
    assert not accepted, f"MCPServer does not accept {accepted}"

    if "version" in parameters:
        assert sops_mcp.SERVER_KWARGS["version"], "server version should not be empty"
    else:
        assert "version" not in sops_mcp.SERVER_KWARGS


def test_run_mcp_server_registers_prompts():
    """SOPs are registered as prompts on a real server instance."""
    with tempfile.TemporaryDirectory() as temp_dir:
        (Path(temp_dir) / "external-test.sop.md").write_text(EXTERNAL_SOP)

        server = _build_server(sop_paths=temp_dir)
        prompts = asyncio.run(server.list_prompts())

        registered = {prompt.name: prompt for prompt in prompts}
        assert "external-test" in registered
        assert "External SOP for testing" in registered["external-test"].description


def test_run_mcp_server_prompt_renders_sop():
    """Invoking a registered prompt renders the SOP content and user input."""
    with tempfile.TemporaryDirectory() as temp_dir:
        (Path(temp_dir) / "external-test.sop.md").write_text(EXTERNAL_SOP)

        server = _build_server(sop_paths=temp_dir)
        result = asyncio.run(
            server.get_prompt("external-test", {"user_input": "do the thing"})
        )

        rendered = result.messages[0].content.text
        assert '<agent-sop name="external-test">' in rendered
        assert "Test content." in rendered
        assert "do the thing" in rendered


def test_run_mcp_server_prompt_user_input_is_optional():
    """user_input defaults to empty so prompts work with no arguments."""
    with tempfile.TemporaryDirectory() as temp_dir:
        (Path(temp_dir) / "external-test.sop.md").write_text(EXTERNAL_SOP)

        server = _build_server(sop_paths=temp_dir)
        result = asyncio.run(server.get_prompt("external-test"))

        rendered = result.messages[0].content.text
        assert "<user-input>\n\n</user-input>" in rendered
