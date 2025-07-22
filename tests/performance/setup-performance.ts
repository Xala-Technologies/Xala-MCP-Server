// Performance test setup
import { performance } from 'perf_hooks';

// Enable performance monitoring
global.performance = performance;

// Extend test timeout for performance tests
jest.setTimeout(60000);

// Performance test utilities
global.perfUtils = {
  measureTime: async (fn: () => Promise<any>): Promise<number> => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
  },
  
  calculateStats: (times: number[]) => {
    const sorted = times.sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  },
  
  formatBytes: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  },
};

// Memory monitoring
if (global.gc) {
  console.log('Manual GC enabled for performance tests');
} else {
  console.warn('Manual GC not available. Run with --expose-gc flag for accurate memory tests');
}

// Performance expectations
global.performanceExpectations = {
  responseTime: {
    simple: 100, // ms
    medium: 500, // ms
    complex: 2000, // ms
  },
  throughput: {
    requestsPerSecond: 100,
  },
  memory: {
    maxHeapGrowth: 100, // MB
    maxLeakRate: 0.1, // MB per 1000 requests
  },
};