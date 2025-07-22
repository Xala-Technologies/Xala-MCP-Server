import { z } from 'zod';

export const MetricDataPointSchema = z.object({
  timestamp: z.string().datetime(),
  value: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

export type MetricDataPoint = z.infer<typeof MetricDataPointSchema>;

export const CodeMetricsSchema = z.object({
  typeSafety: z.object({
    totalFiles: z.number(),
    typedFiles: z.number(),
    anyUsageCount: z.number(),
    explicitReturnTypes: z.number(),
    implicitAny: z.number(),
  }),
  complexity: z.object({
    averageCyclomaticComplexity: z.number(),
    maxCyclomaticComplexity: z.number(),
    averageNestingDepth: z.number(),
    maxNestingDepth: z.number(),
  }),
  designSystem: z.object({
    totalStyleUsages: z.number(),
    designTokenUsages: z.number(),
    hardcodedValues: z.number(),
    compliancePercentage: z.number(),
  }),
  coverage: z.object({
    statements: z.number(),
    branches: z.number(),
    functions: z.number(),
    lines: z.number(),
  }),
});

export type CodeMetrics = z.infer<typeof CodeMetricsSchema>;

export const ArchitectureMetricsSchema = z.object({
  packages: z.object({
    total: z.number(),
    withBarrelExports: z.number(),
    withDocumentation: z.number(),
    averageDependencies: z.number(),
  }),
  dependencies: z.object({
    internal: z.number(),
    external: z.number(),
    circular: z.number(),
    outdated: z.number(),
    vulnerable: z.number(),
  }),
  components: z.object({
    total: z.number(),
    reusable: z.number(),
    averageUsage: z.number(),
    withTests: z.number(),
  }),
  performance: z.object({
    bundleSize: z.number(),
    chunkCount: z.number(),
    averageLoadTime: z.number(),
    criticalPathLength: z.number(),
  }),
});

export type ArchitectureMetrics = z.infer<typeof ArchitectureMetricsSchema>;

export const WorkflowMetricsSchema = z.object({
  specifications: z.object({
    total: z.number(),
    complete: z.number(),
    inProgress: z.number(),
    averageCompletionTime: z.number(),
  }),
  tasks: z.object({
    total: z.number(),
    completed: z.number(),
    inProgress: z.number(),
    blocked: z.number(),
    averageCompletionTime: z.number(),
    velocityPerWeek: z.number(),
  }),
  quality: z.object({
    violationsPerCommit: z.number(),
    fixTime: z.number(),
    reviewCycles: z.number(),
    firstTimePassRate: z.number(),
  }),
  documentation: z.object({
    coverage: z.number(),
    staleness: z.number(),
    averageUpdateFrequency: z.number(),
  }),
});

export type WorkflowMetrics = z.infer<typeof WorkflowMetricsSchema>;

export const DeveloperMetricsSchema = z.object({
  productivity: z.object({
    commitsPerDay: z.number(),
    linesOfCodePerDay: z.number(),
    tasksCompletedPerWeek: z.number(),
    averageReviewTime: z.number(),
  }),
  quality: z.object({
    defectDensity: z.number(),
    codeReviewComments: z.number(),
    testWritingRatio: z.number(),
    documentationContribution: z.number(),
  }),
  collaboration: z.object({
    codeReviewsGiven: z.number(),
    codeReviewsReceived: z.number(),
    pairProgrammingHours: z.number(),
    knowledgeSharingScore: z.number(),
  }),
});

export type DeveloperMetrics = z.infer<typeof DeveloperMetricsSchema>;

export interface MetricsSnapshot {
  timestamp: string;
  projectId: string;
  code: CodeMetrics;
  architecture: ArchitectureMetrics;
  workflow: WorkflowMetrics;
  developer?: DeveloperMetrics;
}

export interface MetricsTrend {
  metric: string;
  period: 'day' | 'week' | 'month' | 'quarter';
  dataPoints: MetricDataPoint[];
  trend: 'improving' | 'stable' | 'declining';
  changePercentage: number;
}