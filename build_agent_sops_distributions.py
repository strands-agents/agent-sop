#!/usr/bin/env python3
"""Build sop to transform agent sops for different distributions."""

from pathlib import Path
import re
from typing import Callable
from dataclasses import dataclass

AGENT_SOPS_SOURCE = Path("agent-sops")

def skills_transform(content: str, filename: str) -> None:
    """Transform sop for skills distribution - creates subdirectory structure."""
    
    # Extract overview/description from content
    overview_match = re.search(r'## Overview\s*\n(.*?)(?=\n##|\n#|\Z)', content, re.DOTALL)
    if not overview_match:
        raise ValueError(f"No Overview section found in {filename}")
    
    description = overview_match.group(1).strip().replace('\n', ' ')
    
    # Get sop name without extension
    sop_name = Path(filename).stem.split(".sop")[0]
    
    # Create subdirectory
    subdir = Path("skills") / sop_name
    subdir.mkdir(parents=True, exist_ok=True)
    
    # Create frontmatter
    frontmatter = f"""---
name: {sop_name}
description: {description}
---

"""
    
    # Write SKILL.md file
    skill_file = subdir / "SKILL.md"
    skill_file.write_text(frontmatter + content)
    
    print(f"Created {skill_file}")

@dataclass
class Distribution:
    target_directory: str

    # Takes in the target directory, followed by the filename of the sop
    transform_function: Callable[[str, str], None]

DISTRIBUTIONS = [
    Distribution("skills", skills_transform),
]

def build_distributions():
    """Build and distribute agent sops."""
        
    # Iterate over distributions
    for distribution in DISTRIBUTIONS:
        target_directory_path = Path(distribution.target_directory)
        target_directory_path.mkdir(exist_ok=True)
    
        # Process each source sop
        for sop_file in AGENT_SOPS_SOURCE.glob("*.sop.md"):
            content = sop_file.read_text()
            distribution.transform_function(content, sop_file.name)

if __name__ == "__main__":
    build_distributions()
