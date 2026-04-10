from .rules import get_sop_format as get_sop_format
from .utils import load_builtin_sops

# Load all SOP files as module attributes
for _sop in load_builtin_sops():
    _attr_name = _sop["name"].replace("-", "_").replace(".", "_")

    # Load file content as module attribute
    globals()[_attr_name] = _sop["content"]

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

    globals()[f"{_attr_name}_with_input"] = _make_wrapper(_sop["content"], _sop["name"])
