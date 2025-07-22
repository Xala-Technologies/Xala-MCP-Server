import { BasePrompt } from './BasePrompt';

export class ComponentReviewPrompt extends BasePrompt {
  name = 'component-review';
  description = 'Review a React component for best practices, accessibility, and performance';
  arguments = [
    {
      name: 'component_code',
      description: 'The component code to review',
      required: true,
    },
    {
      name: 'component_name',
      description: 'Name of the component being reviewed',
      required: true,
    },
    {
      name: 'focus_areas',
      description: 'Specific areas to focus on (comma-separated)',
      required: false,
    },
  ];

  async getPromptText(args?: Record<string, string>): Promise<{
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;
  }> {
    this.validateArguments(args, ['component_code', 'component_name']);

    const focusAreas = args?.focus_areas?.split(',').map(a => a.trim()) || [
      'TypeScript usage',
      'Accessibility',
      'Performance',
      'Code structure',
      'Design system compliance',
    ];

    const systemPrompt = `You are an expert React/TypeScript code reviewer with deep knowledge of:
- TypeScript best practices and strict type safety
- React performance optimization patterns
- WCAG 2.2 AAA accessibility standards
- Component architecture and separation of concerns
- Design system usage and styling best practices

Your reviews should be:
1. Specific and actionable
2. Prioritized by severity (critical, high, medium, low)
3. Include code examples for improvements
4. Reference relevant documentation or standards`;

    const userPrompt = `Please review the following React component "${args!.component_name}" with focus on:
${focusAreas.map(area => `- ${area}`).join('\n')}

Component code:
\`\`\`typescript
${args!.component_code}
\`\`\`

Provide a structured review covering:
1. Critical issues that must be fixed
2. Recommended improvements
3. Accessibility concerns
4. Performance optimizations
5. Code structure and maintainability`;

    return {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };
  }
}