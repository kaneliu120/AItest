#!/usr/bin/env node

const http = require('http');

// 产品开发相关查询
const productDevQueries = [
  // 前端开发
  { query: '如何创建一个React组件？', type: 'frontend', priority: 'medium' },
  { query: 'Next.js页面路由的最佳实践', type: 'frontend', priority: 'medium' },
  { query: 'Tailwind CSS响应式设计指南', type: 'frontend', priority: 'low' },
  { query: 'TypeScript类型定义优化', type: 'frontend', priority: 'medium' },
  
  // 后端开发
  { query: 'Node.js API认证实现', type: 'backend', priority: 'high' },
  { query: 'PostgreSQL数据库连接池配置', type: 'backend', priority: 'medium' },
  { query: 'Redis缓存策略优化', type: 'backend', priority: 'high' },
  { query: '微服务架构设计模式', type: 'backend', priority: 'critical' },
  
  // DevOps
  { query: 'Docker容器化部署流程', type: 'devops', priority: 'medium' },
  { query: 'GitHub Actions CI/CD配置', type: 'devops', priority: 'high' },
  { query: 'Kubernetes服务发现机制', type: 'devops', priority: 'critical' },
  { query: '云原生应用监控方案', type: 'devops', priority: 'medium' },
  
  // 架构设计
  { query: '系统架构设计原则', type: 'architecture', priority: 'critical' },
  { query: '高可用系统设计模式', type: 'architecture', priority: 'critical' },
  { query: '数据库分片策略', type: 'architecture', priority: 'high' },
  { query: '消息队列选型指南', type: 'architecture', priority: 'medium' },
  
  // 测试和质量
  { query: '单元测试最佳实践', type: 'testing', priority: 'medium' },
  { query: '端到端测试框架比较', type: 'testing', priority: 'low' },
  { query: '代码质量检查工具配置', type: 'testing', priority: 'medium' },
  { query: '性能测试方法论', type: 'testing', priority: 'high' },
  
  // 项目管理
  { query: '敏捷开发流程管理', type: 'management', priority: 'medium' },
  { query: '技术债务管理策略', type: 'management', priority: 'high' },
  { query: '团队协作工具选择', type: 'management', priority: 'low' },
  { query: '项目风险评估方法', type: 'management', priority: 'critical' }
];

// 测试统计
const stats = {
  totalQueries: 0,
  successful: 0,
  failed: 0,
  cacheHits: 0,
  cacheMisses: 0,
  responseTimes: [],
  taskTypes: {},
  priorities: {},
  systems: {}
};

console.log('🚀 开始智能分发系统产品开发调用测试...\n');
console.log('📊 测试配置:');
console.log('  查询数量:', productDevQueries.length);
console.log('  类型分布:', {
  frontend: productDevQueries.filter(q => q.type === 'frontend').length,
  backend: productDevQueries.filter(q => q.type === 'backend').length,
  devops: productDevQueries.filter(q => q.type === 'devops').length,
  architecture: productDevQueries.filter(q => q.type === 'architecture').length,
  testing: productDevQueries.filter(q => q.type === 'testing').length,
  management: productDevQueries.filter(q => q.type === 'management').length
});
console.log('  优先级分布:', {
  critical: productDevQueries.filter(q => q.priority === 'critical').length,
  high: productDevQueries.filter(q => q.priority === 'high').length,
  medium: productDevQueries.filter(q => q.priority === 'medium').length,
  low: productDevQueries.filter(q => q.priority === 'low').length
});

// 测试单个查询
function testQuery(queryObj, index) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const postData = JSON.stringify({
      action: 'dispatch',
      query: queryObj.query,
      priority: queryObj.priority,
      context: {
        queryType: queryObj.type,
        source: 'product-dev-test'
      },
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
        stats.totalQueries++;
        
        try {
          const json = JSON.parse(data);
          
          // 统计任务类型
          stats.taskTypes[queryObj.type] = (stats.taskTypes[queryObj.type] || 0) + 1;
          stats.priorities[queryObj.priority] = (stats.priorities[queryObj.priority] || 0) + 1;
          
          if (json.success) {
            stats.successful++;
            
            // 注意：响应结构是 json.data.data
            const responseData = json.data?.data || json.data;
            
            // 统计系统分配
            const dispatchSystem = responseData?.dispatchDecision?.system || responseData?.system || 'unknown';
            stats.systems[dispatchSystem] = (stats.systems[dispatchSystem] || 0) + 1;
            
            // 统计缓存状态
            if (responseData?.cached) {
              stats.cacheHits++;
            } else {
              stats.cacheMisses++;
            }
            
            if (index % 5 === 0) { // 每5个查询显示一次进度
              console.log(`✅ 查询 ${index + 1}/${productDevQueries.length}: "${queryObj.query.substring(0, 40)}..."`);
              console.log(`   系统: ${dispatchSystem}, 策略: ${responseData?.dispatchDecision?.strategy || 'unknown'}, 缓存: ${responseData?.cached ? '命中' : '未命中'}, 时间: ${responseTime}ms`);
            }
          } else {
            stats.failed++;
            console.log(`❌ 查询 ${index + 1} 失败: ${json.error || '未知错误'}`);
          }
        } catch (e) {
          stats.failed++;
          console.log(`❌ 查询 ${index + 1} 解析失败: ${e.message}`);
        }
        
        resolve();
      });
    });

    req.on('error', (e) => {
      stats.failed++;
      stats.totalQueries++;
      console.log(`❌ 查询 ${index + 1} 请求失败: ${e.message}`);
      resolve();
    });

    req.on('timeout', () => {
      stats.failed++;
      stats.totalQueries++;
      console.log(`❌ 查询 ${index + 1} 请求超时`);
      req.destroy();
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// 获取智能分发系统统计
async function getDispatcherStats() {
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

// 获取缓存统计
async function getCacheStats() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v3/cache?action=stats',
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

// 运行测试
async function runTest() {
  console.log('\n🔍 开始执行产品开发查询...\n');
  
  // 分批执行查询，避免服务器压力
  const batchSize = 5;
  for (let i = 0; i < productDevQueries.length; i += batchSize) {
    const batch = productDevQueries.slice(i, i + batchSize);
    const promises = batch.map((query, idx) => 
      testQuery(query, i + idx)
    );
    
    await Promise.all(promises);
    
    // 批次间延迟
    if (i + batchSize < productDevQueries.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 获取系统统计
  const dispatcherStats = await getDispatcherStats();
  const cacheStats = await getCacheStats();
  
  // 计算统计
  const totalTime = stats.responseTimes.reduce((sum, time) => sum + time, 0);
  const avgResponseTime = stats.responseTimes.length > 0 ? totalTime / stats.responseTimes.length : 0;
  
  const successRate = stats.totalQueries > 0 ? (stats.successful / stats.totalQueries) * 100 : 0;
  const cacheHitRate = stats.successful > 0 ? (stats.cacheHits / stats.successful) * 100 : 0;
  
  // 输出结果
  console.log('\n📊 智能分发系统产品开发调用测试结果:');
  console.log('='.repeat(70));
  console.log(`总查询数: ${stats.totalQueries}`);
  console.log(`成功查询: ${stats.successful} (${successRate.toFixed(1)}%)`);
  console.log(`失败查询: ${stats.failed}`);
  console.log(`缓存命中: ${stats.cacheHits} (${cacheHitRate.toFixed(1)}%)`);
  console.log(`缓存未命中: ${stats.cacheMisses}`);
  console.log(`平均响应时间: ${avgResponseTime.toFixed(1)}ms`);
  
  console.log('\n🎯 任务类型分布:');
  Object.entries(stats.taskTypes).forEach(([type, count]) => {
    const percentage = (count / stats.totalQueries * 100).toFixed(1);
    console.log(`  ${type}: ${count}次 (${percentage}%)`);
  });
  
  console.log('\n⚡ 优先级分布:');
  Object.entries(stats.priorities).forEach(([priority, count]) => {
    const percentage = (count / stats.totalQueries * 100).toFixed(1);
    console.log(`  ${priority}: ${count}次 (${percentage}%)`);
  });
  
  console.log('\n🔧 系统分配分布:');
  Object.entries(stats.systems).forEach(([system, count]) => {
    const percentage = (count / stats.successful * 100).toFixed(1);
    console.log(`  ${system}: ${count}次 (${percentage}%)`);
  });
  
  if (dispatcherStats) {
    console.log('\n📈 智能分发系统统计:');
    console.log(`  总处理任务: ${dispatcherStats.totalTasks || 0}`);
    console.log(`  成功任务: ${dispatcherStats.successfulTasks || 0}`);
    console.log(`  失败任务: ${dispatcherStats.failedTasks || 0}`);
    console.log(`  平均处理时间: ${dispatcherStats.averageProcessingTime || 0}ms`);
    console.log(`  缓存命中率: ${dispatcherStats.cacheHitRate || '0.00'}%`);
  }
  
  if (cacheStats) {
    console.log('\n🧠 上下文缓存系统统计:');
    console.log(`  缓存大小: ${cacheStats.cacheSize || 0} 项`);
    console.log(`  命中率: ${cacheStats.hitRate || '0.00'}%`);
    console.log(`  语义命中率: ${cacheStats.semanticHitRate || '0.00'}%`);
    console.log(`  总请求数: ${cacheStats.totalRequests || 0}`);
  }
  
  console.log('='.repeat(70));
  
  // 性能评估
  console.log('\n🎯 智能分发系统性能评估:');
  
  // 成功率评估
  if (successRate >= 95) {
    console.log('✅ 系统可靠性: 优秀 (≥ 95%) - 高可用性');
  } else if (successRate >= 90) {
    console.log('⚠️  系统可靠性: 良好 (≥ 90%)');
  } else {
    console.log('❌ 系统可靠性: 需要优化 (< 90%)');
  }
  
  // 响应时间评估
  if (avgResponseTime < 100) {
    console.log('✅ 响应速度: 优秀 (< 100ms) - 实时响应');
  } else if (avgResponseTime < 300) {
    console.log('⚠️  响应速度: 可接受 (< 300ms)');
  } else {
    console.log('❌ 响应速度: 较慢 (> 300ms)');
  }
  
  // 缓存命中率评估
  if (cacheHitRate >= 50) {
    console.log('✅ 缓存效率: 优秀 (≥ 50%) - 显著减少重复计算');
  } else if (cacheHitRate >= 30) {
    console.log('⚠️  缓存效率: 良好 (≥ 30%)');
  } else {
    console.log('❌ 缓存效率: 需要优化 (< 30%)');
  }
  
  // 系统分配合理性评估
  const expectedSystems = ['mission-control', 'okms', 'unified-gateway'];
  const actualSystems = Object.keys(stats.systems);
  const systemCoverage = expectedSystems.filter(sys => actualSystems.includes(sys)).length / expectedSystems.length;
  
  if (systemCoverage >= 0.8) {
    console.log('✅ 系统集成: 优秀 (≥ 80%) - 多系统协同工作');
  } else if (systemCoverage >= 0.5) {
    console.log('⚠️  系统集成: 良好 (≥ 50%)');
  } else {
    console.log('❌ 系统集成: 需要优化 (< 50%)');
  }
  
  console.log('\n🚀 建议优化措施:');
  
  if (successRate < 90) {
    console.log('  • 检查API端点健康状态');
    console.log('  • 优化错误处理机制');
    console.log('  • 增加重试逻辑');
  }
  
  if (avgResponseTime > 300) {
    console.log('  • 优化任务处理算法');
    console.log('  • 增加并发处理能力');
    console.log('  • 优化数据库查询');
  }
  
  if (cacheHitRate < 30) {
    console.log('  • 优化缓存策略配置');
    console.log('  • 增加缓存预热机制');
    console.log('  • 调整缓存TTL时间');
  }
  
  if (systemCoverage < 0.5) {
    console.log('  • 检查系统集成配置');
    console.log('  • 验证API连接状态');
    console.log('  • 完善系统路由逻辑');
  }
  
  console.log('\n✅ 智能分发系统产品开发调用测试完成！');
  console.log('\n📋 立即可用:');
  console.log('  1. 智能分发API: http://localhost:3001/api/v2/dispatcher');
  console.log('  2. 上下文缓存API: http://localhost:3001/api/v3/cache');
  console.log('  3. 统一网关API: http://localhost:3001/api/v1/unified');
  console.log('  4. 管理界面: http://localhost:3001/intelligent-dispatcher');
  console.log('  5. 缓存界面: http://localhost:3001/context-cache');
}

// 运行测试
runTest().catch(console.error);