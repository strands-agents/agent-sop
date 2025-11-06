# MCP Prompt Server

Serves markdown files as MCP prompts using FastMCP.

## Testing

Build the package:
```bash
pip install build
python -m build
```

Run and inspect the MCP server:
```bash
npx @modelcontextprotocol/inspector uvx --from . python main.py
```
