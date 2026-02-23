#!/usr/bin/env node

/**
 * API格式测试脚本
 * 验证所有API使用标准化格式
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const API_ENDPOINTS = [
  '/api/health',
  '/api/finance?action=summary',
  '/api/ecosystem/monitoring',
  '/api/workflows',
  '/api/testing',
  '/api/deployments',
  '/api/automation',
  '/api/tasks',
  '/api/freelance'
];

// 验证函数
function validateApiResponse(response, endpoint) {
  const issues = [];
  
  // 检查基本结构
  if (!response.success && response.success !== false) {
    issues.push('缺少success字段');
  }
  
  if (!response.timestamp) {
    issues.push('缺少timestamp字段');
  }
  
  if (!response.version) {
    issues.push('缺少version字段');
  }
  
  // 检查成功响应的结构
  if (response.success === true) {
    if (response.data === undefined) {
      issues.push('成功响应缺少data字段');
    }
    
    if (response.error !== undefined) {
      issues.push('成功响应不应包含error字段');
    }
  }
  
  // 检查错误响应的结构
  if (response.success === false) {
    if (!response.error) {
      issues.push('错误响应缺少error字段');
    } else {
      if (!response.error.code) {
        issues.push('错误响应缺少error.code字段');
      }
      if (!response.error.message) {
        issues.push('错误响应缺少error.message字段');
      }
    }
    
    if (response.data !== undefined) {
      issues.push('错误响应不应包含data字段');
    }
  }
  
  // 检查请求ID
  if (!response.requestId) {
    issues.push('缺少requestId字段');
  }
  
  return issues;
}

// 测试函数
async function testEndpoint(endpoint) {
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
        try {
          const json = JSON.parse(data);
          const issues = validateApiResponse(json, endpoint);
          
          resolve({
            endpoint,
            status: res.statusCode,
            success: issues.length === 0,
            issues,
            hasRequestId: !!json.requestId,
            hasTimestamp: !!json.timestamp,
            hasVersion: !!json.version,
            responseTime: res.headers['x-processing-time'] || 'N/A',
            cacheStatus: res.headers['x-cache'] || 'N/A'
          });
        } catch (error) {
          resolve({
            endpoint,
            status: res.statusCode,
            success: false,
            issues: ['响应不是有效的JSON: ' + error.message],
            hasRequestId: false,
            hasTimestamp: false,
            hasVersion: false,
            responseTime: 'N/A',
            cacheStatus: 'N/A'
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        endpoint,
        status: 0,
        success: false,
        issues: ['连接失败: ' + error.message],
        hasRequestId: false,
        hasTimestamp: false,
        hasVersion: false,
        responseTime: 'N/A',
        cacheStatus: 'N/A'
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        endpoint,
        status: 0,
        success: false,
        issues: ['请求超时'],
        hasRequestId: false,
        hasTimestamp: false,
        hasVersion: false,
        responseTime: 'N/A',
        cacheStatus: 'N/A'
      });
    });
    
    req.end();
  });
}

// 主函数
async function runTests() {
  console.log('🚀 开始API格式验证测试\n');
  console.log('服务器地址:', BASE_URL);
  console.log('测试端点:', API_ENDPOINTS.length, '个\n');
  
  const results = [];
  
  for (const endpoint of API_ENDPOINTS) {
    console.log(`🔍 测试: ${endpoint}`);
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      console.log(`   ✅ 格式正确 (${result.status})`);
      console.log(`     请求ID: ${result.hasRequestId ? '✅' : '❌'}`);
      console.log(`     时间戳: ${result.hasTimestamp ? '✅' : '❌'}`);
      console.log(`     版本号: ${result.hasVersion ? '✅' : '❌'}`);
      console.log(`     响应时间: ${result.responseTime}ms`);
      console.log(`     缓存状态: ${result.cacheStatus}`);
    } else {
      console.log(`   ❌ 格式问题 (${result.status})`);
      result.issues.forEach(issue => {
        console.log(`     问题: ${issue}`);
      });
    }
    console.log('');
  }
  
  // 统计结果
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  const successRate = (passed / total) * 100;
  
  console.log('📊 测试结果统计\n');
  console.log(`总计测试: ${total}`);
  console.log(`通过测试: ${passed}`);
  console.log(`失败测试: ${failed}`);
  console.log(`成功率: ${successRate.toFixed(1)}%\n`);
  
  // 详细统计
  const stats = {
    requestId: results.filter(r => r.hasRequestId).length,
    timestamp: results.filter(r => r.hasTimestamp).length,
    version: results.filter(r => r.hasVersion).length,
    responseTime: results.filter(r => r.responseTime !== 'N/A').length,
    cacheStatus: results.filter(r => r.cacheStatus !== 'N/A').length
  };
  
  console.log('📈 标准化字段统计');
  console.log(`   请求ID: ${stats.requestId}/${total} (${(stats.requestId/total*100).toFixed(1)}%)`);
  console.log(`   时间戳: ${stats.timestamp}/${total} (${(stats.timestamp/total*100).toFixed(1)}%)`);
  console.log(`   版本号: ${stats.version}/${total} (${(stats.version/total*100).toFixed(1)}%)`);
  console.log(`   响应时间: ${stats.responseTime}/${total} (${(stats.responseTime/total*100).toFixed(1)}%)`);
  console.log(`   缓存头: ${stats.cacheStatus}/${total} (${(stats.cacheStatus/total*100).toFixed(1)}%)\n`);
  
  // 失败详情
  if (failed > 0) {
    console.log('❌ 失败端点详情:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`   ${result.endpoint}:`);
      result.issues.forEach(issue => {
        console.log(`     - ${issue}`);
      });
    });
    console.log('');
  }
  
  // 建议
  console.log('💡 建议:');
  if (successRate === 100) {
    console.log('   ✅ 所有API格式标准化完成！');
    console.log('   🚀 可以继续下一步优化工作');
  } else if (successRate >= 80) {
    console.log('   ⚠️ 大部分API已标准化，需要修复少数问题');
    console.log('   🔧 检查失败端点的具体问题');
  } else {
    console.log('   ❌ API标准化需要更多工作');
    console.log('   🔧 需要手动检查和修复API格式');
  }
  
  console.log('\n🎯 下一步行动:');
  console.log('   1. 修复失败的API端点');
  console.log('   2. 运行完整的功能测试');
  console.log('   3. 更新客户端代码适配新格式');
  console.log('   4. 部署到生产环境');
  
  return { passed, failed, total, successRate, results };
}

// 运行测试
runTests().then(result => {
  console.log('\n=== 测试完成 ===');
  process.exit(result.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('测试执行错误:', error);
  process.exit(1);
});