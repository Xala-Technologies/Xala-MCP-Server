import { z } from 'zod';
import { ViolationSeverity, ViolationAction } from './quality.types';

export enum RuleCategory {
  TYPESCRIPT_COMPLIANCE = 'typescript_compliance',
  CODE_QUALITY = 'code_quality',
  ACCESSIBILITY_COMPLIANCE = 'accessibility_compliance',
  PACKAGE_SYSTEM = 'package_system',
  BUSINESS_LOGIC = 'business_logic',
}

export const RuleDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.nativeEnum(RuleCategory),
  description: z.string(),
  enabled: z.boolean().default(true),
  severity: z.nativeEnum(ViolationSeverity),
  action: z.nativeEnum(ViolationAction),
  config: z.record(z.unknown()).optional(),
});

export type RuleDefinition = z.infer<typeof RuleDefinitionSchema>;

export const TypeScriptRulesSchema = z.object({
  strictTypes: z.boolean().default(true),
  explicitReturnTypes: z.boolean().default(true),
  noAnyTypes: z.boolean().default(true),
  readonlyInterfaces: z.boolean().default(true),
  maxFileLines: z.number().default(300),
  importOrganization: z.object({
    order: z.array(z.string()).default(['react', 'third-party', 'internal', 'relative']),
    enforceBlankLines: z.boolean().default(true),
  }),
});

export type TypeScriptRules = z.infer<typeof TypeScriptRulesSchema>;

export const CodeQualityRulesSchema = z.object({
  enforceDesignTokens: z.boolean().default(true),
  componentStructure: z.object({
    separateConcerns: z.boolean().default(true),
    maxComplexity: z.number().default(10),
    enforcePropsInterface: z.boolean().default(true),
  }),
  stateManagement: z.object({
    pattern: z.string().default('zustand'),
    enforceImmer: z.boolean().default(true),
  }),
  performanceStandards: z.object({
    requireMemoization: z.boolean().default(true),
    enforceLoadingStates: z.boolean().default(true),
    requireErrorBoundaries: z.boolean().default(true),
  }),
});

export type CodeQualityRules = z.infer<typeof CodeQualityRulesSchema>;

export const AccessibilityRulesSchema = z.object({
  wcagLevel: z.enum(['A', 'AA', 'AAA']).default('AAA'),
  keyboardNavigation: z.boolean().default(true),
  screenReaderSupport: z.boolean().default(true),
  colorContrastRatio: z.number().default(7.0),
  internationalization: z.object({
    multiLanguage: z.boolean().default(true),
    rtlSupport: z.boolean().default(true),
    contextAwareTranslations: z.boolean().default(true),
  }),
  compliance: z.object({
    norwegian: z.object({
      personalNumberValidation: z.boolean().default(true),
      postalCodeValidation: z.boolean().default(true),
      securityClassifications: z.boolean().default(true),
    }),
    gdpr: z.object({
      dataPrivacyPatterns: z.boolean().default(true),
      consentManagement: z.boolean().default(true),
      auditTrails: z.boolean().default(true),
    }),
  }),
});

export type AccessibilityRules = z.infer<typeof AccessibilityRulesSchema>;

export const PackageSystemRulesSchema = z.object({
  structure: z.object({
    barrelExports: z.boolean().default(true),
    noCrossDependencies: z.boolean().default(true),
    cleanArchitecture: z.boolean().default(true),
  }),
  dependencies: z.object({
    versionConsistency: z.boolean().default(true),
    securityChecks: z.boolean().default(true),
    allowedScopes: z.array(z.string()).optional(),
  }),
  documentation: z.object({
    requireReadme: z.boolean().default(true),
    jsdocCoverage: z.number().default(90),
    exampleRequired: z.boolean().default(true),
  }),
});

export type PackageSystemRules = z.infer<typeof PackageSystemRulesSchema>;

export const BusinessLogicRulesSchema = z.object({
  errorHandling: z.object({
    typedErrors: z.boolean().default(true),
    gracefulDegradation: z.boolean().default(true),
    errorBoundaries: z.boolean().default(true),
  }),
  security: z.object({
    inputValidation: z.boolean().default(true),
    sanitization: z.boolean().default(true),
    authenticationPatterns: z.boolean().default(true),
  }),
  apiIntegration: z.object({
    clientPatterns: z.boolean().default(true),
    retryLogic: z.boolean().default(true),
    errorHandling: z.boolean().default(true),
  }),
  testing: z.object({
    unitTestCoverage: z.number().default(80),
    integrationTestRequired: z.boolean().default(true),
    e2eTestRequired: z.boolean().default(true),
  }),
});

export type BusinessLogicRules = z.infer<typeof BusinessLogicRulesSchema>;

export interface RuleConfiguration {
  typescript: TypeScriptRules;
  codeQuality: CodeQualityRules;
  accessibility: AccessibilityRules;
  packageSystem: PackageSystemRules;
  businessLogic: BusinessLogicRules;
  customRules?: RuleDefinition[];
}