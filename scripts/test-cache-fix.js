#!/usr/bin/env node

const http = require('http');

// 测试缓存功能
const testQueries = [
  '创建一个React用户登录组件',
  '设计PostgreSQL数据库表结构',
  '配置Docker Compose文件'
];

console.log('🧪 测试智能分发系统缓存功能...\n');

// 测试重复查询的缓存效果
async function testCacheEffect() {
  const results = [];
  
  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`📝 测试查询 "${query}"`);
    
    // 第一次查询（应该未命中缓存）
    const firstResponse = await makeRequest(query, 'first');
    results.push({ query, first: firstResponse });
    
    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 第二次查询（应该命中缓存）
    const secondResponse = await makeRequest(query, 'second');
    results.push({ query, second: secondResponse });
    
    console.log(`   第一次: ${firstResponse.time}ms, 缓存: ${firstResponse.cached ? '命中' : '未命中'}`);
    console.log(`   第二次: ${secondResponse.time}ms, 缓存: ${secondResponse.cached ? '命中' : '未命中'}`);
    console.log(`   性能提升: ${((firstResponse.time - secondResponse.time) / firstResponse.time * 100).toFixed(1)}%\n`);
  }
  
  // 分析结果
  const totalFirstTime = results.filter(r => r.first).reduce((sum, r) => sum + r.first.time, 0);
  const totalSecondTime = results.filter(r => r.second).reduce((sum, r) => sum + r.second.time, 0);
  const cacheHits = results.filter(r => r.second && r.second.cached).length;
  
  console.log('📊 缓存测试结果:');
  console.log('='.repeat(50));
  console.log(`总查询次数: ${results.length}`);
  console.log(`缓存命中次数: ${cacheHits}`);
  console.log(`首次平均响应时间: ${(totalFirstTime / testQueries.length).toFixed(1)}ms`);
  console.log(`二次平均响应时间: ${(totalSecondTime / testQueries.length).toFixed(1)}ms`);
  console.log(`平均性能提升: ${((totalFirstTime - totalSecondTime) / totalFirstTime * 100).toFixed(1)}%`);
  console.log('='.repeat(50));
}

// 发送请求
function makeRequest(query, attempt) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const postData = JSON.stringify({
      action: 'dispatch',
      query,
      priority: 'medium',
      useCache: true
    });
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v2/dispatcher',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        try {
          const json = JSON.parse(data);
          if (json.success) {
            resolve({
              time: responseTime,
              cached: json.data.data.cached,
              success: true,
              attempt
            });
          } else {
            resolve({
              time: responseTime,
              cached: false,
              success: false,
              error: json.error,
              attempt
            });
          }
        } catch (e) {
          resolve({
            time: responseTime,
            cached: false,
            success: false,
            error: e.message,
            attempt
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        time: Date.now() - startTime,
        cached: false,
        success: false,
        error: e.message,
        attempt
      });
    });

    req.on('timeout', () => {
      resolve({
        time: 5000,
        cached: false,
        success: false,
        error: '请求超时',
        attempt
      });
      req.destroy();
    });

    req.write(postData);
    req.end();
  });
}

// 获取缓存统计
async function getCacheStats() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v2/dispatcher?action=cache-stats',
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.success ? json.data : null);
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    req.end();
  });
}

// 运行测试
async function runTest() {
  console.log('🚀 开始缓存功能测试...\n');
  
  // 运行缓存测试
  await testCacheEffect();
  
  // 获取缓存统计
  const cacheStats = await getCacheStats();
  if (cacheStats) {
    console.log('\n📈 缓存统计信息:');
    console.log('='.repeat(50));
    console.log(`缓存大小: ${cacheStats.size || 0} 项`);
    console.log(`命中率: ${cacheStats.hitRate || 0}%`);
    console.log(`命中次数: ${cacheStats.hits || 0}`);
    console.log(`未命中次数: ${cacheStats.misses || 0}`);
    console.log('='.repeat(50));
  }
  
  console.log('\n✅ 缓存功能测试完成！');
}

runTest().catch(console.error);