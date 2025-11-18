from pathlib import Path
import re
import logging
from typing import List, Dict, Any, Optional
from mcp.server.fastmcp import FastMCP

logger = logging.getLogger(__name__)


def expand_sop_paths(sop_paths_str: str) -> List[Path]:
    """Expand and validate SOP directory paths.
    
    Args:
        sop_paths_str: Colon-separated string of directory paths
        
    Returns:
        List of expanded Path objects
    """
    if not sop_paths_str:
        return []
    
    paths = []
    for path_str in sop_paths_str.split(':'):
        path_str = path_str.strip()
        if not path_str:
            continue
            
        # Expand tilde and resolve to absolute path
        path = Path(path_str).expanduser().resolve()
        paths.append(path)
    
    return paths


def load_external_sops(sop_directories: List[Path]) -> List[Dict[str, Any]]:
    """Load SOPs from external directories.
    
    Args:
        sop_directories: List of directory paths to search for SOPs
        
    Returns:
        List of SOP dictionaries with name, content, and description
    """
    external_sops = []
    
    for directory in sop_directories:
        if not directory.exists():
            logger.warning(f"SOP directory does not exist: {directory}")
            continue
            
        if not directory.is_dir():
            logger.warning(f"SOP path is not a directory: {directory}")
            continue
            
        try:
            for sop_file in directory.glob("*.sop.md"):
                if not sop_file.is_file():
                    continue
                    
                try:
                    sop_content = sop_file.read_text(encoding='utf-8')
                    
                    # Extract overview section for description
                    overview_match = re.search(r'## Overview\s*\n(.*?)(?=\n##|\n#|\Z)', sop_content, re.DOTALL)
                    if not overview_match:
                        logger.warning(f"No Overview section found in {sop_file}")
                        continue
                    
                    description = overview_match.group(1).strip().replace('\n', ' ')
                    sop_name = sop_file.stem.removesuffix(".sop")
                    
                    external_sops.append({
                        'name': sop_name,
                        'content': sop_content,
                        'description': description
                    })
                    
                except Exception as e:
                    logger.error(f"Error loading SOP from {sop_file}: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error scanning directory {directory}: {e}")
            continue
    
    return external_sops


def run_mcp_server(sop_paths: Optional[str] = None):
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
            
            mcp.prompt(name=name, description=description)(make_prompt_handler(name, content))
    
    # Load external SOPs first (higher precedence)
    if sop_paths:
        external_directories = expand_sop_paths(sop_paths)
        external_sops = load_external_sops(external_directories)
        
        for sop in external_sops:
            register_sop(sop['name'], sop['content'], sop['description'])
    
    # Load built-in SOPs last (lower precedence)
    sops_dir = Path(__file__).parent / "sops"
    for md_file in sops_dir.glob("*.sop.md"):
        if md_file.is_file():
            prompt_name = md_file.stem.removesuffix(".sop")
            sop_content = md_file.read_text(encoding='utf-8')
            overview_match = re.search(r'## Overview\s*\n(.*?)(?=\n##|\n#|\Z)', sop_content, re.DOTALL)
            if not overview_match:
                raise ValueError(f"No Overview section found in {sop_content}")
            
            description = overview_match.group(1).strip().replace('\n', ' ')
            register_sop(prompt_name, sop_content, description)
    
    mcp.run()
