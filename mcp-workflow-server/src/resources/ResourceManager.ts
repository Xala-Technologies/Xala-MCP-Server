import { Logger } from 'winston';
import { MCPResource } from '@types';
import { LoggerFactory } from '@utils/logger';
import { ProjectAnalysisResource } from './ProjectAnalysisResource';
import { CodebaseStructureResource } from './CodebaseStructureResource';
import { QualityReportResource } from './QualityReportResource';
import { SpecificationStatusResource } from './SpecificationStatusResource';
import { WorkflowTemplateResource } from './WorkflowTemplateResource';
import { TaskDependencyResource } from './TaskDependencyResource';
import { ComplianceStatusResource } from './ComplianceStatusResource';
import { PerformanceMetricsResource } from './PerformanceMetricsResource';

export interface Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  
  initialize(): Promise<void>;
  read(params?: Record<string, unknown>): Promise<unknown>;
}

export class ResourceManager {
  private logger: Logger;
  private resources: Map<string, Resource> = new Map();

  constructor() {
    this.logger = LoggerFactory.getLogger('ResourceManager');
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing ResourceManager...');

    const resourceInstances: Resource[] = [
      new ProjectAnalysisResource(),
      new CodebaseStructureResource(),
      new QualityReportResource(),
      new SpecificationStatusResource(),
      new WorkflowTemplateResource(),
      new TaskDependencyResource(),
      new ComplianceStatusResource(),
      new PerformanceMetricsResource(),
    ];

    for (const resource of resourceInstances) {
      await this.registerResource(resource);
    }

    this.logger.info(`Initialized ${this.resources.size} resources`);
  }

  private async registerResource(resource: Resource): Promise<void> {
    try {
      await resource.initialize();
      this.resources.set(resource.uri, resource);
      this.logger.debug(`Registered resource: ${resource.uri}`);
    } catch (error) {
      this.logger.error(`Failed to register resource ${resource.uri}:`, error);
      throw error;
    }
  }

  async listResources(): Promise<MCPResource[]> {
    return Array.from(this.resources.values()).map((resource) => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
    }));
  }

  async readResource(uri: string, params?: Record<string, unknown>): Promise<unknown> {
    const resource = this.resources.get(uri);
    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }

    try {
      return await resource.read(params);
    } catch (error) {
      this.logger.error(`Failed to read resource ${uri}:`, error);
      throw error;
    }
  }

  getResource(uri: string): Resource | undefined {
    return this.resources.get(uri);
  }

  hasResource(uri: string): boolean {
    return this.resources.has(uri);
  }
}