import shutil
from pathlib import Path

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class CustomBuildHook(BuildHookInterface):
    def initialize(self, version, build_data):
        # Copy SOPs
        sops_source_dir = Path("../agent-sops")
        sops_target_dir = Path("strands_agents_sops/sops")

        sops_target_dir.mkdir(parents=True, exist_ok=True)

        if sops_source_dir.exists():
            for md_file in sops_source_dir.glob("*.md"):
                shutil.copy2(md_file, sops_target_dir)

        # Copy rules
        rules_source_dir = Path("../rules")
        rules_target_dir = Path("strands_agents_sops/rules")

        rules_target_dir.mkdir(parents=True, exist_ok=True)

        if rules_source_dir.exists():
            for md_file in rules_source_dir.glob("*.md"):
                shutil.copy2(md_file, rules_target_dir)
