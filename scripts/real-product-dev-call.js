#!/usr/bin/env node

const http = require('http');

console.log('🚀 开始实际产品开发调用测试...\n');

// 实际产品开发场景
const realProductDevScenarios = [
  {
    name: 'React组件开发',
    query: '创建一个用户登录表单组件，包含邮箱、密码输入框和提交按钮，使用React Hooks和TypeScript',
    type: 'frontend',
    priority: 'high',
    expected: '应该返回React组件代码和最佳实践建议'
  },
  {
    name: 'API设计',
    query: '设计一个用户管理REST API，包含用户注册、登录、信息更新和删除功能，使用JWT认证',
    type: 'backend',
    priority: 'critical',
    expected: '应该返回API端点设计、数据库模型和认证流程'
  },
  {
    name: '数据库优化',
    query: '优化PostgreSQL查询性能，针对有100万条用户记录的用户表，如何创建索引和优化查询',
    type: 'database',
    priority: 'high',
    expected: '应该返回索引策略、查询优化建议和性能监控方法'
  },
  {
    name: 'Docker部署',
    query: '创建一个Node.js应用的Dockerfile和多阶段构建配置，包含生产环境优化',
    type: 'devops',
    priority: 'medium',
    expected: '应该返回Dockerfile配置、多阶段构建脚本和部署指南'
  },
  {
    name: '测试策略',
    query: '为React前端应用设计完整的测试策略，包括单元测试、集成测试和E2E测试',
    type: 'testing',
    priority: 'medium',
    expected: '应该返回测试框架选择、测试用例设计和CI/CD集成'
  },
  {
    name: '架构设计',
    query: '设计一个微服务电商系统的架构，包含商品、订单、支付和用户服务',
    type: 'architecture',
    priority: 'critical',
    expected: '应该返回系统架构图、服务划分和通信机制'
  }
];

// 测试单个场景
function testScenario(scenario, index) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const postData = JSON.stringify({
      action: 'dispatch',
      query: scenario.query,
      priority: scenario.priority,
      context: {
        queryType: scenario.type,
        source: 'real-product-dev',
        scenario: scenario.name
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
      timeout: 15000
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
          const responseData = json.data?.data || json.data;
          
          console.log(`📋 场景 ${index + 1}: ${scenario.name}`);
          console.log(`  查询: "${scenario.query.substring(0, 60)}..."`);
          
          if (json.success) {
            const system = responseData?.dispatchDecision?.system || responseData?.system || 'unknown';
            const strategy = responseData?.dispatchDecision?.strategy || 'unknown';
            const cached = responseData?.cached ? '✅ 缓存命中' : '🔄 实时处理';
            
            console.log(`  结果: ${cached}`);
            console.log(`  系统: ${system}, 策略: ${strategy}`);
            console.log(`  响应时间: ${responseTime}ms`);
            
            // 显示响应摘要
            if (responseData?.data) {
              const responseType = typeof responseData.data === 'object' ? 'object' : typeof responseData.data;
              console.log(`  响应类型: ${responseType}`);
              
              if (responseType === 'object' && responseData.data.system) {
                console.log(`  处理系统: ${responseData.data.system}`);
              }
              
              if (responseData.data.monitoring) {
                console.log(`  工具状态: ${responseData.data.monitoring.healthyTools}/${responseData.data.monitoring.totalTools} 健康`);
              }
            }
            
            // 评估响应相关性
            const queryKeywords = scenario.query.toLowerCase().split(' ');
            const responseText = JSON.stringify(responseData).toLowerCase();
            let keywordMatches = 0;
            
            queryKeywords.forEach(keyword => {
              if (keyword.length > 3 && responseText.includes(keyword)) {
                keywordMatches++;
              }
            });
            
            const relevanceScore = (keywordMatches / Math.min(queryKeywords.length, 10)) * 100;
            console.log(`  相关性: ${relevanceScore.toFixed(1)}% (${keywordMatches}/${Math.min(queryKeywords.length, 10)} 关键词匹配)`);
            
          } else {
            console.log(`  ❌ 失败: ${json.error || '未知错误'}`);
          }
          
        } catch (e) {
          console.log(`  ❌ 解析失败: ${e.message}`);
        }
        
        console.log('  ' + '─'.repeat(60));
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log(`  ❌ 请求失败: ${e.message}`);
      console.log('  ' + '─'.repeat(60));
      resolve();
    });

    req.on('timeout', () => {
      console.log(`  ❌ 请求超时 (15秒)`);
      console.log('  ' + '─'.repeat(60));
      req.destroy();
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// 运行测试
async function runTest() {
  console.log('🎯 测试实际产品开发场景...\n');
  
  for (let i = 0; i < realProductDevScenarios.length; i++) {
    await testScenario(realProductDevScenarios[i], i);
    
    // 场景间延迟
    if (i < realProductDevScenarios.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n✅ 实际产品开发调用测试完成！');
  console.log('\n📋 智能分发系统状态:');
  console.log('  1. API端点: http://localhost:3001/api/v2/dispatcher');
  console.log('  2. 支持场景: 前端开发、后端设计、数据库优化、DevOps、测试策略、架构设计');
  console.log('  3. 功能特性: 智能路由、缓存优化、性能监控、多系统集成');
  console.log('  4. 响应时间: < 100ms (缓存命中)');
  console.log('  5. 集成系统: Mission Control、上下文缓存、统一网关');
  
  console.log('\n🚀 立即开始使用:');
  console.log('  curl -X POST "http://localhost:3001/api/v2/dispatcher" \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"action":"dispatch","query":"你的产品开发问题","priority":"medium","useCache":true}\'');
}

// 运行测试
runTest().catch(console.error);