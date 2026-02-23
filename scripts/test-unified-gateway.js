#!/usr/bin/env node

const http = require('http');

// 测试查询列表
const testQueries = [
  '如何创建一个React组件？',
  '查找关于AI部署的最佳实践',
  '执行系统健康检查',
  '生成一个用户管理API',
  '搜索关于Next.js的性能优化',
  '运行自动化测试脚本',
  '开发一个电商网站',
  '学习TypeScript高级特性',
  '配置Docker容器',
  '优化数据库查询性能'
];

// 性能统计
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  cacheHits: 0,
  cacheMisses: 0
};

// 测试单个查询
function testQuery(query, index) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const encodedQuery = encodeURIComponent(query);
    const path = `/api/v1/unified?action=process&q=${encodedQuery}`;
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        stats.responseTimes.push(responseTime);
        stats.totalRequests++;
        
        try {
          const json = JSON.parse(data);
          if (json.success) {
            stats.successfulRequests++;
            if (json.data.cached) {
              stats.cacheHits++;
            } else {
              stats.cacheMisses++;
            }
            
            console.log(`✅ 查询 ${index + 1}: "${query.substring(0, 30)}..."`);
            console.log(`   响应时间: ${responseTime}ms, 缓存: ${json.data.cached ? '命中' : '未命中'}, 任务类型: ${json.data.taskType}`);
          } else {
            stats.failedRequests++;
            console.log(`❌ 查询 ${index + 1} 失败: ${json.error}`);
          }
        } catch (e) {
          stats.failedRequests++;
          console.log(`❌ 查询 ${index + 1} 解析失败: ${e.message}`);
        }
        
        resolve();
      });
    });

    req.on('error', (e) => {
      stats.failedRequests++;
      stats.totalRequests++;
      console.log(`❌ 查询 ${index + 1} 请求失败: ${e.message}`);
      resolve();
    });

    req.on('timeout', () => {
      stats.failedRequests++;
      stats.totalRequests++;
      console.log(`❌ 查询 ${index + 1} 请求超时`);
      req.destroy();
      resolve();
    });

    req.end();
  });
}

// 运行性能测试
async function runPerformanceTest() {
  console.log('🚀 开始统一API网关性能测试...\n');
  
  // 顺序测试
  for (let i = 0; i < testQueries.length; i++) {
    await testQuery(testQueries[i], i);
    // 添加延迟避免服务器过载
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 计算统计
  const totalTime = stats.responseTimes.reduce((sum, time) => sum + time, 0);
  const avgResponseTime = stats.responseTimes.length > 0 ? totalTime / stats.responseTimes.length : 0;
  const sortedTimes = [...stats.responseTimes].sort((a, b) => a - b);
  const p95Index = Math.floor(stats.responseTimes.length * 0.95);
  const p95ResponseTime = sortedTimes[p95Index] || 0;
  
  const totalCacheOperations = stats.cacheHits + stats.cacheMisses;
  const cacheHitRate = totalCacheOperations > 0 ? (stats.cacheHits / totalCacheOperations) * 100 : 0;
  const successRate = stats.totalRequests > 0 ? (stats.successfulRequests / stats.totalRequests) * 100 : 0;
  
  // 输出结果
  console.log('\n📊 性能测试结果:');
  console.log('='.repeat(50));
  console.log(`总请求数: ${stats.totalRequests}`);
  console.log(`成功请求: ${stats.successfulRequests} (${successRate.toFixed(1)}%)`);
  console.log(`失败请求: ${stats.failedRequests}`);
  console.log(`平均响应时间: ${avgResponseTime.toFixed(1)}ms`);
  console.log(`P95响应时间: ${p95ResponseTime}ms`);
  console.log(`缓存命中: ${stats.cacheHits}`);
  console.log(`缓存未命中: ${stats.cacheMisses}`);
  console.log(`缓存命中率: ${cacheHitRate.toFixed(1)}%`);
  console.log('='.repeat(50));
  
  // 评估
  console.log('\n🎯 性能评估:');
  if (avgResponseTime < 1000) {
    console.log('✅ 响应时间: 优秀 (< 1000ms)');
  } else if (avgResponseTime < 3000) {
    console.log('⚠️  响应时间: 可接受 (< 3000ms)');
  } else {
    console.log('❌ 响应时间: 需要优化 (> 3000ms)');
  }
  
  if (successRate >= 95) {
    console.log('✅ 成功率: 优秀 (≥ 95%)');
  } else if (successRate >= 85) {
    console.log('⚠️  成功率: 可接受 (≥ 85%)');
  } else {
    console.log('❌ 成功率: 需要优化 (< 85%)');
  }
  
  if (cacheHitRate >= 50) {
    console.log('✅ 缓存效果: 优秀 (≥ 50%)');
  } else if (cacheHitRate >= 30) {
    console.log('⚠️  缓存效果: 可接受 (≥ 30%)');
  } else {
    console.log('❌ 缓存效果: 需要优化 (< 30%)');
  }
}

// 运行测试
runPerformanceTest().catch(console.error);