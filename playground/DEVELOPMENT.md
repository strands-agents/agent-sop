# Agent Script Playground - Development Guide

## Essential Commands

### Initial Setup
```bash
# Install Node.js dependencies
npm install

# Setup Python service
cd src/python
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

### Development Workflow
```bash
# Start development server (runs both Node.js and Python services)
npm run dev

# Build for production
npm run build

# Run all tests
npm test
```

### Before Every Commit (REQUIRED)
```bash
# 1. Run full test suite
npm test

# 2. Build successfully
npm run build

# 3. Test Python service
cd src/python && source venv/bin/activate
python -m pytest tests/ -v
python -m py_compile services/*.py
cd ../..
```

## Python Service Commands

### Testing
```bash
cd src/python && source venv/bin/activate

# Run all Python tests
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/test_mcp_manager.py -v

# Test with coverage
python -m pytest tests/ --cov=services --cov-report=html

# Syntax check
python -m py_compile services/*.py
```

### Development
```bash
cd src/python && source venv/bin/activate

# Start Python service standalone
python main.py

# Debug mode
LOG_LEVEL=DEBUG python main.py

# Verify imports
python -c "from services import AgentService, MCPClientManager; print('Setup complete')"
```

## Project Structure

```
playground/
├── package.json           # Node.js dependencies and scripts
├── src/
│   ├── server.js         # Express server
│   ├── frontend/         # Preact frontend
│   └── python/           # Python service
│       ├── requirements.txt
│       ├── services/     # Core Python modules
│       └── tests/        # Python tests
├── dist/                 # Built frontend assets
└── test/                 # Node.js tests
```

## Development Rules

### Adding New Features
1. **Write tests first** (TDD approach)
2. **Run full test suite** before committing
3. **Verify build passes** before committing
4. **Update this guide** if new commands needed

### Testing New MCP Integration
```bash
# Test MCP manager
cd src/python && source venv/bin/activate
python -m pytest tests/test_mcp_manager.py -v

# Test full integration
npm test
npm run build
```

## Debugging

### Frontend Issues
```bash
# Check frontend build
npm run build

# Run frontend tests only
npm run test:frontend

# Start with verbose logging
DEBUG=* npm run dev
```

### Python Service Issues
```bash
cd src/python && source venv/bin/activate

# Check service starts
python main.py --help

# Validate imports
python -c "
from services import AgentService, MCPClientManager
print('All imports successful')
"

# Check environment
which python
pip list | grep -E "(strands|mcp|pytest)"
```

### Build Issues
```bash
# Clean and rebuild
rm -rf dist/ node_modules/
npm install
npm run build

# Check for syntax errors
npm run lint  # if available
```

## Environment Variables

```bash
# Python service debug
export LOG_LEVEL=DEBUG

# Node.js debug
export DEBUG=*

# Custom port
export PORT=8080
```

## NPX Distribution Testing

```bash
# Test NPX package locally
npm pack
npx ./agent-script-playground-*.tgz

# Test installation
npm install -g .
agent-script-playground
```
