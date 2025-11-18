from pathlib import Path

# Load all SOP files as module attributes
_sops_dir = Path(__file__).parent.parent.parent / "agent-sops"

for _md_file in _sops_dir.glob("*.sop.md"):
    if _md_file.is_file():
        # Convert filename to valid Python identifier
        _attr_name = (
            _md_file.stem.removesuffix(".sop").replace("-", "_").replace(".", "_")
        )
        _sop_name = _md_file.stem.removesuffix(".sop")
        _content = _md_file.read_text(encoding="utf-8")

        # Load file content as module attribute
        globals()[_attr_name] = _content

        # Create wrapper function for each SOP
        def _make_wrapper(content, name):
            def wrapper(user_input: str = "") -> str:
                return f"""<agent-sop name="{name}">
<content>
{content}
</content>
<user-input>
{user_input}
</user-input>
</agent-sop>"""

            return wrapper

        globals()[f"{_attr_name}_with_input"] = _make_wrapper(_content, _sop_name)

# Clean up temporary variables
del _sops_dir
