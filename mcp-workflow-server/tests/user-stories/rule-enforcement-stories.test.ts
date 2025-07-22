import { MCPServer } from '@core/MCPServer';
import axios from 'axios';

/**
 * User stories for each rule category enforcement
 */
describe('Rule Enforcement User Stories', () => {
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

  describe('TypeScript Compliance Rules', () => {
    /**
     * Story: As a developer, I want to ensure my TypeScript code follows strict type safety
     * to prevent runtime errors and improve code maintainability.
     */
    it('should enforce no-any rule and suggest alternatives', async () => {
      const codeWithAny = `
        // API response handler
        export async function handleApiResponse(response: any) {
          const data = response.data;
          const items: any[] = data.items;
          
          return items.map((item: any) => ({
            id: item.id,
            name: item.name,
            metadata: item.meta as any,
          }));
        }
      `;

      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'ts-story-1',
        method: 'tools/call',
        params: {
          name: 'verify-types',
          arguments: {
            projectId: 'ts-compliance-test',
            files: ['api-handler.ts'],
            strictMode: true,
          },
        },
      });

      const validation = JSON.parse(response.data.result.content[0].text);
      
      // Should detect multiple any usages
      expect(validation.errors.filter((e: any) => e.error.includes('any'))).toHaveLength(4);
      
      // Should provide suggestions
      const anyError = validation.errors[0];
      expect(anyError.suggestion).toContain('specific type');
      
      // Get fix suggestions
      const fixResponse = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'ts-story-2',
        method: 'prompts/get',
        params: {
          name: 'component-review',
          arguments: {
            component_code: codeWithAny,
            component_name: 'handleApiResponse',
            focus_areas: 'Type safety',
          },
        },
      });

      const prompt = fixResponse.data.result;
      expect(prompt.messages[1].content).toContain('Type safety');
    });

    /**
     * Story: As a team lead, I want to ensure all functions have explicit return types
     * to make the codebase more predictable and self-documenting.
     */
    it('should enforce explicit return types', async () => {
      const functionsWithoutReturnTypes = `
        export function calculateTotal(items) {
          return items.reduce((sum, item) => sum + item.price, 0);
        }
        
        export const formatCurrency = (amount) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(amount);
        };
        
        class OrderService {
          processOrder(order) {
            // Complex processing logic
            return { success: true, orderId: order.id };
          }
        }
      `;

      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'ts-story-3',
        method: 'tools/call',
        params: {
          name: 'enforce-standards',
          arguments: {
            projectId: 'ts-compliance-test',
            categories: ['typescript'],
            autoFix: false,
          },
        },
      });

      const enforcement = JSON.parse(response.data.result.content[0].text);
      const tsViolations = enforcement.violations.byCategory.typescript;
      
      expect(tsViolations).toBeGreaterThan(0);
      expect(enforcement.blockers.some((b: any) => b.rule === 'ts-explicit-return')).toBe(true);
    });
  });

  describe('Code Quality Rules', () => {
    /**
     * Story: As a UI developer, I want to use design tokens consistently
     * to maintain visual consistency across the application.
     */
    it('should enforce design token usage and provide fixes', async () => {
      const componentWithHardcodedStyles = `
        import React from 'react';
        
        export const Card = ({ title, content }) => {
          return (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <h3 style={{ 
                color: '#333333',
                fontSize: '18px',
                marginBottom: '12px',
              }}>
                {title}
              </h3>
              <p style={{ 
                color: '#666666',
                fontSize: '14px',
                lineHeight: '1.5',
              }}>
                {content}
              </p>
            </div>
          );
        };
      `;

      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'cq-story-1',
        method: 'tools/call',
        params: {
          name: 'validate-component',
          arguments: {
            componentPath: 'Card.tsx',
            componentCode: componentWithHardcodedStyles,
            validationRules: ['cq-design-tokens'],
          },
        },
      });

      const validation = JSON.parse(response.data.result.content[0].text);
      
      // Should detect all hardcoded values
      const hardcodedViolations = validation.violations.filter((v: any) => 
        v.message.includes('hardcoded')
      );
      expect(hardcodedViolations.length).toBeGreaterThan(5);
      
      // Should provide auto-fix suggestions
      const colorViolation = hardcodedViolations.find((v: any) => 
        v.message.includes('#ffffff')
      );
      expect(colorViolation.autoFix).toBeDefined();
      expect(colorViolation.autoFix.changes[0].replacement).toContain('theme');
    });

    /**
     * Story: As a performance-conscious developer, I want to ensure components
     * are optimized to prevent unnecessary re-renders.
     */
    it('should detect performance issues and suggest optimizations', async () => {
      const unoptimizedComponent = `
        import React, { useState } from 'react';
        
        export const ProductList = ({ products, onProductSelect }) => {
          const [filter, setFilter] = useState('');
          
          // Expensive filtering on every render
          const filteredProducts = products.filter(p => 
            p.name.toLowerCase().includes(filter.toLowerCase()) ||
            p.description.toLowerCase().includes(filter.toLowerCase())
          );
          
          // Creating new function on every render
          const handleProductClick = (product) => {
            console.log('Product clicked:', product);
            onProductSelect(product);
          };
          
          // Expensive computation
          const totalValue = filteredProducts.reduce((sum, p) => {
            return sum + (p.price * p.quantity * (1 - p.discount));
          }, 0);
          
          return (
            <div>
              <input 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search products..."
              />
              <div>Total Value: ${totalValue.toFixed(2)}</div>
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  onClick={() => handleProductClick(product)}
                />
              ))}
            </div>
          );
        };
      `;

      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'cq-story-2',
        method: 'prompts/get',
        params: {
          name: 'performance-optimization',
          arguments: {
            component_code: unoptimizedComponent,
            performance_metrics: JSON.stringify({
              renderTime: '150ms',
              rerenderCount: '25/minute',
            }),
          },
        },
      });

      const prompt = response.data.result;
      expect(prompt.messages[1].content).toContain('useMemo');
      expect(prompt.messages[1].content).toContain('useCallback');
    });
  });

  describe('Accessibility Compliance Rules', () => {
    /**
     * Story: As a developer building inclusive applications, I want to ensure
     * all interactive elements are accessible to users with disabilities.
     */
    it('should enforce WCAG AAA standards for forms', async () => {
      const inaccessibleForm = `
        import React from 'react';
        
        export const ContactForm = () => {
          return (
            <form>
              <input type="text" placeholder="Name" />
              <input type="email" placeholder="Email" />
              <textarea placeholder="Message" rows={5} />
              <div onClick={handleSubmit} style={{ cursor: 'pointer' }}>
                Submit
              </div>
            </form>
          );
        };
      `;

      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'a11y-story-1',
        method: 'tools/call',
        params: {
          name: 'check-accessibility',
          arguments: {
            filePath: 'ContactForm.tsx',
            wcagLevel: 'AAA',
            checkType: 'full',
          },
        },
      });

      const a11yReport = JSON.parse(response.data.result.content[0].text);
      
      // Should fail accessibility check
      expect(a11yReport.passed).toBe(false);
      
      // Should identify specific issues
      expect(a11yReport.violations.some((v: any) => 
        v.description.includes('label') || v.description.includes('aria-label')
      )).toBe(true);
      
      // Clickable div instead of button
      expect(a11yReport.violations.some((v: any) => 
        v.description.includes('button') || v.description.includes('interactive')
      )).toBe(true);
    });

    /**
     * Story: As a global product owner, I want to ensure the application
     * supports multiple languages and regional requirements.
     */
    it('should enforce internationalization standards', async () => {
      const nonI18nComponent = `
        import React from 'react';
        
        export const UserProfile = ({ user }) => {
          return (
            <div>
              <h1>User Profile</h1>
              <p>Name: {user.name}</p>
              <p>Joined: {new Date(user.joinedAt).toLocaleDateString()}</p>
              <p>Phone: {user.phone}</p>
              <p>Balance: $${user.balance.toFixed(2)}</p>
              <button>Edit Profile</button>
              <button>Delete Account</button>
            </div>
          );
        };
      `;

      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'a11y-story-2',
        method: 'prompts/get',
        params: {
          name: 'accessibility-review',
          arguments: {
            component_code: nonI18nComponent,
            wcag_level: 'AAA',
            user_context: 'International users, RTL languages support needed',
          },
        },
      });

      const prompt = response.data.result;
      expect(prompt.messages[1].content).toContain('Internationalization');
      expect(prompt.messages[0].content).toContain('localization');
    });
  });

  describe('Package System Rules', () => {
    /**
     * Story: As an architect, I want to ensure clean package boundaries
     * to maintain a scalable and maintainable codebase.
     */
    it('should detect cross-package dependencies', async () => {
      // This would typically analyze actual file imports
      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'pkg-story-1',
        method: 'resources/read',
        params: {
          uri: 'codebase-structure',
          projectId: 'package-test',
        },
      });

      const structure = response.data.result.contents;
      expect(structure.structure.dependencies.circular).toEqual([]);
    });

    /**
     * Story: As a team member, I want all packages to have proper documentation
     * so I can understand and use them correctly.
     */
    it('should enforce documentation standards', async () => {
      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'pkg-story-2',
        method: 'tools/call',
        params: {
          name: 'enforce-standards',
          arguments: {
            projectId: 'package-test',
            categories: ['packageSystem'],
            autoFix: false,
          },
        },
      });

      const enforcement = JSON.parse(response.data.result.content[0].text);
      const pkgViolations = enforcement.violations.byCategory.packageSystem;
      
      // Check for documentation requirements
      expect(pkgViolations).toBeDefined();
    });
  });

  describe('Business Logic Rules', () => {
    /**
     * Story: As a security-conscious developer, I want to ensure all inputs
     * are properly validated and sanitized to prevent security vulnerabilities.
     */
    it('should enforce input validation and security patterns', async () => {
      const insecureCode = `
        import { db } from './database';
        
        export async function searchUsers(req, res) {
          const { query } = req.query;
          
          // SQL injection vulnerability
          const users = await db.query(\`
            SELECT * FROM users 
            WHERE name LIKE '%\${query}%'
          \`);
          
          // XSS vulnerability
          res.send(\`
            <h1>Search Results for: \${query}</h1>
            <ul>\${users.map(u => \`<li>\${u.name}</li>\`).join('')}</ul>
          \`);
        }
        
        export function processPayment(amount, cardNumber) {
          // No validation
          return chargeCard(cardNumber, amount);
        }
      `;

      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'bl-story-1',
        method: 'prompts/get',
        params: {
          name: 'quality-review',
          arguments: {
            code: insecureCode,
            review_type: 'security',
            standards: 'OWASP Top 10',
          },
        },
      });

      const prompt = response.data.result;
      expect(prompt.messages[1].content).toContain('Security vulnerabilities');
      expect(prompt.messages[0].content).toContain('OWASP');
    });

    /**
     * Story: As a developer, I want proper error handling patterns
     * to ensure the application degrades gracefully.
     */
    it('should enforce error handling patterns', async () => {
      const poorErrorHandling = `
        export async function fetchUserData(userId) {
          const response = await fetch(\`/api/users/\${userId}\`);
          const data = await response.json();
          return data;
        }
        
        export function calculateDiscount(price, discountCode) {
          const discount = discounts[discountCode];
          return price * (1 - discount);
        }
      `;

      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'bl-story-2',
        method: 'tools/call',
        params: {
          name: 'validate-component',
          arguments: {
            componentPath: 'utils.ts',
            componentCode: poorErrorHandling,
            validationRules: ['error-handling'],
          },
        },
      });

      const validation = JSON.parse(response.data.result.content[0].text);
      
      // Should suggest try-catch blocks
      expect(validation.suggestions.some((s: any) => 
        s.includes('error handling') || s.includes('try-catch')
      )).toBe(true);
    });
  });
});