import { MCPServer } from '@core/MCPServer';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * End-to-End test simulating a complete development workflow
 * from project initialization to production deployment readiness
 */
describe('Full Development Workflow E2E', () => {
  let server: MCPServer;
  const baseURL = 'http://localhost:3000';
  const testProjectPath = path.join(__dirname, '../../temp/e2e-test-project');
  const projectId = 'e2e-test-project';

  beforeAll(async () => {
    // Start server
    server = new MCPServer();
    await server.initialize();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create test project directory
    await fs.mkdir(testProjectPath, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup
    await server.shutdown();
    await fs.rm(testProjectPath, { recursive: true, force: true });
  });

  describe('Complete Project Lifecycle', () => {
    let specifications: any;
    let qualityReport: any;

    it('Step 1: Initialize project with specifications', async () => {
      // Generate complete specifications for a blog platform
      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'e2e-1',
        method: 'tools/call',
        params: {
          name: 'generate-specification',
          arguments: {
            prompt: `Build a modern blog platform with the following features:
              - User authentication (email/password and OAuth)
              - Create, edit, and delete blog posts
              - Rich text editor with image upload
              - Comments and reactions
              - Categories and tags
              - Search functionality
              - User profiles
              - Admin dashboard`,
            projectId,
            phase: 'all',
            context: {
              techStack: {
                frontend: 'React + TypeScript',
                backend: 'Node.js + Express',
                database: 'PostgreSQL',
                storage: 'AWS S3',
              },
              constraints: [
                'Must be WCAG AAA compliant',
                'GDPR compliant',
                'Support 10K concurrent users',
                'Mobile responsive',
              ],
            },
          },
        },
      });

      expect(response.status).toBe(200);
      specifications = JSON.parse(response.data.result.content[0].text);
      
      // Verify comprehensive specifications
      expect(specifications.requirements.length).toBeGreaterThanOrEqual(10);
      expect(specifications.design.architecture.patterns).toContain('MVC');
      expect(specifications.tasks.length).toBeGreaterThanOrEqual(20);
      
      // Save specifications
      await fs.writeFile(
        path.join(testProjectPath, 'specifications.json'),
        JSON.stringify(specifications, null, 2)
      );
    });

    it('Step 2: Generate initial code structure', async () => {
      // Create tasks from specifications
      const tasksResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'e2e-2',
        method: 'tools/call',
        params: {
          name: 'create-tasks',
          arguments: {
            projectId,
            requirements: specifications.requirements.map((r: any) => r.description),
            granularity: 'detailed',
            includeTests: true,
          },
        },
      });

      const tasks = JSON.parse(tasksResponse.data.result.content[0].text);
      expect(tasks.totalTasks).toBeGreaterThan(0);
      expect(tasks.testingTasks.length).toBeGreaterThan(0);
    });

    it('Step 3: Validate initial components', async () => {
      // Create a sample component
      const loginComponent = `
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { validateEmail } from '../utils/validation';

interface LoginFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      onError('Invalid email address');
      return;
    }
    
    setLoading(true);
    
    try {
      await login(email, password);
      onSuccess();
    } catch (error) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Login form">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        aria-label="Email address"
        required
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        aria-label="Password"
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
};`;

      // Save component
      const componentsPath = path.join(testProjectPath, 'src/components');
      await fs.mkdir(componentsPath, { recursive: true });
      await fs.writeFile(
        path.join(componentsPath, 'LoginForm.tsx'),
        loginComponent
      );

      // Validate the component
      const validationResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'e2e-3',
        method: 'tools/call',
        params: {
          name: 'validate-component',
          arguments: {
            componentPath: 'LoginForm.tsx',
            componentCode: loginComponent,
          },
        },
      });

      const validation = JSON.parse(validationResponse.data.result.content[0].text);
      expect(validation.violations.length).toBe(0); // Should pass validation
    });

    it('Step 4: Check accessibility compliance', async () => {
      const a11yResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'e2e-4',
        method: 'tools/call',
        params: {
          name: 'check-accessibility',
          arguments: {
            filePath: path.join(componentsPath, 'LoginForm.tsx'),
            wcagLevel: 'AAA',
            checkType: 'full',
          },
        },
      });

      const a11yReport = JSON.parse(a11yResponse.data.result.content[0].text);
      expect(a11yReport.wcagLevel).toBe('AAA');
      // LoginForm should have good accessibility
      expect(a11yReport.score).toBeGreaterThan(90);
    });

    it('Step 5: Analyze codebase quality', async () => {
      const analysisResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'e2e-5',
        method: 'tools/call',
        params: {
          name: 'analyze-codebase',
          arguments: {
            projectId,
            analysisType: 'full',
            focus: ['architecture', 'codeQuality', 'testCoverage'],
          },
        },
      });

      const analysis = JSON.parse(analysisResponse.data.result.content[0].text);
      expect(analysis.summary.healthScore).toBeGreaterThan(80);
    });

    it('Step 6: Get quality report', async () => {
      const reportResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'e2e-6',
        method: 'resources/read',
        params: {
          uri: 'quality-report',
          projectId,
        },
      });

      qualityReport = reportResponse.data.result.contents;
      expect(qualityReport.summary).toBeDefined();
      
      // Save quality report
      await fs.writeFile(
        path.join(testProjectPath, 'quality-report.json'),
        JSON.stringify(qualityReport, null, 2)
      );
    });

    it('Step 7: Check compliance status', async () => {
      const complianceResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'e2e-7',
        method: 'resources/read',
        params: {
          uri: 'compliance-status',
          projectId,
        },
      });

      const compliance = complianceResponse.data.result.contents;
      expect(compliance.compliance.wcag.status).toBe('passing');
      expect(compliance.compliance.gdpr.compliant).toBe(true);
    });

    it('Step 8: Enforce standards before deployment', async () => {
      const enforcementResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'e2e-8',
        method: 'tools/call',
        params: {
          name: 'enforce-standards',
          arguments: {
            projectId,
            enforcementLevel: 'strict',
            autoFix: true,
            categories: ['typescript', 'codeQuality', 'accessibility'],
          },
        },
      });

      const enforcement = JSON.parse(enforcementResponse.data.result.content[0].text);
      expect(enforcement.summary.readyForCommit).toBeDefined();
      
      // If there are blockers, they should be critical issues only
      if (enforcement.blockers.length > 0) {
        enforcement.blockers.forEach((blocker: any) => {
          expect(blocker.severity).toBe('error');
        });
      }
    });

    it('Step 9: Sync documentation', async () => {
      const docSyncResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'e2e-9',
        method: 'tools/call',
        params: {
          name: 'update-documentation',
          arguments: {
            projectId,
            syncType: 'code-to-docs',
            dryRun: false,
          },
        },
      });

      const docSync = JSON.parse(docSyncResponse.data.result.content[0].text);
      expect(docSync.applied).toBe(true);
      expect(docSync.summary.filesCreated + docSync.summary.filesUpdated).toBeGreaterThan(0);
    });

    it('Step 10: Final deployment readiness check', async () => {
      // Get specification status
      const specStatusResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'e2e-10-1',
        method: 'resources/read',
        params: {
          uri: 'specification-status',
          projectId,
        },
      });

      const specStatus = specStatusResponse.data.result.contents;
      expect(specStatus.overallProgress).toBeGreaterThan(80);

      // Get performance metrics
      const perfResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'e2e-10-2',
        method: 'resources/read',
        params: {
          uri: 'performance-metrics',
          projectId,
        },
      });

      const perfMetrics = perfResponse.data.result.contents;
      
      // Check if current metrics meet budgets
      const bundleSize = parseInt(perfMetrics.current.bundleSize);
      const budgetSize = parseInt(perfMetrics.budgets.bundleSize);
      expect(bundleSize).toBeLessThanOrEqual(budgetSize);

      // Final project analysis
      const finalAnalysisResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'e2e-10-3',
        method: 'resources/read',
        params: {
          uri: 'project-analysis',
          projectId,
          deep: true,
        },
      });

      const finalAnalysis = finalAnalysisResponse.data.result.contents;
      expect(finalAnalysis.recommendations.length).toBeLessThan(5); // Few recommendations means good quality
      
      // Generate deployment checklist
      const deploymentChecklist = {
        specifications: specStatus.overallProgress >= 90,
        qualityGatesPassed: qualityReport.passed,
        complianceMet: compliance.compliance.wcag.status === 'passing',
        performanceWithinBudget: bundleSize <= budgetSize,
        documentationComplete: docSync.applied,
        criticalIssuesResolved: enforcement.blockers.length === 0,
      };

      // All checks should pass for deployment readiness
      Object.values(deploymentChecklist).forEach(check => {
        expect(check).toBe(true);
      });

      // Save deployment checklist
      await fs.writeFile(
        path.join(testProjectPath, 'deployment-checklist.json'),
        JSON.stringify(deploymentChecklist, null, 2)
      );
    });
  });
});