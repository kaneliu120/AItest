#!/usr/bin/env node

/**
 * 全面检查Mission Control所有API端点
 * 检查: 响应状态、JSON格式、错误处理、性能
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const TIMEOUT = 10000; // 10秒超时

// 需要检查的API端点
const API_ENDPOINTS = [
  // 核心系统API
  { path: '/api/health', method: 'GET', description: '旧健康监控API' },
  { path: '/api/system-monitoring', method: 'GET', description: '新系统监控API' },
  { path: '/api/dashboard', method: 'GET', description: '仪表板聚合API' },
  
  // 任务管理API
  { path: '/api/tasks', method: 'GET', params: '?action=stats', description: '任务统计API' },
  { path: '/api/tasks/calendar', method: 'GET', description: '日历同步API' },
  { path: '/api/tasks/batch', method: 'GET', description: '批量操作API' },
  
  // 财务API
  { path: '/api/finance', method: 'GET', params: '?action=summary', description: '财务摘要API' },
  { path: '/api/finance/integration/tasks', method: 'GET', description: '财务任务集成API' },
  
  // 工具管理API
  { path: '/api/tools', method: 'GET', description: '工具管理API' },
  { path: '/api/tools/marketplace', method: 'GET', description: '工具市场API' },
  { path: '/api/tools/installed', method: 'GET', description: '已安装工具API' },
  
  // 数据分析API
  { path: '/api/analytics', method: 'GET', description: '数据分析API' },
  { path: '/api/missions', method: 'GET', description: '使命中心API' },
  
  // 自动化API
  { path: '/api/automation', method: 'GET', params: '?action=status', description: '自动化状态API' },
  
  // 测试API
  { path: '/api/test', method: 'GET', params: '?action=summary', description: '测试中心API' },
  
  // 故障排除API
  { path: '/api/troubleshooting', method: 'GET', description: '故障排除API' },
  
  // 工作流API
  { path: '/api/workflows/bookings', method: 'GET', description: '工作流预约API' },
  
  // 外包API
  { path: '/api/freelance', method: 'GET', description: '外包平台API' },
  
  // 生态系统API
  { path: '/api/ecosystem/status', method: 'GET', description: '生态系统状态API' },
];

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

function colorize(text, color) {
  return colors[color] + text + colors.reset;
}

async function checkEndpoint(endpoint) {
  const url = BASE_URL + endpoint.path + (endpoint.params || '');
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const req = http.request(url, { method: endpoint.method, timeout: TIMEOUT }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        const status = res.statusCode;
        let result = {
          endpoint: endpoint.path,
          description: endpoint.description,
          status,
          responseTime,
          success: false,
          error: null,
          data: null,
        };
        
        try {
          if (data) {
            const jsonData = JSON.parse(data);
            result.data = jsonData;
            result.success = jsonData.success !== false && status >= 200 && status < 300;
          } else {
            result.success = status >= 200 && status < 300;
          }
        } catch (error) {
          result.success = false;
          result.error = `JSON解析错误: ${error.message}`;
          result.data = data.substring(0, 200); // 只取前200字符
        }
        
        resolve(result);
      });
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        endpoint: endpoint.path,
        description: endpoint.description,
        status: 0,
        responseTime,
        success: false,
        error: error.message,
        data: null,
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      resolve({
        endpoint: endpoint.path,
        description: endpoint.description,
        status: 0,
        responseTime,
        success: false,
        error: '请求超时',
        data: null,
      });
    });
    
    req.end();
  });
}

async function runAllChecks() {
  console.log(colorize('🚀 Mission Control API 全面检查', 'cyan'));
  console.log(colorize('='.repeat(60), 'gray'));
  console.log(`检查时间: ${new Date().toLocaleString()}`);
  console.log(`基础URL: ${BASE_URL}`);
  console.log(`检查端点: ${API_ENDPOINTS.length} 个`);
  console.log(colorize('='.repeat(60), 'gray'));
  
  const results = [];
  let passed = 0;
  let failed = 0;
  let totalResponseTime = 0;
  
  for (let i = 0; i < API_ENDPOINTS.length; i++) {
    const endpoint = API_ENDPOINTS[i];
    process.stdout.write(`[${i + 1}/${API_ENDPOINTS.length}] 检查 ${endpoint.path}... `);
    
    const result = await checkEndpoint(endpoint);
    results.push(result);
    totalResponseTime += result.responseTime;
    
    if (result.success) {
      passed++;
      console.log(colorize('✅ 通过', 'green'));
    } else {
      failed++;
      console.log(colorize('❌ 失败', 'red'));
    }
  }
  
  // 打印汇总报告
  console.log('\n' + colorize('📊 检查结果汇总', 'cyan'));
  console.log(colorize('='.repeat(60), 'gray'));
  console.log(`总计: ${API_ENDPOINTS.length} 个端点`);
  console.log(colorize(`通过: ${passed}`, 'green'));
  console.log(colorize(`失败: ${failed}`, failed > 0 ? 'red' : 'green'));
  console.log(`平均响应时间: ${Math.round(totalResponseTime / API_ENDPOINTS.length)}ms`);
  console.log(colorize('='.repeat(60), 'gray'));
  
  // 打印失败详情
  if (failed > 0) {
    console.log('\n' + colorize('🔍 失败端点详情', 'yellow'));
    results.filter(r => !r.success).forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.endpoint} (${result.description})`);
      console.log(`   状态: ${result.status === 0 ? '连接失败' : `HTTP ${result.status}`}`);
      console.log(`   响应时间: ${result.responseTime}ms`);
      console.log(`   错误: ${result.error || '未知错误'}`);
      if (result.data && typeof result.data === 'string') {
        console.log(`   响应数据: ${result.data.substring(0, 100)}...`);
      }
    });
  }
  
  // 打印性能分析
  console.log('\n' + colorize('⚡ 性能分析', 'cyan'));
  console.log(colorize('='.repeat(60), 'gray'));
  
  const sortedByTime = [...results].sort((a, b) => b.responseTime - a.responseTime);
  console.log('最慢的5个端点:');
  sortedByTime.slice(0, 5).forEach((result, index) => {
    const color = result.responseTime > 1000 ? 'red' : result.responseTime > 500 ? 'yellow' : 'green';
    console.log(`  ${index + 1}. ${result.endpoint}: ${colorize(result.responseTime + 'ms', color)}`);
  });
  
  // 按类别统计
  console.log('\n' + colorize('📈 按类别统计', 'cyan'));
  console.log(colorize('='.repeat(60), 'gray'));
  
  const categories = {};
  results.forEach(result => {
    const category = result.endpoint.split('/')[2] || '其他';
    if (!categories[category]) {
      categories[category] = { total: 0, passed: 0, failed: 0 };
    }
    categories[category].total++;
    if (result.success) {
      categories[category].passed++;
    } else {
      categories[category].failed++;
    }
  });
  
  Object.entries(categories).forEach(([category, stats]) => {
    const passRate = Math.round((stats.passed / stats.total) * 100);
    const color = passRate === 100 ? 'green' : passRate >= 80 ? 'yellow' : 'red';
    console.log(`${category.padEnd(15)}: ${stats.passed}/${stats.total} ${colorize(`(${passRate}%)`, color)}`);
  });
  
  // 生成修复建议
  console.log('\n' + colorize('🔧 修复建议', 'magenta'));
  console.log(colorize('='.repeat(60), 'gray'));
  
  const failedEndpoints = results.filter(r => !r.success);
  if (failedEndpoints.length === 0) {
    console.log('✅ 所有API端点运行正常，无需修复。');
  } else {
    console.log('需要修复的端点:');
    failedEndpoints.forEach((endpoint, index) => {
      console.log(`\n${index + 1}. ${colorize(endpoint.endpoint, 'red')}`);
      console.log(`   问题: ${endpoint.error}`);
      
      // 根据错误类型提供建议
      if (endpoint.status === 404) {
        console.log(`   建议: 检查路由文件是否存在: src/app${endpoint.path}/route.ts`);
      } else if (endpoint.status === 500) {
        console.log(`   建议: 检查服务器日志，查看具体错误信息`);
      } else if (endpoint.error?.includes('JSON解析错误')) {
        console.log(`   建议: API返回了非JSON格式数据，检查响应内容类型`);
      } else if (endpoint.error?.includes('请求超时')) {
        console.log(`   建议: API响应过慢，检查是否有阻塞操作或死循环`);
      } else if (endpoint.status === 0) {
        console.log(`   建议: 无法连接到服务器，检查服务器是否运行在端口3001`);
      }
    });
  }
  
  // 保存检查结果到文件
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalEndpoints: API_ENDPOINTS.length,
    passed,
    failed,
    averageResponseTime: Math.round(totalResponseTime / API_ENDPOINTS.length),
    results: results.map(r => ({
      endpoint: r.endpoint,
      description: r.description,
      status: r.status,
      responseTime: r.responseTime,
      success: r.success,
      error: r.error,
    })),
  };
  
  const fs = require('fs');
  const reportFile = '/tmp/api-check-report.json';
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`\n📄 详细报告已保存到: ${reportFile}`);
  
  return failed === 0 ? 0 : 1;
}

// 运行检查
runAllChecks().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  console.error(colorize('检查过程中发生错误:', 'red'), error);
  process.exit(1);
});