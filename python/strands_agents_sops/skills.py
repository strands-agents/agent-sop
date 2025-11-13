from pathlib import Path
import re

def generate_anthropic_skills(output_dir: str):
    """Generate Anthropic skills from SOPs"""
    sops_dir = Path(__file__).parent / "sops"
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    for sop_file in sops_dir.glob("*.sop.md"):
        content = sop_file.read_text()
        
        # Extract overview/description
        overview_match = re.search(r'## Overview\s*\n(.*?)(?=\n##|\n#|\Z)', content, re.DOTALL)
        if not overview_match:
            raise ValueError(f"No Overview section found in {sop_file.name}")
        
        description = overview_match.group(1).strip().replace('\n', ' ')
        skill_name = sop_file.stem.removesuffix(".sop")
        
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
    
    print(f"\nAnthropic skills generated in: {output_path.absolute()}")
