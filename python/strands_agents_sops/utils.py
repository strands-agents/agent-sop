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


def _load_sop_file(sop_file: Path) -> dict[str, str] | None:
    """Load a single SOP file and extract its metadata.

    Args:
        sop_file: Path to a .sop.md file

    Returns:
        SOP dictionary with name, content, description, or None if invalid
    """
    try:
        sop_content = sop_file.read_text(encoding="utf-8")

        overview_match = re.search(
            r"## Overview\s*\n(.*?)(?=\n##|\n#|\Z)", sop_content, re.DOTALL
        )
        if not overview_match:
            logger.warning(f"No Overview section found in {sop_file}")
            return None

        description = overview_match.group(1).strip().replace("\n", " ")
        sop_name = sop_file.stem.removesuffix(".sop")

        return {
            "name": sop_name,
            "content": sop_content,
            "description": description,
        }

    except Exception as e:
        logger.error(f"Error loading SOP from {sop_file}: {e}")
        return None


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

                sop = _load_sop_file(sop_file)
                if sop:
                    external_sops.append(sop)

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
    sops_dir = Path(__file__).parent / "sops"

    if not sops_dir.exists():
        logger.warning(f"Built-in SOPs directory not found: {sops_dir}")
        return sops

    for md_file in sops_dir.glob("*.sop.md"):
        if md_file.is_file():
            sop = _load_sop_file(md_file)
            if sop:
                sops.append(sop)

    return sops


def load_sops(external_sop_paths: str | None = None) -> list[dict[str, Any]]:
    """Load all SOPs from external paths and built-in directory.

    Args:
        external_sop_paths: Optional colon-separated string of external SOP directory paths

    Returns:
        List of SOP dictionaries with name, content, description (external SOPs first)
    """
    external_directories = expand_sop_paths(external_sop_paths) if external_sop_paths else []
    sops = load_external_sops(external_directories) + load_builtin_sops()

    all_sops = []
    seen_names = set()
    for sop in sops:
        if sop["name"] not in seen_names:
            seen_names.add(sop["name"])
            all_sops.append(sop)

    return all_sops
