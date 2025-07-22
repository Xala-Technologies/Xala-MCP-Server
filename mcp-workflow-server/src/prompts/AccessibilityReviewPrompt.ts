import { BasePrompt } from './BasePrompt';

export class AccessibilityReviewPrompt extends BasePrompt {
  name = 'accessibility-review';
  description = 'Review UI components and pages for accessibility compliance';
  arguments = [
    {
      name: 'component_code',
      description: 'Component or page code to review',
      required: true,
    },
    {
      name: 'wcag_level',
      description: 'Target WCAG compliance level (A, AA, AAA)',
      required: false,
    },
    {
      name: 'user_context',
      description: 'Specific user groups or disabilities to consider',
      required: false,
    },
  ];

  async getPromptText(args?: Record<string, string>): Promise<{
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;
  }> {
    this.validateArguments(args, ['component_code']);

    const wcagLevel = args?.wcag_level || 'AAA';

    const systemPrompt = `You are an accessibility expert specializing in:
- WCAG 2.2 guidelines and compliance
- ARIA standards and best practices
- Assistive technology compatibility
- Inclusive design principles
- Internationalization and localization
- Cognitive accessibility

Your reviews should:
1. Identify specific WCAG violations
2. Provide code examples for fixes
3. Consider multiple disability types
4. Suggest progressive enhancement approaches`;

    const userPrompt = `Please perform an accessibility review of the following code for WCAG ${wcagLevel} compliance:

\`\`\`typescript
${args!.component_code}
\`\`\`

${args?.user_context ? `User Context: ${args.user_context}` : ''}

Review for:
1. Keyboard navigation support
2. Screen reader compatibility
3. Color contrast and visual design
4. Interactive element accessibility
5. Form accessibility
6. Error handling and messaging
7. Focus management
8. Semantic HTML usage`;

    return {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };
  }
}