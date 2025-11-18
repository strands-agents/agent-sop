<div align="center">
  <div>
    <a href="https://strandsagents.com">
      <img src="https://strandsagents.com/latest/assets/logo-github.svg" alt="Strands Agents" width="55px" height="105px">
    </a>
  </div>

  <h1>Agent SOP</h1>
  <h2>Natural language workflows that enable AI agents to perform complex, multi-step tasks with consistency and reliability.</h2>

  <div align="center">
    <a href="https://pypi.org/project/strands-agents-sops/"><img alt="PyPI" src="https://img.shields.io/pypi/v/strands-agents-sops"/></a>
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
| **[codebase-summary](agent-sops/codebase-summary.sop.md)** | Comprehensive codebase analysis and documentation generation | Project onboarding, documentation creation, system understanding |
| **[pdd](agent-sops/pdd.sop.md)** | Problem-driven development methodology | Complex problem solving, architectural decisions, system design |
| **[code-task-generator](agent-sops/code-task-generator.sop.md)** | Intelligent task breakdown and planning from requirements | Project planning, sprint preparation, requirement analysis |
| **[code-assist](agent-sops/code-assist.sop.md)** | TDD-based code implementation with structured workflow | Feature development, bug fixes, refactoring |

## Quick Start

Install the `strands-agents-sops` package:

```bash
pip install strands-agents-sops
```

### Using with Strands Agents

Install strands agents and the sops package:

```bash
pip install strands-agents strands-agents-tools strands-agents-sops
```

Create a simple cli coding agent:

```python
from strands import Agent
from strands_tools import editor, shell
from strands_agents_sops import code_assist

agent = Agent(
  system_prompt=code_assist,
  tools=[editor, shell]
)

agent("Start code-assist sop")

while(True):
  agent(input("\nInput: "))
```

### Using as MCP Server

```bash
# Install the package
pip install strands-agents-sops

# Start MCP server with built-in SOPs only
strands-agents-sops mcp

# Load external SOPs from custom directories
strands-agents-sops mcp --sop-paths ~/my-sops:/path/to/other-sops

# External SOPs override built-in SOPs with same name
strands-agents-sops mcp --sop-paths ~/custom-sops  # Your custom code-assist.sop.md overrides built-in
```

#### External SOP Loading

The `--sop-paths` argument allows you to extend the MCP server with your own SOPs:

- **Colon-separated paths**: `~/sops1:/absolute/path:relative/path`
- **Path expansion**: Supports `~` (home directory) and relative paths
- **First-wins precedence**: External SOPs override built-in SOPs with same name
- **Graceful error handling**: Invalid paths or malformed SOPs are skipped with warnings

**Example workflow:**
```bash
# Create your custom SOP
mkdir ~/my-sops
cat > ~/my-sops/custom-workflow.sop.md << 'EOF'
# Custom Workflow
## Overview
My custom workflow for specific tasks.
## Steps
### 1. Custom Step
Do something custom.
EOF

# Start MCP server with your custom SOPs
strands-agents-sops mcp --sop-paths ~/my-sops
```

Then connect your MCP-compatible AI assistant to access SOPs as tools. Here is an example mcp server configuration:

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
# Generate Skills format from built-in SOPs only
strands-agents-sops skills

# Or specify custom output directory
strands-agents-sops skills --output-dir my-skills

# Load external SOPs from custom directories
strands-agents-sops skills --sop-paths ~/my-sops:/path/to/other-sops

# External SOPs override built-in SOPs with same name
strands-agents-sops skills --sop-paths ~/custom-sops --output-dir ./skills
```

#### External SOP Loading

The `--sop-paths` argument allows you to extend skills generation with your own SOPs:

- **Colon-separated paths**: `~/sops1:/absolute/path:relative/path`
- **Path expansion**: Supports `~` (home directory) and relative paths
- **First-wins precedence**: External SOPs override built-in SOPs with same name
- **Graceful error handling**: Invalid paths or malformed SOPs are skipped with warnings

**Example workflow:**
```bash
# Create your custom SOP
mkdir ~/my-sops
cat > ~/my-sops/custom-workflow.sop.md << 'EOF'
# Custom Workflow
## Overview
My custom workflow for specific tasks.
## Steps
### 1. Custom Step
Do something custom.
EOF

# Generate skills with your custom SOPs
strands-agents-sops skills --sop-paths ~/my-sops --output-dir ./skills
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
└── pdd/
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
- **MCP Prompts**: For AI assistant integration
- **Anthropic Skills**: For Claude.ai and Skills API
- **Python Modules**: For programmatic access
- **Documentation**: For human reference

## Creating Agent SOPs

### Authoring with AI Agents

Agent SOPs can be authored in minutes using your favorite AI agent and the standard formatting rule. You can either copy the rule directly from this repo or use `strands-agents-sops rule`:

```bash
# Output the Agent SOP format rule
strands-agents-sops rule
```

The rule can be used in various AI coding agents:

1. **Kiro IDE** - Copy into your project as `.kiro/steering/agent-sop-format.md`.
1. **Kiro CLI** - Pin the rule file via the `/context` command or instruct Kiro CLI to read the rule file.
2. **Amazon Q Developer** - Copy into your project as `.amazonq/rules/agent-sop-format.md`.
3. **Claude Code** - Instruct Claude Code to read the rule file.
4. **Cursor** - Copy into your project as `.cursor/rules/agent-sop-format.mdc` folder (Note the `.mdc` file extension).
5. **Cline** - Copy into your project as `.clinerules/agent-sop-format.md`.

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

## Documentation

- **[Specification](spec/agent-sops-specification.md)**: Complete format specification
- **[Format Rules](rules/agent-sop-format.md)**: Agent context for writing your own rules
- **[Examples](agent-sops/)**: All available SOPs with full implementations

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.