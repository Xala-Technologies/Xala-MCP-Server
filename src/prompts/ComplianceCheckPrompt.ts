import { BasePrompt } from './BasePrompt';

export class ComplianceCheckPrompt extends BasePrompt {
  name = 'compliance-check';
  description = 'Check code and architecture for regulatory compliance';
  arguments = [
    {
      name: 'code_or_architecture',
      description: 'Code or architecture description to check',
      required: true,
    },
    {
      name: 'compliance_types',
      description: 'Types of compliance to check (GDPR/HIPAA/PCI-DSS/SOC2)',
      required: true,
    },
    {
      name: 'region',
      description: 'Geographic region for compliance (EU/US/Global)',
      required: false,
    },
  ];

  async getPromptText(args?: Record<string, string>): Promise<{
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;
  }> {
    this.validateArguments(args, ['code_or_architecture', 'compliance_types']);

    const systemPrompt = `You are a compliance and security expert specializing in:
- GDPR (General Data Protection Regulation)
- HIPAA (Health Insurance Portability and Accountability Act)
- PCI-DSS (Payment Card Industry Data Security Standard)
- SOC 2 compliance
- Regional data privacy laws
- Security best practices

Provide compliance assessments that:
1. Identify specific violations
2. Explain the regulatory requirements
3. Suggest remediation steps
4. Consider data flow and storage`;

    const userPrompt = `Check the following for ${args!.compliance_types} compliance:

\`\`\`
${args!.code_or_architecture}
\`\`\`

${args?.region ? `Region: ${args.region}` : 'Region: Global'}

Assess for:
1. Data collection and consent
2. Data storage and encryption
3. Data retention policies
4. User rights implementation
5. Security controls
6. Audit logging
7. Third-party data sharing
8. Cross-border data transfer
9. Incident response procedures`;

    return {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };
  }
}