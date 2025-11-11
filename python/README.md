# Strands Agents SOPs

Agent Standard Operating Procedures as importable strings with optional MCP server functionality.

## Usage

### As Python Package
Import SOP files as strings:
```python
import strands_agents_sops as sops

# Access SOPs as module attributes (hyphens become underscores)
print(sops.code_task_generator)
print(sops.pdd)
print(sops.codebase_summary)
print(sops.code_assist)
```

### As MCP Server
Run the MCP server:
```bash
python -m strands_agents_sops
```

Or use the installed script:
```bash
strands-agents-sops
```

## Testing

Build and test the package:
```bash
pip install build
python -m build
pip install dist/*.whl

# Test MCP server
npx @modelcontextprotocol/inspector strands-agents-sops
```
