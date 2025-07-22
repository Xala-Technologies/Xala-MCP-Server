import { Logger } from 'winston';
import { 
  RuleDefinition, 
  RuleCategory, 
  RuleConfiguration,
  QualityViolation,
  ViolationSeverity,
  ViolationAction,
  ProjectConfig,
} from '@types';
import { LoggerFactory } from '@utils/logger';
import { TypeScriptRuleSet } from './rulesets/TypeScriptRuleSet';
import { CodeQualityRuleSet } from './rulesets/CodeQualityRuleSet';
import { AccessibilityRuleSet } from './rulesets/AccessibilityRuleSet';
import { PackageSystemRuleSet } from './rulesets/PackageSystemRuleSet';
import { BusinessLogicRuleSet } from './rulesets/BusinessLogicRuleSet';

export interface RuleSet {
  category: RuleCategory;
  rules: RuleDefinition[];
  
  initialize(config: RuleConfiguration): Promise<void>;
  validate(filePath: string, content: string): Promise<QualityViolation[]>;
}

export interface RuleContext {
  projectConfig: ProjectConfig;
  filePath: string;
  fileContent: string;
  ast?: any; // Abstract Syntax Tree
  metadata?: Record<string, unknown>;
}

export class RuleEngine {
  private logger: Logger;
  private ruleSets: Map<RuleCategory, RuleSet> = new Map();
  private customRules: RuleDefinition[] = [];
  private initialized = false;

  constructor() {
    this.logger = LoggerFactory.getLogger('RuleEngine');
  }

  async initialize(projectConfig: ProjectConfig): Promise<void> {
    this.logger.info(`Initializing rule engine for project: ${projectConfig.projectId}`);

    try {
      // Initialize built-in rule sets
      const ruleSets: RuleSet[] = [
        new TypeScriptRuleSet(),
        new CodeQualityRuleSet(),
        new AccessibilityRuleSet(),
        new PackageSystemRuleSet(),
        new BusinessLogicRuleSet(),
      ];

      for (const ruleSet of ruleSets) {
        await ruleSet.initialize(projectConfig.rules);
        this.ruleSets.set(ruleSet.category, ruleSet);
        this.logger.debug(`Initialized rule set: ${ruleSet.category}`);
      }

      // Load custom rules
      if (projectConfig.rules.customRules) {
        this.customRules = projectConfig.rules.customRules;
        this.logger.info(`Loaded ${this.customRules.length} custom rules`);
      }

      this.initialized = true;
      this.logger.info('Rule engine initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize rule engine:', error);
      throw error;
    }
  }

  async validateFile(
    filePath: string,
    content: string,
    categories?: RuleCategory[]
  ): Promise<QualityViolation[]> {
    if (!this.initialized) {
      throw new Error('Rule engine not initialized');
    }

    this.logger.debug(`Validating file: ${filePath}`);
    const violations: QualityViolation[] = [];

    try {
      // Determine which rule sets to run
      const ruleSetsToRun = categories
        ? Array.from(this.ruleSets.entries()).filter(([cat]) => categories.includes(cat))
        : Array.from(this.ruleSets.entries());

      // Run each applicable rule set
      for (const [category, ruleSet] of ruleSetsToRun) {
        if (this.shouldRunRuleSet(category, filePath)) {
          const ruleViolations = await ruleSet.validate(filePath, content);
          violations.push(...ruleViolations);
        }
      }

      // Run custom rules
      for (const customRule of this.customRules) {
        if (customRule.enabled && this.shouldRunRule(customRule, filePath)) {
          const customViolations = await this.runCustomRule(customRule, filePath, content);
          violations.push(...customViolations);
        }
      }

      this.logger.debug(`Found ${violations.length} violations in ${filePath}`);
      return violations;
    } catch (error) {
      this.logger.error(`Error validating file ${filePath}:`, error);
      throw error;
    }
  }

  async validateProject(
    projectPath: string,
    filePatterns?: string[]
  ): Promise<Map<string, QualityViolation[]>> {
    if (!this.initialized) {
      throw new Error('Rule engine not initialized');
    }

    this.logger.info(`Validating project: ${projectPath}`);
    const results = new Map<string, QualityViolation[]>();

    try {
      // Get all files to validate
      const files = await this.getProjectFiles(projectPath, filePatterns);
      this.logger.info(`Found ${files.length} files to validate`);

      // Validate each file
      for (const file of files) {
        const content = await this.readFile(file);
        const violations = await this.validateFile(file, content);
        if (violations.length > 0) {
          results.set(file, violations);
        }
      }

      this.logger.info(`Validation complete. Files with violations: ${results.size}`);
      return results;
    } catch (error) {
      this.logger.error('Error validating project:', error);
      throw error;
    }
  }

  determineAction(violations: QualityViolation[]): ViolationAction {
    // Determine the most severe action needed
    const actions = violations.map(v => v.action);
    
    if (actions.includes(ViolationAction.BLOCK_COMMIT)) {
      return ViolationAction.BLOCK_COMMIT;
    } else if (actions.includes(ViolationAction.REQUIRE_REVIEW)) {
      return ViolationAction.REQUIRE_REVIEW;
    } else if (actions.includes(ViolationAction.AUTO_FIX)) {
      return ViolationAction.AUTO_FIX;
    } else if (actions.includes(ViolationAction.LOG_WARNING)) {
      return ViolationAction.LOG_WARNING;
    } else {
      return ViolationAction.SUGGEST_IMPROVEMENT;
    }
  }

  async autoFix(violations: QualityViolation[]): Promise<Map<string, string>> {
    const fixes = new Map<string, string>();
    
    for (const violation of violations) {
      if (violation.action === ViolationAction.AUTO_FIX && violation.autoFix) {
        for (const change of violation.autoFix.changes) {
          // Apply the fix
          const currentContent = fixes.get(change.file) || await this.readFile(change.file);
          const fixedContent = this.applyFix(currentContent, change);
          fixes.set(change.file, fixedContent);
        }
      }
    }

    return fixes;
  }

  private shouldRunRuleSet(category: RuleCategory, filePath: string): boolean {
    // Determine if a rule set should run based on file type
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    switch (category) {
      case RuleCategory.TYPESCRIPT_COMPLIANCE:
        return ext === 'ts' || ext === 'tsx';
      case RuleCategory.CODE_QUALITY:
        return ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'jsx';
      case RuleCategory.ACCESSIBILITY_COMPLIANCE:
        return ext === 'tsx' || ext === 'jsx';
      case RuleCategory.PACKAGE_SYSTEM:
        return filePath.includes('package.json') || filePath.endsWith('index.ts');
      case RuleCategory.BUSINESS_LOGIC:
        return ext === 'ts' || ext === 'tsx';
      default:
        return true;
    }
  }

  private shouldRunRule(rule: RuleDefinition, filePath: string): boolean {
    // Custom logic to determine if a rule should run on a file
    return rule.enabled;
  }

  private async runCustomRule(
    rule: RuleDefinition,
    filePath: string,
    content: string
  ): Promise<QualityViolation[]> {
    // Placeholder for custom rule execution
    return [];
  }

  private async getProjectFiles(projectPath: string, patterns?: string[]): Promise<string[]> {
    // Placeholder - would use glob to find files
    return [];
  }

  private async readFile(filePath: string): Promise<string> {
    // Placeholder - would read file content
    return '';
  }

  private applyFix(content: string, change: any): string {
    // Placeholder - would apply the fix to content
    return content;
  }

  getRuleStatistics(): {
    totalRules: number;
    enabledRules: number;
    rulesByCategory: Record<RuleCategory, number>;
  } {
    const stats = {
      totalRules: 0,
      enabledRules: 0,
      rulesByCategory: {} as Record<RuleCategory, number>,
    };

    for (const [category, ruleSet] of this.ruleSets) {
      const categoryRules = ruleSet.rules;
      stats.totalRules += categoryRules.length;
      stats.enabledRules += categoryRules.filter(r => r.enabled).length;
      stats.rulesByCategory[category] = categoryRules.length;
    }

    stats.totalRules += this.customRules.length;
    stats.enabledRules += this.customRules.filter(r => r.enabled).length;

    return stats;
  }
}