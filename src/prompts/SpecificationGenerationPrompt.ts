import { BasePrompt } from './BasePrompt';

export class SpecificationGenerationPrompt extends BasePrompt {
  name = 'specification-generation';
  description = 'Generate detailed project specifications from requirements';
  arguments = [
    {
      name: 'user_prompt',
      description: 'User description of what they want to build',
      required: true,
    },
    {
      name: 'project_context',
      description: 'Existing project context and constraints',
      required: false,
    },
    {
      name: 'specification_type',
      description: 'Type of specification to generate (requirements/design/tasks)',
      required: false,
    },
  ];

  async getPromptText(args?: Record<string, string>): Promise<{
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;
  }> {
    this.validateArguments(args, ['user_prompt']);

    const specType = args?.specification_type || 'all';

    const systemPrompt = `You are an expert business analyst and technical architect skilled in:
- Requirements engineering (EARS format)
- User story creation with acceptance criteria
- Technical design and architecture
- Task breakdown and estimation
- Agile development methodologies

Generate specifications that are:
1. Clear and unambiguous
2. Testable and measurable
3. Technically feasible
4. Properly prioritized`;

    const userPrompt = `Generate ${specType} specifications for the following project:

User Request:
${args!.user_prompt}

${args?.project_context ? `Project Context:\n${args.project_context}` : ''}

Please provide:
${specType === 'all' || specType === 'requirements' ? `
1. Functional Requirements (EARS format)
2. Non-functional Requirements
3. User Stories with Acceptance Criteria
4. Compliance Requirements` : ''}
${specType === 'all' || specType === 'design' ? `
5. High-level Architecture
6. Key Design Decisions
7. Interface Definitions
8. Data Models` : ''}
${specType === 'all' || specType === 'tasks' ? `
9. Task Breakdown
10. Dependencies
11. Time Estimates
12. Risk Assessment` : ''}`;

    return {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };
  }
}