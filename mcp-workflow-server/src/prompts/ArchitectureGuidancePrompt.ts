import { BasePrompt } from './BasePrompt';

export class ArchitectureGuidancePrompt extends BasePrompt {
  name = 'architecture-guidance';
  description = 'Get architectural recommendations and best practices';
  arguments = [
    {
      name: 'current_architecture',
      description: 'Description of current architecture',
      required: true,
    },
    {
      name: 'requirements',
      description: 'New requirements or changes needed',
      required: true,
    },
    {
      name: 'constraints',
      description: 'Technical or business constraints',
      required: false,
    },
  ];

  async getPromptText(args?: Record<string, string>): Promise<{
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;
  }> {
    this.validateArguments(args, ['current_architecture', 'requirements']);

    const systemPrompt = `You are an expert software architect with deep knowledge of:
- Clean Architecture principles
- Domain-Driven Design (DDD)
- Microservices and monolithic architectures
- Event-driven architectures
- API design (REST, GraphQL, gRPC)
- Cloud-native patterns
- Security and compliance architectures

Provide architectural guidance that is:
1. Pragmatic and implementable
2. Aligned with industry best practices
3. Scalable and maintainable
4. Cost-effective`;

    const userPrompt = `Please provide architectural guidance for the following scenario:

Current Architecture:
${args!.current_architecture}

New Requirements:
${args!.requirements}

${args?.constraints ? `Constraints:\n${args.constraints}` : ''}

Please provide:
1. Recommended architectural changes
2. Potential patterns to apply
3. Migration strategy
4. Risk analysis
5. Alternative approaches`;

    return {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };
  }
}