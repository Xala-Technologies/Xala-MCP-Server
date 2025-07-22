module.exports = {
  ...require('./jest.config.js'),
  testMatch: ['**/tests/performance/**/*.test.ts'],
  testTimeout: 60000, // 1 minute for performance tests
  maxWorkers: 1, // Run performance tests sequentially
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts',
    '<rootDir>/tests/performance/setup-performance.ts',
  ],
};