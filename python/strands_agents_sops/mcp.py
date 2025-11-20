import logging
import re
from pathlib import Path

from mcp.server.fastmcp import FastMCP

from .utils import expand_sop_paths, load_external_sops

logger = logging.getLogger(__name__)


def run_mcp_server(sop_paths: str | None = None):
    """Run the MCP server for serving SOPs as prompts

    Args:
        sop_paths: Optional colon-separated string of external SOP directory paths
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

    # Load external SOPs first (higher precedence)
    if sop_paths:
        external_directories = expand_sop_paths(sop_paths)
        external_sops = load_external_sops(external_directories)

        for sop in external_sops:
            register_sop(sop["name"], sop["content"], sop["description"])

    # Load built-in SOPs last (lower precedence)
    sops_dir = Path(__file__).parent / "sops"
    for md_file in sops_dir.glob("*.sop.md"):
        if md_file.is_file():
            prompt_name = md_file.stem.removesuffix(".sop")
            sop_content = md_file.read_text(encoding="utf-8")
            overview_match = re.search(
                r"## Overview\s*\n(.*?)(?=\n##|\n#|\Z)", sop_content, re.DOTALL
            )
            if not overview_match:
                raise ValueError(f"No Overview section found in {sop_content}")

            description = overview_match.group(1).strip().replace("\n", " ")
            register_sop(prompt_name, sop_content, description)

    mcp.run()
