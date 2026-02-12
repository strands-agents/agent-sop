import logging
import re
from pathlib import Path

from .utils import expand_sop_paths, load_external_sops

logger = logging.getLogger(__name__)


def generate_anthropic_skills(output_dir: str, sop_paths: str | None = None):
    """Generate Anthropic skills from SOPs"""
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    processed_sops = set()  # Track processed SOP names for first-wins behavior

    # Process external SOPs first (higher precedence)
    if sop_paths:
        external_directories = expand_sop_paths(sop_paths)
        external_sops = load_external_sops(external_directories)

        for sop in external_sops:
            if sop["name"] not in processed_sops:
                processed_sops.add(sop["name"])
                _create_skill_file(
                    output_path, sop["name"], sop["content"], sop["description"]
                )

    # Process built-in SOPs last (lower precedence)
    sops_dir = Path(__file__).parent / "sops"
    for sop_file in sops_dir.glob("*.sop.md"):
        skill_name = sop_file.stem.removesuffix(".sop")

        if skill_name not in processed_sops:
            processed_sops.add(skill_name)
            content = sop_file.read_text()

            # Extract overview/description
            overview_match = re.search(
                r"## Overview\s*\n(.*?)(?=\n##|\n#|\Z)", content, re.DOTALL
            )
            if not overview_match:
                raise ValueError(f"No Overview section found in {sop_file.name}")

            description = overview_match.group(1).strip().replace("\n", " ")
            _create_skill_file(output_path, skill_name, content, description)

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
---

"""

    skill_file = skill_dir / "SKILL.md"
    skill_file.write_text(frontmatter + content)
    print(f"Created Anthropic skill: {skill_file}")
