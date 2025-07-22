import { MCPServer } from '@core/MCPServer';
import axios from 'axios';
import WebSocket from 'ws';

describe('MCPServer Integration Tests', () => {
  let server: MCPServer;
  const baseURL = 'http://localhost:3000';
  const wsURL = 'ws://localhost:3001';

  beforeAll(async () => {
    server = new MCPServer();
    await server.initialize();
    // Give server time to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await server.shutdown();
  });

  describe('HTTP API', () => {
    it('should respond to health check', async () => {
      const response = await axios.get(`${baseURL}/health`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
      expect(response.data).toHaveProperty('version');
    });

    it('should list available resources', async () => {
      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 1,
        method: 'resources/list',
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('result');
      expect(response.data.result.resources).toBeInstanceOf(Array);
      expect(response.data.result.resources.length).toBeGreaterThan(0);
      
      const resourceUris = response.data.result.resources.map((r: any) => r.uri);
      expect(resourceUris).toContain('project-analysis');
      expect(resourceUris).toContain('quality-report');
      expect(resourceUris).toContain('specification-status');
    });

    it('should list available tools', async () => {
      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
      });

      expect(response.status).toBe(200);
      expect(response.data.result.tools).toBeInstanceOf(Array);
      
      const toolNames = response.data.result.tools.map((t: any) => t.name);
      expect(toolNames).toContain('generate-specification');
      expect(toolNames).toContain('analyze-codebase');
      expect(toolNames).toContain('validate-component');
    });

    it('should call a tool successfully', async () => {
      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'generate-specification',
          arguments: {
            prompt: 'Simple todo app',
            projectId: 'todo-app',
            phase: 'requirements',
          },
        },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('result');
      expect(response.data.result.content).toBeInstanceOf(Array);
      expect(response.data.result.content[0].type).toBe('text');
    });

    it('should handle errors gracefully', async () => {
      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 4,
        method: 'invalid/method',
      });

      expect(response.status).toBe(200); // JSON-RPC returns 200 even for errors
      expect(response.data).toHaveProperty('error');
      expect(response.data.error.code).toBe(-32601); // Method not found
    });
  });

  describe('WebSocket API', () => {
    let ws: WebSocket;

    beforeEach((done) => {
      ws = new WebSocket(wsURL);
      ws.on('open', done);
    });

    afterEach((done) => {
      ws.close();
      ws.on('close', done);
    });

    it('should handle WebSocket requests', (done) => {
      ws.on('message', (data) => {
        const response = JSON.parse(data.toString());
        expect(response).toHaveProperty('result');
        expect(response.result.resources).toBeInstanceOf(Array);
        done();
      });

      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 'ws-1',
        method: 'resources/list',
      }));
    });

    it('should handle multiple concurrent requests', (done) => {
      let responses = 0;
      const expectedResponses = 3;

      ws.on('message', (data) => {
        const response = JSON.parse(data.toString());
        expect(response).toHaveProperty('id');
        responses++;
        
        if (responses === expectedResponses) {
          done();
        }
      });

      // Send multiple requests
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 'ws-2',
        method: 'resources/list',
      }));

      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 'ws-3',
        method: 'tools/list',
      }));

      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 'ws-4',
        method: 'prompts/list',
      }));
    });
  });

  describe('Resource Integration', () => {
    it('should read project analysis resource', async () => {
      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 5,
        method: 'resources/read',
        params: {
          uri: 'project-analysis',
          projectId: 'test-project',
        },
      });

      expect(response.status).toBe(200);
      const analysis = response.data.result.contents;
      expect(analysis).toHaveProperty('projectId', 'test-project');
      expect(analysis).toHaveProperty('codeMetrics');
      expect(analysis).toHaveProperty('architectureMetrics');
      expect(analysis).toHaveProperty('recommendations');
    });
  });

  describe('Tool Integration', () => {
    it('should validate component with multiple rules', async () => {
      const componentCode = `
        export const Button = (props: any) => {
          const style = { color: '#ff0000', padding: '10px' };
          return <button style={style}>{props.children}</button>;
        };
      `;

      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'validate-component',
          arguments: {
            componentPath: 'Button.tsx',
            componentCode,
          },
        },
      });

      expect(response.status).toBe(200);
      const result = JSON.parse(response.data.result.content[0].text);
      expect(result.valid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe('Prompt Integration', () => {
    it('should get component review prompt', async () => {
      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 7,
        method: 'prompts/get',
        params: {
          name: 'component-review',
          arguments: {
            component_code: 'const Button = () => <button>Click</button>',
            component_name: 'Button',
          },
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.result.messages).toBeInstanceOf(Array);
      expect(response.data.result.messages).toHaveLength(2);
      expect(response.data.result.messages[0].role).toBe('system');
      expect(response.data.result.messages[1].role).toBe('user');
    });
  });
});