import { z } from 'zod';

export enum ViolationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  SUGGESTION = 'suggestion',
}

export enum ViolationAction {
  BLOCK_COMMIT = 'block_commit',
  REQUIRE_REVIEW = 'require_review',
  LOG_WARNING = 'log_warning',
  SUGGEST_IMPROVEMENT = 'suggest_improvement',
  AUTO_FIX = 'auto_fix',
}

export const QualityViolationSchema = z.object({
  id: z.string(),
  rule: z.string(),
  category: z.string(),
  severity: z.nativeEnum(ViolationSeverity),
  action: z.nativeEnum(ViolationAction),
  file: z.string(),
  line: z.number().optional(),
  column: z.number().optional(),
  message: z.string(),
  suggestion: z.string().optional(),
  autoFix: z.object({
    description: z.string(),
    changes: z.array(z.object({
      file: z.string(),
      line: z.number(),
      column: z.number(),
      original: z.string(),
      replacement: z.string(),
    })),
  }).optional(),
});

export type QualityViolation = z.infer<typeof QualityViolationSchema>;

export const QualityReportSchema = z.object({
  timestamp: z.string().datetime(),
  projectId: z.string(),
  summary: z.object({
    totalViolations: z.number(),
    errorCount: z.number(),
    warningCount: z.number(),
    infoCount: z.number(),
    suggestionCount: z.number(),
  }),
  metrics: z.object({
    codeQuality: z.object({
      typeSafetyScore: z.number(),
      componentComplexity: z.number(),
      designTokenCompliance: z.number(),
      testCoverage: z.object({
        unit: z.number(),
        integration: z.number(),
        e2e: z.number(),
      }),
    }),
    architectureQuality: z.object({
      packageCouplingScore: z.number(),
      componentReusability: z.number(),
      performanceBudget: z.string(),
      accessibilityScore: z.number(),
    }),
    workflowQuality: z.object({
      specificationCompleteness: z.number(),
      documentationCurrency: z.number(),
      processAdherence: z.number(),
      reviewQualityScore: z.number(),
    }),
  }),
  violations: z.array(QualityViolationSchema),
  passed: z.boolean(),
});

export type QualityReport = z.infer<typeof QualityReportSchema>;

export interface QualityThresholds {
  codeQuality: {
    typeSafetyScore: number;
    componentComplexity: number;
    designTokenCompliance: number;
    testCoverage: {
      unit: number;
      integration: number;
      e2e: number;
    };
  };
  architectureQuality: {
    packageCouplingScore: number;
    componentReusability: number;
    performanceBudget: string;
    accessibilityScore: number;
  };
  workflowQuality: {
    specificationCompleteness: number;
    documentationCurrency: number;
    processAdherence: number;
    reviewQualityScore: number;
  };
}