#!/usr/bin/env node

const http = require('http');

// 产品开发相关查询
const productDevQueries = [
  // 前端开发
  { query: '创建一个React用户登录组件，包含表单验证和状态管理', type: 'frontend' },
  { query: '实现Next.js 15的App Router页面路由配置', type: 'frontend' },
  { query: '设计一个响应式导航栏组件，支持移动端菜单', type: 'frontend' },
  
  // 后端开发  
  { query: '创建Express.js REST API端点，包含JWT认证', type: 'backend' },
  { query: '设计PostgreSQL数据库表结构，用于用户管理系统', type: 'backend' },
  { query: '实现Redis缓存系统，用于会话管理和API响应缓存', type: 'backend' },
  
  // 部署运维
  { query: '配置Docker Compose文件，用于多服务应用部署', type: 'devops' },
  { query: '设置GitHub Actions CI/CD流水线，包含测试和部署', type: 'devops' },
  { query: '配置Nginx反向代理，支持HTTPS和负载均衡', type: 'devops' },
  
  // 知识查询
  { query: 'TypeScript最佳实践和常见错误避免方法', type: 'knowledge' },
  { query: 'React性能优化技巧和工具推荐', type: 'knowledge' },
  { query: '微服务架构设计模式和通信方式', type: 'knowledge' },
  
  // 技能执行
  { query: '执行系统健康检查脚本，生成详细报告', type: 'skill' },
  { query: '运行数据库备份脚本，保存到指定目录', type: 'skill' },
  { query: '执行代码质量检查，使用ESLint和Prettier', type: 'skill' }
];

// 测试统计
const stats = {
  total: 0,
  successful: 0,
  failed: 0,
  responseTimes: [],
  taskTypes: {},
  systemsUsed: {},
  cacheHits: 0,
  cacheMisses: 0,
  errors: []
};

// 测试单个查询
function testQuery(query, type, index) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const postData = JSON.stringify({
      action: 'process',
      query,
      priority: 'medium',
      context: { source: 'product-dev-test', queryType: type }
    });
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/unified',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 15000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        stats.responseTimes.push(responseTime);
        stats.total++;
        
        try {
          const json = JSON.parse(data);
          if (json.success) {
            stats.successful++;
            
            // 记录任务类型
            const taskType = json.data.taskType || 'unknown';
            stats.taskTypes[taskType] = (stats.taskTypes[taskType] || 0) + 1;
            
            // 记录系统使用
            const system = json.data.source || 'unknown';
            stats.systemsUsed[system] = (stats.systemsUsed[system] || 0) + 1;
            
            // 记录缓存状态
            if (json.data.cached) {
              stats.cacheHits++;
            } else {
              stats.cacheMisses++;
            }
            
            console.log(`✅ 测试 ${index + 1} (${type}):`);
            console.log(`   查询: "${query.substring(0, 40)}..."`);
            console.log(`   任务类型: ${taskType}, 系统: ${system}`);
            console.log(`   响应时间: ${responseTime}ms, 缓存: ${json.data.cached ? '命中' : '未命中'}`);
            
            // 显示部分结果
            if (json.data.data && typeof json.data.data === 'string') {
              console.log(`   结果预览: ${json.data.data.substring(0, 80)}...`);
            }
          } else {
            stats.failed++;
            stats.errors.push({ query, error: json.error });
            console.log(`❌ 测试 ${index + 1} 失败: ${json.error}`);
          }
        } catch (e) {
          stats.failed++;
          stats.errors.push({ query, error: e.message });
          console.log(`❌ 测试 ${index + 1} 解析失败: ${e.message}`);
        }
        
        resolve();
      });
    });

    req.on('error', (e) => {
      stats.failed++;
      stats.total++;
      stats.errors.push({ query, error: e.message });
      console.log(`❌ 测试 ${index + 1} 请求失败: ${e.message}`);
      resolve();
    });

    req.on('timeout', () => {
      stats.failed++;
      stats.total++;
      stats.errors.push({ query, error: '请求超时' });
      console.log(`❌ 测试 ${index + 1} 请求超时`);
      req.destroy();
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// 获取网关统计
function getGatewayStats() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/unified?action=stats',
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

// 运行产品开发测试
async function runProductDevTest() {
  console.log('🚀 开始产品开发调用测试...\n');
  console.log('📋 测试场景: 15个产品开发相关查询\n');
  
  // 顺序测试
  for (let i = 0; i < productDevQueries.length; i++) {
    const { query, type } = productDevQueries[i];
    await testQuery(query, type, i);
    // 添加延迟避免服务器过载
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // 获取网关统计
  const gatewayStats = await getGatewayStats();
  
  // 计算统计
  const totalTime = stats.responseTimes.reduce((sum, time) => sum + time, 0);
  const avgResponseTime = stats.responseTimes.length > 0 ? totalTime / stats.responseTimes.length : 0;
  const sortedTimes = [...stats.responseTimes].sort((a, b) => a - b);
  const p95Index = Math.floor(stats.responseTimes.length * 0.95);
  const p95ResponseTime = sortedTimes[p95Index] || 0;
  
  const successRate = stats.total > 0 ? (stats.successful / stats.total) * 100 : 0;
  const cacheRate = (stats.cacheHits + stats.cacheMisses) > 0 ? 
    (stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100 : 0;
  
  // 输出结果
  console.log('\n📊 产品开发调用测试结果:');
  console.log('='.repeat(60));
  console.log(`总查询数: ${stats.total}`);
  console.log(`成功查询: ${stats.successful} (${successRate.toFixed(1)}%)`);
  console.log(`失败查询: ${stats.failed}`);
  console.log(`平均响应时间: ${avgResponseTime.toFixed(1)}ms`);
  console.log(`P95响应时间: ${p95ResponseTime}ms`);
  console.log(`缓存命中率: ${cacheRate.toFixed(1)}% (命中: ${stats.cacheHits}, 未命中: ${stats.cacheMisses})`);
  
  console.log('\n🔧 任务类型分布:');
  Object.entries(stats.taskTypes).forEach(([type, count]) => {
    const percentage = (count / stats.total * 100).toFixed(1);
    console.log(`  ${type}: ${count}次 (${percentage}%)`);
  });
  
  console.log('\n🏗️ 系统使用分布:');
  Object.entries(stats.systemsUsed).forEach(([system, count]) => {
    const percentage = (count / stats.total * 100).toFixed(1);
    console.log(`  ${system}: ${count}次 (${percentage}%)`);
  });
  
  if (gatewayStats) {
    console.log('\n📈 网关历史统计:');
    console.log(`  总请求数: ${gatewayStats.totalRequests || 0}`);
    console.log(`  缓存命中率: ${gatewayStats.cacheStats?.hitRate || 0}%`);
    console.log(`  平均响应时间: ${gatewayStats.averageResponseTime || 0}ms`);
  }
  
  console.log('='.repeat(60));
  
  // 评估
  console.log('\n🎯 产品开发调用能力评估:');
  
  // 响应时间评估
  if (avgResponseTime < 500) {
    console.log('✅ 响应速度: 优秀 (< 500ms) - 适合实时开发交互');
  } else if (avgResponseTime < 2000) {
    console.log('⚠️  响应速度: 可接受 (< 2s) - 适合异步开发任务');
  } else {
    console.log('❌ 响应速度: 较慢 (> 2s) - 需要优化');
  }
  
  // 成功率评估
  if (successRate >= 95) {
    console.log('✅ 可靠性: 优秀 (≥ 95%) - 生产环境可用');
  } else if (successRate >= 85) {
    console.log('⚠️  可靠性: 可接受 (≥ 85%) - 开发环境可用');
  } else {
    console.log('❌ 可靠性: 需要优化 (< 85%)');
  }
  
  // 缓存效果评估
  if (cacheRate >= 30) {
    console.log('✅ 缓存效果: 良好 (≥ 30%) - 有效减少重复计算');
  } else if (cacheRate >= 10) {
    console.log('⚠️  缓存效果: 一般 (≥ 10%) - 有优化空间');
  } else {
    console.log('❌ 缓存效果: 较差 (< 10%) - 需要优化缓存策略');
  }
  
  // 系统多样性评估
  const systemCount = Object.keys(stats.systemsUsed).length;
  if (systemCount >= 3) {
    console.log('✅ 系统集成: 优秀 (≥ 3个系统) - 充分利用各系统优势');
  } else if (systemCount >= 2) {
    console.log('⚠️  系统集成: 良好 (≥ 2个系统)');
  } else {
    console.log('❌ 系统集成: 单一 (< 2个系统) - 需要更多系统集成');
  }
  
  // 任务类型覆盖评估
  const taskTypeCount = Object.keys(stats.taskTypes).length;
  if (taskTypeCount >= 4) {
    console.log('✅ 任务覆盖: 全面 (≥ 4种类型) - 支持多样化开发需求');
  } else if (taskTypeCount >= 2) {
    console.log('⚠️  任务覆盖: 基本 (≥ 2种类型)');
  } else {
    console.log('❌ 任务覆盖: 有限 (< 2种类型)');
  }
  
  // 错误分析
  if (stats.errors.length > 0) {
    console.log('\n⚠️  错误分析:');
    stats.errors.slice(0, 3).forEach((error, i) => {
      console.log(`  ${i + 1}. "${error.query.substring(0, 30)}..." → ${error.error}`);
    });
    if (stats.errors.length > 3) {
      console.log(`  ... 还有 ${stats.errors.length - 3} 个错误`);
    }
  }
  
  console.log('\n🚀 建议:');
  if (successRate < 95) {
    console.log('  • 优化错误处理，提高系统稳定性');
  }
  if (cacheRate < 30) {
    console.log('  • 优化缓存策略，增加缓存命中率');
  }
  if (systemCount < 3) {
    console.log('  • 集成更多系统，如OKMS、OpenClaw技能等');
  }
  if (avgResponseTime > 2000) {
    console.log('  • 优化慢查询，增加并行处理能力');
  }
  
  console.log('\n✅ 产品开发调用测试完成！');
}

// 运行测试
runProductDevTest().catch(console.error);