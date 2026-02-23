#!/usr/bin/env node

const http = require('http');

console.log('🧠 测试知识增强开发系统...\n');

// 测试知识增强
function testKnowledgeEnhancement(query, scenario) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const postData = JSON.stringify({
      action: 'enhance',
      query,
      priority: 'high',
      enhancementLevel: 'enhanced',
      context: {
        scenario,
        source: 'test'
      }
    });
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v4/knowledge-dev',
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
          
          if (json.success) {
            const enhanced = json.data.enhanced;
            const taskAnalysis = enhanced.enhancedResponse.data?.taskAnalysis;
            const enhancements = enhanced.enhancements || [];
            const qualityMetrics = enhanced.qualityMetrics || {};
            const knowledgeSources = enhanced.knowledgeSources || [];
            
            console.log(`📋 ${scenario}:`);
            console.log(`  查询: "${query.substring(0, 60)}..."`);
            console.log(`  响应时间: ${responseTime}ms`);
            console.log(`  任务类型: ${taskAnalysis?.type || '未知'}`);
            console.log(`  复杂度: ${taskAnalysis?.complexity || '未知'}`);
            console.log(`  增强内容: ${enhancements.length} 项`);
            console.log(`  知识来源: ${knowledgeSources.length} 个`);
            
            // 质量指标
            if (qualityMetrics.completeness) {
              const avgQuality = (
                qualityMetrics.completeness + 
                qualityMetrics.accuracy + 
                qualityMetrics.relevance + 
                qualityMetrics.practicality
              ) / 4;
              
              console.log(`  质量评分: ${(avgQuality * 100).toFixed(1)}%`);
            }
            
            // 显示增强类型分布
            const enhancementTypes = {};
            enhancements.forEach(enh => {
              enhancementTypes[enh.type] = (enhancementTypes[enh.type] || 0) + 1;
            });
            
            console.log(`  增强类型:`, Object.entries(enhancementTypes).map(([type, count]) => `${type}:${count}`).join(', '));
            
          } else {
            console.log(`❌ ${scenario} 失败: ${json.error || '未知错误'}`);
          }
          
        } catch (e) {
          console.log(`❌ ${scenario} 解析失败: ${e.message}`);
        }
        
        console.log('  ' + '─'.repeat(60));
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log(`❌ ${scenario} 请求失败: ${e.message}`);
      console.log('  ' + '─'.repeat(60));
      resolve();
    });

    req.on('timeout', () => {
      console.log(`❌ ${scenario} 请求超时 (15秒)`);
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
  console.log('🎯 测试知识增强开发场景...\n');
  
  const testScenarios = [
    {
      name: 'React组件开发',
      query: '创建一个用户登录表单组件，包含邮箱、密码输入框和提交按钮，使用React Hooks和TypeScript，支持表单验证',
      type: 'code-generation'
    },
    {
      name: 'API设计优化',
      query: '设计一个高性能的用户管理REST API，支持JWT认证、速率限制、请求验证和错误处理',
      type: 'api-design'
    },
    {
      name: '数据库性能优化',
      query: '优化PostgreSQL数据库查询性能，针对有1000万条记录的用户表，如何设计索引和优化复杂查询',
      type: 'database-design'
    },
    {
      name: '微服务架构设计',
      query: '设计一个电商系统的微服务架构，包含商品服务、订单服务、支付服务和用户服务，考虑服务发现、负载均衡和容错',
      type: 'architecture-design'
    },
    {
      name: '测试策略设计',
      query: '为React前端和Node.js后端应用设计完整的测试策略，包括单元测试、集成测试、端到端测试和性能测试',
      type: 'testing-strategy'
    }
  ];
  
  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    await testKnowledgeEnhancement(scenario.query, scenario.name);
    
    // 场景间延迟
    if (i < testScenarios.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('\n✅ 知识增强开发系统测试完成！');
  console.log('\n📋 系统状态:');
  console.log('  1. API端点: http://localhost:3001/api/v4/knowledge-dev');
  console.log('  2. 管理界面: http://localhost:3001/knowledge-dev');
  console.log('  3. 增强级别: basic/enhanced/expert/contextual');
  console.log('  4. 支持任务: 代码生成、API设计、数据库设计、架构设计、测试策略等');
  console.log('  5. 集成系统: 知识库(OKMS)、上下文缓存、智能分发、统一网关');
  
  console.log('\n🚀 立即开始使用:');
  console.log('  curl -X POST "http://localhost:3001/api/v4/knowledge-dev" \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"action":"enhance","query":"你的开发任务","enhancementLevel":"enhanced"}\'');
  
  console.log('\n🎯 核心价值:');
  console.log('  • 基于知识库的智能开发支持');
  console.log('  • 任务分析和复杂度评估');
  console.log('  • 最佳实践和设计模式推荐');
  console.log('  • 质量指标和改进建议');
  console.log('  • 多系统深度集成');
}

// 运行测试
runTest().catch(console.error);