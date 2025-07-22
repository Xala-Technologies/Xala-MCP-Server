const axios = require('axios');

const baseURL = 'http://localhost:3000';

async function runTests() {
  console.log('🧪 Running MCP Workflow Server Tests\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Health Check
  try {
    const res = await axios.get(`${baseURL}/health`);
    if (res.data.status === 'healthy') {
      console.log('✅ Health check passed');
      passed++;
    } else {
      throw new Error('Invalid health status');
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    failed++;
  }
  
  // Test 2: List Resources
  try {
    const res = await axios.post(`${baseURL}/mcp`, {
      jsonrpc: '2.0',
      id: 1,
      method: 'resources/list'
    });
    if (res.data.result && res.data.result.resources) {
      console.log('✅ List resources passed');
      passed++;
    } else {
      throw new Error('Invalid resources response');
    }
  } catch (error) {
    console.log('❌ List resources failed:', error.message);
    failed++;
  }
  
  // Test 3: List Tools
  try {
    const res = await axios.post(`${baseURL}/mcp`, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    });
    if (res.data.result && res.data.result.tools) {
      console.log('✅ List tools passed');
      passed++;
    } else {
      throw new Error('Invalid tools response');
    }
  } catch (error) {
    console.log('❌ List tools failed:', error.message);
    failed++;
  }
  
  // Test 4: Call Tool
  try {
    const res = await axios.post(`${baseURL}/mcp`, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'generate-specification',
        arguments: {
          prompt: 'Test prompt',
          projectId: 'test-project'
        }
      }
    });
    if (res.data.result && res.data.result.content) {
      console.log('✅ Tool call passed');
      passed++;
    } else {
      throw new Error('Invalid tool response');
    }
  } catch (error) {
    console.log('❌ Tool call failed:', error.message);
    failed++;
  }
  
  // Test 5: Invalid Method
  try {
    const res = await axios.post(`${baseURL}/mcp`, {
      jsonrpc: '2.0',
      id: 4,
      method: 'invalid/method'
    });
    if (res.data.error && res.data.error.code === -32601) {
      console.log('✅ Error handling passed');
      passed++;
    } else {
      throw new Error('Should have returned method not found error');
    }
  } catch (error) {
    console.log('❌ Error handling failed:', error.message);
    failed++;
  }
  
  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed!');
    process.exit(1);
  }
}

// Start server first
console.log('Starting server...');
const { spawn } = require('child_process');
const server = spawn('node', ['dist/simple-server.js'], {
  detached: false
});

// Wait for server to start
setTimeout(async () => {
  try {
    await runTests();
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  } finally {
    server.kill();
  }
}, 2000);

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});