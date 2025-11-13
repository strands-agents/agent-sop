<div align="center">
  <div>
    <a href="https://strandsagents.com">
      <img src="https://strandsagents.com/latest/assets/logo-github.svg" alt="Strands Agents" width="55px" height="105px">
    </a>
  </div>

  <h1>Agent SOPs</h1>
  <h2>Natural language workflows that enable AI agents to perform complex, multi-step tasks with consistency and reliability.</h2>

  <div align="center">
    <a href="https://github.com/strands-agents/agent-sop/graphs/commit-activity"><img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/m/strands-agents/agent-sop"/></a>
    <a href="https://github.com/strands-agents/agent-sop/issues"><img alt="GitHub open issues" src="https://img.shields.io/github/issues/strands-agents/agent-sop"/></a>
    <a href="https://github.com/strands-agents/agent-sop/pulls"><img alt="GitHub open pull requests" src="https://img.shields.io/github/issues-pr/strands-agents/agent-sop"/></a>
    <a href="https://github.com/strands-agents/agent-sop/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/strands-agents/agent-sop"/></a>
  </div>
  
  <p>
    <a href="https://strandsagents.com/">Documentation</a>
    ◆ <a href="https://github.com/strands-agents/sdk-python">Python SDK</a>
    ◆ <a href="https://github.com/strands-agents/tools">Tools</a>
    ◆ <a href="https://github.com/strands-agents/samples">Samples</a>
    ◆ <a href="https://github.com/strands-agents/mcp-server">MCP Server</a>
    ◆ <a href="https://github.com/strands-agents/agent-builder">Agent Builder</a>
  </p>
</div>

# Agent SOPs

Agent SOPs (Standard Operating Procedures) are markdown-based instruction sets that guide AI agents through sophisticated workflows using natural language, parameterized inputs, and constraint-based execution. They transform complex processes into reusable, shareable workflows that work across different AI systems and teams.

*Lovingly nicknamed "Strands Operating Procedures" by the team.*

## What are Agent SOPs?

Agent SOPs use a standardized format to define:
- **Clear objectives** with detailed overviews
- **Parameterized inputs** for flexible reuse
- **Step-by-step instructions** with RFC 2119 constraints (MUST, SHOULD, MAY)
- **Examples and troubleshooting** for reliable execution

### Example SOP Structure

```markdown
# Code Assist

## Overview
This SOP guides the implementation of code tasks using test-driven development 
principles, following a structured Explore, Plan, Code, Commit workflow.

## Parameters
- **task_description** (required): Description of the task to be implemented
- **mode** (optional, default: "interactive"): "interactive" or "fsc" (Full Self-Coding)

## Steps
### 1. Setup
Initialize the project environment and create necessary directory structures.

**Constraints:**
- You MUST validate and create the documentation directory structure
- You MUST discover existing instruction files using find commands
- You MUST NOT proceed if directory creation fails

### 2. Explore Phase
[Additional steps with specific constraints...]
```

## Available SOPs

| SOP | Purpose | Use Cases |
|-----|---------|-----------|
| **[code-assist](agent-sops/code-assist.sop.md)** | TDD-based code implementation with structured workflow | Feature development, bug fixes, refactoring |
| **[codebase-summary](agent-sops/codebase-summary.sop.md)** | Comprehensive codebase analysis and documentation generation | Project onboarding, documentation creation, system understanding |
| **[code-task-generator](agent-sops/code-task-generator.sop.md)** | Intelligent task breakdown and planning from requirements | Project planning, sprint preparation, requirement analysis |
| **[pdd](agent-sops/pdd.sop.md)** | Problem-driven development methodology | Complex problem solving, architectural decisions, system design |
| **[sop-generator](agent-sops/sop-generator.sop.md)** | Automated creation of new Agent SOPs | Workflow standardization, process documentation, SOP development |

## Quick Start

### Using with Strands Agents

```python
from strands import Agent
import strands_agents_sops

# Create agent with SOP capability
agent = Agent()

# Use a specific SOP
sop_content = strands_agents_sops.code_assist_with_input(
    "Implement user authentication system"
)

response = agent(sop_content)
```

### Using as MCP Server

```bash
# Install the package
pip install strands-agents-sops

# Start MCP server (default)
strands-agents-sops
# or explicitly
strands-agents-sops mcp

# Generate Anthropic skills
strands-agents-sops skills
# or with custom output directory
strands-agents-sops skills --output-dir my-skills
```

Then connect your MCP-compatible AI assistant to access SOPs as tools:

```python
# Each SOP becomes an available tool
tools = mcp_client.list_tools()
# Returns: code_assist, codebase_summary, code_task_generator, pdd, sop_generator

# Execute a SOP
result = mcp_client.call_tool("code_assist", {
    "user_input": "Create a REST API for user management"
})
```

---

## Anthropic Skills Integration

Agent SOPs are fully compatible with Claude's [Skills system](https://support.claude.com/en/articles/12512176-what-are-skills), allowing you to teach Claude specialized workflows that can be reused across conversations and projects.

### How SOPs Work as Skills

The key value of using SOPs as Skills is **progressive disclosure of context**. Instead of loading all workflow instructions into Claude's context upfront, you can provide many SOP skills to an agent, and Claude will intelligently decide which ones to load and execute based on the task at hand.

This approach offers several advantages:

- **Context Efficiency**: Only relevant workflow instructions are loaded when needed
- **Scalable Expertise**: Provide dozens of specialized workflows without overwhelming the context
- **Intelligent Selection**: Claude automatically chooses the most appropriate SOP for each task
- **Dynamic Loading**: Complex workflows are only activated when Claude determines they're useful

For example, you might provide Claude with all five Agent SOPs as skills. When asked to "implement user authentication," Claude would automatically select and load the `code-assist` skill. When asked to "document this codebase," it would choose the `codebase-summary` skill instead.

### Converting SOPs to Skills

Each Agent SOP can be automatically converted to Anthropic's Skills format:

```bash
# Generate Skills format from SOPs
strands-agents-sops skills

# Or specify custom output directory
strands-agents-sops skills --output-dir my-skills
```

This creates individual skill directories:
```
skills/
├── code-assist/
│   └── SKILL.md
├── codebase-summary/
│   └── SKILL.md
├── code-task-generator/
│   └── SKILL.md
├── pdd/
│   └── SKILL.md
└── sop-generator/
    └── SKILL.md
```

### Using Skills in Claude

#### Claude.ai
1. Navigate to your Claude.ai account
2. Go to Skills settings
3. Upload the generated `SKILL.md` files
4. Reference skills in conversations: "Use the code-assist skill to implement user authentication"

#### Claude API
```python
# Upload skill via API
skill_content = open('skills/code-assist/SKILL.md').read()
skill = client.skills.create(
    name="code-assist",
    content=skill_content
)

# Use skill in conversation
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    skills=[skill.id],
    messages=[{
        "role": "user", 
        "content": "Use the code-assist skill to implement a user authentication system"
    }]
)
```

#### Claude Code
Install skills as plugins in Claude Code:

```bash
# Add this repository as a marketplace
/plugin marketplace add strands-agents/agent-sop

# Install skills
/plugin install example-skills@agent-sop
```

### Skill Format

Each generated skill includes proper frontmatter and instructions:

```markdown
---
name: code-assist
description: TDD-based code implementation with structured Explore, Plan, Code, Commit workflow
---

# Code Assist

This skill guides the implementation of code tasks using test-driven development 
principles, following a structured workflow that balances automation with user 
collaboration while adhering to existing package patterns.

[Full SOP instructions follow...]
```

---

## How Agent SOPs Work

### 1. Structured Format
SOPs use a standardized markdown format with:
- **Overview**: Clear purpose and context
- **Parameters**: Typed inputs with defaults and constraints
- **Steps**: Numbered workflow phases with specific requirements
- **Constraints**: RFC 2119 keywords (MUST, SHOULD, MAY) for precise behavior

### 2. Constraint-Based Execution
Each step includes explicit constraints that define:
- Required actions (MUST)
- Recommended practices (SHOULD) 
- Optional enhancements (MAY)
- Prohibited behaviors (MUST NOT)

### 3. Parameterized Workflows
SOPs accept inputs to customize execution:
- **Required parameters**: Essential inputs for the workflow
- **Optional parameters**: Customization options with sensible defaults
- **Multiple input methods**: Direct text, file paths, URLs, or interactive prompts

### 4. Multi-Modal Distribution
Single SOP source files can be distributed to multiple formats:
- **MCP Tools**: For AI assistant integration
- **Anthropic Skills**: For Claude.ai and Skills API
- **Python Modules**: For programmatic access
- **Documentation**: For human reference

## Creating Agent SOPs

### Basic Structure

```markdown
# SOP Name

## Overview
Brief description of what this SOP accomplishes and when to use it.

## Parameters
- **required_param** (required): Description of required input
- **optional_param** (optional, default: value): Description with default

## Steps
### 1. Step Name
Description of what this step accomplishes.

**Constraints:**
- You MUST perform required actions
- You SHOULD follow recommended practices
- You MAY include optional enhancements

## Examples
Concrete usage examples showing input and expected outcomes.

## Troubleshooting
Common issues and their solutions.
```

### Best Practices

1. **Clear Objectives**: Start with a comprehensive Overview section
2. **Explicit Constraints**: Use RFC 2119 keywords for precise behavior
3. **Parameterization**: Make SOPs reusable with well-defined inputs
4. **Error Handling**: Include troubleshooting for common failure modes
5. **Examples**: Provide concrete usage demonstrations

## Integration Patterns

### Strands Agents Integration
```python
# Direct SOP content access
content = strands_agents_sops.code_assist

# Formatted SOP with user input
formatted = strands_agents_sops.codebase_summary_with_input(
    "Analyze the authentication module"
)

agent = Agent()
result = agent(formatted)
```

### MCP Server Integration
```bash
# Start MCP server (default behavior)
strands-agents-sops
# or explicitly
strands-agents-sops server

# Available as MCP tools:
# - code_assist
# - codebase_summary  
# - code_task_generator
# - pdd
# - sop_generator
```

### Anthropic Skills Generation
```bash
# Generate skills in default 'skills' directory
strands-agents-sops skills

# Generate skills in custom directory
strands-agents-sops skills --output-dir my-custom-skills
```

## Documentation

- **[Specification](spec/agent-sops-specification.md)**: Complete format specification
- **[Format Rules](rules/agent-sop-format.md)**: Validation and compliance rules
- **[Examples](agent-sops/)**: All available SOPs with full implementations

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.