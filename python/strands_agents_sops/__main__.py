from pathlib import Path
from mcp.server.fastmcp import FastMCP

def run_mcp_server():
    """Run the MCP server for serving SOPs as prompts"""
    sops_dir = Path(__file__).parent / "sops"
    mcp = FastMCP("prompt-server")
    
    for md_file in sops_dir.glob("*.sop.md"):
        if md_file.is_file():
            prompt_name = md_file.stem
            
            # Fix closure bug by capturing file path
            def make_prompt_handler(file_path: Path):
                def get_prompt() -> str:
                    return file_path.read_text(encoding='utf-8')
                return get_prompt
            
            mcp.prompt(name=prompt_name)(make_prompt_handler(md_file))
    
    mcp.run()

if __name__ == "__main__":
    run_mcp_server()
