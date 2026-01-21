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
