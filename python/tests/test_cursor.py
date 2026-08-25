import tempfile
from pathlib import Path

from strands_agents_sops.cursor import generate_cursor_commands


def test_generate_cursor_commands():
    """Test cursor commands generation"""
    with tempfile.TemporaryDirectory() as temp_dir:
        generate_cursor_commands(temp_dir)

        # Check that files were created
        output_path = Path(temp_dir)
        files = list(output_path.glob("*.md"))

        # Should have created some command files
        assert len(files) > 0

        # Check that at least one expected SOP was created
        sop_names = [f.stem for f in files]
        assert any("code-assist" in name for name in sop_names)


def test_generate_cursor_commands_with_custom_sops():
    """Test cursor commands generation with custom SOP paths"""
    with tempfile.TemporaryDirectory() as temp_dir:
        # Test with non-existent path (should not crash)
        generate_cursor_commands(temp_dir, sop_paths="/nonexistent/path")

        # Should still create built-in SOPs
        output_path = Path(temp_dir)
        files = list(output_path.glob("*.md"))
        assert len(files) > 0


def test_generate_cursor_commands_with_nested_custom_sop():
    """Nested custom SOPs are converted to Cursor commands."""
    with (
        tempfile.TemporaryDirectory() as temp_dir,
        tempfile.TemporaryDirectory() as output_dir,
    ):
        nested_dir = Path(temp_dir) / "team" / "operations"
        nested_dir.mkdir(parents=True)
        (nested_dir / "deploy.sop.md").write_text(
            "# Deploy\n\n## Overview\nDeploy from a nested SOP.\n"
        )

        generate_cursor_commands(output_dir, sop_paths=temp_dir)

        command_file = Path(output_dir) / "deploy.sop.md"
        assert command_file.exists()
        assert "Deploy from a nested SOP." in command_file.read_text()
