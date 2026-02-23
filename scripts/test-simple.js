// 简单测试脚本
const http = require('http');

console.log('🚀 测试简化版API\n');

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: endpoint,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          endpoint,
          status: res.statusCode,
          data: data,
          headers: {
            requestId: res.headers['x-request-id'],
            processingTime: res.headers['x-processing-time']
          }
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        endpoint,
        status: 0,
        error: '连接失败: ' + error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        endpoint,
        status: 0,
        error: '请求超时'
      });
    });
    
    req.end();
  });
}

async function runTests() {
  const endpoints = [
    '/api/simple',
    '/api/health',
    '/api/freelance'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`🔍 测试: ${endpoint}`);
    const result = await testEndpoint(endpoint);
    
    if (result.error) {
      console.log(`   ❌ 失败: ${result.error}`);
    } else {
      console.log(`   ✅ 响应状态: ${result.status}`);
      console.log(`      请求ID: ${result.headers.requestId || '无'}`);
      console.log(`      处理时间: ${result.headers.processingTime || '无'}ms`);
      
      // 尝试解析JSON
      try {
        const json = JSON.parse(result.data);
        console.log(`      JSON解析: ✅ 成功`);
        console.log(`      响应格式:`);
        console.log(`        success: ${json.success !== undefined ? '✅' : '❌'}`);
        console.log(`        timestamp: ${json.timestamp ? '✅' : '❌'}`);
        console.log(`        version: ${json.version ? '✅' : '❌'}`);
        console.log(`        requestId: ${json.requestId ? '✅' : '❌'}`);
        
        // 显示部分数据
        if (json.data) {
          const dataStr = JSON.stringify(json.data).substring(0, 100);
          console.log(`        数据: ${dataStr}...`);
        }
      } catch (e) {
        console.log(`      JSON解析: ❌ 失败: ${e.message}`);
        console.log(`      原始响应: ${result.data.substring(0, 200)}...`);
      }
    }
    console.log('');
  }
}

// 等待服务器启动
setTimeout(() => {
  runTests().catch(console.error);
}, 2000);