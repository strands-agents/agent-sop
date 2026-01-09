# AGENTS.md - AI Assistant Context for Agent SOP Project

## Project Overview
Agent SOP provides natural language workflows that enable AI agents to perform complex, multi-step tasks with consistency and reliability. This is a Python package that implements the Model Context Protocol (MCP) for AI assistant integration and supports conversion to Anthropic Skills format.

## Directory Structure

```
agent-sop/
├── python/strands_agents_sops/    # Main Python package
│   ├── __main__.py               # CLI entry point (mcp|skills|rule commands)
│   ├── mcp.py                    # MCP server implementation
│   ├── skills.py                 # Anthropic Skills conversion
│   └── utils.py                  # Shared SOP utilities
├── agent-sops/                   # Source SOP definitions
│   ├── codebase-summary.sop.md   # Documentation generation workflow
│   ├── code-assist.sop.md        # TDD implementation workflow
│   ├── code-task-generator.sop.md # Task breakdown workflow
│   └── pdd.sop.md               # Prompt-driven development workflow
├── python/tests/                 # Comprehensive test suite
├── spec/                         # SOP format specification
└── rules/                        # SOP authoring guidelines
```

## Development Patterns

### SOP Format Structure
All SOPs follow this standardized format:
```markdown
# SOP Title

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
- You MUST NOT perform prohibited actions

## Examples
Concrete usage examples showing input and expected outcomes.

## Troubleshooting
Common issues and their solutions.
```

### RFC 2119 Constraint Keywords
- **MUST**: Required actions that cannot be skipped
- **MUST NOT**: Prohibited behaviors, forbidden actions
- **SHOULD**: Recommended practices for optimal results
- **SHOULD NOT**: Not recommended, but not forbidden
- **MAY**: Optional enhancements or alternatives

### Parameter Definition Pattern
```markdown
- **parameter_name** (required|optional, default: value): Description
```

## Core SOPs

1. **codebase-summary**: Analyzes codebases and generates comprehensive documentation
2. **code-assist**: TDD-based implementation with Explore, Plan, Code, Commit workflow
3. **code-task-generator**: Breaks down requirements into manageable tasks
4. **pdd**: Prompt-driven development methodology

## Testing and Quality Assurance

### Running Tests
```bash
# Navigate to python package directory
cd python

# Use hatch to run manages testing environment
hatch test
```

### Code Quality Standards
```bash
# Format code
hatch run format

# Check code quality
hatch run lint

# Auto-fix linting issues
hatch run lint-fix

# Clean build artifacts
hatch run clean
```

## Integration Patterns for AI Assistants

### MCP Integration
```bash
# Start MCP server with built-in SOPs
strands-agents-sops mcp

# Include custom SOPs (sops in path must have `.sop.md` postfix)
strands-agents-sops mcp --sop-paths ~/my-sops:/team/sops
```

**MCP Client Configuration Example:**
```json
{
  "mcpServers": {
    "agent-sops": {
      "command": "strands-agents-sops", 
      "args": ["mcp", "--sop-paths", "~/custom-sops"]
    }
  }
}
```

### Skills Integration
```bash
# Generate Skills format for Claude
strands-agents-sops skills --output-dir ./skills

# Include custom SOPs in Skills generation
strands-agents-sops skills --sop-paths ~/my-sops --output-dir ./skills
```

### Cursor IDE Integration
```bash
# Generate Cursor commands from built-in SOPs (default: .cursor/commands)
strands-agents-sops commands --type cursor

# Specify custom output directory
strands-agents-sops commands --type cursor --output-dir .cursor/commands

# Include custom SOPs in commands generation
strands-agents-sops commands --type cursor --sop-paths ~/my-sops --output-dir .cursor/commands
```

**Usage in Cursor:**
1. Generate commands: Run `strands-agents-sops commands --type cursor` in your project root
2. Execute workflows: In Cursor chat, type `/` followed by the command name (e.g., `/code-assist.sop`)
3. Provide parameters: When prompted, provide the required parameters for the workflow

**Note:** Cursor commands don't support explicit parameters, so the AI will prompt you for required inputs when you execute a command. The generated commands include parameter documentation to guide this interaction.

### Python Integration
```python
from strands import Agent
from strands_tools import editor, shell
from strands_agents_sops import code_assist

# Create agent with SOP as system prompt
agent = Agent(
    system_prompt=code_assist,
    tools=[editor, shell]
)

# Execute SOP
agent("Start code-assist sop")
```

## Build and Distribution Process

### Package Building
- **Build System**: Hatchling with hatch-vcs for git-based versioning
- **Custom Hook**: `copy_agent_sops_hook.py` copies SOPs and rules to package
- **Version Management**: Automatic from git tags (no manual version updates)
- **Distribution**: PyPI as `strands-agents-sops`

### Development Workflow
1. **SOP Changes**: Edit files in `agent-sops/` directory
2. **Python Changes**: Edit files in `python/strands_agents_sops/`
3. **Testing**: Run comprehensive test suite
4. **Build**: Hatchling automatically embeds SOPs during build
5. **Release**: Git tag triggers automated PyPI publishing

### External SOP Development
```bash
# Create custom SOP directory
mkdir ~/my-sops

# Create custom SOP following format specification
cat > ~/my-sops/custom-workflow.sop.md << 'EOF'
# Custom Workflow
## Overview
My custom workflow for specific tasks.
## Parameters
- **task** (required): Description of task
## Steps
### 1. Custom Step
**Constraints:**
- You MUST follow the custom process
EOF

# Test with MCP server
strands-agents-sops mcp --sop-paths ~/my-sops

# Generate Skills including custom SOPs
strands-agents-sops skills --sop-paths ~/my-sops --output-dir ./skills
```

### Adding New SOPs
1. Create `.sop.md` file in `agent-sops/` directory
2. Follow standardized format with Overview, Parameters, Steps
3. Use RFC 2119 constraint keywords in step constraints
4. Include Examples and Troubleshooting sections
5. Build hook automatically copies to package during build

### Testing SOPs
- Test parameter validation and default values
- Verify constraint logic and step execution
- Validate examples work as documented
- Check MCP tool integration

### Build Process
- Uses hatchling with hatch-vcs for version management
- `copy_agent_sops_hook.py` copies SOPs and rules to package
- Automatic version from git tags
- Distributes to PyPI as `strands-agents-sops`

## AI Assistant Instructions

### Using Documentation
- Start with `.sop/summary/index.md` for navigation guidance
- Consult specific documentation files based on query type
- Use cross-references between components, interfaces, and workflows

### SOP Execution Context
- SOPs are designed for progressive disclosure of context
- Parameters support multiple input methods (direct, file, interactive)
- Constraint-based execution ensures reliable behavior
- Error handling includes troubleshooting guidance

### Integration Patterns
- MCP: Expose SOPs as tools for AI assistant integration
- Skills: Convert to Claude-compatible format with frontmatter
- Python: Programmatic access to SOP content and execution
- CLI: Command-line interface for all functionality

## Package Configuration and Metadata

### Key Configuration Files
- **`pyproject.toml`**: Package metadata, dependencies, build configuration
- **`copy_agent_sops_hook.py`**: Build hook for SOP embedding
- **`.github/workflows/`**: CI/CD for automated testing and publishing

### Dependencies
- **Runtime**: MCP >=1.20.0 (only required dependency)
- **Development**: pytest, pytest-cov, ruff
- **Build**: hatchling, hatch-vcs

### Version Management
- **Source**: Git tags via hatch-vcs
- **Format**: Semantic versioning (e.g., 1.2.3)
- **Development**: Automatic .devN suffixes for non-tagged commits
