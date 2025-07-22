import { RuleSet, RuleContext } from '../RuleEngine';
import {
  RuleCategory,
  RuleDefinition,
  RuleConfiguration,
  QualityViolation,
  ViolationSeverity,
  ViolationAction,
  TypeScriptRules,
} from '@types';
import * as ts from 'typescript';
import { BaseRuleSet } from './BaseRuleSet';

export class TypeScriptRuleSet extends BaseRuleSet implements RuleSet {
  category = RuleCategory.TYPESCRIPT_COMPLIANCE;
  private config?: TypeScriptRules;
  private program?: ts.Program;

  rules: RuleDefinition[] = [
    {
      id: 'ts-no-any',
      name: 'No Any Types',
      category: RuleCategory.TYPESCRIPT_COMPLIANCE,
      description: 'Disallow usage of the any type',
      enabled: true,
      severity: ViolationSeverity.ERROR,
      action: ViolationAction.BLOCK_COMMIT,
    },
    {
      id: 'ts-explicit-return',
      name: 'Explicit Return Types',
      category: RuleCategory.TYPESCRIPT_COMPLIANCE,
      description: 'Require explicit return types on functions',
      enabled: true,
      severity: ViolationSeverity.WARNING,
      action: ViolationAction.REQUIRE_REVIEW,
    },
    {
      id: 'ts-readonly-interfaces',
      name: 'Readonly Interfaces',
      category: RuleCategory.TYPESCRIPT_COMPLIANCE,
      description: 'Prefer readonly properties in interfaces',
      enabled: true,
      severity: ViolationSeverity.INFO,
      action: ViolationAction.SUGGEST_IMPROVEMENT,
    },
    {
      id: 'ts-strict-null-checks',
      name: 'Strict Null Checks',
      category: RuleCategory.TYPESCRIPT_COMPLIANCE,
      description: 'Ensure strict null checking is enabled',
      enabled: true,
      severity: ViolationSeverity.ERROR,
      action: ViolationAction.BLOCK_COMMIT,
    },
    {
      id: 'ts-import-organization',
      name: 'Import Organization',
      category: RuleCategory.TYPESCRIPT_COMPLIANCE,
      description: 'Enforce proper import organization',
      enabled: true,
      severity: ViolationSeverity.WARNING,
      action: ViolationAction.AUTO_FIX,
    },
  ];

  async initialize(config: RuleConfiguration): Promise<void> {
    await super.initialize(config);
    this.config = config.typescript;
    
    // Update rule enablement based on config
    this.updateRuleStates();
  }

  async validate(filePath: string, content: string): Promise<QualityViolation[]> {
    const violations: QualityViolation[] = [];

    try {
      // Create a TypeScript source file
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      // Run each enabled rule
      if (this.isRuleEnabled('ts-no-any')) {
        violations.push(...this.checkNoAny(sourceFile, filePath));
      }

      if (this.isRuleEnabled('ts-explicit-return')) {
        violations.push(...this.checkExplicitReturnTypes(sourceFile, filePath));
      }

      if (this.isRuleEnabled('ts-readonly-interfaces')) {
        violations.push(...this.checkReadonlyInterfaces(sourceFile, filePath));
      }

      if (this.isRuleEnabled('ts-import-organization')) {
        violations.push(...this.checkImportOrganization(sourceFile, filePath));
      }

      // Check file length
      const lines = content.split('\n');
      if (lines.length > (this.config?.maxFileLines || 300)) {
        violations.push({
          id: `${filePath}-file-too-long`,
          rule: 'ts-max-file-lines',
          category: this.category,
          severity: ViolationSeverity.WARNING,
          action: ViolationAction.REQUIRE_REVIEW,
          file: filePath,
          line: lines.length,
          message: `File exceeds maximum line count of ${this.config?.maxFileLines || 300}`,
          suggestion: 'Consider splitting this file into smaller modules',
        });
      }

    } catch (error) {
      this.logger.error(`Error validating TypeScript file ${filePath}:`, error);
    }

    return violations;
  }

  private checkNoAny(sourceFile: ts.SourceFile, filePath: string): QualityViolation[] {
    const violations: QualityViolation[] = [];
    
    const checkNode = (node: ts.Node) => {
      if (node.kind === ts.SyntaxKind.AnyKeyword) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        violations.push({
          id: `${filePath}-${line}-${character}-any`,
          rule: 'ts-no-any',
          category: this.category,
          severity: ViolationSeverity.ERROR,
          action: ViolationAction.BLOCK_COMMIT,
          file: filePath,
          line: line + 1,
          column: character + 1,
          message: 'Usage of "any" type is not allowed',
          suggestion: 'Replace with a specific type or use "unknown" if type is truly unknown',
        });
      }
      
      ts.forEachChild(node, checkNode);
    };

    checkNode(sourceFile);
    return violations;
  }

  private checkExplicitReturnTypes(sourceFile: ts.SourceFile, filePath: string): QualityViolation[] {
    const violations: QualityViolation[] = [];
    
    const checkNode = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node)) {
        if (!node.type && !this.isImplicitVoid(node)) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const functionName = this.getFunctionName(node);
          
          violations.push({
            id: `${filePath}-${line}-${character}-return-type`,
            rule: 'ts-explicit-return',
            category: this.category,
            severity: ViolationSeverity.WARNING,
            action: ViolationAction.REQUIRE_REVIEW,
            file: filePath,
            line: line + 1,
            column: character + 1,
            message: `Function "${functionName}" is missing explicit return type`,
            suggestion: 'Add explicit return type annotation',
          });
        }
      }
      
      ts.forEachChild(node, checkNode);
    };

    checkNode(sourceFile);
    return violations;
  }

  private checkReadonlyInterfaces(sourceFile: ts.SourceFile, filePath: string): QualityViolation[] {
    const violations: QualityViolation[] = [];
    
    const checkNode = (node: ts.Node) => {
      if (ts.isInterfaceDeclaration(node)) {
        node.members.forEach(member => {
          if (ts.isPropertySignature(member) && !member.modifiers?.some(m => m.kind === ts.SyntaxKind.ReadonlyKeyword)) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(member.getStart());
            const propertyName = member.name?.getText();
            
            violations.push({
              id: `${filePath}-${line}-${character}-readonly`,
              rule: 'ts-readonly-interfaces',
              category: this.category,
              severity: ViolationSeverity.INFO,
              action: ViolationAction.SUGGEST_IMPROVEMENT,
              file: filePath,
              line: line + 1,
              column: character + 1,
              message: `Property "${propertyName}" in interface "${node.name.text}" should be readonly`,
              suggestion: 'Add readonly modifier to prevent accidental mutations',
              autoFix: {
                description: 'Add readonly modifier',
                changes: [{
                  file: filePath,
                  line: line + 1,
                  column: character + 1,
                  original: propertyName || '',
                  replacement: `readonly ${propertyName}`,
                }],
              },
            });
          }
        });
      }
      
      ts.forEachChild(node, checkNode);
    };

    checkNode(sourceFile);
    return violations;
  }

  private checkImportOrganization(sourceFile: ts.SourceFile, filePath: string): QualityViolation[] {
    const violations: QualityViolation[] = [];
    const imports: { node: ts.ImportDeclaration; category: string }[] = [];
    
    // Collect all imports
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier.getText().slice(1, -1); // Remove quotes
        const category = this.categorizeImport(moduleSpecifier);
        imports.push({ node, category });
      }
    };
    
    ts.forEachChild(sourceFile, visit);
    
    // Check import order
    const expectedOrder = this.config?.importOrganization?.order || ['react', 'third-party', 'internal', 'relative'];
    let lastCategoryIndex = -1;
    
    imports.forEach(({ node, category }) => {
      const categoryIndex = expectedOrder.indexOf(category);
      if (categoryIndex < lastCategoryIndex) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        violations.push({
          id: `${filePath}-${line}-import-order`,
          rule: 'ts-import-organization',
          category: this.category,
          severity: ViolationSeverity.WARNING,
          action: ViolationAction.AUTO_FIX,
          file: filePath,
          line: line + 1,
          message: `Import "${node.moduleSpecifier.getText()}" is in wrong order`,
          suggestion: `Should be grouped with ${category} imports`,
        });
      }
      lastCategoryIndex = Math.max(lastCategoryIndex, categoryIndex);
    });
    
    return violations;
  }

  private categorizeImport(moduleSpecifier: string): string {
    if (moduleSpecifier === 'react' || moduleSpecifier.startsWith('react/')) {
      return 'react';
    } else if (moduleSpecifier.startsWith('.')) {
      return 'relative';
    } else if (moduleSpecifier.startsWith('@/') || moduleSpecifier.startsWith('@')) {
      return 'internal';
    } else {
      return 'third-party';
    }
  }

  private isImplicitVoid(node: ts.FunctionDeclaration | ts.ArrowFunction | ts.MethodDeclaration): boolean {
    // Check if function body is empty or only contains void expressions
    return false; // Simplified implementation
  }

  private getFunctionName(node: ts.FunctionDeclaration | ts.ArrowFunction | ts.MethodDeclaration): string {
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
      return node.name?.getText() || 'anonymous';
    }
    return 'arrow function';
  }

  private updateRuleStates(): void {
    if (!this.config) return;

    this.setRuleEnabled('ts-no-any', this.config.noAnyTypes);
    this.setRuleEnabled('ts-explicit-return', this.config.explicitReturnTypes);
    this.setRuleEnabled('ts-readonly-interfaces', this.config.readonlyInterfaces);
  }
}