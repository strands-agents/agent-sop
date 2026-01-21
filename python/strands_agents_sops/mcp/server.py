"""MCP server orchestrator for Agent SOPs."""

import logging
from collections.abc import Callable

from mcp.server.fastmcp import FastMCP

from ..utils import load_sops

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
        self.sops = {sop["name"]: sop for sop in load_sops(self.sop_paths)}
        self._register_sop_prompts(self.sops)
        self._register_sop_tools()

    def _register_sop_tools(self) -> None:
        """Register SOP management tools with MCP server."""

        @self.mcp.tool()
        def list_agent_sops() -> list[dict]:
            """List all available agent SOPs with name and description.

            Returns:
                List of SOP dictionaries containing name and description
            """
            result = []
            for sop in self.sops.values():
                result.append(
                    {
                        "name": sop["name"],
                        "description": sop["description"],
                    }
                )
            return result

        @self.mcp.tool()
        def get_agent_sop(name: str) -> dict:
            """Get the full content of a specific SOP.

            Args:
                name: Name of the SOP to retrieve

            Returns:
                SOP dictionary with name, description, and full content

            Raises:
                ValueError: If SOP name is not found
            """
            if name in self.sops:
                sop = self.sops[name]
                return {
                    "name": sop["name"],
                    "description": sop["description"],
                    "content": sop["content"],
                }

            raise ValueError(
                f"SOP '{name}' not found. Available SOPs: {list(self.sops.keys())}"
            )

    def run(self) -> None:
        """Start the MCP server."""
        self.mcp.run()

    def _register_sop_prompts(self, sops: dict[str, dict]) -> None:
        """Register SOP prompts with MCP server.

        Args:
            sops: Dictionary of SOP name to SOP dict with name, description, and content
        """
        for sop in sops.values():
            try:
                handler = self._create_prompt_handler(sop["name"], sop["content"])
                self.mcp.prompt(name=sop["name"], description=sop["description"])(handler)
            except Exception as e:
                raise RuntimeError(
                    f"Error registering prompt for SOP '{sop['name']}': {e}"
                ) from e

    def _create_prompt_handler(self, sop_name: str, sop_content: str) -> Callable[[str], str]:
        """Create a prompt handler for a specific SOP.

        Args:
            sop_name: Name of the SOP
            sop_content: Content of the SOP

        Returns:
            Prompt handler function
        """

        def get_prompt(user_input: str = "") -> str:
            return f"""Run this SOP:
<agent-sop name="{sop_name}">
<content>
{sop_content}
</content>
<user-input>
{user_input}
</user-input>
</agent-sop>"""

        return get_prompt
