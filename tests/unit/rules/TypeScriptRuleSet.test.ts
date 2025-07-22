import { TypeScriptRuleSet } from '@rules/rulesets/TypeScriptRuleSet';
import { RuleCategory, ViolationSeverity, ViolationAction } from '@types';

describe('TypeScriptRuleSet', () => {
  let ruleSet: TypeScriptRuleSet;

  beforeEach(() => {
    ruleSet = new TypeScriptRuleSet();
  });

  describe('initialization', () => {
    it('should initialize with correct category', () => {
      expect(ruleSet.category).toBe(RuleCategory.TYPESCRIPT_COMPLIANCE);
    });

    it('should have all required rules', () => {
      expect(ruleSet.rules).toHaveLength(5);
      
      const ruleIds = ruleSet.rules.map(r => r.id);
      expect(ruleIds).toContain('ts-no-any');
      expect(ruleIds).toContain('ts-explicit-return');
      expect(ruleIds).toContain('ts-readonly-interfaces');
      expect(ruleIds).toContain('ts-strict-null-checks');
      expect(ruleIds).toContain('ts-import-organization');
    });

    it('should initialize with configuration', async () => {
      const config = {
        typescript: {
          strictTypes: true,
          explicitReturnTypes: true,
          noAnyTypes: true,
          readonlyInterfaces: true,
          maxFileLines: 200,
          importOrganization: {
            order: ['react', 'third-party', 'internal', 'relative'],
            enforceBlankLines: true,
          },
        },
        codeQuality: {} as any,
        accessibility: {} as any,
        packageSystem: {} as any,
        businessLogic: {} as any,
      };

      await ruleSet.initialize(config);
      // Rules should be enabled based on config
      const noAnyRule = ruleSet.rules.find(r => r.id === 'ts-no-any');
      expect(noAnyRule?.enabled).toBe(true);
    });
  });

  describe('validate - no any types', () => {
    it('should detect any type usage', async () => {
      const code = `
        function processData(data: any): void {
          console.log(data);
        }
        
        let value: any = 42;
      `;

      const violations = await ruleSet.validate('test.ts', code);
      const anyViolations = violations.filter(v => v.rule === 'ts-no-any');
      
      expect(anyViolations).toHaveLength(2);
      expect(anyViolations[0].severity).toBe(ViolationSeverity.ERROR);
      expect(anyViolations[0].action).toBe(ViolationAction.BLOCK_COMMIT);
      expect(anyViolations[0].message).toContain('any');
    });

    it('should not flag valid type usage', async () => {
      const code = `
        function processData(data: string): void {
          console.log(data);
        }
        
        let value: number = 42;
      `;

      const violations = await ruleSet.validate('test.ts', code);
      const anyViolations = violations.filter(v => v.rule === 'ts-no-any');
      
      expect(anyViolations).toHaveLength(0);
    });
  });

  describe('validate - explicit return types', () => {
    it('should detect missing return types', async () => {
      const code = `
        function calculate(a: number, b: number) {
          return a + b;
        }
        
        const multiply = (x: number, y: number) => x * y;
      `;

      const violations = await ruleSet.validate('test.ts', code);
      const returnViolations = violations.filter(v => v.rule === 'ts-explicit-return');
      
      expect(returnViolations).toHaveLength(2);
      expect(returnViolations[0].severity).toBe(ViolationSeverity.WARNING);
      expect(returnViolations[0].message).toContain('return type');
    });

    it('should accept explicit return types', async () => {
      const code = `
        function calculate(a: number, b: number): number {
          return a + b;
        }
        
        const multiply = (x: number, y: number): number => x * y;
      `;

      const violations = await ruleSet.validate('test.ts', code);
      const returnViolations = violations.filter(v => v.rule === 'ts-explicit-return');
      
      expect(returnViolations).toHaveLength(0);
    });
  });

  describe('validate - readonly interfaces', () => {
    it('should suggest readonly for interface properties', async () => {
      const code = `
        interface User {
          id: string;
          name: string;
          email: string;
        }
      `;

      const violations = await ruleSet.validate('test.ts', code);
      const readonlyViolations = violations.filter(v => v.rule === 'ts-readonly-interfaces');
      
      expect(readonlyViolations).toHaveLength(3);
      expect(readonlyViolations[0].severity).toBe(ViolationSeverity.INFO);
      expect(readonlyViolations[0].action).toBe(ViolationAction.SUGGEST_IMPROVEMENT);
      expect(readonlyViolations[0].autoFix).toBeDefined();
    });

    it('should accept readonly properties', async () => {
      const code = `
        interface User {
          readonly id: string;
          readonly name: string;
          readonly email: string;
        }
      `;

      const violations = await ruleSet.validate('test.ts', code);
      const readonlyViolations = violations.filter(v => v.rule === 'ts-readonly-interfaces');
      
      expect(readonlyViolations).toHaveLength(0);
    });
  });

  describe('validate - import organization', () => {
    it('should detect incorrect import order', async () => {
      const code = `
        import { Component } from './MyComponent';
        import React from 'react';
        import axios from 'axios';
        import { utils } from '@/utils';
      `;

      const violations = await ruleSet.validate('test.ts', code);
      const importViolations = violations.filter(v => v.rule === 'ts-import-organization');
      
      expect(importViolations.length).toBeGreaterThan(0);
      expect(importViolations[0].action).toBe(ViolationAction.AUTO_FIX);
    });

    it('should accept correct import order', async () => {
      const code = `
        import React from 'react';
        import axios from 'axios';
        import { utils } from '@/utils';
        import { Component } from './MyComponent';
      `;

      const violations = await ruleSet.validate('test.ts', code);
      const importViolations = violations.filter(v => v.rule === 'ts-import-organization');
      
      expect(importViolations).toHaveLength(0);
    });
  });

  describe('validate - file length', () => {
    it('should detect files exceeding max lines', async () => {
      const longCode = Array(350).fill('const a = 1;').join('\n');
      
      const violations = await ruleSet.validate('test.ts', longCode);
      const lengthViolations = violations.filter(v => v.rule === 'ts-max-file-lines');
      
      expect(lengthViolations).toHaveLength(1);
      expect(lengthViolations[0].message).toContain('exceeds maximum line count');
    });
  });
});