#!/usr/bin/env node

// Simplified MCP Workflow Server for testing
import express from 'express';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Mock data
const mockResources = [
  { uri: 'project-analysis', name: 'Project Analysis' },
  { uri: 'quality-report', name: 'Quality Report' },
];

const mockTools = [
  { name: 'generate-specification', description: 'Generate project specifications' },
  { name: 'validate-component', description: 'Validate React components' },
];

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

// MCP endpoint
app.post('/mcp', (req, res) => {
  const { method, id } = req.body;
  
  let result: any;
  
  switch (method) {
    case 'resources/list':
      result = { resources: mockResources };
      break;
    case 'tools/list':
      result = { tools: mockTools };
      break;
    case 'tools/call':
      result = {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, message: 'Tool executed' })
        }]
      };
      break;
    default:
      res.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: 'Method not found' }
      });
      return;
  }
  
  res.json({
    jsonrpc: '2.0',
    id,
    result
  });
});

app.listen(PORT, () => {
  console.log(`MCP Workflow Server running on port ${PORT}`);
});