"""MCP server orchestrator for Agent SOPs."""

import logging

from mcp.server.fastmcp import FastMCP

from ..utils import get_all_sops

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
        self.sops: list[dict] = []

    def setup(self) -> None:
        """Setup the MCP server by loading SOPs and registering prompts/tools."""
        self.sops = get_all_sops(self.sop_paths)
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
            for sop in self.sops:
                result.append(
                    {
                        "name": sop["name"],
                        "description": sop["description"],
                    }
                )
            return sorted(result, key=lambda x: x["name"])

        @self.mcp.tool()
        def get_agent_sop(sop_name: str) -> dict:
            """Get the full content of a specific SOP.

            Args:
                sop_name: Name of the SOP to retrieve

            Returns:
                SOP dictionary with name, description, and full content

            Raises:
                ValueError: If SOP name is not found
            """
            for sop in self.sops:
                if sop["name"] == sop_name:
                    return {
                        "name": sop["name"],
                        "description": sop["description"],
                        "content": sop["content"],
                    }

            available_sops = [sop["name"] for sop in self.sops]
            raise ValueError(
                f"SOP '{sop_name}' not found. Available SOPs: {available_sops}"
            )

    def run(self) -> None:
        """Start the MCP server."""
        self.setup()
        self.mcp.run()

    def _register_sop_prompts(self, sops: list[dict]) -> None:
        """Register SOP prompts with MCP server.

        Args:
            sops: List of SOP dictionaries with name, description, and content
        """
        for sop in sops:
            try:
                handler = self._create_prompt_handler(sop["name"], sop["content"])
                self.mcp.prompt(name=sop["name"], description=sop["description"])(handler)
            except Exception as e:
                logger.error(f"Error registering prompt for SOP '{sop['name']}': {e}")
                continue

    def _create_prompt_handler(self, sop_name: str, sop_content: str):
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
