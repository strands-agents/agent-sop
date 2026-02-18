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
- **Parameterized inputs** for flexible reuse across different contexts
- **Step-by-step instructions** with RFC 2119 constraints (MUST, SHOULD, MAY)
- **Examples and troubleshooting** for reliable execution
- **Multi-modal distribution** (MCP tools, Anthropic Skills, Python modules)

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
| **[pdd](agent-sops/pdd.sop.md)** | Prompt-driven development methodology | Complex problem solving, architectural decisions, system design |
| **[code-task-generator](agent-sops/code-task-generator.sop.md)** | Intelligent task breakdown and planning from requirements | Project planning, sprint preparation, requirement analysis |
| **[code-assist](agent-sops/code-assist.sop.md)** | TDD-based code implementation with structured workflow | Feature development, bug fixes, refactoring |
| **[eval](agent-sops/eval.sop.md)** | Automated evaluation workflow for AI agents using [Strands Evals SDK](https://github.com/strands-agents/evals) | Evaluation planning, test data generation, evaluation execution, and result analysis ([usage guide](https://strandsagents.com/latest/documentation/docs/user-guide/evals-sdk/eval-sop/)) |

## Directory Structure

The Prompt-Driven Development (PDD) family of SOPs (`codebase-summary`, `pdd`, `code-task-generator`, `code-assist`) write their artifacts to a `.agents/` directory with this default organizational structure:

```
.agents/
├── summary/               # codebase-summary output (always commit)
│   └── *.md
├── planning/              # pdd output (often worth committing)
│   └── {project_name}/
│       ├── rough-idea.md
│       ├── idea-honing.md
│       ├── research/
│       ├── design/
│       └── implementation/
├── tasks/                 # code-task-generator output (optionally commit)
│   └── {project_name}/
│       └── step01/
│           └── task-*.code-task.md
└── scratchpad/            # code-assist working files (add to .gitignore)
    └── {project_name}/
        └── {task_name}/
```

**Why this structure?**

The hierarchy is organized by what you're likely to want to commit:

1. **`summary/`** - Documentation from `codebase-summary`. Useful for both humans and agents. Recommend always committing.
2. **`planning/`** - Design docs from `pdd`. Captures decisions, alternatives considered, and rationale that tend to be lost in traditional software development. Often worth committing.
3. **`tasks/`** - Code tasks from `code-task-generator`. May be committed or tracked in an issue tracker instead.
4. **`scratchpad/`** - Working notes from `code-assist`. Transient implementation artifacts. Add to `.gitignore`.

**Note:** When project names are auto-generated, they are prefixed with the current date (YYYY-MM-DD) for easy identification and sorting (e.g., `2026-01-30-auth-system`).

This separation also enables you to focus your AI tools' context on useful reference docs. For example, in Kiro CLI, you can "pin" relevant files in the planning folder while implementing a project:
```
/context add .agents/planning/{project_name}/**/*.md
```

## Quick Start

Install the `strands-agents-sops` package:

```bash
# Using Homebrew
brew install strands-agents-sops

# Or using pip
pip install strands-agents-sops
```

### Using with Strands Agents

Install strands agents and the sops package:

```bash
brew install strands-agents-sops
pip install strands-agents strands-agents-tools
```

> **Note:** See [Quick Start](#quick-start) above for pip installation of `strands-agents-sops`.

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

The MCP (Model Context Protocol) server exposes SOPs as prompts that AI assistants can discover and use on-demand:

```bash
# Install the package (see Quick Start for pip alternative)
brew install strands-agents-sops

# Start MCP server with built-in SOPs only
strands-agents-sops mcp

# Load external SOPs from custom directories (sops in path must have `.sop.md` postfix)
strands-agents-sops mcp --sop-paths ~/my-sops:/path/to/other-sops

# External SOPs override built-in SOPs with same name
strands-agents-sops mcp --sop-paths ~/custom-sops  # Your custom code-assist.sop.md overrides built-in
```

#### Using SOPs in Different AI Tools

The syntax for invoking MCP prompts varies between AI tools:

**Kiro:**
```
@codebase-summary
```

**Claude Code:**
```
/strands-agents-sops:codebase-summary
```



#### External SOP Loading

The `--sop-paths` argument allows you to extend the MCP server with your own SOPs:

- **File format**: Only files with `.sop.md` postfix are recognized as SOPs
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

## Cursor IDE Integration

Agent SOPs can be converted to Cursor commands, allowing you to execute workflows directly within Cursor IDE using the `/` command prefix.

### Understanding Cursor Rules vs Commands

- **Rules** (`.cursor/rules`): Provide persistent, system-level guidance that's automatically applied. Rules are static and don't support parameters.
- **Commands** (`.cursor/commands`): Reusable workflows triggered with `/` prefix. Commands can prompt users for input, making them ideal for parameterized SOPs.

Since Agent SOPs are parameterized workflows that need user input, they're best implemented as **Commands** rather than Rules.

### Converting SOPs to Cursor Commands

Each Agent SOP can be automatically converted to Cursor command format:

```bash
# Generate Cursor commands from built-in SOPs (default output: .cursor/commands)
strands-agents-sops commands --type cursor

# Or specify custom output directory
strands-agents-sops commands --type cursor --output-dir .cursor/commands

# Load external SOPs from custom directories
strands-agents-sops commands --type cursor --sop-paths ~/my-sops:/path/to/other-sops

# External SOPs override built-in SOPs with same name
strands-agents-sops commands --type cursor --sop-paths ~/custom-sops --output-dir .cursor/commands
```

#### External SOP Loading

The `--sop-paths` argument allows you to extend commands generation with your own SOPs:

- **File format**: Only files with `.sop.md` postfix are recognized as SOPs
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
## Parameters
- **task** (required): Description of task
## Steps
### 1. Custom Step
Do something custom.
EOF

# Generate Cursor commands with your custom SOPs
strands-agents-sops commands --type cursor --sop-paths ~/my-sops
```

This creates command files in `.cursor/commands/`:
```
.cursor/commands/
├── code-assist.sop.md
├── codebase-summary.sop.md
├── code-task-generator.sop.md
├── pdd.sop.md
└── custom-workflow.sop.md
```

### Using Commands in Cursor

1. **Generate commands**: Run `strands-agents-sops commands --type cursor` in your project root
2. **Execute workflows**: In Cursor chat, type `/` followed by the command name (e.g., `/code-assist.sop`)
3. **Provide parameters**: When prompted, provide the required parameters for the workflow

**Example:**
```
You: /code-assist.sop

AI: I'll help you implement code using the code-assist workflow. 
    Please provide the following required parameters:
    - task_description: [description of the task]
    - mode (optional, default: "auto"): "interactive" or "auto"
    
You: task_description: "Create a user authentication system"
     mode: "interactive"
```

### Command Format

Each generated command includes:
- Clear usage instructions
- Parameter documentation (required and optional)
- Full SOP content for execution

The commands handle parameters by prompting users when executed, since Cursor doesn't support explicit parameter passing. The SOP's "Constraints for parameter acquisition" section guides this interaction.

### Parameter Handling

Since Cursor commands don't support explicit parameters, the generated commands include instructions to prompt users for required inputs. The AI assistant will:
1. Read the command file when you type `/command-name`
2. Identify required and optional parameters from the SOP
3. Prompt you for all required parameters upfront
4. Execute the workflow with the provided parameters

This approach maintains the parameterized nature of SOPs while working within Cursor's command system.

---

## Anthropic Skills Integration

Agent SOPs are fully compatible with Claude's [Skills system](https://support.claude.com/en/articles/12512176-what-are-skills), allowing you to teach Claude specialized workflows that can be reused across conversations and projects.

### How SOPs Work as Skills

The key value of using SOPs as Skills is **progressive disclosure of context**. Instead of loading all workflow instructions into Claude's context upfront, you can provide many SOP skills to Claude, and Claude will intelligently decide which ones to load and execute based on the task at hand.

This approach offers several advantages:

- **Context Efficiency**: Only relevant workflow instructions are loaded when needed
- **Scalable Expertise**: Provide dozens of specialized workflows without overwhelming the context
- **Intelligent Selection**: Claude automatically chooses the most appropriate SOP for each task
- **Dynamic Loading**: Complex workflows are only activated when Claude determines they're useful

For example, you might provide Claude with all Agent SOPs as skills. When asked to "implement user authentication," Claude would automatically select and load the `code-assist` skill. When asked to "document this codebase," it would choose the `codebase-summary` skill instead.

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

- **File format**: Only files with `.sop.md` postfix are recognized as SOPs
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

**Install via marketplace (recommended)**

```bash
# Add the marketplace
claude plugin marketplace add strands-agents/agent-sop

# Install all agent SOPs
claude plugin install agent-sops@agent-sop

# Skills available as /code-assist, /pdd, /codebase-summary, /code-task-generator, /eval
```

The skills are automatically generated and published to the `skills-dist` branch on each GitHub Release (and can be republished manually via workflow dispatch).

**For Development:**

If you want to use local skills for development or testing:

```bash
# Clone the repo
git clone https://github.com/strands-agents/agent-sop

# Generate local skills
cd agent-sop
pip install strands-agents-sops
strands-agents-sops skills --output-dir ./skills

# Run Claude Code with the plugin
claude --plugin-dir ./agent-sop
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

## What Are Agent SOPs?

Agent SOPs use a standardized markdown format with key features that enable repeatable and understandable behavior from AI agents:

1. **Structured steps with [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) constraints** - Each workflow step uses [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) keywords like MUST, SHOULD, and MAY to provide precise control over agent behavior without rigid scripting, ensuring reliable execution while preserving the agent's reasoning ability.
2. **Parameterized inputs** - Rather than hardcoding specific values, SOPs accept parameters that customize behavior for different projects, teams, or requirements. This transforms single-use prompts into flexible templates that can be applied broadly while maintaining consistency.
3. **Easy authoring through AI assistance** - Teams can create new SOPs in minutes. Coding agents can read the SOP format specification and generate new workflows based on natural language descriptions, making the creation process accessible to anyone regardless of prompt engineering expertise.
4. **Progress tracking and resumability** - Agent SOPs can instruct agents to document their progress as they work, making it easy to understand what's happening and resume if something breaks. This transparency was crucial for debugging prompts and building developer trust in AI automation.


## Creating Agent SOPs

### Authoring with AI Agents

Agent SOPs can be authored in minutes using your favorite AI agent and the standard formatting rule. You can either copy the rule directly from this repo or use `strands-agents-sops rule`:

```bash
# Output the Agent SOP format rule
strands-agents-sops rule
```

The rule can be used in various AI coding agents:

1. **Kiro** - Copy into your home directory or project as `.kiro/steering/agent-sop-format.md`.
2. **Amazon Q Developer** - Copy into your project as `.amazonq/rules/agent-sop-format.md`.
3. **Claude Code** - Instruct Claude Code to read the rule file.
4. **Cursor** - Copy into your project as `.cursor/rules/agent-sop-format.mdc` (Note the `.mdc` file extension).
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

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.
