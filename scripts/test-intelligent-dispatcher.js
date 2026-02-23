#!/usr/bin/env node

const http = require('http');

// 测试查询列表
const testQueries = [
  { query: '开发一个React组件库', priority: 'high' },
  { query: '查找TypeScript最佳实践', priority: 'medium' },
  { query: '执行系统健康检查脚本', priority: 'critical' },
  { query: '生成API文档模板', priority: 'low' },
  { query: '优化数据库查询性能', priority: 'high' }
];

// 性能统计
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  systemsUsed: {},
  taskTypes: {},
  strategies: {}
};

// 测试单个分发
function testDispatch(query, priority, index) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const postData = JSON.stringify({
      action: 'dispatch',
      query,
      priority
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
            
            // 记录系统使用
            const system = json.data.data.source;
            stats.systemsUsed[system] = (stats.systemsUsed[system] || 0) + 1;
            
            // 记录任务类型
            const taskType = json.data.data.taskType;
            stats.taskTypes[taskType] = (stats.taskTypes[taskType] || 0) + 1;
            
            console.log(`✅ 测试 ${index + 1}: "${query.substring(0, 30)}..."`);
            console.log(`   优先级: ${priority}, 系统: ${system}, 任务类型: ${taskType}`);
            console.log(`   响应时间: ${responseTime}ms, 缓存: ${json.data.data.cached ? '命中' : '未命中'}`);
          } else {
            stats.failedRequests++;
            console.log(`❌ 测试 ${index + 1} 失败: ${json.error}`);
          }
        } catch (e) {
          stats.failedRequests++;
          console.log(`❌ 测试 ${index + 1} 解析失败: ${e.message}`);
        }
        
        resolve();
      });
    });

    req.on('error', (e) => {
      stats.failedRequests++;
      stats.totalRequests++;
      console.log(`❌ 测试 ${index + 1} 请求失败: ${e.message}`);
      resolve();
    });

    req.on('timeout', () => {
      stats.failedRequests++;
      stats.totalRequests++;
      console.log(`❌ 测试 ${index + 1} 请求超时`);
      req.destroy();
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// 获取分发统计
function getDispatchStats() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v2/dispatcher?action=stats',
      method: 'GET',
      timeout: 5000
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

// 运行性能测试
async function runPerformanceTest() {
  console.log('🚀 开始智能分发系统性能测试...\n');
  
  // 顺序测试
  for (let i = 0; i < testQueries.length; i++) {
    const { query, priority } = testQueries[i];
    await testDispatch(query, priority, i);
    // 添加延迟避免服务器过载
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 获取分发统计
  const dispatchStats = await getDispatchStats();
  
  // 计算统计
  const totalTime = stats.responseTimes.reduce((sum, time) => sum + time, 0);
  const avgResponseTime = stats.responseTimes.length > 0 ? totalTime / stats.responseTimes.length : 0;
  const sortedTimes = [...stats.responseTimes].sort((a, b) => a - b);
  const p95Index = Math.floor(stats.responseTimes.length * 0.95);
  const p95ResponseTime = sortedTimes[p95Index] || 0;
  
  const successRate = stats.totalRequests > 0 ? (stats.successfulRequests / stats.totalRequests) * 100 : 0;
  
  // 输出结果
  console.log('\n📊 性能测试结果:');
  console.log('='.repeat(50));
  console.log(`总请求数: ${stats.totalRequests}`);
  console.log(`成功请求: ${stats.successfulRequests} (${successRate.toFixed(1)}%)`);
  console.log(`失败请求: ${stats.failedRequests}`);
  console.log(`平均响应时间: ${avgResponseTime.toFixed(1)}ms`);
  console.log(`P95响应时间: ${p95ResponseTime}ms`);
  
  console.log('\n🔧 系统使用分布:');
  Object.entries(stats.systemsUsed).forEach(([system, count]) => {
    const percentage = (count / stats.totalRequests * 100).toFixed(1);
    console.log(`  ${system}: ${count}次 (${percentage}%)`);
  });
  
  console.log('\n🎯 任务类型分布:');
  Object.entries(stats.taskTypes).forEach(([type, count]) => {
    const percentage = (count / stats.totalRequests * 100).toFixed(1);
    console.log(`  ${type}: ${count}次 (${percentage}%)`);
  });
  
  if (dispatchStats) {
    console.log('\n📈 历史统计对比:');
    console.log(`  总历史任务: ${dispatchStats.totalTasks}`);
    console.log(`  历史成功率: ${(dispatchStats.successRate * 100).toFixed(1)}%`);
    console.log(`  历史缓存率: ${(dispatchStats.cacheRate * 100).toFixed(1)}%`);
    console.log(`  历史平均时间: ${dispatchStats.averageExecutionTime.toFixed(1)}ms`);
  }
  
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
  
  // 检查系统多样性
  const systemCount = Object.keys(stats.systemsUsed).length;
  if (systemCount >= 2) {
    console.log('✅ 系统多样性: 良好 (使用多个系统)');
  } else {
    console.log('⚠️  系统多样性: 一般 (主要使用单一系统)');
  }
}

// 运行测试
runPerformanceTest().catch(console.error);