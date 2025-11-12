from pathlib import Path
from mcp.server.fastmcp import FastMCP
from textwrap import dedent

def run_mcp_server():
    """Run the MCP server for serving SOPs as prompts"""
    sops_dir = Path(__file__).parent / "sops"
    mcp = FastMCP("agent-sop-prompt-server")
    
    for md_file in sops_dir.glob("*.sop.md"):
        if md_file.is_file():
            prompt_name = md_file.stem
            
            def make_prompt_handler(file_path: Path):
                def get_prompt(user_input: str = "") -> str:
                    sop_content = file_path.read_text(encoding='utf-8')
                    return f"""<agent-sop name="{prompt_name}">
<content>
{sop_content}
</content>
<user-input>
{user_input}
</user-input>
</agent-sop>"""
                return get_prompt
            
            mcp.prompt(name=prompt_name)(make_prompt_handler(md_file))
    
    mcp.run()

if __name__ == "__main__":
    run_mcp_server()
