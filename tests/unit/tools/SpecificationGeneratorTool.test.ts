import { SpecificationGeneratorTool } from '@tools/SpecificationGeneratorTool';
import { MCPToolResult } from '@types';

describe('SpecificationGeneratorTool', () => {
  let tool: SpecificationGeneratorTool;

  beforeEach(() => {
    tool = new SpecificationGeneratorTool();
  });

  describe('initialization', () => {
    it('should have correct metadata', () => {
      expect(tool.name).toBe('generate-specification');
      expect(tool.description).toContain('Generate project specifications');
      expect(tool.inputSchema.required).toContain('prompt');
      expect(tool.inputSchema.required).toContain('projectId');
    });
  });

  describe('execute', () => {
    it('should generate all specifications when phase is "all"', async () => {
      const input = {
        prompt: 'Build a user authentication system with email/password login',
        projectId: 'auth-project',
        phase: 'all',
      };

      const result = await tool.execute(input);
      
      expect(result.isError).toBeFalsy();
      expect(result.content[0].type).toBe('text');
      
      const specification = JSON.parse(result.content[0].text!);
      expect(specification).toHaveProperty('requirements');
      expect(specification).toHaveProperty('design');
      expect(specification).toHaveProperty('tasks');
      expect(specification.metadata.projectId).toBe('auth-project');
    });

    it('should generate only requirements when phase is "requirements"', async () => {
      const input = {
        prompt: 'User management with roles and permissions',
        projectId: 'user-mgmt',
        phase: 'requirements',
      };

      const result = await tool.execute(input);
      
      expect(result.isError).toBeFalsy();
      const specification = JSON.parse(result.content[0].text!);
      
      expect(specification).toHaveProperty('requirements');
      expect(specification).not.toHaveProperty('design');
      expect(specification).not.toHaveProperty('tasks');
      expect(specification.requirements.length).toBeGreaterThan(0);
    });

    it('should handle context information', async () => {
      const input = {
        prompt: 'Add OAuth integration',
        projectId: 'auth-project',
        phase: 'design',
        context: {
          techStack: {
            frontend: 'React',
            backend: 'Node.js',
            auth: 'Passport.js',
          },
          constraints: ['Must support Google and GitHub OAuth'],
        },
      };

      const result = await tool.execute(input);
      
      expect(result.isError).toBeFalsy();
      const specification = JSON.parse(result.content[0].text!);
      
      expect(specification).toHaveProperty('design');
      expect(specification.metadata.phase).toBe('design');
    });

    it('should return error for invalid input', async () => {
      const input = {
        // Missing required fields
        phase: 'all',
      };

      const result = await tool.execute(input);
      
      expect(result.isError).toBeTruthy();
      expect(result.content[0].text).toContain('Invalid input');
    });

    it('should convert requirements to EARS format', async () => {
      const input = {
        prompt: 'When user clicks login, validate credentials',
        projectId: 'auth-project',
        phase: 'requirements',
      };

      const result = await tool.execute(input);
      const specification = JSON.parse(result.content[0].text!);
      
      const requirement = specification.requirements[0];
      expect(requirement.earsFormat).toBeDefined();
      expect(requirement.earsFormat).toMatch(/^(WHEN|IF|The system SHALL)/);
    });
  });

  describe('performance', () => {
    it('should complete specification generation within time limit', async () => {
      const input = {
        prompt: 'Complex e-commerce platform with inventory, orders, and payments',
        projectId: 'ecommerce',
        phase: 'all',
      };

      const startTime = Date.now();
      const result = await tool.execute(input);
      const endTime = Date.now();
      
      expect(result.isError).toBeFalsy();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});