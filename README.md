# MCP Development Workflow Server

A comprehensive Model Context Protocol (MCP) server that serves as an intelligent development workflow orchestrator and code quality gatekeeper for organizational development teams.

## Features

### Core Capabilities

- **Full MCP Protocol Support**: JSON-RPC 2.0 over HTTP/WebSocket with Resources, Tools, and Prompts
- **Development Workflow Orchestration**: Automated specification generation from requirements to implementation
- **Quality Gatekeeper System**: Enforce strict development standards with configurable rules
- **Multi-Project Support**: Manage multiple projects with different configurations
- **Extensible Architecture**: Easy to add new tools, resources, and prompts

### Specification Management System

#### Three-Phase Workflow
1. **Requirements Analysis**: Transform user prompts into structured requirements using EARS format
2. **Technical Design**: Generate architectural decisions, interfaces, and data flow diagrams
3. **Implementation Planning**: Break down work into granular, sequenced tasks with dependencies

### Quality Rules Engine

#### Five Rule Categories
1. **TypeScript Compliance**: Strict type safety, explicit return types, no `any` types
2. **Code Quality**: Design token compliance, component architecture, state management patterns
3. **Accessibility & Compliance**: WCAG 2.2 AAA, internationalization, GDPR compliance
4. **Package System**: Clean architecture, dependency management, documentation standards
5. **Business Logic**: Error handling patterns, security standards, testing requirements

### Automated Hooks System

- **File Change Hooks**: Auto-generate tests, update documentation
- **Quality Assurance Hooks**: Pre-commit validation, CI/CD integration
- **Workflow Hooks**: Task completion tracking, specification updates

## Installation

```bash
npm install @organization/mcp-workflow-server
```

## Quick Start

### 1. Basic Setup

```bash
# Clone and install
git clone <repository>
cd mcp-workflow-server
npm install

# Build the project
npm run build

# Start the server
npm start
```

### 2. Configuration

Create a `config/server.yaml` file:

```yaml
server:
  port: 3000
  host: localhost
  protocol: both  # http, ws, or both

mcp:
  capabilities:
    resources: true
    tools: true
    prompts: true

quality:
  enableGatekeeper: true
  blockOnViolations: true
  autoFix: false

workflow:
  autoGenerateSpecs: true
  requireApproval: true
```

### 3. Project Configuration

Create a project configuration in `config/projects/my-project.yaml`:

```yaml
projectId: my-project
name: My React Application
rootPath: /path/to/project

rules:
  typescript:
    strictTypes: true
    noAnyTypes: true
    maxFileLines: 300
  
  codeQuality:
    enforceDesignTokens: true
    componentStructure:
      maxComplexity: 10

thresholds:
  codeQuality:
    typeSafetyScore: 95
    testCoverage:
      unit: 80
      integration: 70
```

## Usage

### Using with Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "workflow-server": {
      "command": "node",
      "args": ["/path/to/mcp-workflow-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Available Resources

- `project-analysis`: Comprehensive project metrics and analysis
- `codebase-structure`: Visual representation of codebase organization
- `quality-report`: Current quality violations and metrics
- `specification-status`: Status of requirements, design, and tasks
- `workflow-templates`: Reusable workflow templates
- `task-dependencies`: Task dependency graph
- `compliance-status`: Compliance with standards (WCAG, GDPR, etc.)
- `performance-metrics`: Performance budgets and metrics

### Available Tools

- `analyze-codebase`: Deep analysis of codebase quality
- `validate-component`: Validate React components against standards
- `check-accessibility`: WCAG compliance checking
- `verify-types`: TypeScript validation
- `generate-specification`: Generate specs from user prompts
- `create-tasks`: Break down requirements into tasks
- `update-documentation`: Sync documentation with code
- `enforce-standards`: Apply quality standards

### Available Prompts

- `component-review`: Review React components
- `architecture-guidance`: Get architectural recommendations
- `accessibility-review`: Review for accessibility compliance
- `performance-optimization`: Performance improvement suggestions
- `specification-generation`: Generate project specifications
- `task-breakdown`: Break down features into tasks
- `quality-review`: Comprehensive quality review
- `compliance-check`: Check regulatory compliance

## API Examples

### HTTP API

```bash
# List available resources
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"resources/list"}'

# Generate specifications
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "generate-specification",
      "arguments": {
        "prompt": "Build a user authentication system",
        "projectId": "my-project",
        "phase": "all"
      }
    }
  }'
```

### WebSocket API

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  }));
});

ws.on('message', (data) => {
  const response = JSON.parse(data);
  console.log(response);
});
```

## Architecture

```
mcp-workflow-server/
├── src/
│   ├── core/           # Core MCP server implementation
│   ├── resources/      # MCP resources
│   ├── tools/          # MCP tools
│   ├── prompts/        # MCP prompts
│   ├── rules/          # Quality rule engine
│   ├── metrics/        # Metrics collection
│   ├── hooks/          # Automation hooks
│   ├── config/         # Configuration management
│   ├── utils/          # Utilities
│   └── types/          # TypeScript types
├── config/             # Configuration files
├── tests/              # Test suite
└── docs/               # Documentation
```

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details