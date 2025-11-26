import logging
import re
from pathlib import Path

from .utils import expand_sop_paths, load_external_sops

logger = logging.getLogger(__name__)


def generate_cursor_commands(output_dir: str, sop_paths: str | None = None):
    """Generate Cursor commands from SOPs

    Args:
        output_dir: Output directory for Cursor commands (typically .cursor/commands)
        sop_paths: Optional colon-separated string of external SOP directory paths
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    processed_sops = set()  # Track processed SOP names for first-wins behavior

    # Process external SOPs first (higher precedence)
    if sop_paths:
        external_directories = expand_sop_paths(sop_paths)
        external_sops = load_external_sops(external_directories)

        for sop in external_sops:
            if sop["name"] not in processed_sops:
                processed_sops.add(sop["name"])
                _create_command_file(
                    output_path, sop["name"], sop["content"], sop["description"]
                )

    # Process built-in SOPs last (lower precedence)
    sops_dir = Path(__file__).parent / "sops"
    for sop_file in sops_dir.glob("*.sop.md"):
        command_name = sop_file.stem.removesuffix(".sop")

        if command_name not in processed_sops:
            processed_sops.add(command_name)
            content = sop_file.read_text()

            # Extract overview/description
            overview_match = re.search(
                r"## Overview\s*\n(.*?)(?=\n##|\n#|\Z)", content, re.DOTALL
            )
            if not overview_match:
                raise ValueError(f"No Overview section found in {sop_file.name}")

            description = overview_match.group(1).strip().replace("\n", " ")
            _create_command_file(output_path, command_name, content, description)

    print(f"\nCursor commands generated in: {output_path.absolute()}")


def _create_command_file(
    output_path: Path, command_name: str, sop_content: str, description: str
):
    """Create a Cursor command file from SOP content

    Args:
        output_path: Directory where command file will be created
        command_name: Name of the command (used as filename)
        sop_content: Full SOP markdown content
        description: Brief description of the SOP
    """
    # Extract parameters section to add parameter handling instructions
    parameters_section = _extract_parameters_section(sop_content)
    parameter_instructions = _generate_parameter_instructions(parameters_section)

    # Create command content
    # Cursor commands are plain markdown, so we can include the full SOP
    # but we'll add a header to make it clear this is a command
    command_content = f"""# {command_name.replace('-', ' ').title()}

{description}

## Usage

Type `/` followed by `{command_name}` in the Cursor chat to execute this workflow.

{parameter_instructions}

---

{sop_content}
"""

    command_file = output_path / f"{command_name}.md"
    command_file.write_text(command_content, encoding="utf-8")
    print(f"Created Cursor command: {command_file}")


def _extract_parameters_section(sop_content: str) -> str | None:
    """Extract the Parameters section from SOP content"""
    # Match Parameters section until next top-level section
    params_match = re.search(
        r"## Parameters\s*\n(.*?)(?=\n##|\n#|\Z)", sop_content, re.DOTALL
    )
    if params_match:
        return params_match.group(1).strip()
    return None


def _generate_parameter_instructions(parameters_section: str | None) -> str:
    """Generate instructions for handling parameters in Cursor commands"""
    if not parameters_section:
        return """## Parameters

This workflow does not require any parameters. Simply execute the command to begin."""

    # Parse parameters
    required_params = []
    optional_params = []

    # Match parameter definitions: - **param_name** (required|optional[, default: value]): description
    # Description can span multiple lines until next parameter or section
    param_pattern = r"- \*\*(\w+)\*\* \((required|optional)(?:, default: ([^)]+))?\): (.+?)(?=\n- \*\*|\n\*\*Constraints|\n##|\Z)"

    for match in re.finditer(param_pattern, parameters_section, re.DOTALL):
        param_name, param_type, default_value, description = match.groups()
        # Clean up description - remove extra whitespace and normalize newlines
        description = re.sub(r'\s+', ' ', description.strip())
        param_info = {
            "name": param_name,
            "description": description,
            "default": default_value.strip() if default_value else None
        }

        if param_type == "required":
            required_params.append(param_info)
        else:
            optional_params.append(param_info)

    instructions = ["## Parameters\n"]

    if required_params or optional_params:
        instructions.append("When you execute this command, I will prompt you for the following parameters:\n")

        if required_params:
            instructions.append("### Required Parameters\n")
            for param in required_params:
                instructions.append(f"- **{param['name']}**: {param['description']}\n")

        if optional_params:
            instructions.append("### Optional Parameters\n")
            for param in optional_params:
                default_text = f" (default: {param['default']})" if param['default'] else ""
                instructions.append(f"- **{param['name']}**: {param['description']}{default_text}\n")

        instructions.append("\n**Note**: Please provide all required parameters when prompted. Optional parameters can be skipped to use their default values.\n")
    else:
        instructions.append("This workflow does not require any parameters. Simply execute the command to begin.\n")

    return "".join(instructions)
