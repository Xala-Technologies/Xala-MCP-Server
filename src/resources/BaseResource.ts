import { Logger } from 'winston';
import { Resource } from './ResourceManager';
import { LoggerFactory } from '@utils/logger';

export abstract class BaseResource implements Resource {
  protected logger: Logger;
  
  abstract uri: string;
  abstract name: string;
  abstract description?: string;
  abstract mimeType?: string;

  constructor() {
    this.logger = LoggerFactory.getLogger(this.constructor.name);
  }

  async initialize(): Promise<void> {
    this.logger.debug(`Initializing resource: ${this.uri}`);
  }

  abstract read(params?: Record<string, unknown>): Promise<unknown>;

  protected validateParams<T extends Record<string, unknown>>(
    params: Record<string, unknown> | undefined,
    required: (keyof T)[]
  ): T {
    if (!params) {
      throw new Error('Parameters are required');
    }

    for (const key of required) {
      if (!(key as string in params)) {
        throw new Error(`Missing required parameter: ${String(key)}`);
      }
    }

    return params as T;
  }
}