import { MCPServer } from '@core/MCPServer';
import axios from 'axios';
import { performance } from 'perf_hooks';

/**
 * Performance tests to ensure the MCP server can handle production loads
 */
describe('MCP Server Performance Tests', () => {
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

  describe('Response Time Tests', () => {
    it('should respond to simple requests within 100ms', async () => {
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        
        await axios.post(`${baseURL}/mcp`, {
          jsonrpc: '2.0',
          id: `perf-${i}`,
          method: 'resources/list',
        });
        
        const end = performance.now();
        times.push(end - start);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
      
      console.log(`Average response time: ${averageTime.toFixed(2)}ms`);
      console.log(`95th percentile: ${p95Time.toFixed(2)}ms`);
      
      expect(averageTime).toBeLessThan(100);
      expect(p95Time).toBeLessThan(200);
    });

    it('should handle complex tool calls within 2 seconds', async () => {
      const start = performance.now();
      
      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'perf-complex',
        method: 'tools/call',
        params: {
          name: 'generate-specification',
          arguments: {
            prompt: 'Build a complete e-commerce platform with inventory management',
            projectId: 'perf-test',
            phase: 'all',
          },
        },
      });
      
      const end = performance.now();
      const responseTime = end - start;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle 50 concurrent requests', async () => {
      const concurrentRequests = 50;
      const promises = [];

      const start = performance.now();

      for (let i = 0; i < concurrentRequests; i++) {
        const promise = axios.post(`${baseURL}/mcp`, {
          jsonrpc: '2.0',
          id: `concurrent-${i}`,
          method: i % 3 === 0 ? 'resources/list' : 
                 i % 3 === 1 ? 'tools/list' : 'prompts/list',
        });
        promises.push(promise);
      }

      const results = await Promise.allSettled(promises);
      const end = performance.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const totalTime = end - start;

      console.log(`Concurrent requests: ${concurrentRequests}`);
      console.log(`Successful: ${successful}, Failed: ${failed}`);
      console.log(`Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`Average time per request: ${(totalTime / concurrentRequests).toFixed(2)}ms`);

      expect(successful).toBe(concurrentRequests);
      expect(failed).toBe(0);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle mixed workload without degradation', async () => {
      const workloadSize = 100;
      const promises = [];
      const responseTimes: { [key: string]: number[] } = {
        light: [],
        medium: [],
        heavy: [],
      };

      for (let i = 0; i < workloadSize; i++) {
        const start = performance.now();
        let promise;
        let type: string;

        if (i % 10 === 0) {
          // Heavy operation (10%)
          type = 'heavy';
          promise = axios.post(`${baseURL}/mcp`, {
            jsonrpc: '2.0',
            id: `mixed-${i}`,
            method: 'tools/call',
            params: {
              name: 'analyze-codebase',
              arguments: {
                projectId: 'perf-test',
                analysisType: 'full',
              },
            },
          });
        } else if (i % 3 === 0) {
          // Medium operation (30%)
          type = 'medium';
          promise = axios.post(`${baseURL}/mcp`, {
            jsonrpc: '2.0',
            id: `mixed-${i}`,
            method: 'resources/read',
            params: {
              uri: 'project-analysis',
              projectId: 'perf-test',
            },
          });
        } else {
          // Light operation (60%)
          type = 'light';
          promise = axios.post(`${baseURL}/mcp`, {
            jsonrpc: '2.0',
            id: `mixed-${i}`,
            method: 'resources/list',
          });
        }

        promise.then(() => {
          const end = performance.now();
          responseTimes[type].push(end - start);
        });

        promises.push(promise);
        
        // Stagger requests slightly to simulate real usage
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      await Promise.allSettled(promises);

      // Analyze response times
      Object.entries(responseTimes).forEach(([type, times]) => {
        if (times.length > 0) {
          const avg = times.reduce((a, b) => a + b, 0) / times.length;
          const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
          
          console.log(`${type} operations - Avg: ${avg.toFixed(2)}ms, P95: ${p95.toFixed(2)}ms`);
          
          // Light operations should remain fast even under load
          if (type === 'light') {
            expect(avg).toBeLessThan(200);
          }
        }
      });
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during extended operation', async () => {
      const initialMemory = process.memoryUsage();
      const iterations = 1000;
      const checkpoints: any[] = [];

      for (let i = 0; i < iterations; i++) {
        await axios.post(`${baseURL}/mcp`, {
          jsonrpc: '2.0',
          id: `memory-${i}`,
          method: 'tools/call',
          params: {
            name: 'validate-component',
            arguments: {
              componentPath: 'Test.tsx',
              componentCode: 'const Test = () => <div>Test</div>',
            },
          },
        });

        // Check memory every 100 iterations
        if (i % 100 === 0) {
          if (global.gc) {
            global.gc(); // Force garbage collection if available
          }
          const currentMemory = process.memoryUsage();
          checkpoints.push({
            iteration: i,
            heapUsed: currentMemory.heapUsed,
            external: currentMemory.external,
          });
        }
      }

      const finalMemory = process.memoryUsage();
      
      // Memory growth should be reasonable
      const memoryGrowth = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024; // MB
      console.log(`Memory growth over ${iterations} requests: ${memoryGrowth.toFixed(2)} MB`);
      
      // Check for linear memory growth (potential leak)
      const firstHalf = checkpoints.slice(0, checkpoints.length / 2);
      const secondHalf = checkpoints.slice(checkpoints.length / 2);
      
      const firstHalfAvg = firstHalf.reduce((sum, cp) => sum + cp.heapUsed, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, cp) => sum + cp.heapUsed, 0) / secondHalf.length;
      
      const growthRate = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;
      console.log(`Memory growth rate: ${(growthRate * 100).toFixed(2)}%`);
      
      expect(growthRate).toBeLessThan(0.5); // Less than 50% growth
    });
  });

  describe('Scalability Tests', () => {
    it('should maintain performance with large payloads', async () => {
      const largeComponent = `
        import React from 'react';
        ${Array(1000).fill("import { Component } from './components';").join('\n')}
        
        export const LargeComponent = () => {
          ${Array(500).fill("const [state, setState] = useState(0);").join('\n')}
          
          return (
            <div>
              ${Array(1000).fill("<Component />").join('\n')}
            </div>
          );
        };
      `;

      const start = performance.now();
      
      const response = await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: 'large-payload',
        method: 'tools/call',
        params: {
          name: 'validate-component',
          arguments: {
            componentPath: 'LargeComponent.tsx',
            componentCode: largeComponent,
          },
        },
      });
      
      const end = performance.now();
      const responseTime = end - start;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should handle large files within 5s
    });

    it('should handle burst traffic gracefully', async () => {
      const burstSize = 200;
      const results = {
        successful: 0,
        failed: 0,
        responseTimes: [] as number[],
      };

      // Send all requests at once (burst)
      const promises = Array(burstSize).fill(null).map((_, i) => {
        const start = performance.now();
        
        return axios.post(`${baseURL}/mcp`, {
          jsonrpc: '2.0',
          id: `burst-${i}`,
          method: 'resources/list',
        }).then(response => {
          const end = performance.now();
          results.successful++;
          results.responseTimes.push(end - start);
          return response;
        }).catch(error => {
          results.failed++;
          throw error;
        });
      });

      const burstStart = performance.now();
      await Promise.allSettled(promises);
      const burstEnd = performance.now();

      const avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
      const maxResponseTime = Math.max(...results.responseTimes);
      
      console.log(`Burst test - Size: ${burstSize}`);
      console.log(`Successful: ${results.successful}, Failed: ${results.failed}`);
      console.log(`Total time: ${(burstEnd - burstStart).toFixed(2)}ms`);
      console.log(`Avg response: ${avgResponseTime.toFixed(2)}ms, Max: ${maxResponseTime.toFixed(2)}ms`);
      
      expect(results.successful).toBeGreaterThan(burstSize * 0.95); // 95% success rate
      expect(avgResponseTime).toBeLessThan(1000); // Average under 1 second
    });
  });

  describe('Resource Efficiency Tests', () => {
    it('should efficiently cache repeated requests', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 'cache-test',
        method: 'resources/read',
        params: {
          uri: 'project-analysis',
          projectId: 'cache-test',
        },
      };

      // First request (cache miss)
      const firstStart = performance.now();
      await axios.post(`${baseURL}/mcp`, request);
      const firstEnd = performance.now();
      const firstTime = firstEnd - firstStart;

      // Subsequent requests (cache hits)
      const cachedTimes: number[] = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        await axios.post(`${baseURL}/mcp`, { ...request, id: `cache-test-${i}` });
        const end = performance.now();
        cachedTimes.push(end - start);
      }

      const avgCachedTime = cachedTimes.reduce((a, b) => a + b, 0) / cachedTimes.length;
      const improvement = ((firstTime - avgCachedTime) / firstTime) * 100;
      
      console.log(`First request: ${firstTime.toFixed(2)}ms`);
      console.log(`Avg cached request: ${avgCachedTime.toFixed(2)}ms`);
      console.log(`Performance improvement: ${improvement.toFixed(2)}%`);
      
      expect(avgCachedTime).toBeLessThan(firstTime * 0.5); // Cached requests should be 50% faster
    });
  });
});