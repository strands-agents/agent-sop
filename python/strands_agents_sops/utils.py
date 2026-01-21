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
