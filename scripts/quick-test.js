// 快速测试脚本
const http = require('http');

console.log('🚀 快速API测试\n');

const endpoints = [
  '/api/health',
  '/api/freelance'
];

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: endpoint,
      method: 'GET',
      timeout: 3000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            endpoint,
            status: res.statusCode,
            success: true,
            data: json,
            headers: {
              requestId: res.headers['x-request-id'],
              processingTime: res.headers['x-processing-time']
            }
          });
        } catch (error) {
          resolve({
            endpoint,
            status: res.statusCode,
            success: false,
            error: '无效的JSON: ' + error.message,
            rawData: data.substring(0, 200)
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        endpoint,
        status: 0,
        success: false,
        error: '连接失败: ' + error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        endpoint,
        status: 0,
        success: false,
        error: '请求超时'
      });
    });
    
    req.end();
  });
}

async function runTests() {
  for (const endpoint of endpoints) {
    console.log(`🔍 测试: ${endpoint}`);
    const result = await testEndpoint(endpoint);
    
    if (result.success) {
      console.log(`   ✅ 成功 (${result.status})`);
      console.log(`      请求ID: ${result.headers.requestId || '无'}`);
      console.log(`      处理时间: ${result.headers.processingTime || '无'}ms`);
      
      // 检查响应格式
      const resp = result.data;
      console.log(`      格式检查:`);
      console.log(`        success: ${resp.success !== undefined ? '✅' : '❌'}`);
      console.log(`        timestamp: ${resp.timestamp ? '✅' : '❌'}`);
      console.log(`        version: ${resp.version ? '✅' : '❌'}`);
      console.log(`        requestId: ${resp.requestId ? '✅' : '❌'}`);
      
      if (resp.success) {
        console.log(`        data: ${resp.data ? '✅' : '❌'}`);
      } else {
        console.log(`        error: ${resp.error ? '✅' : '❌'}`);
      }
    } else {
      console.log(`   ❌ 失败: ${result.error}`);
      if (result.rawData) {
        console.log(`      原始响应: ${result.rawData}`);
      }
    }
    console.log('');
  }
}

runTests().catch(console.error);