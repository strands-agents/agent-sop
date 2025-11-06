## Agent SOP Distributions

### Overview

The `build_agent_sop_distributions.py` script processes agent sops from the `agent-sops/` directory and distributes them to different target formats using a dataclass-based distribution system.

### Usage

```bash
python build_agent_sops_distributions.py
```

### What it does

#### Source
- Reads all `.md` files from `agent-sops/` directory

#### MCP Distribution
- Creates files in `mcp/sops/` subdirectory
- No content transformation

#### Skills Distribution  
- Creates individual subdirectories under `skills/` named after each sop
- Creates `SKILL.md` file in each subdirectory
- Adds frontmatter with:
  - `name`: SOP filename (without extension)
  - `description`: Content from Overview section (newlines removed)
- **Fails if no Overview section is found**

### Output Structure

```
mcp/
└── sops/
    ├── sop1.md
    └── sop2.md

skills/
├── sop1/
│   └── SKILL.md (with frontmatter)
└── sop2/
    └── SKILL.md (with frontmatter)
```
## Adding New Distributions

Add new `Distribution` instances to the `DISTRIBUTIONS` list with appropriate transform functions.
