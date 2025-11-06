# Agent Script Playground

An interactive playground for authoring and testing Agent Scripts using natural language conversation.

## Quick Start

```bash
npx agent-script-playground
```

This will start the playground server and automatically open your browser to the web interface.

## Features

- 🤖 **Interactive Chat Interface**: Author agent scripts through natural language conversation
- 📝 **Real-time Script Preview**: See agent scripts update as they're created
- 🧪 **Testing Environment**: Test scripts with streaming execution and interactive prompts
- 🔌 **MCP Integration**: Configure MCP servers for enhanced tool capabilities
- 💾 **Export Functionality**: Save scripts as `.script.md` files

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

### Server Configuration

The server runs on port 3000 by default. You can specify a different port:

```bash
PORT=8080 npx agent-script-playground
```

### Project Structure

```
playground/
├── bin/cli.js          # NPX entry point
├── src/server.js       # Express server
├── public/index.html   # Web interface
├── test/               # Test files
└── package.json        # Package configuration
```

## API Endpoints

- `GET /` - Main web interface
- `GET /health` - Health check endpoint
- `GET /api` - API information

## Requirements

- Node.js 16.0.0 or higher
- Modern web browser

## License

MIT
