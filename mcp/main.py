from pathlib import Path
from mcp.server.fastmcp import FastMCP

SOPS_DIR: Path = Path(__file__).parent / "sops"

# Create MCP server
mcp = FastMCP("prompt-server")

def discover_sops() -> None:
    """Discover markdown files and register as prompts"""
    
    for md_file in SOPS_DIR.glob("*sop.md"):
        if md_file.is_file():
            prompt_name = md_file.stem
            
            # Register each markdown file as a prompt
            @mcp.prompt(name=prompt_name)
            def get_prompt() -> str:
                return md_file.read_text(encoding='utf-8')

if __name__ == "__main__":
    discover_sops()
    mcp.run()
