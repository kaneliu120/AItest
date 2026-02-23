#!/usr/bin/env node

/**
 * 简单工作流测试 - 验证核心功能
 */

const http = require('http');

console.log('🎯 简单工作流测试 - 验证核心功能\n');
console.log('服务器: http://localhost:3001\n');

async function testEndpoint(method, path, body = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            success: json.success === true,
            status: res.statusCode,
            data: json.data,
            message: json.message,
            requestId: json.requestId,
          });
        } catch (error) {
          resolve({
            success: false,
            status: res.statusCode,
            error: 'JSON解析失败',
            rawData: data.substring(0, 200),
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        status: 0,
        error: `连接失败: ${error.message}`,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        status: 0,
        error: '请求超时',
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runSimpleTest() {
  console.log('1. 测试服务器连接...');
  const healthResult = await testEndpoint('GET', '/api/health');
  
  if (healthResult.success) {
    console.log(`   ✅ 服务器正常: ${healthResult.data?.status || 'unknown'}`);
  } else {
    console.log(`   ❌ 服务器连接失败: ${healthResult.error}`);
    return false;
  }
  
  console.log('\n2. 测试工作流API...');
  const workflowsResult = await testEndpoint('GET', '/api/workflows?action=list');
  
  if (workflowsResult.success) {
    console.log(`   ✅ 工作流API正常`);
    console.log(`       工作流数量: ${workflowsResult.data?.total || 0}`);
    
    if (workflowsResult.data?.workflows?.length > 0) {
      console.log('       可用工作流:');
      workflowsResult.data.workflows.slice(0, 3).forEach(wf => {
        console.log(`         - ${wf.name} (${wf.id})`);
      });
    }
  } else {
    console.log(`   ❌ 工作流API失败: ${workflowsResult.error}`);
  }
  
  console.log('\n3. 测试简单API...');
  const simpleResult = await testEndpoint('GET', '/api/simple');
  
  if (simpleResult.success) {
    console.log(`   ✅ 简单API正常`);
    console.log(`       响应: ${simpleResult.message}`);
    console.log(`       请求ID: ${simpleResult.requestId}`);
  } else {
    console.log(`   ⚠️  简单API失败: ${simpleResult.error}`);
  }
  
  console.log('\n4. 测试生态系统监控...');
  const ecosystemResult = await testEndpoint('GET', '/api/ecosystem/monitoring');
  
  if (ecosystemResult.success) {
    console.log(`   ✅ 生态系统监控正常`);
    console.log(`       工具数量: ${ecosystemResult.data?.monitoring?.totalTools || 0}`);
    console.log(`       健康工具: ${ecosystemResult.data?.monitoring?.healthyTools || 0}`);
  } else {
    console.log(`   ⚠️  生态系统监控失败: ${ecosystemResult.error}`);
  }
  
  console.log('\n5. 测试工作流执行（简单版）...');
  
  // 先检查是否有预定义工作流
  if (workflowsResult.success && workflowsResult.data?.workflows?.length > 0) {
    const firstWorkflow = workflowsResult.data.workflows[0];
    
    console.log(`   尝试执行: ${firstWorkflow.name}`);
    const executeResult = await testEndpoint('POST', '/api/workflows', {
      action: 'execute',
      workflowId: firstWorkflow.id,
      input: { test: true, simple: true },
      priority: 'low',
    });
    
    if (executeResult.success) {
      console.log(`   ✅ 工作流执行请求成功`);
      console.log(`       实例ID: ${executeResult.data?.instanceId}`);
      console.log(`       状态: ${executeResult.data?.status}`);
      
      // 等待并检查状态
      console.log('   等待3秒...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const checkResult = await testEndpoint('GET', '/api/workflows?action=instances');
      if (checkResult.success) {
        const instances = checkResult.data?.instances || [];
        console.log(`       总实例数: ${instances.length}`);
        
        if (instances.length > 0) {
          const latest = instances[0];
          console.log(`       最新实例状态: ${latest.status}`);
          console.log(`       开始时间: ${new Date(latest.startedAt).toLocaleTimeString()}`);
        }
      }
    } else {
      console.log(`   ⚠️  工作流执行失败: ${executeResult.error}`);
    }
  } else {
    console.log('   ⚠️  无可执行的工作流');
  }
  
  // 总结
  console.log('\n🎯 简单测试总结\n');
  
  const tests = [
    { name: '服务器连接', result: healthResult.success },
    { name: '工作流API', result: workflowsResult.success },
    { name: '简单API', result: simpleResult.success },
    { name: '生态系统监控', result: ecosystemResult.success },
    { name: '工作流执行', result: executeResult?.success || false },
  ];
  
  const passed = tests.filter(t => t.result).length;
  const total = tests.length;
  const successRate = (passed / total) * 100;
  
  tests.forEach(test => {
    console.log(`   ${test.result ? '✅' : '❌'} ${test.name}`);
  });
  
  console.log(`\n📊 测试结果: ${passed}/${total} 通过 (${successRate.toFixed(1)}%)`);
  
  if (successRate >= 80) {
    console.log('\n🎉 核心功能测试成功！');
    console.log('🚀 系统基本功能正常，可以开始自动化。');
  } else if (successRate >= 60) {
    console.log('\n⚠️  系统基本正常，部分功能需要检查。');
    console.log('🔧 建议修复失败的功能。');
  } else {
    console.log('\n❌ 系统需要更多调试。');
    console.log('🔧 建议检查服务器状态和API连接。');
  }
  
  console.log('\n💡 立即行动建议:');
  console.log('   1. 访问 http://localhost:3001 查看系统状态');
  console.log('   2. 访问 http://localhost:3001/workflows 查看工作流');
  console.log('   3. 测试晚间主动性工作流');
  console.log('   4. 配置定时触发器');
  
  return successRate >= 60;
}

runSimpleTest().then(success => {
  console.log('\n=== 简单工作流测试完成 ===');
  console.log(`时间: ${new Date().toISOString()}`);
  
  // 创建测试报告
  const report = {
    timestamp: new Date().toISOString(),
    test: '简单工作流功能测试',
    result: success ? 'passed' : 'failed',
    recommendations: [
      '检查工作流协调器语法错误',
      '验证模块集成服务',
      '测试完整的业务工作流',
      '配置生产环境',
    ],
    immediateActions: [
      '修复工作流协调器编译错误',
      '测试生存阶段每日工作流',
      '连接真实数据源',
      '设置自动化执行',
    ],
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    'simple-workflow-test-report.json',
    JSON.stringify(report, null, 2),
    'utf8'
  );
  
  console.log('📄 测试报告已保存: simple-workflow-test-report.json');
  
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('测试执行错误:', error);
  process.exit(1);
});