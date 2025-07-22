import { z } from 'zod';
import { RuleConfiguration } from './rules.types';
import { QualityThresholds } from './quality.types';

export const ServerConfigSchema = z.object({
  server: z.object({
    port: z.number().default(3000),
    host: z.string().default('localhost'),
    protocol: z.enum(['http', 'ws', 'both']).default('both'),
    cors: z.object({
      enabled: z.boolean().default(true),
      origins: z.array(z.string()).default(['*']),
    }),
  }),
  mcp: z.object({
    capabilities: z.object({
      resources: z.boolean().default(true),
      tools: z.boolean().default(true),
      prompts: z.boolean().default(true),
    }),
    timeout: z.number().default(30000),
    maxRequestSize: z.string().default('10mb'),
  }),
  workflow: z.object({
    autoGenerateSpecs: z.boolean().default(true),
    requireApproval: z.boolean().default(true),
    maxTasksPerBatch: z.number().default(10),
    steeringFilesPath: z.string().default('./steering'),
  }),
  quality: z.object({
    enableGatekeeper: z.boolean().default(true),
    blockOnViolations: z.boolean().default(true),
    autoFix: z.boolean().default(false),
    reportPath: z.string().default('./quality-reports'),
  }),
  hooks: z.object({
    enabled: z.boolean().default(true),
    concurrency: z.number().default(5),
    timeout: z.number().default(5000),
  }),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    format: z.enum(['json', 'text']).default('json'),
    outputPath: z.string().default('./logs'),
  }),
  cache: z.object({
    enabled: z.boolean().default(true),
    ttl: z.number().default(3600),
    maxSize: z.number().default(1000),
  }),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

export interface ProjectConfig {
  projectId: string;
  name: string;
  description?: string;
  rootPath: string;
  rules: RuleConfiguration;
  thresholds: QualityThresholds;
  hooks?: HookConfiguration;
  integrations?: IntegrationConfig;
}

export interface HookConfiguration {
  fileChange: HookDefinition[];
  qualityAssurance: HookDefinition[];
  workflowEvents: HookDefinition[];
}

export interface HookDefinition {
  id: string;
  name: string;
  trigger: string;
  action: string;
  config?: Record<string, unknown>;
}

export interface IntegrationConfig {
  versionControl?: {
    type: 'git';
    hooks: string[];
    branchProtection: boolean;
  };
  cicd?: {
    type: 'github' | 'gitlab' | 'jenkins' | 'azure';
    qualityGates: boolean;
    autoReporting: boolean;
  };
  projectManagement?: {
    type: 'jira' | 'linear' | 'asana';
    syncTasks: boolean;
    updateStatus: boolean;
  };
  communication?: {
    type: 'slack' | 'teams';
    notifications: string[];
    reportChannel: string;
  };
}

export interface ConfigurationManager {
  loadServerConfig(): Promise<ServerConfig>;
  loadProjectConfig(projectId: string): Promise<ProjectConfig>;
  saveProjectConfig(config: ProjectConfig): Promise<void>;
  validateConfig(config: unknown): boolean;
}