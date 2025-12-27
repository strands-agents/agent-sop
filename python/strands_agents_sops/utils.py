import logging
import re
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def expand_sop_paths(sop_paths_str: str) -> list[Path]:
    """Expand and validate SOP directory paths.

    Args:
        sop_paths_str: Colon-separated string of directory paths

    Returns:
        List of expanded Path objects
    """
    if not sop_paths_str:
        return []

    paths = []
    for path_str in sop_paths_str.split(":"):
        path_str = path_str.strip()
        if not path_str:
            continue

        # Expand tilde and resolve to absolute path
        path = Path(path_str).expanduser().resolve()
        paths.append(path)

    return paths


def load_external_sops(sop_directories: list[Path]) -> list[dict[str, Any]]:
    """Load SOPs from external directories.

    Args:
        sop_directories: List of directory paths to search for SOPs

    Returns:
        List of SOP dictionaries with name, content, and description
    """
    external_sops = []

    for directory in sop_directories:
        if not directory.exists():
            logger.warning(f"SOP directory does not exist: {directory}")
            continue

        if not directory.is_dir():
            logger.warning(f"SOP path is not a directory: {directory}")
            continue

        try:
            for sop_file in directory.glob("*.sop.md"):
                if not sop_file.is_file():
                    continue

                try:
                    sop_content = sop_file.read_text(encoding="utf-8")

                    # Extract overview section for description
                    overview_match = re.search(
                        r"## Overview\s*\n(.*?)(?=\n##|\n#|\Z)", sop_content, re.DOTALL
                    )
                    if not overview_match:
                        logger.warning(f"No Overview section found in {sop_file}")
                        continue

                    description = overview_match.group(1).strip().replace("\n", " ")
                    sop_name = sop_file.stem.removesuffix(".sop")

                    external_sops.append(
                        {
                            "name": sop_name,
                            "content": sop_content,
                            "description": description,
                        }
                    )

                except Exception as e:
                    logger.error(f"Error loading SOP from {sop_file}: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error scanning directory {directory}: {e}")
            continue

    return external_sops


def parse_sop_parameters(content: str) -> list[dict[str, Any]]:
    """Parse parameters section from SOP content.

    Args:
        content: SOP markdown content

    Returns:
        List of parameter dictionaries with name, required, default, description
    """
    parameters = []

    # Find Parameters section
    params_match = re.search(
        r"## Parameters\s*\n(.*?)(?=\n##|\n#|\Z)", content, re.DOTALL
    )
    if not params_match:
        return parameters

    params_text = params_match.group(1)

    # Parse parameter lines: - **param_name** (required|optional, default: value): description
    param_pattern = r"- \*\*([^*]+)\*\* \(([^)]+)\): (.+)"

    for match in re.finditer(param_pattern, params_text):
        param_name = match.group(1).strip()
        param_info = match.group(2).strip()
        description = match.group(3).strip()

        # Parse required/optional and default value
        required = "required" in param_info.lower()
        default_value = None

        # Extract default value if present
        default_match = re.search(r"default:\s*([^,)]+)", param_info)
        if default_match:
            default_value = default_match.group(1).strip()

        parameters.append(
            {
                "name": param_name,
                "required": required,
                "default": default_value,
                "description": description,
            }
        )

    return parameters


def parse_sop_examples(content: str) -> str | None:
    """Parse examples section from SOP content.

    Args:
        content: SOP markdown content

    Returns:
        Examples section content or None if not found
    """
    examples_match = re.search(
        r"## Examples\s*\n(.*?)(?=\n##|\n#|\Z)", content, re.DOTALL
    )
    return examples_match.group(1).strip() if examples_match else None


def parse_sop_troubleshooting(content: str) -> str | None:
    """Parse troubleshooting section from SOP content.

    Args:
        content: SOP markdown content

    Returns:
        Troubleshooting section content or None if not found
    """
    troubleshooting_match = re.search(
        r"## Troubleshooting\s*\n(.*?)(?=\n##|\n#|\Z)", content, re.DOTALL
    )
    return troubleshooting_match.group(1).strip() if troubleshooting_match else None


def load_builtin_sops() -> list[dict[str, str]]:
    """Load all built-in SOPs from the sops directory.

    Returns:
        List of SOP dictionaries with name, content, description
    """
    sops = []
    # Use __file__ to find the sops directory relative to this utils.py file
    sops_dir = Path(__file__).parent / "sops"

    if not sops_dir.exists():
        logger.warning(f"Built-in SOPs directory not found: {sops_dir}")
        return sops

    for md_file in sops_dir.glob("*.sop.md"):
        if md_file.is_file():
            try:
                sop_name = md_file.stem.removesuffix(".sop")
                sop_content = md_file.read_text(encoding="utf-8")

                # Extract overview section for description
                overview_match = re.search(
                    r"## Overview\s*\n(.*?)(?=\n##|\n#|\Z)", sop_content, re.DOTALL
                )
                if not overview_match:
                    logger.warning(f"No Overview section found in {md_file}")
                    continue

                description = overview_match.group(1).strip().replace("\n", " ")

                sops.append(
                    {
                        "name": sop_name,
                        "content": sop_content,
                        "description": description,
                    }
                )

            except Exception as e:
                logger.error(f"Error loading built-in SOP from {md_file}: {e}")
                continue

    return sops


def get_all_sops(sop_paths: str | None = None) -> list[dict[str, Any]]:
    """Load all SOPs from external paths and built-in directory.

    Args:
        sop_paths: Optional colon-separated string of external SOP directory paths

    Returns:
        List of SOP dictionaries with name, content, description (external SOPs first)
    """
    all_sops = []
    seen_names = set()

    # Load external SOPs first (higher precedence)
    if sop_paths:
        external_directories = expand_sop_paths(sop_paths)
        external_sops = load_external_sops(external_directories)

        for sop in external_sops:
            if sop["name"] not in seen_names:
                seen_names.add(sop["name"])
                all_sops.append(sop)

    # Load built-in SOPs
    builtin_sops = load_builtin_sops()
    for sop in builtin_sops:
        if sop["name"] not in seen_names:
            seen_names.add(sop["name"])
            all_sops.append(sop)

    return all_sops


def create_sop_metadata(name: str, content: str) -> dict[str, Any]:
    """Create comprehensive metadata for a SOP.

    Args:
        name: SOP name
        content: SOP markdown content

    Returns:
        Dictionary with SOP metadata including parameters, examples, etc.
    """
    # Extract overview for description
    overview_match = re.search(
        r"## Overview\s*\n(.*?)(?=\n##|\n#|\Z)", content, re.DOTALL
    )
    description = ""
    if overview_match:
        description = overview_match.group(1).strip().replace("\n", " ")

    # Parse all sections
    parameters = parse_sop_parameters(content)
    examples = parse_sop_examples(content)
    troubleshooting = parse_sop_troubleshooting(content)

    metadata = {
        "name": name,
        "description": description,
        "parameters": parameters,
    }

    # Add optional sections if they exist
    if examples:
        metadata["examples"] = examples
    if troubleshooting:
        metadata["troubleshooting"] = troubleshooting

    return metadata
