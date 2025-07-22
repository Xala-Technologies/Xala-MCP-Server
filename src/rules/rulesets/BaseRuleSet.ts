import { Logger } from 'winston';
import { RuleSet } from '../RuleEngine';
import {
  RuleCategory,
  RuleDefinition,
  RuleConfiguration,
  QualityViolation,
} from '@types';
import { LoggerFactory } from '@utils/logger';

export abstract class BaseRuleSet implements RuleSet {
  protected logger: Logger;
  abstract category: RuleCategory;
  abstract rules: RuleDefinition[];

  constructor() {
    this.logger = LoggerFactory.getLogger(this.constructor.name);
  }

  async initialize(config: RuleConfiguration): Promise<void> {
    this.logger.debug(`Initializing ${this.category} rule set`);
  }

  abstract validate(filePath: string, content: string): Promise<QualityViolation[]>;

  protected isRuleEnabled(ruleId: string): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    return rule?.enabled ?? false;
  }

  protected setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  protected getRuleSeverity(ruleId: string): string {
    const rule = this.rules.find(r => r.id === ruleId);
    return rule?.severity ?? 'info';
  }

  protected getRuleAction(ruleId: string): string {
    const rule = this.rules.find(r => r.id === ruleId);
    return rule?.action ?? 'log_warning';
  }
}