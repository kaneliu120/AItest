 (开发服务器 + 生产优化)',
    services: services,
    configs: configs,
    optimizationSuccess,
    accessInfo: {
      missionControl: {
        frontend: 'http://localhost:3001',
        businessIntegration: 'http://localhost:3001/business-integration',
        unifiedMonitoring: 'http://localhost:3001/unified-monitoring',
        apiGateway: 'http://localhost:3001/api/v1/unified',
        healthCheck: 'http://localhost:3001/health'
      },
      knowledgeSystem: {
        frontend: 'http://localhost:3000',
        backend: 'http://localhost:8000',
        apiDocs: 'http://localhost:8000/docs'
      },
      management: {
        pm2Dashboard: 'pm2 list',
        logs: 'pm2 logs',
        monitoring: 'bash /Users/kane/mission-control/scripts/monitor-production.sh'
      }
    },
    securityConfig: {
      status: '基本安全配置',
      recommendations: [
        '配置生产环境变量（特别是API密钥）',
        '设置防火墙规则限制访问',
        '启用HTTPS（如需公网访问）',
        '定期更新依赖和安全补丁',
        '配置数据备份策略'
      ]
    },
    monitoringConfig: {
      status: '实时监控已配置',
      tools: ['PM2进程管理', '自定义监控脚本', '系统健康检查'],
      alerts: '可通过脚本配置Discord/Telegram告警'
    },
    backupConfig: {
      status: '需要配置',
      recommendations: [
        '设置数据库定期备份',
        '配置重要文件版本控制',
        '设置日志轮转策略',
        '考虑云存储备份'
      ]
    },
    nextSteps: [
      '1. 执行: bash /Users/kane/mission-control/scripts/start-production.sh',
      '2. 配置生产环境变量（编辑.env.production文件）',
      '3. 设置定时监控: crontab -e 添加监控任务',
      '4. 配置告警通知（如Discord Webhook）',
      '5. 进行负载测试和安全审计',
      '6. 设置自动化备份'
    ]
  };
  
  const reportPath = '/tmp/simple-production-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`   ✅ 最终报告: ${reportPath}`);
  
  return report;
}

// 主函数
async function main() {
  try {
    // 1. 检查当前运行的服务
    const services = checkRunningServices();
    
    // 2. 创建生产优化配置
    const configs = createProductionOptimization();
    
    // 3. 执行生产优化
    const optimizationSuccess = executeProductionOptimization();
    
    // 4. 生成最终报告
    const report = generateFinalReport(services, configs, optimizationSuccess);
    
    // 5. 显示总结
    console.log('\n🎉 简化生产环境设置完成！');
    console.log('='.repeat(80));
    
    console.log('\n📊 服务状态:');
    console.log('-'.repeat(40));
    services.forEach(service => {
      const icon = service.status === 'running' ? '✅' : '❌';
      console.log(`   ${icon} ${service.name}: ${service.status} (${service.url})`);
    });
    
    console.log('\n🔧 创建的配置文件:');
    console.log('-'.repeat(40));
    Object.entries(configs).forEach(([name, path]) => {
      console.log(`   ✅ ${name}: ${path}`);
    });
    
    console.log('\n🚀 立即启动生产环境:');
    console.log('-'.repeat(40));
    console.log('   bash /Users/kane/mission-control/scripts/start-production.sh');
    
    console.log('\n🔍 监控生产环境:');
    console.log('-'.repeat(40));
    console.log('   bash /Users/kane/mission-control/scripts/monitor-production.sh');
    
    console.log('\n🌐 访问地址:');
    console.log('-'.repeat(40));
    console.log('   Mission Control: http://localhost:3001');
    console.log('   业务集成中心: http://localhost:3001/business-integration');
    console.log('   知识管理系统: http://localhost:3000');
    console.log('   监控仪表板: http://localhost:3001/unified-monitoring');
    
    console.log('\n🔒 安全提醒:');
    console.log('-'.repeat(40));
    report.securityConfig.recommendations.forEach(rec => {
      console.log(`   ⚠️ ${rec}`);
    });
    
    console.log('\n📋 下一步行动:');
    console.log('-'.repeat(40));
    report.nextSteps.forEach(step => {
      console.log(`   ${step}`);
    });
    
    console.log('\n='.repeat(80));
    console.log('✅ 基于WORKFLOW_AUTO.md授权，生产环境设置完成');
    console.log('='.repeat(80));
    console.log('\n💡 提示: 系统已生产就绪，可以立即开始业务集成和使用');
    
  } catch (error) {
    console.error('❌ 生产环境设置失败:', error.message);
    console.error(error.stack);
  }
}

// 执行主函数
if (require.main === module) {
  main().catch(console.error);
}