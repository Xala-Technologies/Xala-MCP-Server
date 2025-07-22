import { Logger } from 'winston';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { z } from 'zod';
import { 
  ServerConfig, 
  ServerConfigSchema,
  ProjectConfig,
  RuleConfiguration,
  QualityThresholds,
} from '@types';
import { LoggerFactory } from '@utils/logger';

export class ConfigurationManager {
  private logger: Logger;
  private serverConfig?: ServerConfig;
  private projectConfigs: Map<string, ProjectConfig> = new Map();
  private configPath: string;

  constructor(configPath: string = './config') {
    this.logger = LoggerFactory.getLogger('ConfigurationManager');
    this.configPath = configPath;
  }

  async loadServerConfig(): Promise<ServerConfig> {
    if (this.serverConfig) {
      return this.serverConfig;
    }

    try {
      const configFile = path.join(this.configPath, 'server.yaml');
      const configData = await this.loadYamlFile(configFile);
      
      this.serverConfig = ServerConfigSchema.parse(configData);
      this.logger.info('Server configuration loaded successfully');
      
      return this.serverConfig;
    } catch (error) {
      this.logger.warn('Failed to load server config, using defaults:', error);
      this.serverConfig = this.getDefaultServerConfig();
      return this.serverConfig;
    }
  }

  async loadProjectConfig(projectId: string): Promise<ProjectConfig> {
    const cached = this.projectConfigs.get(projectId);
    if (cached) {
      return cached;
    }

    try {
      const projectFile = path.join(this.configPath, 'projects', `${projectId}.yaml`);
      const projectData = await this.loadYamlFile(projectFile);
      
      const config = this.parseProjectConfig(projectId, projectData);
      this.projectConfigs.set(projectId, config);
      
      this.logger.info(`Project configuration loaded: ${projectId}`);
      return config;
    } catch (error) {
      this.logger.error(`Failed to load project config for ${projectId}:`, error);
      throw new Error(`Project configuration not found: ${projectId}`);
    }
  }

  async saveProjectConfig(config: ProjectConfig): Promise<void> {
    const projectFile = path.join(this.configPath, 'projects', `${config.projectId}.yaml`);
    
    try {
      await this.ensureDirectory(path.dirname(projectFile));
      await fs.writeFile(projectFile, yaml.dump(config), 'utf-8');
      
      this.projectConfigs.set(config.projectId, config);
      this.logger.info(`Project configuration saved: ${config.projectId}`);
    } catch (error) {
      this.logger.error(`Failed to save project config:`, error);
      throw error;
    }
  }

  async loadRuleConfiguration(configName: string): Promise<RuleConfiguration> {
    const rulesFile = path.join(this.configPath, 'rules', `${configName}.yaml`);
    
    try {
      const rulesData = await this.loadYamlFile(rulesFile);
      return this.parseRuleConfiguration(rulesData);
    } catch (error) {
      this.logger.warn(`Failed to load rules config ${configName}, using defaults`);
      return this.getDefaultRuleConfiguration();
    }
  }

  async loadQualityThresholds(configName: string): Promise<QualityThresholds> {
    const thresholdsFile = path.join(this.configPath, 'thresholds', `${configName}.yaml`);
    
    try {
      const thresholdsData = await this.loadYamlFile(thresholdsFile);
      return this.parseQualityThresholds(thresholdsData);
    } catch (error) {
      this.logger.warn(`Failed to load thresholds config ${configName}, using defaults`);
      return this.getDefaultQualityThresholds();
    }
  }

  validateConfig(config: unknown): boolean {
    try {
      ServerConfigSchema.parse(config);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Configuration validation failed:', error.errors);
      }
      return false;
    }
  }

  private async loadYamlFile(filePath: string): Promise<unknown> {
    const content = await fs.readFile(filePath, 'utf-8');
    return yaml.load(content);
  }

  private async ensureDirectory(dir: string): Promise<void> {
    await fs.mkdir(dir, { recursive: true });
  }

  private parseProjectConfig(projectId: string, data: any): ProjectConfig {
    return {
      projectId,
      name: data.name || projectId,
      description: data.description,
      rootPath: data.rootPath || process.cwd(),
      rules: this.parseRuleConfiguration(data.rules || {}),
      thresholds: this.parseQualityThresholds(data.thresholds || {}),
      hooks: data.hooks,
      integrations: data.integrations,
    };
  }

  private parseRuleConfiguration(data: any): RuleConfiguration {
    return {
      typescript: {
        strictTypes: data.typescript?.strictTypes ?? true,
        explicitReturnTypes: data.typescript?.explicitReturnTypes ?? true,
        noAnyTypes: data.typescript?.noAnyTypes ?? true,
        readonlyInterfaces: data.typescript?.readonlyInterfaces ?? true,
        maxFileLines: data.typescript?.maxFileLines ?? 300,
        importOrganization: {
          order: data.typescript?.importOrganization?.order ?? ['react', 'third-party', 'internal', 'relative'],
          enforceBlankLines: data.typescript?.importOrganization?.enforceBlankLines ?? true,
        },
      },
      codeQuality: this.getDefaultRuleConfiguration().codeQuality,
      accessibility: this.getDefaultRuleConfiguration().accessibility,
      packageSystem: this.getDefaultRuleConfiguration().packageSystem,
      businessLogic: this.getDefaultRuleConfiguration().businessLogic,
      customRules: data.customRules,
    };
  }

  private parseQualityThresholds(data: any): QualityThresholds {
    return {
      codeQuality: {
        typeSafetyScore: data.codeQuality?.typeSafetyScore ?? 95,
        componentComplexity: data.codeQuality?.componentComplexity ?? 10,
        designTokenCompliance: data.codeQuality?.designTokenCompliance ?? 100,
        testCoverage: {
          unit: data.codeQuality?.testCoverage?.unit ?? 80,
          integration: data.codeQuality?.testCoverage?.integration ?? 70,
          e2e: data.codeQuality?.testCoverage?.e2e ?? 60,
        },
      },
      architectureQuality: {
        packageCouplingScore: data.architectureQuality?.packageCouplingScore ?? 8,
        componentReusability: data.architectureQuality?.componentReusability ?? 70,
        performanceBudget: data.architectureQuality?.performanceBudget ?? '500kb',
        accessibilityScore: data.architectureQuality?.accessibilityScore ?? 95,
      },
      workflowQuality: {
        specificationCompleteness: data.workflowQuality?.specificationCompleteness ?? 90,
        documentationCurrency: data.workflowQuality?.documentationCurrency ?? 85,
        processAdherence: data.workflowQuality?.processAdherence ?? 95,
        reviewQualityScore: data.workflowQuality?.reviewQualityScore ?? 8,
      },
    };
  }

  private getDefaultServerConfig(): ServerConfig {
    return ServerConfigSchema.parse({});
  }

  private getDefaultRuleConfiguration(): RuleConfiguration {
    return {
      typescript: {
        strictTypes: true,
        explicitReturnTypes: true,
        noAnyTypes: true,
        readonlyInterfaces: true,
        maxFileLines: 300,
        importOrganization: {
          order: ['react', 'third-party', 'internal', 'relative'],
          enforceBlankLines: true,
        },
      },
      codeQuality: {
        enforceDesignTokens: true,
        componentStructure: {
          separateConcerns: true,
          maxComplexity: 10,
          enforcePropsInterface: true,
        },
        stateManagement: {
          pattern: 'zustand',
          enforceImmer: true,
        },
        performanceStandards: {
          requireMemoization: true,
          enforceLoadingStates: true,
          requireErrorBoundaries: true,
        },
      },
      accessibility: {
        wcagLevel: 'AAA',
        keyboardNavigation: true,
        screenReaderSupport: true,
        colorContrastRatio: 7.0,
        internationalization: {
          multiLanguage: true,
          rtlSupport: true,
          contextAwareTranslations: true,
        },
        compliance: {
          norwegian: {
            personalNumberValidation: true,
            postalCodeValidation: true,
            securityClassifications: true,
          },
          gdpr: {
            dataPrivacyPatterns: true,
            consentManagement: true,
            auditTrails: true,
          },
        },
      },
      packageSystem: {
        structure: {
          barrelExports: true,
          noCrossDependencies: true,
          cleanArchitecture: true,
        },
        dependencies: {
          versionConsistency: true,
          securityChecks: true,
        },
        documentation: {
          requireReadme: true,
          jsdocCoverage: 90,
          exampleRequired: true,
        },
      },
      businessLogic: {
        errorHandling: {
          typedErrors: true,
          gracefulDegradation: true,
          errorBoundaries: true,
        },
        security: {
          inputValidation: true,
          sanitization: true,
          authenticationPatterns: true,
        },
        apiIntegration: {
          clientPatterns: true,
          retryLogic: true,
          errorHandling: true,
        },
        testing: {
          unitTestCoverage: 80,
          integrationTestRequired: true,
          e2eTestRequired: true,
        },
      },
    };
  }

  private getDefaultQualityThresholds(): QualityThresholds {
    return {
      codeQuality: {
        typeSafetyScore: 95,
        componentComplexity: 10,
        designTokenCompliance: 100,
        testCoverage: {
          unit: 80,
          integration: 70,
          e2e: 60,
        },
      },
      architectureQuality: {
        packageCouplingScore: 8,
        componentReusability: 70,
        performanceBudget: '500kb',
        accessibilityScore: 95,
      },
      workflowQuality: {
        specificationCompleteness: 90,
        documentationCurrency: 85,
        processAdherence: 95,
        reviewQualityScore: 8,
      },
    };
  }
}