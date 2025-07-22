# MCP Workflow Server - Test Suite Overview

## Test Coverage Summary

The MCP Workflow Server includes a comprehensive test suite covering all aspects of functionality, performance, and user workflows.

### Test Categories

#### 1. Unit Tests (`tests/unit/`)
- **Purpose**: Test individual components in isolation
- **Coverage**: 
  - Rule sets (TypeScript, Code Quality, Accessibility, Package System, Business Logic)
  - Tools (Specification Generator, Component Validator, etc.)
  - Resources (Project Analysis, Quality Reports, etc.)
  - Core components (Configuration Manager, Rule Engine)

#### 2. Integration Tests (`tests/integration/`)
- **Purpose**: Test component interactions and API endpoints
- **Coverage**:
  - HTTP/WebSocket API functionality
  - Resource reading and tool execution
  - Multi-component workflows
  - Error handling and edge cases

#### 3. End-to-End Tests (`tests/e2e/`)
- **Purpose**: Test complete workflows from start to finish
- **Coverage**:
  - Full project lifecycle (specification → implementation → deployment)
  - Quality gate enforcement
  - Documentation synchronization
  - Compliance verification

#### 4. User Story Tests (`tests/user-stories/`)
- **Purpose**: Validate real-world developer scenarios
- **Coverage**:
  - Developer workflow stories (5 complete scenarios)
  - Rule enforcement stories (one per rule category)
  - Feature development lifecycle
  - Code quality improvement workflows

#### 5. Performance Tests (`tests/performance/`)
- **Purpose**: Ensure scalability and efficiency
- **Coverage**:
  - Response time benchmarks
  - Concurrent request handling
  - Memory usage and leak detection
  - Large payload processing
  - Burst traffic handling
  - Caching efficiency

## Running Tests

### All Tests
```bash
npm test                    # Run all tests
npm run test:all           # Run all test categories sequentially
npm run test:coverage      # Generate coverage report
```

### By Category
```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e           # End-to-end tests only
npm run test:stories       # User story tests only
npm run test:performance   # Performance tests (requires --expose-gc)
```

### Watch Mode
```bash
npm run test:watch         # Run tests in watch mode during development
```

## Test Examples

### Unit Test Example: TypeScript Rule Validation
```typescript
// Tests no-any rule enforcement
it('should detect any type usage', async () => {
  const code = `function processData(data: any): void { }`;
  const violations = await ruleSet.validate('test.ts', code);
  expect(violations).toHaveLength(1);
  expect(violations[0].severity).toBe('error');
});
```

### User Story Example: New Feature Development
```typescript
// Story: As a developer, I want specifications for my feature
it('should guide developer through new feature development', async () => {
  const response = await generateSpecification({
    prompt: 'Add user profile page with avatar upload',
    projectId: 'social-app',
    phase: 'all'
  });
  
  expect(specs.requirements).toBeDefined();
  expect(specs.design).toBeDefined();
  expect(specs.tasks).toBeDefined();
});
```

### Performance Test Example: Concurrent Requests
```typescript
// Tests handling 50 concurrent requests
it('should handle 50 concurrent requests', async () => {
  const promises = Array(50).fill(null).map(() => 
    axios.post(`${baseURL}/mcp`, request)
  );
  
  const results = await Promise.allSettled(promises);
  expect(successful).toBe(50);
  expect(totalTime).toBeLessThan(5000);
});
```

## Test Metrics

### Coverage Targets
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Performance Benchmarks
- **Simple requests**: < 100ms average
- **Complex operations**: < 2 seconds
- **Concurrent handling**: 50+ requests
- **Memory growth**: < 50% over 1000 requests

### Quality Standards
Each test category validates:
- **Correctness**: Functions work as specified
- **Robustness**: Handles errors gracefully
- **Performance**: Meets response time targets
- **Scalability**: Handles production loads
- **Usability**: Supports real developer workflows

## Continuous Integration

Tests are designed to run in CI/CD pipelines:
- Unit tests run on every commit
- Integration tests run on pull requests
- E2E tests run before deployment
- Performance tests run nightly
- Coverage reports generated automatically

## Test Data Management

- **Fixtures**: Located in `tests/fixtures/`
- **Mocks**: Auto-mocked dependencies
- **Test Projects**: Temporary projects created/cleaned per test
- **Configuration**: Test-specific configs in `tests/config/`

## Debugging Tests

### Enable Debug Logging
```bash
DEBUG=mcp:* npm test
```

### Run Specific Test
```bash
npm test -- --testNamePattern="should enforce no-any rule"
```

### Performance Profiling
```bash
node --expose-gc --inspect npm run test:performance
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Clarity**: Test names describe the scenario
3. **Coverage**: Test both happy and error paths
4. **Performance**: Keep tests fast (< 5s per test)
5. **Maintenance**: Update tests with code changes

## Future Enhancements

- [ ] Visual regression testing for UI components
- [ ] Mutation testing for quality assurance
- [ ] Load testing with K6 or Artillery
- [ ] Contract testing for API stability
- [ ] Accessibility automation with axe-core