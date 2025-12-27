"""MCP tools for SOP management."""

from mcp.server.fastmcp import FastMCP

from ..utils import create_sop_metadata


def register_sop_tools(mcp: FastMCP, sops: list[dict]) -> None:
    """Register SOP management tools with MCP server.

    Args:
        mcp: FastMCP server instance
        sops: List of SOP dictionaries with name, description, and content
    """

    @mcp.tool()
    def list_agent_sops() -> list[dict]:
        """List all available agent SOPs with metadata.

        Returns:
            List of SOP metadata dictionaries containing name, description, and parameters
        """
        result = []
        for sop in sops:
            metadata = create_sop_metadata(name=sop["name"], content=sop["content"])
            result.append(
                {
                    "name": metadata["name"],
                    "description": metadata["description"],
                    "parameters": metadata["parameters"],
                }
            )
        return sorted(result, key=lambda x: x["name"])

    @mcp.tool()
    def get_agent_sop(sop_name: str) -> dict:
        """Get the full content and metadata of a specific SOP.

        Args:
            sop_name: Name of the SOP to retrieve

        Returns:
            Complete SOP metadata including content, parameters, examples, troubleshooting

        Raises:
            ValueError: If SOP name is not found
        """
        for sop in sops:
            if sop["name"] == sop_name:
                return create_sop_metadata(name=sop["name"], content=sop["content"])

        available_sops = [sop["name"] for sop in sops]
        raise ValueError(
            f"SOP '{sop_name}' not found. Available SOPs: {available_sops}"
        )
