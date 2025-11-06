import { Message } from '../types';

export interface ConversationTemplate {
  id: string;
  name: string;
  messages: Message[];
  finalScript: string;
}

export interface ScriptTemplate {
  name: string;
  content: string;
  description: string;
}

export const scriptTemplates: ScriptTemplate[] = [
  {
    name: 'File Reader',
    description: 'Simple file reading utility',
    content: `# File Reader

## Overview
A utility script that reads and processes text files with error handling and validation.

## Parameters
- **file_path** (required): Path to the file to read
- **encoding** (optional, default: "utf-8"): File encoding to use
- **max_size** (optional, default: 10485760): Maximum file size in bytes

## Steps

### 1. Validate Input Parameters
Verify that the file path is provided and accessible.

**Constraints:**
- You MUST check that file_path parameter is not empty
- You MUST verify the file exists before attempting to read
- You SHOULD validate file permissions

### 2. Read File Content
Read the file content with proper error handling.

**Constraints:**
- You MUST handle file not found errors gracefully
- You MUST respect the max_size limit
- You SHOULD use the specified encoding

### 3. Process and Return Content
Process the file content and return results.

**Constraints:**
- You MUST return the file content as a string
- You SHOULD include file metadata in the response
- You MAY apply basic text processing if needed`
  },
  {
    name: 'API Client',
    description: 'HTTP API client with authentication',
    content: `# API Client

## Overview
A flexible HTTP API client script with authentication support and error handling.

## Parameters
- **base_url** (required): Base URL for the API
- **endpoint** (required): API endpoint to call
- **method** (optional, default: "GET"): HTTP method
- **auth_token** (optional): Authentication token
- **timeout** (optional, default: 30): Request timeout in seconds

## Steps

### 1. Setup HTTP Client
Configure the HTTP client with base settings.

**Constraints:**
- You MUST validate the base_url format
- You MUST set appropriate headers including User-Agent
- You SHOULD configure timeout settings

### 2. Handle Authentication
Add authentication if token is provided.

**Constraints:**
- You MUST add Authorization header if auth_token is provided
- You SHOULD support Bearer token format
- You MAY support other authentication methods

### 3. Make API Request
Execute the HTTP request with error handling.

**Constraints:**
- You MUST handle network errors gracefully
- You MUST respect the timeout setting
- You SHOULD retry on transient failures

### 4. Process Response
Parse and validate the API response.

**Constraints:**
- You MUST check response status codes
- You MUST parse JSON responses safely
- You SHOULD return structured error information`
  }
];

export const conversationTemplates: ConversationTemplate[] = [
  {
    id: 'simple-file-reader',
    name: 'Simple File Reader Request',
    messages: [
      {
        id: 'user-1',
        role: 'user',
        content: 'Create a simple file reader script',
        timestamp: new Date('2024-01-01T10:00:00Z')
      },
      {
        id: 'agent-1',
        role: 'agent',
        content: 'I\'ll create a file reader script for you. This will be a utility that can read text files with proper error handling and validation.\n\nLet me generate the agent script:',
        timestamp: new Date('2024-01-01T10:00:02Z')
      }
    ],
    finalScript: scriptTemplates[0].content
  },
  {
    id: 'api-client-workflow',
    name: 'API Client Development',
    messages: [
      {
        id: 'user-1',
        role: 'user',
        content: 'I need an agent script for making HTTP API calls with authentication',
        timestamp: new Date('2024-01-01T11:00:00Z')
      },
      {
        id: 'agent-1',
        role: 'agent',
        content: 'Perfect! I\'ll create an HTTP API client script that supports authentication and proper error handling. This will be useful for integrating with various web services.',
        timestamp: new Date('2024-01-01T11:00:03Z')
      },
      {
        id: 'user-2',
        role: 'user',
        content: 'Make sure it supports Bearer token authentication and has good timeout handling',
        timestamp: new Date('2024-01-01T11:01:00Z')
      },
      {
        id: 'agent-2',
        role: 'agent',
        content: 'Absolutely! I\'ll include Bearer token support and configurable timeout settings. The script will also handle various HTTP methods and provide structured error responses.',
        timestamp: new Date('2024-01-01T11:01:02Z')
      }
    ],
    finalScript: scriptTemplates[1].content
  }
];

export const responsePatterns = {
  greetings: [
    'Hello! I\'m here to help you create agent scripts. What kind of automation would you like to build?',
    'Hi there! I can help you author agent scripts for various tasks. What would you like to create?',
    'Welcome! I\'m your agent script authoring assistant. What workflow would you like to automate?'
  ],
  
  scriptGeneration: [
    'I\'ll create that script for you. Let me generate the agent script with proper structure and constraints.',
    'Great idea! I\'ll build an agent script that handles that workflow with appropriate error handling.',
    'Perfect! Let me create a well-structured agent script for that task with all the necessary parameters.'
  ],
  
  refinement: [
    'I\'ll update the script with those improvements. Here\'s the refined version:',
    'Good suggestion! Let me modify the script to include those enhancements:',
    'Excellent point! I\'ll refine the script to better handle that scenario:'
  ],
  
  errors: [
    'I apologize, but I encountered a timeout while processing your request. Please try again.',
    'I\'m having trouble generating a properly formatted script. Let me try a different approach.',
    'There seems to be an issue with the script format. Let me correct that for you.'
  ],
  
  help: [
    'I can help you create agent scripts for various automation tasks. Try asking me to create a script for file processing, API calls, data transformation, or any other workflow you need to automate.',
    'I\'m here to help you author agent scripts! You can ask me to create scripts for tasks like file operations, web scraping, data processing, or system automation.',
    'I can generate agent scripts for many different use cases. What kind of task would you like to automate? I can help with file handling, API integration, data processing, and more.'
  ]
};
