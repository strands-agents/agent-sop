import shutil
from pathlib import Path
from hatchling.builders.hooks.plugin.interface import BuildHookInterface

class CustomBuildHook(BuildHookInterface):
    def initialize(self, version, build_data):
        source_dir = Path("../agent-sops")
        target_dir = Path("strands_agents_sops/sops")
        
        # Create target directory if it doesn't exist
        target_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy all .md files from source to target
        if source_dir.exists():
            for md_file in source_dir.glob("*.md"):
                shutil.copy2(md_file, target_dir)
