import { Logger } from 'winston';
import { Tool } from './ToolManager';
import { MCPToolResult } from '@types';
import { LoggerFactory } from '@utils/logger';
import { z } from 'zod';

export abstract class BaseTool implements Tool {
  protected logger: Logger;
  
  abstract name: string;
  abstract description: string;
  abstract inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };

  constructor() {
    this.logger = LoggerFactory.getLogger(this.constructor.name);
  }

  async initialize(): Promise<void> {
    this.logger.debug(`Initializing tool: ${this.name}`);
  }

  abstract execute(args: Record<string, unknown>): Promise<MCPToolResult>;

  protected validateInput<T>(
    args: Record<string, unknown>,
    schema: z.ZodSchema<T>
  ): T {
    try {
      return schema.parse(args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        throw new Error(`Invalid input: ${issues}`);
      }
      throw error;
    }
  }

  protected successResult(content: string): MCPToolResult {
    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
      isError: false,
    };
  }

  protected errorResult(message: string): MCPToolResult {
    return {
      content: [
        {
          type: 'text',
          text: message,
        },
      ],
      isError: true,
    };
  }

  protected jsonResult(data: unknown): MCPToolResult {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
      isError: false,
    };
  }
}