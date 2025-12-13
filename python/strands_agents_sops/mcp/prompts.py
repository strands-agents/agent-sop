"""MCP prompts for SOP execution."""

import logging

from mcp.server.fastmcp import FastMCP

logger = logging.getLogger(__name__)


def register_sop_prompts(mcp: FastMCP, sops: list[dict]) -> None:
    """Register SOP prompts with MCP server.

    Args:
        mcp: FastMCP server instance
        sops: List of SOP dictionaries with name, description, and content
    """
    for sop in sops:
        try:
            handler = create_prompt_handler(sop["name"], sop["content"])
            mcp.prompt(name=sop["name"], description=sop["description"])(handler)
        except Exception as e:
            logger.error(f"Error registering prompt for SOP '{sop['name']}': {e}")
            continue


def create_prompt_handler(sop_name: str, sop_content: str):
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
