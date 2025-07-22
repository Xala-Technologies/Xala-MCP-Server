import { LoggerFactory } from '@utils/logger';

// Set up test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce noise in tests

// Configure logger for tests
LoggerFactory.configure({
  level: 'error',
  format: 'text',
  outputPath: undefined, // Don't write logs in tests
});

// Mock timers for performance tests
jest.useFakeTimers();

// Global test utilities
global.testUtils = {
  createMockRequest: (method: string, params?: any) => ({
    jsonrpc: '2.0',
    id: Math.random().toString(36).substring(7),
    method,
    params,
  }),
  
  createMockFile: (path: string, content: string) => ({
    path,
    content,
    stats: {
      size: content.length,
      mtime: new Date(),
    },
  }),
  
  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Clean up after all tests
afterAll(() => {
  LoggerFactory.clearLoggers();
});