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
strands-agents-sops  # Starts MCP server
```

Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "agent-sops": {
      "command": "strands-agents-sops"
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
```
