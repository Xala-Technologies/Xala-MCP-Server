import { Logger } from 'winston';
import { MCPPrompt } from '@types';
import { LoggerFactory } from '@utils/logger';
import { ComponentReviewPrompt } from './ComponentReviewPrompt';
import { ArchitectureGuidancePrompt } from './ArchitectureGuidancePrompt';
import { AccessibilityReviewPrompt } from './AccessibilityReviewPrompt';
import { PerformanceOptimizationPrompt } from './PerformanceOptimizationPrompt';
import { SpecificationGenerationPrompt } from './SpecificationGenerationPrompt';
import { TaskBreakdownPrompt } from './TaskBreakdownPrompt';
import { QualityReviewPrompt } from './QualityReviewPrompt';
import { ComplianceCheckPrompt } from './ComplianceCheckPrompt';

export interface Prompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
  
  initialize(): Promise<void>;
  getPromptText(args?: Record<string, string>): Promise<{
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;
  }>;
}

export class PromptManager {
  private logger: Logger;
  private prompts: Map<string, Prompt> = new Map();

  constructor() {
    this.logger = LoggerFactory.getLogger('PromptManager');
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing PromptManager...');

    const promptInstances: Prompt[] = [
      new ComponentReviewPrompt(),
      new ArchitectureGuidancePrompt(),
      new AccessibilityReviewPrompt(),
      new PerformanceOptimizationPrompt(),
      new SpecificationGenerationPrompt(),
      new TaskBreakdownPrompt(),
      new QualityReviewPrompt(),
      new ComplianceCheckPrompt(),
    ];

    for (const prompt of promptInstances) {
      await this.registerPrompt(prompt);
    }

    this.logger.info(`Initialized ${this.prompts.size} prompts`);
  }

  private async registerPrompt(prompt: Prompt): Promise<void> {
    try {
      await prompt.initialize();
      this.prompts.set(prompt.name, prompt);
      this.logger.debug(`Registered prompt: ${prompt.name}`);
    } catch (error) {
      this.logger.error(`Failed to register prompt ${prompt.name}:`, error);
      throw error;
    }
  }

  async listPrompts(): Promise<MCPPrompt[]> {
    return Array.from(this.prompts.values()).map((prompt) => ({
      name: prompt.name,
      description: prompt.description,
      arguments: prompt.arguments,
    }));
  }

  async getPrompt(
    name: string,
    args?: Record<string, string>
  ): Promise<{ messages: Array<{ role: string; content: string }> }> {
    const prompt = this.prompts.get(name);
    if (!prompt) {
      throw new Error(`Prompt not found: ${name}`);
    }

    try {
      return await prompt.getPromptText(args);
    } catch (error) {
      this.logger.error(`Failed to get prompt ${name}:`, error);
      throw error;
    }
  }

  getPromptInstance(name: string): Prompt | undefined {
    return this.prompts.get(name);
  }

  hasPrompt(name: string): boolean {
    return this.prompts.has(name);
  }
}