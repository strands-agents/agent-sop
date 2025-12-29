import logging
import re
from pathlib import Path
from typing import List

from .sources import (
    build_sop_sources,
    load_sops_from_sources,
)

logger = logging.getLogger(__name__)


def generate_anthropic_skills(output_dir: str, sop_sources: List[str] | None = None, sop_paths: str | None = None):
    """Generate Anthropic skills from SOPs
    
    Args:
        output_dir: Output directory for skills
        sop_sources: List of external SOP source strings
        sop_paths: Optional colon-separated string of external SOP directory paths (backward compatibility)
    """
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    # Build sources list with proper precedence order
    sops_dir = Path(__file__).parent / "sops"
    sources = build_sop_sources(
        sop_sources=sop_sources,
        sop_paths=sop_paths,
        builtin_sops_dir=sops_dir
    )

    # Load all SOPs from sources with first-wins precedence
    all_sops = load_sops_from_sources(sources)
    
    # Create skill files for all loaded SOPs
    for sop in all_sops:
        _create_skill_file(
            output_path, sop["name"], sop["content"], sop["description"]
        )

    print(f"\nAnthropic skills generated in: {output_path.absolute()}")


def _create_skill_file(
    output_path: Path, skill_name: str, content: str, description: str
):
    """Create a skill file with proper frontmatter"""
    # Create skill directory and file
    skill_dir = output_path / skill_name
    skill_dir.mkdir(parents=True, exist_ok=True)

    frontmatter = f"""---
name: {skill_name}
description: {description}
type: anthropic-skill
version: "1.0"
---

"""

    skill_file = skill_dir / "SKILL.md"
    skill_file.write_text(frontmatter + content)
    print(f"Created Anthropic skill: {skill_file}")
