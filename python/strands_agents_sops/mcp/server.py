"""MCP server orchestrator for Agent SOPs."""

import logging

from mcp.server.fastmcp import FastMCP

logger = logging.getLogger(__name__)


class AgentSOPMCPServer:
    """MCP server for serving Agent SOPs as prompts and tools."""

    def __init__(self, sop_paths: str | None = None):
        """Initialize the MCP server.

        Args:
            sop_paths: Optional colon-separated string of external SOP directory paths
        """
        self.sop_paths = sop_paths
        self.mcp = FastMCP("agent-sop-prompt-server")

    def setup(self) -> None:
        """Setup the MCP server by loading SOPs and registering prompts/tools."""
        from ..utils import get_all_sops
        from .prompts import register_sop_prompts
        from .tools import register_sop_tools

        sops = get_all_sops(self.sop_paths)
        register_sop_prompts(self.mcp, sops)
        register_sop_tools(self.mcp, sops)

    def run(self) -> None:
        """Start the MCP server."""
        self.setup()
        self.mcp.run()
