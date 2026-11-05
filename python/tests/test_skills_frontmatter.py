from pathlib import Path

import pytest
import yaml

from strands_agents_sops.skills import generate_agent_skills


@pytest.mark.parametrize(
    "description",
    [
        "Run lint and tests.",
        "Run checks: lint and test.",
        "Use the # symbol in documentation.",
        "true",
        'Preserve "quotes", apostrophes\' and C:\\work paths.',
        "日本語の説明と絵文字 🧪",
        "Preserve \u0085, \u2028, \u2029 and \x7f characters.",
    ],
)
def test_generated_frontmatter_preserves_strings(tmp_path: Path, description: str):
    sop_dir = tmp_path / "sops"
    sop_dir.mkdir()
    content = f"# Test SOP\n\n## Overview\n{description}\n\n## Steps\nRun checks.\n"
    (sop_dir / "true.sop.md").write_text(content, encoding="utf-8")
    output_dir = tmp_path / "skills"

    generate_agent_skills(str(output_dir), sop_paths=str(sop_dir))

    generated = (output_dir / "true" / "SKILL.md").read_text(encoding="utf-8")
    _, frontmatter, body = generated.split("---", 2)
    metadata = yaml.safe_load(frontmatter)
    assert metadata == {"name": "true", "description": description}
    assert body.lstrip("\n") == content
