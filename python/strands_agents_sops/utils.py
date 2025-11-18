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
