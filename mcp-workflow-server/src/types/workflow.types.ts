import { z } from 'zod';

export enum SpecificationPhase {
  REQUIREMENTS = 'requirements',
  DESIGN = 'design',
  TASKS = 'tasks',
}

export enum WorkflowStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
}

export const RequirementSchema = z.object({
  id: z.string(),
  type: z.enum(['functional', 'non_functional', 'compliance']),
  description: z.string(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  acceptanceCriteria: z.array(z.string()),
  userStory: z.string().optional(),
  earsFormat: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
});

export type Requirement = z.infer<typeof RequirementSchema>;

export const DesignDocumentSchema = z.object({
  architecture: z.object({
    patterns: z.array(z.string()),
    decisions: z.array(z.object({
      title: z.string(),
      decision: z.string(),
      consequences: z.string(),
      alternatives: z.array(z.string()).optional(),
    })),
  }),
  interfaces: z.array(z.object({
    name: z.string(),
    definition: z.string(),
    usage: z.string(),
  })),
  dataFlow: z.array(z.object({
    from: z.string(),
    to: z.string(),
    data: z.string(),
    protocol: z.string().optional(),
  })),
  integrations: z.array(z.object({
    system: z.string(),
    type: z.string(),
    endpoints: z.array(z.string()),
  })),
});

export type DesignDocument = z.infer<typeof DesignDocumentSchema>;

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(['feature', 'bug', 'refactor', 'test', 'documentation']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  status: z.nativeEnum(WorkflowStatus),
  assignee: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  acceptanceCriteria: z.array(z.string()),
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
  testingRequirements: z.object({
    unit: z.boolean(),
    integration: z.boolean(),
    e2e: z.boolean(),
    performance: z.boolean().optional(),
  }),
});

export type Task = z.infer<typeof TaskSchema>;

export const SteeringFileSchema = z.object({
  project: z.object({
    vision: z.string(),
    businessContext: z.string(),
    stakeholders: z.array(z.object({
      name: z.string(),
      role: z.string(),
      concerns: z.array(z.string()),
    })),
    constraints: z.array(z.string()),
    assumptions: z.array(z.string()),
  }),
  tech: z.object({
    stack: z.record(z.string()),
    patterns: z.array(z.string()),
    standards: z.array(z.string()),
    dependencies: z.record(z.string()),
  }),
  structure: z.object({
    packages: z.array(z.object({
      name: z.string(),
      purpose: z.string(),
      exports: z.array(z.string()),
    })),
    conventions: z.object({
      naming: z.record(z.string()),
      fileOrganization: z.record(z.string()),
    }),
  }),
});

export type SteeringFiles = z.infer<typeof SteeringFileSchema>;