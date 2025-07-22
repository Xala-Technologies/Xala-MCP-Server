import { RuleSet } from '../RuleEngine';
import {
  RuleCategory,
  RuleDefinition,
  RuleConfiguration,
  QualityViolation,
  ViolationSeverity,
  ViolationAction,
  CodeQualityRules,
} from '@types';
import { BaseRuleSet } from './BaseRuleSet';
import * as ts from 'typescript';

export class CodeQualityRuleSet extends BaseRuleSet implements RuleSet {
  category = RuleCategory.CODE_QUALITY;
  private config?: CodeQualityRules;

  rules: RuleDefinition[] = [
    {
      id: 'cq-design-tokens',
      name: 'Design Token Usage',
      category: RuleCategory.CODE_QUALITY,
      description: 'Enforce usage of design tokens instead of hardcoded values',
      enabled: true,
      severity: ViolationSeverity.ERROR,
      action: ViolationAction.BLOCK_COMMIT,
    },
    {
      id: 'cq-component-structure',
      name: 'Component Structure',
      category: RuleCategory.CODE_QUALITY,
      description: 'Enforce proper component structure and separation of concerns',
      enabled: true,
      severity: ViolationSeverity.WARNING,
      action: ViolationAction.REQUIRE_REVIEW,
    },
    {
      id: 'cq-state-management',
      name: 'State Management Patterns',
      category: RuleCategory.CODE_QUALITY,
      description: 'Enforce proper state management patterns',
      enabled: true,
      severity: ViolationSeverity.WARNING,
      action: ViolationAction.REQUIRE_REVIEW,
    },
    {
      id: 'cq-performance',
      name: 'Performance Standards',
      category: RuleCategory.CODE_QUALITY,
      description: 'Enforce React performance best practices',
      enabled: true,
      severity: ViolationSeverity.INFO,
      action: ViolationAction.SUGGEST_IMPROVEMENT,
    },
    {
      id: 'cq-complexity',
      name: 'Component Complexity',
      category: RuleCategory.CODE_QUALITY,
      description: 'Limit cyclomatic complexity of components',
      enabled: true,
      severity: ViolationSeverity.WARNING,
      action: ViolationAction.REQUIRE_REVIEW,
    },
  ];

  async initialize(config: RuleConfiguration): Promise<void> {
    await super.initialize(config);
    this.config = config.codeQuality;
    this.updateRuleStates();
  }

  async validate(filePath: string, content: string): Promise<QualityViolation[]> {
    const violations: QualityViolation[] = [];

    try {
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      if (this.isRuleEnabled('cq-design-tokens')) {
        violations.push(...this.checkDesignTokenUsage(sourceFile, filePath, content));
      }

      if (this.isRuleEnabled('cq-component-structure')) {
        violations.push(...this.checkComponentStructure(sourceFile, filePath));
      }

      if (this.isRuleEnabled('cq-state-management')) {
        violations.push(...this.checkStateManagement(sourceFile, filePath));
      }

      if (this.isRuleEnabled('cq-performance')) {
        violations.push(...this.checkPerformancePatterns(sourceFile, filePath));
      }

      if (this.isRuleEnabled('cq-complexity')) {
        violations.push(...this.checkComplexity(sourceFile, filePath));
      }

    } catch (error) {
      this.logger.error(`Error validating code quality for ${filePath}:`, error);
    }

    return violations;
  }

  private checkDesignTokenUsage(
    sourceFile: ts.SourceFile,
    filePath: string,
    content: string
  ): QualityViolation[] {
    const violations: QualityViolation[] = [];
    
    // Check for hardcoded values in style props and styled components
    const hardcodedPatterns = [
      /color:\s*['"]#[0-9a-fA-F]{3,6}['"]/g,
      /backgroundColor:\s*['"]#[0-9a-fA-F]{3,6}['"]/g,
      /fontSize:\s*['"]?\d+px['"]/g,
      /margin:\s*['"]?\d+px['"]/g,
      /padding:\s*['"]?\d+px['"]/g,
      /borderRadius:\s*['"]?\d+px['"]/g,
    ];

    const lines = content.split('\n');
    
    hardcodedPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const position = match.index;
        const { line, character } = this.getLineAndColumn(content, position);
        
        violations.push({
          id: `${filePath}-${line}-${character}-hardcoded`,
          rule: 'cq-design-tokens',
          category: this.category,
          severity: ViolationSeverity.ERROR,
          action: ViolationAction.BLOCK_COMMIT,
          file: filePath,
          line,
          column: character,
          message: `Hardcoded style value "${match[0]}" should use design tokens`,
          suggestion: 'Import and use design tokens from your theme',
          autoFix: {
            description: 'Replace with design token',
            changes: [{
              file: filePath,
              line,
              column: character,
              original: match[0],
              replacement: this.suggestDesignToken(match[0]),
            }],
          },
        });
      }
    });

    return violations;
  }

  private checkComponentStructure(sourceFile: ts.SourceFile, filePath: string): QualityViolation[] {
    const violations: QualityViolation[] = [];
    
    const checkNode = (node: ts.Node) => {
      // Check for components without proper props interface
      if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
        const isComponent = this.isReactComponent(node);
        if (isComponent && !this.hasPropsInterface(node)) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          
          violations.push({
            id: `${filePath}-${line}-${character}-props`,
            rule: 'cq-component-structure',
            category: this.category,
            severity: ViolationSeverity.WARNING,
            action: ViolationAction.REQUIRE_REVIEW,
            file: filePath,
            line: line + 1,
            column: character + 1,
            message: 'React component missing props interface',
            suggestion: 'Define a TypeScript interface for component props',
          });
        }
        
        // Check for mixed concerns (UI + business logic)
        if (isComponent && this.hasMixedConcerns(node)) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          
          violations.push({
            id: `${filePath}-${line}-mixed-concerns`,
            rule: 'cq-component-structure',
            category: this.category,
            severity: ViolationSeverity.WARNING,
            action: ViolationAction.REQUIRE_REVIEW,
            file: filePath,
            line: line + 1,
            message: 'Component mixes UI and business logic',
            suggestion: 'Extract business logic to custom hooks or services',
          });
        }
      }
      
      ts.forEachChild(node, checkNode);
    };

    checkNode(sourceFile);
    return violations;
  }

  private checkStateManagement(sourceFile: ts.SourceFile, filePath: string): QualityViolation[] {
    const violations: QualityViolation[] = [];
    
    const checkNode = (node: ts.Node) => {
      // Check for direct state mutations
      if (ts.isCallExpression(node) && node.expression.getText().includes('setState')) {
        const arg = node.arguments[0];
        if (arg && this.isDirectMutation(arg)) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          
          violations.push({
            id: `${filePath}-${line}-${character}-mutation`,
            rule: 'cq-state-management',
            category: this.category,
            severity: ViolationSeverity.WARNING,
            action: ViolationAction.REQUIRE_REVIEW,
            file: filePath,
            line: line + 1,
            column: character + 1,
            message: 'Direct state mutation detected',
            suggestion: 'Use immutable update patterns or Immer',
          });
        }
      }
      
      ts.forEachChild(node, checkNode);
    };

    checkNode(sourceFile);
    return violations;
  }

  private checkPerformancePatterns(sourceFile: ts.SourceFile, filePath: string): QualityViolation[] {
    const violations: QualityViolation[] = [];
    
    const checkNode = (node: ts.Node) => {
      // Check for missing React.memo on pure components
      if (this.isPureComponent(node) && !this.isMemorized(node)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const componentName = this.getComponentName(node);
        
        violations.push({
          id: `${filePath}-${line}-memo`,
          rule: 'cq-performance',
          category: this.category,
          severity: ViolationSeverity.INFO,
          action: ViolationAction.SUGGEST_IMPROVEMENT,
          file: filePath,
          line: line + 1,
          message: `Component "${componentName}" could benefit from React.memo`,
          suggestion: 'Wrap component with React.memo to prevent unnecessary re-renders',
        });
      }
      
      // Check for missing useMemo/useCallback
      if (ts.isCallExpression(node) && this.shouldMemoize(node)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        
        violations.push({
          id: `${filePath}-${line}-memoize`,
          rule: 'cq-performance',
          category: this.category,
          severity: ViolationSeverity.INFO,
          action: ViolationAction.SUGGEST_IMPROVEMENT,
          file: filePath,
          line: line + 1,
          message: 'Expensive computation should be memoized',
          suggestion: 'Use useMemo or useCallback to optimize performance',
        });
      }
      
      ts.forEachChild(node, checkNode);
    };

    checkNode(sourceFile);
    return violations;
  }

  private checkComplexity(sourceFile: ts.SourceFile, filePath: string): QualityViolation[] {
    const violations: QualityViolation[] = [];
    const maxComplexity = this.config?.componentStructure?.maxComplexity || 10;
    
    const checkNode = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node)) {
        const complexity = this.calculateCyclomaticComplexity(node);
        
        if (complexity > maxComplexity) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const functionName = this.getFunctionName(node);
          
          violations.push({
            id: `${filePath}-${line}-complexity`,
            rule: 'cq-complexity',
            category: this.category,
            severity: ViolationSeverity.WARNING,
            action: ViolationAction.REQUIRE_REVIEW,
            file: filePath,
            line: line + 1,
            message: `Function "${functionName}" has cyclomatic complexity of ${complexity} (max: ${maxComplexity})`,
            suggestion: 'Break down complex logic into smaller functions',
          });
        }
      }
      
      ts.forEachChild(node, checkNode);
    };

    checkNode(sourceFile);
    return violations;
  }

  private getLineAndColumn(content: string, position: number): { line: number; character: number } {
    const lines = content.substring(0, position).split('\n');
    return {
      line: lines.length,
      character: lines[lines.length - 1].length + 1,
    };
  }

  private suggestDesignToken(hardcodedValue: string): string {
    // Simplified token suggestion
    if (hardcodedValue.includes('color') || hardcodedValue.includes('#')) {
      return 'theme.colors.primary';
    } else if (hardcodedValue.includes('px')) {
      const value = parseInt(hardcodedValue);
      if (value <= 8) return 'theme.spacing.xs';
      if (value <= 16) return 'theme.spacing.sm';
      if (value <= 24) return 'theme.spacing.md';
      return 'theme.spacing.lg';
    }
    return 'theme.tokens.value';
  }

  private isReactComponent(node: ts.Node): boolean {
    // Simplified check - would need more sophisticated logic
    return true;
  }

  private hasPropsInterface(node: ts.Node): boolean {
    // Simplified check
    return false;
  }

  private hasMixedConcerns(node: ts.Node): boolean {
    // Check if component has both UI rendering and business logic
    return false;
  }

  private isDirectMutation(node: ts.Node): boolean {
    // Check for patterns like state.prop = value
    return false;
  }

  private isPureComponent(node: ts.Node): boolean {
    // Check if component has no side effects
    return false;
  }

  private isMemorized(node: ts.Node): boolean {
    // Check if wrapped in React.memo
    return false;
  }

  private shouldMemoize(node: ts.Node): boolean {
    // Check if computation is expensive
    return false;
  }

  private getComponentName(node: ts.Node): string {
    return 'Component';
  }

  private getFunctionName(node: ts.Node): string {
    return 'function';
  }

  private calculateCyclomaticComplexity(node: ts.Node): number {
    // Simplified complexity calculation
    let complexity = 1;
    
    const visit = (n: ts.Node) => {
      if (ts.isIfStatement(n) || ts.isConditionalExpression(n)) complexity++;
      if (ts.isWhileStatement(n) || ts.isForStatement(n)) complexity++;
      if (ts.isCaseClause(n)) complexity++;
      ts.forEachChild(n, visit);
    };
    
    visit(node);
    return complexity;
  }

  private updateRuleStates(): void {
    if (!this.config) return;

    this.setRuleEnabled('cq-design-tokens', this.config.enforceDesignTokens);
    this.setRuleEnabled('cq-component-structure', this.config.componentStructure.separateConcerns);
    this.setRuleEnabled('cq-performance', this.config.performanceStandards.requireMemoization);
  }
}