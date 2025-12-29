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

# Load external SOPs from S3
strands-agents-sops mcp --sop-source type=s3,bucket=my-sop-bucket,prefix=sops/

# Load from S3 with custom region and profile
strands-agents-sops mcp --sop-source type=s3,bucket=my-sop-bucket,region=us-west-2,profile=production

# Load from custom directories (sops in path must have `.sop.md` postfix)
strands-agents-sops mcp --sop-paths ~/my-sops:/path/to/other-sops

# Mix S3 and local sources (first-wins precedence)
strands-agents-sops mcp \
  --sop-source type=s3,bucket=prod-sops,prefix=workflows/ \
  --sop-source type=s3,bucket=team-sops \
  --sop-paths ~/local-sops
```

Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "agent-sops": {
      "command": "strands-agents-sops",
      "args": [
        "mcp", 
        "--sop-source", "type=s3,bucket=my-sop-bucket,prefix=sops/",
        "--sop-paths", "~/my-sops"
      ]
    }
  }
}
```

### Anthropic Skills Generation

```bash
# Generate skills for Claude
strands-agents-sops skills

# Include S3 SOPs in skills generation
strands-agents-sops skills --sop-source type=s3,bucket=my-sop-bucket,prefix=sops/

# Custom output directory
strands-agents-sops skills --output-dir my-skills

# Mix S3 and local sources for skills generation
strands-agents-sops skills \
  --sop-source type=s3,bucket=prod-sops,prefix=workflows/ \
  --sop-paths ~/my-sops \
  --output-dir ./skills
```

### External SOP Sources

Both MCP and Skills commands support loading SOPs from multiple sources with first-wins precedence:

#### Source Types
- **S3**: `--sop-source type=s3,bucket=my-bucket[,prefix=path][,region=us-east-1][,endpoint-url=https://s3.example.com][,profile=myprofile]`
- **Local directories**: `--sop-paths ~/sops1:/absolute/path:relative/path`

#### Source Precedence
1. Listed `--sop-source` entries (in order)
2. Listed `--sop-paths` entries (in order)  
3. Built-in SOPs

#### General Requirements
- **File format**: Only files with `.sop.md` postfix are recognized as SOPs
- **First-wins precedence**: External SOPs override built-in SOPs with same name
- **Graceful error handling**: Invalid sources or malformed SOPs are skipped with warnings

### S3 Configuration

#### AWS Credentials
S3 sources use the AWS default credential chain:
- Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- Shared credentials file (`~/.aws/credentials`)
- IAM roles (for EC2/ECS/Lambda)
- Instance metadata service

#### Required IAM Permissions
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject"
            ],
            "Resource": "arn:aws:s3:::your-sop-bucket/your-prefix/*"
        },
        {
            "Effect": "Allow", 
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::your-sop-bucket",
            "Condition": {
                "StringLike": {
                    "s3:prefix": "your-prefix/*"
                }
            }
        }
    ]
}
```

#### S3 Configuration Examples
```bash
# Basic S3 source
--sop-source type=s3,bucket=my-sop-bucket

# With prefix to limit scope
--sop-source type=s3,bucket=my-sop-bucket,prefix=workflows/

# With specific region and profile
--sop-source type=s3,bucket=my-sop-bucket,region=us-west-2,profile=production

# With custom S3-compatible endpoint (e.g., MinIO)
--sop-source type=s3,bucket=my-sop-bucket,endpoint-url=https://minio.example.com
```

### Local Directory Example
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
