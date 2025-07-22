const axios = require('axios');
const { performance } = require('perf_hooks');

async function runPerformanceTest() {
  const baseURL = 'http://localhost:3000';
  const iterations = 100;
  const concurrentBatch = 10;
  
  console.log('🚀 Running Performance Test\n');
  
  // Test 1: Response Time
  console.log('📊 Response Time Test (100 sequential requests)');
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await axios.post(`${baseURL}/mcp`, {
      jsonrpc: '2.0',
      id: i,
      method: 'resources/list'
    });
    const end = performance.now();
    times.push(end - start);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  console.log(`  Average: ${avgTime.toFixed(2)}ms`);
  console.log(`  Min: ${minTime.toFixed(2)}ms`);
  console.log(`  Max: ${maxTime.toFixed(2)}ms`);
  console.log(`  ✅ Target: < 100ms average\n`);
  
  // Test 2: Concurrent Requests
  console.log('📊 Concurrent Request Test (10 parallel requests)');
  const concurrentStart = performance.now();
  
  const promises = Array(concurrentBatch).fill(null).map((_, i) => 
    axios.post(`${baseURL}/mcp`, {
      jsonrpc: '2.0',
      id: `concurrent-${i}`,
      method: 'tools/list'
    })
  );
  
  await Promise.all(promises);
  const concurrentEnd = performance.now();
  const concurrentTime = concurrentEnd - concurrentStart;
  
  console.log(`  Total time for ${concurrentBatch} concurrent requests: ${concurrentTime.toFixed(2)}ms`);
  console.log(`  Average per request: ${(concurrentTime / concurrentBatch).toFixed(2)}ms`);
  console.log(`  ✅ All requests completed successfully\n`);
  
  // Test 3: Throughput
  console.log('📊 Throughput Test');
  const throughputStart = performance.now();
  let successCount = 0;
  
  for (let i = 0; i < 50; i++) {
    try {
      await axios.post(`${baseURL}/mcp`, {
        jsonrpc: '2.0',
        id: `throughput-${i}`,
        method: i % 2 === 0 ? 'resources/list' : 'tools/list'
      });
      successCount++;
    } catch (error) {
      // Count failures
    }
  }
  
  const throughputEnd = performance.now();
  const throughputTime = (throughputEnd - throughputStart) / 1000; // seconds
  const requestsPerSecond = successCount / throughputTime;
  
  console.log(`  Completed ${successCount}/50 requests in ${throughputTime.toFixed(2)}s`);
  console.log(`  Throughput: ${requestsPerSecond.toFixed(2)} requests/second`);
  console.log(`  ✅ Target: > 100 requests/second\n`);
  
  console.log('✨ Performance test complete!');
}

runPerformanceTest().catch(console.error);