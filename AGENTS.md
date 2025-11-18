# AGENTS.md - AI Assistant Context for Agent SOP Project

## Project Overview
Agent SOP provides natural language workflows that enable AI agents to perform complex, multi-step tasks with consistency and reliability. This is a Python package that implements the Model Context Protocol (MCP) for AI assistant integration.

## Directory Structure
```
agent-sop/
├── python/strands_agents_sops/    # Main Python package
│   ├── sops/                      # Embedded SOP workflows
│   ├── __main__.py               # CLI entry point
│   ├── mcp.py                    # MCP server implementation
│   └── skills.py                 # Anthropic Skills conversion
├── agent-sops/                   # Core SOP definitions
│   ├── codebase-summary.sop.md   # Documentation generation
│   ├── code-assist.sop.md        # TDD implementation
│   ├── code-task-generator.sop.md # Task breakdown
│   └── pdd.sop.md               # Problem-driven development
├── spec/                         # Format specification
└── rules/                        # SOP authoring rules
```

## Development Patterns

### SOP Format Structure
All SOPs follow this standardized format:
```markdown
# SOP Title
## Overview
## Parameters
- **param_name** (required/optional, default: value): Description
## Steps
### 1. Step Name
**Constraints:**
- You MUST perform required actions
- You SHOULD follow best practices
- You MAY include optional features
## Examples
## Troubleshooting
```

### RFC 2119 Constraint Keywords
- **MUST**: Required actions that cannot be skipped
- **SHOULD**: Recommended practices for optimal results
- **MAY**: Optional enhancements or alternatives
- **MUST NOT**: Prohibited behaviors

### Parameter Definition Pattern
```markdown
- **parameter_name** (required|optional, default: value): Description
```

## Key Components

### Core SOPs
1. **codebase-summary**: Analyzes codebases and generates comprehensive documentation
2. **code-assist**: TDD-based implementation with Explore, Plan, Code, Commit workflow
3. **code-task-generator**: Breaks down requirements into manageable tasks
4. **pdd**: Problem-driven development methodology

### Python Package Structure
- `__main__.py`: CLI with commands: mcp (default), skills, rule
- `mcp.py`: MCP server exposing SOPs as tools
- `skills.py`: Converts SOPs to Anthropic Skills format
- `sops/`: Embedded SOP markdown files
- `rules/`: SOP format specification

## Integration Methods

### MCP Server Usage
```bash
strands-agents-sops  # Starts MCP server
```

### Skills Generation
```bash
strands-agents-sops skills --output-dir ./skills
```

### Format Rules
```bash
strands-agents-sops rule  # Outputs SOP format specification
```

## Development Guidelines

### Running Tests

```bash
# Navigate to python package directory
cd python

# Activate virtual environment (if available)
source venv/bin/activate

# Run all tests with verbose output
python -m pytest tests/ -v
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
