from pathlib import Path

# Load all SOP files as module attributes
_sops_dir = Path(__file__).parent / "sops"

for _md_file in _sops_dir.glob("*.sop.md"):
    if _md_file.is_file():
        # Convert filename to valid Python identifier
        _attr_name = _md_file.stem.removesuffix(".sop")c.replace("-", "_").replace(".", "_")
        # Load file content as module attribute
        globals()[_attr_name] = _md_file.read_text(encoding='utf-8')

# Clean up temporary variables
del _sops_dir, _md_file, _attr_name
