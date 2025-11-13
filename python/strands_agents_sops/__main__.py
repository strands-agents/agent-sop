from pathlib import Path
import re
from mcp.server.fastmcp import FastMCP

def run_mcp_server():
    """Run the MCP server for serving SOPs as prompts"""
    sops_dir = Path(__file__).parent / "sops"
    mcp = FastMCP("agent-sop-prompt-server")
    
    for md_file in sops_dir.glob("*.sop.md"):
        if md_file.is_file():
            prompt_name = md_file.stem.removesuffix(".sop")
            sop_content = md_file.read_text(encoding='utf-8')
            overview_match = re.search(r'## Overview\s*\n(.*?)(?=\n##|\n#|\Z)', sop_content, re.DOTALL)
            if not overview_match:
                raise ValueError(f"No Overview section found in {sop_content}")
            
            description = overview_match.group(1).strip().replace('\n', ' ')
            
            def make_prompt_handler(name: str, content: str):
                def get_prompt(user_input: str = "") -> str:
                    return f"""<agent-sop name="{name}">
    <content>
{content}
</content>
<user-input>
{user_input}
</user-input>
</agent-sop>"""
                return get_prompt
            
            mcp.prompt(name=prompt_name, description=description)(make_prompt_handler(prompt_name, sop_content))
    
    mcp.run()

if __name__ == "__main__":
    run_mcp_server()
