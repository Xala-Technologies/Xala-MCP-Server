import { Logger } from 'winston';
import { Prompt } from './PromptManager';
import { LoggerFactory } from '@utils/logger';

export abstract class BasePrompt implements Prompt {
  protected logger: Logger;
  
  abstract name: string;
  abstract description: string;
  abstract arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;

  constructor() {
    this.logger = LoggerFactory.getLogger(this.constructor.name);
  }

  async initialize(): Promise<void> {
    this.logger.debug(`Initializing prompt: ${this.name}`);
  }

  abstract getPromptText(args?: Record<string, string>): Promise<{
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;
  }>;

  protected validateArguments(
    args: Record<string, string> | undefined,
    required: string[]
  ): void {
    if (!args && required.length > 0) {
      throw new Error(`Missing required arguments: ${required.join(', ')}`);
    }

    for (const arg of required) {
      if (!args || !args[arg]) {
        throw new Error(`Missing required argument: ${arg}`);
      }
    }
  }

  protected formatTemplate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return vars[key] || match;
    });
  }
}