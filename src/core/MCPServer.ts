import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import express, { Express } from 'express';
import { WebSocketServer } from 'ws';
import { createServer, Server as HTTPServer } from 'http';
import { Logger } from 'winston';
import { EventEmitter } from 'events';

import {
  MCPServerCapabilities,
  MCPRequest,
  MCPResponse,
  ServerConfig,
} from '@types';
import { createLogger } from '@utils/logger';
import { ResourceManager } from '@resources/ResourceManager';
import { ToolManager } from '@tools/ToolManager';
import { PromptManager } from '@prompts/PromptManager';
import { ConfigurationManager } from '@config/ConfigurationManager';

export class MCPServer extends EventEmitter {
  private server: Server;
  private httpServer?: HTTPServer;
  private wsServer?: WebSocketServer;
  private expressApp?: Express;
  private logger: Logger;
  private config: ServerConfig;
  private resourceManager: ResourceManager;
  private toolManager: ToolManager;
  private promptManager: PromptManager;
  private configManager: ConfigurationManager;
  private requestHandlers: Map<string, (request: any) => Promise<any>> = new Map();

  constructor() {
    super();
    this.logger = createLogger('MCPServer');
    this.server = new Server(
      {
        name: 'mcp-workflow-server',
        version: '1.0.0',
      },
      {
        capabilities: this.getCapabilities(),
      }
    );
    
    this.configManager = new ConfigurationManager();
    this.resourceManager = new ResourceManager();
    this.toolManager = new ToolManager();
    this.promptManager = new PromptManager();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing MCP Workflow Server...');
    
    try {
      this.config = await this.configManager.loadServerConfig();
      
      await this.resourceManager.initialize();
      await this.toolManager.initialize();
      await this.promptManager.initialize();
      
      this.setupHandlers();
      
      if (this.config.server.protocol === 'stdio') {
        await this.startStdioServer();
      } else {
        await this.startNetworkServer();
      }
      
      this.logger.info('MCP Workflow Server initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize server:', error);
      throw error;
    }
  }

  private getCapabilities(): MCPServerCapabilities {
    return {
      resources: true,
      tools: true,
      prompts: true,
    };
  }

  private setupHandlers(): void {
    // Resources
    this.server.setRequestHandler('resources/list', async () => {
      return {
        resources: await this.resourceManager.listResources(),
      };
    });
    this.requestHandlers.set('resources/list', async () => {
      return {
        resources: await this.resourceManager.listResources(),
      };
    });

    this.server.setRequestHandler('resources/read', async (request) => {
      const params = request.params as { uri: string };
      return {
        contents: await this.resourceManager.readResource(params.uri),
      };
    });
    this.requestHandlers.set('resources/read', async (request) => {
      const { uri } = request.params as { uri: string };
      return {
        contents: await this.resourceManager.readResource(uri),
      };
    });

    // Tools
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: await this.toolManager.listTools(),
      };
    });
    this.requestHandlers.set('tools/list', async () => {
      return {
        tools: await this.toolManager.listTools(),
      };
    });

    this.server.setRequestHandler('tools/call', async (request) => {
      const params = request.params as {
        name: string;
        arguments: Record<string, unknown>;
      };
      return await this.toolManager.callTool(params.name, params.arguments);
    });
    this.requestHandlers.set('tools/call', async (request) => {
      const { name, arguments: args } = request.params as {
        name: string;
        arguments: Record<string, unknown>;
      };
      return await this.toolManager.callTool(name, args);
    });

    // Prompts
    this.server.setRequestHandler('prompts/list', async () => {
      return {
        prompts: await this.promptManager.listPrompts(),
      };
    });
    this.requestHandlers.set('prompts/list', async () => {
      return {
        prompts: await this.promptManager.listPrompts(),
      };
    });

    this.server.setRequestHandler('prompts/get', async (request) => {
      const params = request.params as {
        name: string;
        arguments?: Record<string, string>;
      };
      return await this.promptManager.getPrompt(params.name, params.arguments);
    });
    this.requestHandlers.set('prompts/get', async (request) => {
      const { name, arguments: args } = request.params as {
        name: string;
        arguments?: Record<string, string>;
      };
      return await this.promptManager.getPrompt(name, args);
    });

    this.server.onerror = (error) => {
      this.logger.error('Server error:', error);
      this.emit('error', error);
    };
  }

  private async startStdioServer(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('MCP server running on stdio');
  }

  private async startNetworkServer(): Promise<void> {
    const { protocol, host, port } = this.config.server;

    if (protocol === 'http' || protocol === 'both') {
      this.expressApp = express();
      this.setupHttpServer();
      
      this.httpServer = createServer(this.expressApp);
      this.httpServer.listen(port, host, () => {
        this.logger.info(`HTTP server listening on http://${host}:${port}`);
      });
    }

    if (protocol === 'ws' || protocol === 'both') {
      const wsPort = protocol === 'both' ? port + 1 : port;
      this.wsServer = new WebSocketServer({ port: wsPort, host });
      this.setupWebSocketServer();
      
      this.logger.info(`WebSocket server listening on ws://${host}:${wsPort}`);
    }
  }

  private setupHttpServer(): void {
    if (!this.expressApp) return;

    this.expressApp.use(express.json({ limit: this.config.mcp.maxRequestSize }));

    if (this.config.server.cors.enabled) {
      this.expressApp.use((req, res, next) => {
        const origin = req.headers.origin;
        if (!origin || this.config.server.cors.origins.includes('*') ||
            this.config.server.cors.origins.includes(origin)) {
          res.header('Access-Control-Allow-Origin', origin || '*');
          res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.header('Access-Control-Allow-Headers', 'Content-Type');
        }
        next();
      });
    }

    this.expressApp.post('/mcp', async (req, res) => {
      try {
        const request = req.body as MCPRequest;
        const response = await this.handleRequest(request);
        res.json(response);
      } catch (error) {
        const errorResponse: MCPResponse = {
          jsonrpc: '2.0',
          id: req.body.id || null,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : 'Unknown error',
          },
        };
        res.status(500).json(errorResponse);
      }
    });

    this.expressApp.get('/health', (_, res) => {
      res.json({ status: 'healthy', version: '1.0.0' });
    });
  }

  private setupWebSocketServer(): void {
    if (!this.wsServer) return;

    this.wsServer.on('connection', (ws) => {
      this.logger.info('New WebSocket connection');

      ws.on('message', async (data) => {
        try {
          const request = JSON.parse(data.toString()) as MCPRequest;
          const response = await this.handleRequest(request);
          ws.send(JSON.stringify(response));
        } catch (error) {
          const errorResponse: MCPResponse = {
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32700,
              message: 'Parse error',
              data: error instanceof Error ? error.message : 'Invalid JSON',
            },
          };
          ws.send(JSON.stringify(errorResponse));
        }
      });

      ws.on('close', () => {
        this.logger.info('WebSocket connection closed');
      });

      ws.on('error', (error) => {
        this.logger.error('WebSocket error:', error);
      });
    });
  }

  private async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    this.logger.debug('Handling request:', request.method);

    try {
      const [namespace, method] = request.method.split('/');
      
      switch (namespace) {
        case 'resources':
          return await this.handleResourceRequest(method, request);
        case 'tools':
          return await this.handleToolRequest(method, request);
        case 'prompts':
          return await this.handlePromptRequest(method, request);
        default:
          throw new Error(`Unknown namespace: ${namespace}`);
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Method not found',
          data: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  private async handleResourceRequest(
    method: string,
    request: MCPRequest
  ): Promise<MCPResponse> {
    const handler = this.requestHandlers.get(`resources/${method}`);
    if (!handler) {
      throw new Error(`Unknown resource method: ${method}`);
    }
    
    const result = await handler(request);
    return {
      jsonrpc: '2.0',
      id: request.id,
      result,
    };
  }

  private async handleToolRequest(
    method: string,
    request: MCPRequest
  ): Promise<MCPResponse> {
    const handler = this.requestHandlers.get(`tools/${method}`);
    if (!handler) {
      throw new Error(`Unknown tool method: ${method}`);
    }
    
    const result = await handler(request);
    return {
      jsonrpc: '2.0',
      id: request.id,
      result,
    };
  }

  private async handlePromptRequest(
    method: string,
    request: MCPRequest
  ): Promise<MCPResponse> {
    const handler = this.requestHandlers.get(`prompts/${method}`);
    if (!handler) {
      throw new Error(`Unknown prompt method: ${method}`);
    }
    
    const result = await handler(request);
    return {
      jsonrpc: '2.0',
      id: request.id,
      result,
    };
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down MCP Workflow Server...');
    
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => resolve());
      });
    }
    
    if (this.wsServer) {
      await new Promise<void>((resolve) => {
        this.wsServer!.close(() => resolve());
      });
    }
    
    await this.server.close();
    this.logger.info('Server shutdown complete');
  }
}