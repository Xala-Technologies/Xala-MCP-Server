import { Logger } from 'winston';
import { MCPTool, MCPToolCall, MCPToolResult } from '@types';
import { LoggerFactory } from '@utils/logger';
import { CodebaseAnalysisTool } from './CodebaseAnalysisTool';
import { ComponentValidationTool } from './ComponentValidationTool';
import { AccessibilityCheckTool } from './AccessibilityCheckTool';
import { TypeScriptValidationTool } from './TypeScriptValidationTool';
import { SpecificationGeneratorTool } from './SpecificationGeneratorTool';
import { TaskGeneratorTool } from './TaskGeneratorTool';
import { DocumentationSyncTool } from './DocumentationSyncTool';
import { StandardsEnforcementTool } from './StandardsEnforcementTool';

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  
  initialize(): Promise<void>;
  execute(args: Record<string, unknown>): Promise<MCPToolResult>;
}

export class ToolManager {
  private logger: Logger;
  private tools: Map<string, Tool> = new Map();

  constructor() {
    this.logger = LoggerFactory.getLogger('ToolManager');
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing ToolManager...');

    const toolInstances: Tool[] = [
      new CodebaseAnalysisTool(),
      new ComponentValidationTool(),
      new AccessibilityCheckTool(),
      new TypeScriptValidationTool(),
      new SpecificationGeneratorTool(),
      new TaskGeneratorTool(),
      new DocumentationSyncTool(),
      new StandardsEnforcementTool(),
    ];

    for (const tool of toolInstances) {
      await this.registerTool(tool);
    }

    this.logger.info(`Initialized ${this.tools.size} tools`);
  }

  private async registerTool(tool: Tool): Promise<void> {
    try {
      await tool.initialize();
      this.tools.set(tool.name, tool);
      this.logger.debug(`Registered tool: ${tool.name}`);
    } catch (error) {
      this.logger.error(`Failed to register tool ${tool.name}:`, error);
      throw error;
    }
  }

  async listTools(): Promise<MCPTool[]> {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    try {
      this.logger.debug(`Executing tool: ${name}`, { args });
      const result = await tool.execute(args);
      this.logger.debug(`Tool ${name} completed successfully`);
      return result;
    } catch (error) {
      this.logger.error(`Tool ${name} failed:`, error);
      return {
        content: [
          {
            type: 'text',
            text: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  hasTool(name: string): boolean {
    return this.tools.has(name);
  }
}