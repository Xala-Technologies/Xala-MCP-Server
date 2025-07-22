import { BasePrompt } from './BasePrompt';

export class TaskBreakdownPrompt extends BasePrompt {
  name = 'task-breakdown';
  description = 'Break down features and requirements into actionable development tasks';
  arguments = [
    {
      name: 'feature_description',
      description: 'Description of feature or requirement to break down',
      required: true,
    },
    {
      name: 'team_size',
      description: 'Size of development team',
      required: false,
    },
    {
      name: 'timeline',
      description: 'Target timeline or deadline',
      required: false,
    },
  ];

  async getPromptText(args?: Record<string, string>): Promise<{
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;
  }> {
    this.validateArguments(args, ['feature_description']);

    const systemPrompt = `You are an experienced technical project manager skilled in:
- Agile task breakdown and estimation
- Dependency management
- Risk identification
- Resource allocation
- Sprint planning

Create task breakdowns that are:
1. Granular enough to track progress
2. Independent when possible
3. Testable with clear acceptance criteria
4. Realistically estimated`;

    const userPrompt = `Break down the following feature into development tasks:

Feature Description:
${args!.feature_description}

${args?.team_size ? `Team Size: ${args.team_size}` : ''}
${args?.timeline ? `Timeline: ${args.timeline}` : ''}

Please provide:
1. Task list with clear descriptions
2. Dependencies between tasks
3. Time estimates (in hours)
4. Required skills for each task
5. Acceptance criteria
6. Testing requirements
7. Risk factors
8. Suggested task sequence`;

    return {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };
  }
}