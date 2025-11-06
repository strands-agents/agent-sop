# Testing the Agent Script Playground UI

This guide shows you exactly what to type and click to test all playground features.

## Quick Start

1. Run `npm run dev` or `npx agent-script-playground`
2. Type the inputs below in the chat box
3. Watch the script preview update on the right
4. Click "Test Script" to test execution

## Chat Interface Testing

### 🚀 Script Generation

**Type these messages to generate different scripts:**

```
Create a file processor
```
→ Generates file processing script

```
Create a log analyzer script
```
→ Generates log analysis script

```
Create an API client
```
→ Generates API client script

```
Build a file processing tool
```
→ Also generates file processing script

### 🔄 Script Refinement

**After generating a script, type these to modify it:**

```
Add error handling to the script
```
→ Adds error handling sections

```
Add parameter validation
```
→ Enhances parameter validation

```
Add logging to the script
```
→ Adds logging functionality

```
Add timeout handling
```
→ Adds retry logic (API scripts only)

### ❌ Error Testing

**Type these to trigger errors:**

```
trigger timeout error
```
→ Wait 5 seconds, then see timeout message

```
generate invalid format
```
→ See format error message

### 💬 Basic Responses

**Type these for different responses:**

```
hello
```
→ Welcome message

```
help
```
→ Help and examples

```
(leave empty and press Enter)
```
→ Help suggestions

## MCP Server Configuration Testing

### 🔧 Open MCP Config Modal

1. Look for "Configure MCP" button in the UI
2. Click it to open the configuration modal

### ✅ Test Successful Connections

**File System Server (Stdio):**
- **Name:** `File System Server`
- **Type:** Select `stdio`
- **Command:** `python`
- **Args:** `file_server.py`
- Click "Test Connection"
- Should show: ✅ Connected with file tools (read_file, write_file, list_directory)

**Web Tools Server (HTTP):**
- **Name:** `Web Tools Server`
- **Type:** Select `http`
- **URL:** `http://localhost:8000/mcp`
- Click "Test Connection"
- Should show: ✅ Connected with web tools (fetch_url, search_web)

**Database Server:**
- **Name:** `Database Server`
- **Type:** Select `stdio`
- **Command:** `python`
- **Args:** `db_server.py`
- Click "Test Connection"
- Should show: ✅ Connected with database tools (query_db, insert_record)

### ❌ Test Connection Failures

**Command Not Found:**
- **Name:** `Invalid Server`
- **Type:** Select `stdio`
- **Command:** `nonexistent-command`
- Click "Test Connection"
- Should show: ❌ "Command not found: 'nonexistent-command'"

**Unreachable HTTP Server:**
- **Name:** `Unreachable Server`
- **Type:** Select `http`
- **URL:** `http://nonexistent.example.com/mcp`
- Click "Test Connection"
- Should show: ❌ "Connection failed to 'http://nonexistent.example.com/mcp'"

**Permission Error:**
- **Name:** `Permission Server`
- **Type:** Select `stdio`
- **Command:** `restricted-command`
- Click "Test Connection"
- Should show: ❌ "Permission denied when executing 'restricted-command'"

## Script Testing Panel

### 🎯 Open Testing Panel

1. Generate any script using chat
2. Click "Test Script" button in script preview
3. Testing modal opens

### 📝 Test Inputs

**Simple Execution:**
- **Input:** `file_path=/path/to/file.txt`
- **Interactive:** Leave unchecked
- Click "Run"
- Should show: Parameter validation and file processing steps

**Complex Execution:**
- **Input:** `log_file_path=/var/log/app.log, error_patterns=['ERROR', 'FATAL']`
- **Interactive:** Leave unchecked
- Click "Run"
- Should show: Tool loading, reasoning loops, external tool calls

**Interactive Mode:**
- **Input:** `Any test input`
- **Interactive:** Check the box
- Click "Run"
- Should show: Execution steps with prompts asking for your input

**Long Running Test:**
- **Input:** `Large dataset processing`
- **Interactive:** Leave unchecked
- Click "Run"
- Should show: Extended execution with progress updates

## Expected Behaviors

### ⏱️ Timing
- Chat responses: 1.5-2 seconds
- MCP connections: 1-3 seconds with realistic delays
- Script execution: Streams in real-time

### 🎨 Visual Feedback
- Chat messages appear with typing animation
- Script preview updates immediately
- MCP connection status shows loading spinner then result
- Test execution streams output line by line

### 🔄 State Management
- Scripts persist during session
- MCP servers stay connected until removed
- Chat history maintained throughout session

## Testing Checklist

### Chat Interface
- [ ] Generate file processor script
- [ ] Generate log analyzer script  
- [ ] Generate API client script
- [ ] Add error handling refinement
- [ ] Add parameter validation
- [ ] Trigger timeout error
- [ ] Test help responses

### MCP Configuration
- [ ] Test successful stdio connection
- [ ] Test successful HTTP connection
- [ ] Test command not found error
- [ ] Test unreachable server error
- [ ] Test permission denied error
- [ ] Verify tool discovery for each type

### Script Testing
- [ ] Simple execution test
- [ ] Complex execution test
- [ ] Interactive mode test
- [ ] Long running execution test
- [ ] Test execution cancellation

### UI Interactions
- [ ] Script preview updates in real-time
- [ ] Export button works
- [ ] Modal dialogs open/close properly
- [ ] Connection status indicators work
- [ ] Streaming output displays correctly

This covers all testable functionality through the UI interface.
