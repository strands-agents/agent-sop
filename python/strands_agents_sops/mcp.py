import logging
import re
from pathlib import Path
from typing import List

from mcp.server.fastmcp import FastMCP

from .sources import (
    build_sop_sources,
    load_sops_from_sources,
)

logger = logging.getLogger(__name__)


def run_mcp_server(sop_sources: List[str] | None = None, sop_paths: str | None = None):
    """Run the MCP server for serving SOPs as prompts

    Args:
        sop_sources: List of external SOP source strings
        sop_paths: Optional colon-separated string of external SOP directory paths (backward compatibility)
    """
    mcp = FastMCP("agent-sop-prompt-server")
    registered_sops = set()  # Track registered SOP names for first-wins behavior

    def register_sop(name: str, content: str, description: str):
        """Register a SOP if not already registered (first-wins)"""
        if name not in registered_sops:
            registered_sops.add(name)

            def make_prompt_handler(sop_name: str, sop_content: str):
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

            mcp.prompt(name=name, description=description)(
                make_prompt_handler(name, content)
            )

    # Build sources list with proper precedence order
    sops_dir = Path(__file__).parent / "sops"
    sources = build_sop_sources(
        sop_sources=sop_sources,
        sop_paths=sop_paths,
        builtin_sops_dir=sops_dir
    )

    # Load all SOPs from sources with first-wins precedence
    all_sops = load_sops_from_sources(sources)
    
    # Register SOPs with MCP server
    for sop in all_sops:
        register_sop(sop["name"], sop["content"], sop["description"])

    mcp.run()
