<div align="center">
  <h1>
    Strands Agents SOPs
  </h1>

  <h2>
    Agent Standard Operating Procedures Python Package
  </h2>

  <div align="center">
    <a href="https://pypi.org/project/strands-agents-sops/"><img alt="PyPI version" src="https://img.shields.io/pypi/v/strands-agents-sops"/></a>
    <a href="https://python.org"><img alt="Python versions" src="https://img.shields.io/pypi/pyversions/strands-agents-sops"/></a>
    <a href="https://github.com/strands-agents/agent-sop/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/strands-agents/agent-sop"/></a>
  </div>
</div>

A Python package and MCP server that provides Agent Standard Operating Procedures (SOPs) as importable strings, structured prompts for AI agents, and Anthropic Skills generation.

## Feature Overview

- **Python Package**: Import SOPs as module attributes for direct use in code
- **MCP Server**: Serve SOPs as structured prompts with user input injection through the Model Context Protocol
- **Anthropic Skills**: Generate SOPs in Anthropic Skills format for Claude integration  

## Strands Agent (Python Package) Quick Start

Ensure you have Python 3.10+ installed, then:

```bash
# Install the package
pip install strands-agents strands-agents-tools strands-agents-sops
```

```python
from strands import Agent
from strands_tools import shell, editor
import strands_agents_sops as sops

# Create an agent with the Prompt-Driven Development SOP, and tools necessary to get started.
agent = Agent(
  system_prompt=sops.pdd,
  tools=[shell, editor]
)

# Use the `_with_input` helper functions to provide sop with initial input
agent = Agent(
  system_prompt=sops.pdd_with_input("rough_idea: Help me design a REST API"),
  tools=[shell, editor]
)
```
## MCP Server Quick Start

Ensure you have Python 3.10+ installed, then:

```bash
# Install the package
pip install strands-agents-sops
```

Add the server to your MCP client configuration:

```json
{
  "mcpServers": {
    "agent-sops": {
      "command": "strands-agents-sops"
    }
  }
}
```

## Anthropic Skills Quick Start

Generate SOPs in Anthropic Skills format:

```bash
# Generate skills in default 'skills' directory
strands-agents-sops skills

# Generate skills in custom directory  
strands-agents-sops skills --output-dir my-skills
```

This creates individual skill directories that can be uploaded to Claude:
```
skills/
├── code-assist/
│   └── SKILL.md
├── codebase-summary/
│   └── SKILL.md
└── ...
```

## Features at a Glance

### Access SOPs as Strings or Prompts

Access SOPs directly as module attributes or via MCP server:

```python
import strands_agents_sops as sops

# Access raw SOP content (hyphens become underscores)
print(sops.code_assist)
print(sops.pdd)
print(sops.codebase_summary)
print(sops.code_task_generator)
```

The MCP server provides the same agent SOPs as prompts via an MCP server, with an optional input prompt field.

### XML-Wrapped SOPs with User Input

Generate structured prompts with custom user input:

```python
# Use _with_input functions for XML-wrapped content
wrapped = sops.pdd_with_input("Help me design a REST API")
print(wrapped)
```

The `_with_input` functions return XML-structured content:

```xml
<agent-sop name="pdd">
<content>
[SOP content here]
</content>
<user-input>
Help me design a REST API
</user-input>
</agent-sop>
```

## Development

### Testing the Package

```bash
pip install build
python -m build
pip install -e .
```

### Testing the MCP Server

```bash
# Test MCP server
npx @modelcontextprotocol/inspector strands-agents-sops

# Test skills generation
strands-agents-sops skills --output-dir test-skills
```

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](../LICENSE) file for details.
