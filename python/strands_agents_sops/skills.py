import json
import logging
import re
from pathlib import Path

from .utils import expand_sop_paths, load_external_sops

logger = logging.getLogger(__name__)


def generate_agent_skills(output_dir: str, sop_paths: str | None = None):
    """Generate Agent Skills from SOPs"""
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

    print(f"\nAgent Skills generated in: {output_path.absolute()}")


def _yaml_string(value: str) -> str:
    # Escape line breaks and non-printable characters JSON permits literally.
    return re.sub(
        r"[\x7f-\x9f\u2028\u2029\ufffe\uffff]",
        lambda match: f"\\u{ord(match[0]):04x}",
        json.dumps(value, ensure_ascii=False),
    )


def _create_skill_file(
    output_path: Path, skill_name: str, content: str, description: str
):
    """Create a skill file with proper frontmatter"""
    # Create skill directory and file
    skill_dir = output_path / skill_name
    skill_dir.mkdir(parents=True, exist_ok=True)

    frontmatter = f"""---
name: {_yaml_string(skill_name)}
description: {_yaml_string(description)}
---

"""

    skill_file = skill_dir / "SKILL.md"
    skill_file.write_text(frontmatter + content, encoding="utf-8")
    print(f"Created Agent Skill: {skill_file}")
