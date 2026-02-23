#!/usr/bin/env node

/**
 * 工作流协调器集成测试
 */

const http = require('http');

console.log('🚀 工作流协调器集成测试\n');
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

async function runTests() {
  console.log('🔍 测试1: 检查工作流API健康状态\n');
  
  // 测试1: 获取工作流列表
  console.log('测试: 获取工作流列表');
  const listResult = await testEndpoint('GET', '/api/workflows?action=list');
  
  if (listResult.success) {
    console.log(`   ✅ 成功 - 找到 ${listResult.data?.total || 0} 个工作流`);
    console.log(`       预定义: ${listResult.data?.predefined || 0} 个`);
  } else {
    console.log(`   ❌ 失败: ${listResult.error}`);
    return false;
  }
  
  // 测试2: 获取工作流指标
  console.log('\n测试: 获取工作流指标');
  const metricsResult = await testEndpoint('GET', '/api/workflows?action=metrics');
  
  if (metricsResult.success) {
    console.log(`   ✅ 成功 - 指标数据获取成功`);
    console.log(`       总工作流: ${metricsResult.data?.totalWorkflows || 0}`);
    console.log(`       成功率: ${metricsResult.data?.successRate?.toFixed(1) || 0}%`);
  } else {
    console.log(`   ⚠️  指标获取失败: ${metricsResult.error}`);
  }
  
  // 测试3: 获取工作流实例
  console.log('\n测试: 获取工作流实例');
  const instancesResult = await testEndpoint('GET', '/api/workflows?action=instances');
  
  if (instancesResult.success) {
    console.log(`   ✅ 成功 - 找到 ${instancesResult.data?.total || 0} 个实例`);
    console.log(`       运行中: ${instancesResult.data?.running || 0} 个`);
  } else {
    console.log(`   ⚠️  实例获取失败: ${instancesResult.error}`);
  }
  
  // 测试4: 检查健康状态
  console.log('\n测试: 检查工作流健康状态');
  const healthResult = await testEndpoint('GET', '/api/workflows?action=health');
  
  if (healthResult.success) {
    console.log(`   ✅ 成功 - 健康状态: ${healthResult.data?.status || 'unknown'}`);
    if (healthResult.data?.issues?.length > 0) {
      console.log(`       问题: ${healthResult.data.issues.join(', ')}`);
    }
  } else {
    console.log(`   ⚠️  健康检查失败: ${healthResult.error}`);
  }
  
  // 测试5: 执行预定义工作流
  console.log('\n🔍 测试2: 执行预定义工作流\n');
  
  if (listResult.data?.workflows?.length > 0) {
    const firstWorkflow = listResult.data.workflows[0];
    console.log(`测试: 执行工作流 "${firstWorkflow.name}"`);
    
    const executeResult = await testEndpoint('POST', '/api/workflows', {
      action: 'execute',
      workflowId: firstWorkflow.id,
      input: { test: true },
      priority: 'medium',
    });
    
    if (executeResult.success) {
      console.log(`   ✅ 成功 - 工作流开始执行`);
      console.log(`       实例ID: ${executeResult.data?.instanceId}`);
      console.log(`       状态: ${executeResult.data?.status}`);
      
      // 等待2秒后检查实例状态
      console.log('\n   等待2秒检查执行状态...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const checkResult = await testEndpoint('GET', '/api/workflows?action=instances&status=running');
      if (checkResult.success && checkResult.data?.instances?.length > 0) {
        const runningInstance = checkResult.data.instances.find(
          inst => inst.id === executeResult.data?.instanceId
        );
        if (runningInstance) {
          console.log(`   📊 实例状态: ${runningInstance.status}`);
          console.log(`       当前步骤: ${runningInstance.currentStep || 'N/A'}`);
        }
      }
    } else {
      console.log(`   ❌ 执行失败: ${executeResult.error}`);
    }
  } else {
    console.log('   ⚠️  没有可执行的工作流');
  }
  
  // 测试6: 测试控制操作
  console.log('\n🔍 测试3: 测试工作流控制操作\n');
  
  // 先获取一个运行中的实例
  const runningInstances = await testEndpoint('GET', '/api/workflows?action=instances&status=running');
  if (runningInstances.success && runningInstances.data?.instances?.length > 0) {
    const runningInstance = runningInstances.data.instances[0];
    console.log(`测试: 暂停工作流实例 "${runningInstance.id}"`);
    
    const pauseResult = await testEndpoint('POST', '/api/workflows', {
      action: 'pause',
      instanceId: runningInstance.id,
    });
    
    if (pauseResult.success) {
      console.log(`   ✅ 成功 - 工作流已暂停`);
      
      // 测试恢复
      console.log('\n测试: 恢复工作流实例');
      const resumeResult = await testEndpoint('POST', '/api/workflows', {
        action: 'resume',
        instanceId: runningInstance.id,
      });
      
      if (resumeResult.success) {
        console.log(`   ✅ 成功 - 工作流已恢复`);
      } else {
        console.log(`   ⚠️  恢复失败: ${resumeResult.error}`);
      }
    } else {
      console.log(`   ⚠️  暂停失败: ${pauseResult.error}`);
    }
  } else {
    console.log('   ⚠️  没有运行中的实例可用于控制测试');
  }
  
  // 测试7: 清理旧实例
  console.log('\n🔍 测试4: 测试清理操作\n');
  
  console.log('测试: 清理旧实例');
  const cleanupResult = await testEndpoint('POST', '/api/workflows', {
    action: 'cleanup',
    maxAgeHours: 1, // 清理1小时前的实例
  });
  
  if (cleanupResult.success) {
    console.log(`   ✅ 成功 - 清理了 ${cleanupResult.data?.cleanedCount || 0} 个旧实例`);
  } else {
    console.log(`   ⚠️  清理失败: ${cleanupResult.error}`);
  }
  
  // 总结
  console.log('\n📊 集成测试总结\n');
  
  const tests = [
    { name: '获取工作流列表', result: listResult.success },
    { name: '获取工作流指标', result: metricsResult.success },
    { name: '获取工作流实例', result: instancesResult.success },
    { name: '检查健康状态', result: healthResult.success },
    { name: '执行工作流', result: executeResult?.success || false },
    { name: '控制操作', result: pauseResult?.success || false },
    { name: '清理操作', result: cleanupResult.success },
  ];
  
  const passed = tests.filter(t => t.result).length;
  const total = tests.length;
  const successRate = (passed / total) * 100;
  
  tests.forEach(test => {
    console.log(`   ${test.result ? '✅' : '❌'} ${test.name}`);
  });
  
  console.log(`\n🎯 测试结果: ${passed}/${total} 通过 (${successRate.toFixed(1)}%)`);
  
  if (successRate >= 80) {
    console.log('\n🎉 工作流协调器集成测试成功！');
    console.log('🚀 系统已准备好支持自动化工作流。');
  } else if (successRate >= 50) {
    console.log('\n⚠️  工作流协调器基本正常，部分功能需要检查。');
    console.log('🔧 建议修复失败的功能。');
  } else {
    console.log('\n❌ 工作流协调器需要更多调试。');
    console.log('🔧 建议检查API连接和工作流定义。');
  }
  
  console.log('\n💡 下一步建议:');
  console.log('   1. 访问 http://localhost:3001/workflows 查看监控面板');
  console.log('   2. 测试预定义工作流的完整执行流程');
  console.log('   3. 集成其他模块到工作流中');
  console.log('   4. 配置定时触发器');
  
  return successRate >= 50;
}

runTests().then(success => {
  console.log('\n=== 集成测试完成 ===');
  console.log(`时间: ${new Date().toISOString()}`);
  
  // 创建测试报告
  const report = {
    timestamp: new Date().toISOString(),
    test: '工作流协调器集成测试',
    result: success ? 'passed' : 'failed',
    recommendations: [
      '访问 /workflows 页面查看监控',
      '测试晚间主动性工作流',
      '配置系统健康检查工作流',
      '集成财务和外包模块',
    ],
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    'workflow-integration-test-report.json',
    JSON.stringify(report, null, 2),
    'utf8'
  );
  
  console.log('📄 测试报告已保存: workflow-integration-test-report.json');
  
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('测试执行错误:', error);
  process.exit(1);
});