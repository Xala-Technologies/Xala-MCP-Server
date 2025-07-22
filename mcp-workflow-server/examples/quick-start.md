# MCP Workflow Server - Quick Start Guide

## Starting the Server

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## Example Usage

### 1. Generate Project Specifications

```bash
# Using curl
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "generate-specification",
      "arguments": {
        "prompt": "Build a user authentication system with email/password login, OAuth support, and role-based access control",
        "projectId": "auth-system",
        "phase": "all"
      }
    }
  }'
```

### 2. Analyze Codebase Quality

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "analyze-codebase",
      "arguments": {
        "projectId": "my-project",
        "analysisType": "full"
      }
    }
  }'
```

### 3. Validate React Component

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "validate-component",
      "arguments": {
        "componentPath": "src/components/LoginForm.tsx",
        "componentCode": "export const LoginForm = () => { return <form>...</form> }"
      }
    }
  }'
```

### 4. Get Component Review Prompt

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "prompts/get",
    "params": {
      "name": "component-review",
      "arguments": {
        "component_code": "const Button = (props) => <button>{props.children}</button>",
        "component_name": "Button"
      }
    }
  }'
```

### 5. Read Project Analysis

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "resources/read",
    "params": {
      "uri": "project-analysis",
      "projectId": "my-project"
    }
  }'
```

## WebSocket Example

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('Connected to MCP server');
  
  // List available tools
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  }));
});

ws.on('message', (data) => {
  const response = JSON.parse(data);
  console.log('Response:', JSON.stringify(response, null, 2));
  
  // After getting tools list, call a tool
  if (response.id === 1 && response.result) {
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'check-accessibility',
        arguments: {
          filePath: 'src/components/Header.tsx',
          wcagLevel: 'AAA'
        }
      }
    }));
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

## Using with Claude Desktop

Add to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "workflow-server": {
      "command": "node",
      "args": ["/path/to/mcp-workflow-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production",
        "CONFIG_PATH": "/path/to/config"
      }
    }
  }
}
```

Then in Claude Desktop, you can use commands like:

- "Analyze my React project for quality issues"
- "Generate specifications for a shopping cart feature"
- "Check if my LoginForm component is accessible"
- "Review my authentication service architecture"