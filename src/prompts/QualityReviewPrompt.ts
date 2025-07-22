import { BasePrompt } from './BasePrompt';

export class QualityReviewPrompt extends BasePrompt {
  name = 'quality-review';
  description = 'Comprehensive code quality review against organizational standards';
  arguments = [
    {
      name: 'code',
      description: 'Code to review',
      required: true,
    },
    {
      name: 'review_type',
      description: 'Type of review (full/security/performance/maintainability)',
      required: false,
    },
    {
      name: 'standards',
      description: 'Specific standards to check against',
      required: false,
    },
  ];

  async getPromptText(args?: Record<string, string>): Promise<{
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;
  }> {
    this.validateArguments(args, ['code']);

    const reviewType = args?.review_type || 'full';

    const systemPrompt = `You are a senior code reviewer with expertise in:
- Clean Code principles
- SOLID principles
- Design patterns
- Security best practices
- Performance optimization
- Testing strategies
- Code maintainability

Provide reviews that are:
1. Constructive and educational
2. Prioritized by severity
3. Include specific examples
4. Suggest improvements`;

    const userPrompt = `Perform a ${reviewType} quality review of the following code:

\`\`\`typescript
${args!.code}
\`\`\`

${args?.standards ? `Standards to check: ${args.standards}` : ''}

Review for:
1. Code structure and organization
2. Naming conventions
3. Error handling
4. Security vulnerabilities
5. Performance issues
6. Testability
7. Documentation
8. Maintainability
9. Best practices adherence`;

    return {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };
  }
}