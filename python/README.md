<div align="center">
  <div>
    <a href="https://strandsagents.com">
      <img src="https://strandsagents.com/latest/assets/logo-github.svg" alt="Strands Agents" width="55px" height="105px">
    </a>
  </div>

  <h1>Strands Agents SOP</h1>
  <h2>Agent Standard Operating Procedures Python Package</h2>

  <p>
    <a href="https://github.com/strands-agents/agent-sop">Agent SOPs GitHub Repository</a>
  </p>
</div>

A comprehensive Python package that provides Agent Standard Operating Procedures (SOPs) as importable strings, structured prompts for AI agents via Model Context Protocol (MCP), and Anthropic Skills generation capabilities.

## 🚀 Quick Start

### Strands Agents SDK Usage

```bash
# Install the package
pip install strands-agents strands-agents-tools strands-agents-sops
```

```python
from strands import Agent
from strands_tools import shell, editor
import strands_agents_sops as sops

# Create an agent with the Prompt-Driven Development SOP
agent = Agent(
    system_prompt=sops.pdd,
    tools=[shell, editor]
)

# Use SOPs with custom input
agent = Agent(
    system_prompt=sops.pdd_with_input("Help me design a REST API"),
    tools=[shell, editor]
)
```

### MCP Server Usage

```bash
# Install and run MCP server
pip install strands-agents-sops

# Start with built-in SOPs only
strands-agents-sops mcp

# Load external SOPs from custom directories (sops in path must have `.sop.md` postfix)
strands-agents-sops mcp --sop-paths ~/my-sops:/path/to/other-sops

# External SOPs override built-in SOPs with same name
strands-agents-sops mcp --sop-paths ~/custom-sops
```

Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "agent-sops": {
      "command": "strands-agents-sops",
      "args": ["mcp", "--sop-paths", "~/my-sops"]
    }
  }
}
```

### Anthropic Skills Generation

```bash
# Generate skills for Claude
strands-agents-sops skills

# Custom output directory
strands-agents-sops skills --output-dir my-skills

# Include external SOPs in skills generation (sops in path must have `.sop.md` postfix)
strands-agents-sops skills --sop-paths ~/my-sops --output-dir ./skills
```

### External SOP Loading

Both MCP and Skills commands support loading custom SOPs:

- **File format**: Only files with `.sop.md` postfix are recognized as SOPs
- **Colon-separated paths**: `~/sops1:/absolute/path:relative/path`
- **Path expansion**: Supports `~` (home directory) and relative paths  
- **First-wins precedence**: External SOPs override built-in SOPs with same name
- **Graceful error handling**: Invalid paths or malformed SOPs are skipped with warnings

```bash
# Create custom SOP
mkdir ~/my-sops
cat > ~/my-sops/custom-workflow.sop.md << 'EOF'
# Custom Workflow
## Overview
My custom workflow for specific tasks.
## Steps
### 1. Custom Step
Do something custom.
EOF

# Use with MCP server
strands-agents-sops mcp --sop-paths ~/my-sops
```

## 🧪 Development & Testing

### Setup Development Environment

```bash
# Navigate to python directory
cd python

# Install development dependencies
pip install hatch
```

### Running Tests

```bash
# Run all tests with coverage
hatch test
```

### Code Formatting & Linting

```bash
# Format code with Ruff
hatch run format

# Check linting issues
hatch run lint

# Auto-fix linting issues
hatch run lint-fix

# Clean build artifacts and cache
hatch run clean
```
