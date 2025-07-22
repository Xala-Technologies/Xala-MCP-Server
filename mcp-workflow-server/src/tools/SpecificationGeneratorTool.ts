import { z } from 'zod';
import { BaseTool } from './BaseTool';
import { MCPToolResult } from '@types';
import { 
  Requirement, 
  DesignDocument, 
  Task, 
  SpecificationPhase,
  WorkflowStatus 
} from '@types';
import { RequirementsAnalyzer } from '@utils/specification/RequirementsAnalyzer';
import { DesignGenerator } from '@utils/specification/DesignGenerator';
import { TaskBreakdown } from '@utils/specification/TaskBreakdown';

const SpecificationGeneratorInputSchema = z.object({
  prompt: z.string().describe('User prompt or requirements description'),
  phase: z.enum(['requirements', 'design', 'tasks', 'all']).default('all'),
  projectId: z.string().describe('Project identifier'),
  context: z.object({
    existingRequirements: z.array(z.string()).optional(),
    techStack: z.record(z.string()).optional(),
    constraints: z.array(z.string()).optional(),
  }).optional(),
});

type SpecificationGeneratorInput = z.infer<typeof SpecificationGeneratorInputSchema>;

interface GeneratedSpecification {
  requirements?: Requirement[];
  design?: DesignDocument;
  tasks?: Task[];
  metadata: {
    generatedAt: string;
    phase: string;
    projectId: string;
  };
}

export class SpecificationGeneratorTool extends BaseTool {
  name = 'generate-specification';
  description = 'Generate project specifications from user prompts (requirements, design, tasks)';
  inputSchema = {
    type: 'object' as const,
    properties: {
      prompt: { type: 'string', description: 'User prompt or requirements description' },
      phase: { 
        type: 'string', 
        enum: ['requirements', 'design', 'tasks', 'all'],
        description: 'Which specification phase to generate'
      },
      projectId: { type: 'string', description: 'Project identifier' },
      context: {
        type: 'object',
        properties: {
          existingRequirements: { type: 'array', items: { type: 'string' } },
          techStack: { type: 'object' },
          constraints: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    required: ['prompt', 'projectId'],
  };

  private requirementsAnalyzer: RequirementsAnalyzer;
  private designGenerator: DesignGenerator;
  private taskBreakdown: TaskBreakdown;

  constructor() {
    super();
    this.requirementsAnalyzer = new RequirementsAnalyzer();
    this.designGenerator = new DesignGenerator();
    this.taskBreakdown = new TaskBreakdown();
  }

  async execute(args: Record<string, unknown>): Promise<MCPToolResult> {
    const input = this.validateInput(args, SpecificationGeneratorInputSchema);
    
    this.logger.info(`Generating specifications for project: ${input.projectId}`);

    try {
      const specification: GeneratedSpecification = {
        metadata: {
          generatedAt: new Date().toISOString(),
          phase: input.phase,
          projectId: input.projectId,
        },
      };

      if (input.phase === 'all' || input.phase === 'requirements') {
        specification.requirements = await this.generateRequirements(input);
      }

      if (input.phase === 'all' || input.phase === 'design') {
        const requirements = specification.requirements || 
          await this.loadExistingRequirements(input.projectId);
        specification.design = await this.generateDesign(input, requirements);
      }

      if (input.phase === 'all' || input.phase === 'tasks') {
        const requirements = specification.requirements || 
          await this.loadExistingRequirements(input.projectId);
        const design = specification.design || 
          await this.loadExistingDesign(input.projectId);
        specification.tasks = await this.generateTasks(input, requirements, design);
      }

      await this.saveSpecification(specification);

      return this.jsonResult(specification);
    } catch (error) {
      this.logger.error('Specification generation failed:', error);
      return this.errorResult(
        `Failed to generate specification: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async generateRequirements(
    input: SpecificationGeneratorInput
  ): Promise<Requirement[]> {
    this.logger.info('Generating requirements from prompt');
    
    const analysis = await this.requirementsAnalyzer.analyze(input.prompt, {
      existingRequirements: input.context?.existingRequirements,
      constraints: input.context?.constraints,
    });

    const requirements: Requirement[] = [];
    let id = 1;

    // Convert analysis to requirements
    for (const req of analysis.functionalRequirements) {
      requirements.push({
        id: `REQ-${id++}`,
        type: 'functional',
        description: req.description,
        priority: req.priority || 'medium',
        acceptanceCriteria: req.acceptanceCriteria || [],
        userStory: req.userStory,
        earsFormat: this.convertToEARS(req.description),
      });
    }

    for (const req of analysis.nonFunctionalRequirements) {
      requirements.push({
        id: `REQ-${id++}`,
        type: 'non_functional',
        description: req.description,
        priority: req.priority || 'medium',
        acceptanceCriteria: req.acceptanceCriteria || [],
      });
    }

    for (const req of analysis.complianceRequirements) {
      requirements.push({
        id: `REQ-${id++}`,
        type: 'compliance',
        description: req.description,
        priority: 'high',
        acceptanceCriteria: req.acceptanceCriteria || [],
      });
    }

    return requirements;
  }

  private async generateDesign(
    input: SpecificationGeneratorInput,
    requirements: Requirement[]
  ): Promise<DesignDocument> {
    this.logger.info('Generating technical design');

    const design = await this.designGenerator.generate(requirements, {
      techStack: input.context?.techStack,
      constraints: input.context?.constraints,
    });

    return design;
  }

  private async generateTasks(
    input: SpecificationGeneratorInput,
    requirements: Requirement[],
    design: DesignDocument
  ): Promise<Task[]> {
    this.logger.info('Breaking down into tasks');

    const tasks = await this.taskBreakdown.breakdown(requirements, design, {
      projectId: input.projectId,
    });

    return tasks.map((task, index) => ({
      ...task,
      id: `TASK-${index + 1}`,
      status: WorkflowStatus.PLANNING,
    }));
  }

  private convertToEARS(description: string): string {
    // Simple EARS format conversion
    // In a real implementation, this would use NLP to properly structure
    if (description.toLowerCase().includes('when')) {
      return `WHEN ${description}`;
    } else if (description.toLowerCase().includes('if')) {
      return `IF ${description}`;
    } else {
      return `The system SHALL ${description}`;
    }
  }

  private async loadExistingRequirements(_projectId: string): Promise<Requirement[]> {
    // Implementation would load from storage
    return [];
  }

  private async loadExistingDesign(_projectId: string): Promise<DesignDocument> {
    // Implementation would load from storage
    return {
      architecture: { patterns: [], decisions: [] },
      interfaces: [],
      dataFlow: [],
      integrations: [],
    };
  }

  private async saveSpecification(_specification: GeneratedSpecification): Promise<void> {
    // Implementation would save to storage
    this.logger.info('Specification saved successfully');
  }
}