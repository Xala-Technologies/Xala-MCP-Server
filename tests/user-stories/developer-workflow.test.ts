import { MCPServer } from '@core/MCPServer';
import { RuleEngine } from '@rules/RuleEngine';
import axios from 'axios';

/**
 * User Story: As a developer, I want to use the MCP server to ensure my code
 * meets organizational standards before committing.
 */
describe('Developer Workflow User Stories', () => {
  let server: MCPServer;
  const baseURL = 'http://localhost:3000';

  beforeAll(async () => {
    server = new MCPServer();
    await server.initialize();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await server.shutdown();
  });

  describe('Story 1: New Feature Development', () => {
    /**
     * Given: I am starting a new feature
     * When: I request specifications for the feature
     * Then: I receive detailed requirements, design, and tasks
     */
    it('should guide developer through new feature development', async () => {
      // Step 1: Generate specifications
      const specResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'story-1-1',
        method: 'tools/call',
        params: {
          name: 'generate-specification',
          arguments: {
            prompt: 'Add user profile page with avatar upload and bio editing',
            projectId: 'social-app',
            phase: 'all',
          },
        },
      });

      expect(specResponse.status).toBe(200);
      const specs = JSON.parse(specResponse.data.result.content[0].text);
      
      // Verify requirements are generated
      expect(specs.requirements).toBeDefined();
      expect(specs.requirements.length).toBeGreaterThan(0);
      const avatarReq = specs.requirements.find((r: any) => 
        r.description.toLowerCase().includes('avatar')
      );
      expect(avatarReq).toBeDefined();
      
      // Verify design is generated
      expect(specs.design).toBeDefined();
      expect(specs.design.interfaces.length).toBeGreaterThan(0);
      
      // Verify tasks are generated
      expect(specs.tasks).toBeDefined();
      expect(specs.tasks.length).toBeGreaterThan(0);
      const uploadTask = specs.tasks.find((t: any) => 
        t.title.toLowerCase().includes('upload')
      );
      expect(uploadTask).toBeDefined();
      expect(uploadTask.testingRequirements).toBeDefined();

      // Step 2: Check task dependencies
      const depsResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'story-1-2',
        method: 'resources/read',
        params: {
          uri: 'task-dependencies',
          projectId: 'social-app',
        },
      });

      expect(depsResponse.status).toBe(200);
      const deps = depsResponse.data.result.contents;
      expect(deps.tasks).toBeInstanceOf(Array);
      expect(deps.criticalPath).toBeDefined();
    });
  });

  describe('Story 2: Code Quality Enforcement', () => {
    /**
     * Given: I have written a React component
     * When: I validate it against organizational standards
     * Then: I receive actionable feedback on violations
     */
    it('should enforce TypeScript and design system standards', async () => {
      const poorQualityComponent = `
        import React from 'react';
        
        export const UserCard = (props: any) => {
          const handleClick = (e) => {
            props.onClick(e);
          };
          
          return (
            <div style={{ 
              backgroundColor: '#f0f0f0', 
              padding: '20px',
              borderRadius: '8px' 
            }}>
              <img src={props.avatar} />
              <h3 style={{ color: '#333333' }}>{props.name}</h3>
              <button onClick={handleClick}>
                Follow
              </button>
            </div>
          );
        };
      `;

      // Validate the component
      const validationResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'story-2-1',
        method: 'tools/call',
        params: {
          name: 'validate-component',
          arguments: {
            componentPath: 'UserCard.tsx',
            componentCode: poorQualityComponent,
          },
        },
      });

      expect(validationResponse.status).toBe(200);
      const validation = JSON.parse(validationResponse.data.result.content[0].text);
      
      // Should detect multiple violations
      expect(validation.valid).toBe(false);
      expect(validation.violations.length).toBeGreaterThan(0);
      
      // Check for specific violations
      const anyTypeViolation = validation.violations.find((v: any) => 
        v.message.includes('any')
      );
      expect(anyTypeViolation).toBeDefined();
      expect(anyTypeViolation.severity).toBe('error');
      
      // Check accessibility
      const accessibilityResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'story-2-2',
        method: 'tools/call',
        params: {
          name: 'check-accessibility',
          arguments: {
            filePath: 'UserCard.tsx',
            wcagLevel: 'AAA',
          },
        },
      });

      const a11y = JSON.parse(accessibilityResponse.data.result.content[0].text);
      expect(a11y.passed).toBe(false);
      
      // Missing alt text
      const altTextViolation = a11y.violations.find((v: any) => 
        v.rule === 'image-alt'
      );
      expect(altTextViolation).toBeDefined();
      expect(altTextViolation.impact).toBe('critical');
    });

    /**
     * Given: I have violations in my code
     * When: I request enforcement of standards
     * Then: Auto-fixable issues are resolved and others are reported
     */
    it('should enforce standards and provide auto-fixes', async () => {
      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'story-2-3',
        method: 'tools/call',
        params: {
          name: 'enforce-standards',
          arguments: {
            projectId: 'social-app',
            enforcementLevel: 'standard',
            autoFix: true,
          },
        },
      });

      const enforcement = JSON.parse(response.data.result.content[0].text);
      expect(enforcement.violations.fixed).toBeGreaterThan(0);
      expect(enforcement.summary.readyForCommit).toBeDefined();
      
      // Should have blockers that prevent commit
      if (enforcement.blockers.length > 0) {
        expect(enforcement.summary.readyForCommit).toBe(false);
      }
    });
  });

  describe('Story 3: Architecture Guidance', () => {
    /**
     * Given: I need to make architectural decisions
     * When: I request architecture guidance
     * Then: I receive context-aware recommendations
     */
    it('should provide architecture guidance for scaling', async () => {
      const promptResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'story-3-1',
        method: 'prompts/get',
        params: {
          name: 'architecture-guidance',
          arguments: {
            current_architecture: 'Monolithic React app with Express backend',
            requirements: 'Need to support 100K concurrent users',
            constraints: 'Limited to AWS services, 6 month timeline',
          },
        },
      });

      expect(promptResponse.status).toBe(200);
      const prompt = promptResponse.data.result;
      expect(prompt.messages).toHaveLength(2);
      
      // System prompt should mention architectural patterns
      expect(prompt.messages[0].content).toContain('Clean Architecture');
      expect(prompt.messages[0].content).toContain('Microservices');
      
      // User prompt should include the requirements
      expect(prompt.messages[1].content).toContain('100K concurrent users');
      expect(prompt.messages[1].content).toContain('AWS services');
    });
  });

  describe('Story 4: Performance Optimization', () => {
    /**
     * Given: I have a slow-performing component
     * When: I request performance analysis
     * Then: I receive specific optimization suggestions
     */
    it('should identify performance issues and suggest fixes', async () => {
      const slowComponent = `
        import React, { useState } from 'react';
        
        export const DataGrid = ({ data }) => {
          const [filter, setFilter] = useState('');
          
          // Expensive computation on every render
          const processedData = data.map(item => ({
            ...item,
            computed: heavyComputation(item),
          })).filter(item => item.name.includes(filter));
          
          return (
            <div>
              <input 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)} 
              />
              {processedData.map(item => (
                <ExpensiveRow key={item.id} {...item} />
              ))}
            </div>
          );
        };
      `;

      const metricsResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'story-4-1',
        method: 'resources/read',
        params: {
          uri: 'performance-metrics',
          projectId: 'social-app',
        },
      });

      const metrics = metricsResponse.data.result.contents;
      expect(metrics.budgets).toBeDefined();
      expect(metrics.current).toBeDefined();
      
      // Get optimization suggestions
      const optimizationResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'story-4-2',
        method: 'prompts/get',
        params: {
          name: 'performance-optimization',
          arguments: {
            component_code: slowComponent,
            performance_metrics: JSON.stringify(metrics.current),
            target_metrics: JSON.stringify(metrics.budgets),
          },
        },
      });

      const optimization = optimizationResponse.data.result;
      expect(optimization.messages[1].content).toContain('useMemo');
      expect(optimization.messages[1].content).toContain('optimization');
    });
  });

  describe('Story 5: Documentation Sync', () => {
    /**
     * Given: I have updated my code
     * When: I sync documentation
     * Then: Documentation is updated to match implementation
     */
    it('should keep documentation in sync with code', async () => {
      const syncResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'story-5-1',
        method: 'tools/call',
        params: {
          name: 'update-documentation',
          arguments: {
            projectId: 'social-app',
            syncType: 'bidirectional',
            dryRun: true,
          },
        },
      });

      const syncResult = JSON.parse(syncResponse.data.result.content[0].text);
      expect(syncResult.changes).toBeInstanceOf(Array);
      expect(syncResult.summary).toBeDefined();
      expect(syncResult.dryRun).toBe(true);
      
      // Should identify documentation that needs updating
      if (syncResult.changes.length > 0) {
        const change = syncResult.changes[0];
        expect(change).toHaveProperty('file');
        expect(change).toHaveProperty('type');
        expect(change).toHaveProperty('description');
      }
    });
  });
});