import tempfile
from pathlib import Path
from unittest.mock import patch

from strands_agents_sops.skills import generate_anthropic_skills


class TestSkillsCLIIntegration:
    """Test CLI argument parsing for skills subcommand"""

    def test_skills_accepts_sop_paths_argument(self):
        """Test that skills subcommand accepts --sop-paths argument"""
        with patch(
            "strands_agents_sops.__main__.generate_anthropic_skills"
        ) as mock_generate:
            with patch(
                "sys.argv",
                ["strands-agents-sops", "skills", "--sop-paths", "~/test-sops"],
            ):
                from strands_agents_sops.__main__ import main

                main()
                mock_generate.assert_called_once_with("skills", sop_paths="~/test-sops")

    def test_skills_accepts_both_arguments(self):
        """Test that skills subcommand accepts both --sop-paths and --output-dir"""
        with patch(
            "strands_agents_sops.__main__.generate_anthropic_skills"
        ) as mock_generate:
            with patch(
                "sys.argv",
                [
                    "strands-agents-sops",
                    "skills",
                    "--sop-paths",
                    "~/sops",
                    "--output-dir",
                    "./output",
                ],
            ):
                from strands_agents_sops.__main__ import main

                main()
                mock_generate.assert_called_once_with("./output", sop_paths="~/sops")

    def test_skills_backward_compatibility(self):
        """Test that skills subcommand works without --sop-paths"""
        with patch(
            "strands_agents_sops.__main__.generate_anthropic_skills"
        ) as mock_generate:
            with patch(
                "sys.argv",
                ["strands-agents-sops", "skills", "--output-dir", "./skills"],
            ):
                from strands_agents_sops.__main__ import main

                main()
                mock_generate.assert_called_once_with("./skills", sop_paths=None)


class TestSkillsExternalSOPLoading:
    """Test external SOP loading in skills generation"""

    def test_generate_skills_with_external_sops(self):
        """Test skills generation with external SOPs"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create external SOP
            external_sop = """# External Test SOP

## Overview
This is an external test SOP for skills generation.

## Parameters
- **test_param** (required): Test parameter

## Steps
### 1. Test Step
Test step content.
"""
            sop_file = Path(temp_dir) / "external-test.sop.md"
            sop_file.write_text(external_sop)

            with tempfile.TemporaryDirectory() as output_dir:
                generate_anthropic_skills(output_dir, sop_paths=temp_dir)

                # Check that external SOP skill was created
                skill_file = Path(output_dir) / "external-test" / "SKILL.md"
                assert skill_file.exists()

                skill_content = skill_file.read_text()
                assert "name: external-test" in skill_content
                assert (
                    "This is an external test SOP for skills generation."
                    in skill_content
                )
                assert "# External Test SOP" in skill_content

    def test_external_sop_overrides_builtin(self):
        """Test that external SOP overrides built-in SOP with same name"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create external code-assist SOP
            external_sop = """# Custom Code Assist

## Overview
This is a custom version of code-assist that overrides the built-in one.

## Steps
### 1. Custom Step
Custom implementation.
"""
            sop_file = Path(temp_dir) / "code-assist.sop.md"
            sop_file.write_text(external_sop)

            with tempfile.TemporaryDirectory() as output_dir:
                generate_anthropic_skills(output_dir, sop_paths=temp_dir)

                # Check that external version was used
                skill_file = Path(output_dir) / "code-assist" / "SKILL.md"
                assert skill_file.exists()

                skill_content = skill_file.read_text()
                assert "custom version" in skill_content.lower()
                assert "# Custom Code Assist" in skill_content

    def test_first_external_sop_wins(self):
        """Test that first external SOP wins when multiple have same name"""
        with (
            tempfile.TemporaryDirectory() as temp_dir1,
            tempfile.TemporaryDirectory() as temp_dir2,
        ):
            # Create first SOP
            sop1 = """# Test SOP First

## Overview
This is the first version that should win.
"""
            (Path(temp_dir1) / "test.sop.md").write_text(sop1)

            # Create second SOP with same name
            sop2 = """# Test SOP Second

## Overview
This is the second version that should be ignored.
"""
            (Path(temp_dir2) / "test.sop.md").write_text(sop2)

            with tempfile.TemporaryDirectory() as output_dir:
                generate_anthropic_skills(
                    output_dir, sop_paths=f"{temp_dir1}:{temp_dir2}"
                )

                # Check that first version was used
                skill_file = Path(output_dir) / "test" / "SKILL.md"
                assert skill_file.exists()

                skill_content = skill_file.read_text()
                assert "first version" in skill_content.lower()
                assert "# Test SOP First" in skill_content

    def test_invalid_sop_files_skipped(self):
        """Test that invalid SOP files are skipped gracefully"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create invalid SOP (missing Overview)
            invalid_sop = """# Invalid SOP

## Parameters
- **param** (required): Test parameter
"""
            (Path(temp_dir) / "invalid.sop.md").write_text(invalid_sop)

            # Create valid SOP
            valid_sop = """# Valid SOP

## Overview
This is a valid SOP.

## Steps
### 1. Step
Content.
"""
            (Path(temp_dir) / "valid.sop.md").write_text(valid_sop)

            with tempfile.TemporaryDirectory() as output_dir:
                generate_anthropic_skills(output_dir, sop_paths=temp_dir)

                # Check that only valid SOP was processed
                assert not (Path(output_dir) / "invalid").exists()
                assert (Path(output_dir) / "valid" / "SKILL.md").exists()

    def test_nonexistent_directory_handled(self):
        """Test that non-existent directories are handled gracefully"""
        with tempfile.TemporaryDirectory() as output_dir:
            # Should not raise exception
            generate_anthropic_skills(output_dir, sop_paths="/nonexistent/path")

            # Built-in SOPs should still be processed
            builtin_skills = list(Path(output_dir).glob("*/SKILL.md"))
            assert len(builtin_skills) > 0  # Should have built-in skills

    def test_multiple_paths_processed(self):
        """Test that multiple colon-separated paths are processed"""
        with (
            tempfile.TemporaryDirectory() as temp_dir1,
            tempfile.TemporaryDirectory() as temp_dir2,
        ):
            # Create SOP in first directory
            sop1 = """# SOP One

## Overview
First SOP.
"""
            (Path(temp_dir1) / "sop-one.sop.md").write_text(sop1)

            # Create SOP in second directory
            sop2 = """# SOP Two

## Overview
Second SOP.
"""
            (Path(temp_dir2) / "sop-two.sop.md").write_text(sop2)

            with tempfile.TemporaryDirectory() as output_dir:
                generate_anthropic_skills(
                    output_dir, sop_paths=f"{temp_dir1}:{temp_dir2}"
                )

                # Check that both SOPs were processed
                assert (Path(output_dir) / "sop-one" / "SKILL.md").exists()
                assert (Path(output_dir) / "sop-two" / "SKILL.md").exists()

    def test_backward_compatibility_no_sop_paths(self):
        """Test that skills generation works without sop_paths parameter"""
        with tempfile.TemporaryDirectory() as output_dir:
            generate_anthropic_skills(output_dir)

            # Should generate built-in skills
            builtin_skills = list(Path(output_dir).glob("*/SKILL.md"))
            assert len(builtin_skills) > 0  # Should have built-in skills

            # Check for known built-in skills
            skill_names = [skill.parent.name for skill in builtin_skills]
            assert "code-assist" in skill_names

    def test_skill_frontmatter_simplified(self):
        """Test that generated skills have simplified frontmatter without type/version"""
        with tempfile.TemporaryDirectory() as output_dir:
            generate_anthropic_skills(output_dir)

            skill_file = Path(output_dir) / "code-assist" / "SKILL.md"
            assert skill_file.exists()

            skill_content = skill_file.read_text()

            # Verify required fields are present
            assert "name: code-assist" in skill_content
            assert "description:" in skill_content

            # Verify deprecated fields are NOT present
            assert "type:" not in skill_content
            assert "version:" not in skill_content
