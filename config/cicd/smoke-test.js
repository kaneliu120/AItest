#!/usr/bin/env node

/**
 * 冒烟测试脚本
 * 用于部署后验证服务基本功能
 */

const axios = require('axios');

const SERVICES = [
  { name: 'Mission Control', url: 'http://localhost:3001/health' },
  { name: '知识管理系统前端', url: 'http://localhost:3000' },
  { name: '知识管理系统后端', url: 'http://localhost:8000/health' },
  { name: '统一API网关', url: 'http://localhost:3001/api/v1/unified?action=status' },
  { name: '业务集成中心', url: 'http://localhost:3001/business-integration' },
  { name: '监控系统', url: 'http://localhost:3001/api/v6/monitoring?action=status' }
];

async function smokeTest() {
  console.log('🚬 开始冒烟测试');
  console.log('='.repeat(60));
  
  const results = [];
  
  for (const service of SERVICES) {
    try {
      const startTime = Date.now();
      const response = await axios.get(service.url, { timeout: 10000 });
      const responseTime = Date.now() - startTime;
      
      results.push({
        service: service.name,
        status: '✅ 通过',
        responseTime: `${responseTime}ms`,
        statusCode: response.status
      });
      
      console.log(`✅ ${service.name}: ${responseTime}ms (状态码: ${response.status})`);
    } catch (error) {
      results.push({
        service: service.name,
        status: '❌ 失败',
        error: error.message,
        statusCode: error.response?.status || 'N/A'
      });
      
      console.log(`❌ ${service.name}: ${error.message}`);
    }
  }
  
  console.log('');
  console.log('📋 冒烟测试结果');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.status === '✅ 通过').length;
  const failed = results.filter(r => r.status === '❌ 失败').length;
  
  console.log(`通过: ${passed}, 失败: ${failed}, 总计: ${results.length}`);
  
  if (failed > 0) {
    console.log('');
    console.log('⚠️  失败的测试:');
    results.filter(r => r.status === '❌ 失败').forEach(r => {
      console.log(`   - ${r.service}: ${r.error}`);
    });
    
    process.exit(1);
  }
  
  console.log('');
  console.log('🎉 所有冒烟测试通过！');
  console.log('='.repeat(60));
}

// 执行冒烟测试
smokeTest().catch(error => {
  console.error('❌ 冒烟测试执行失败:', error.message);
  process.exit(1);
});