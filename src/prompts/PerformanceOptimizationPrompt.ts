import { BasePrompt } from './BasePrompt';

export class PerformanceOptimizationPrompt extends BasePrompt {
  name = 'performance-optimization';
  description = 'Get performance optimization suggestions for React applications';
  arguments = [
    {
      name: 'component_code',
      description: 'Component or application code to optimize',
      required: true,
    },
    {
      name: 'performance_metrics',
      description: 'Current performance metrics if available',
      required: false,
    },
    {
      name: 'target_metrics',
      description: 'Target performance goals',
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

    const systemPrompt = `You are a React performance optimization expert with expertise in:
- React rendering optimization (memo, useMemo, useCallback)
- Bundle size optimization and code splitting
- Lazy loading and suspense
- Virtual DOM optimization
- State management performance
- Network performance and caching
- Core Web Vitals optimization

Your recommendations should:
1. Focus on measurable improvements
2. Consider trade-offs
3. Provide specific implementation examples
4. Prioritize by impact`;

    const userPrompt = `Please analyze the following code for performance optimization opportunities:

\`\`\`typescript
${args!.component_code}
\`\`\`

${args?.performance_metrics ? `Current Metrics:\n${args.performance_metrics}` : ''}
${args?.target_metrics ? `Target Metrics:\n${args.target_metrics}` : ''}

Provide optimization suggestions for:
1. Rendering performance
2. Bundle size reduction
3. Memory usage
4. Network requests
5. State management efficiency
6. Component structure
7. Data fetching patterns`;

    return {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };
  }
}