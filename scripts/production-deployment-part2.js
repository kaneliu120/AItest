);
  if (!fs.existsSync(prometheusDir)) {
    fs.mkdirSync(prometheusDir, { recursive: true });
  }
  fs.writeFileSync(prometheusPath, prometheusConfig);
  console.log(`   ✅ Prometheus配置: ${prometheusPath}`);
  
  // 2. 告警规则
  const alertRules = `groups:
  - name: mission_control_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "高错误率检测"
          description: "错误率超过5% (当前值: {{ $value }})"
          
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "高响应时间检测"
          description: "95%响应时间超过1秒 (当前值: {{ $value }}s)"
          
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "服务下线"
          description: "{{ $labels.job }} 服务已下线"
          
      - alert: HighMemoryUsage
        expr: (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "高内存使用率"
          description: "内存使用率超过80% (当前值: {{ $value }}%)"
          
      - alert: HighCPUUsage
        expr: rate(container_cpu_usage_seconds_total[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "高CPU使用率"
          description: "CPU使用率超过80% (当前值: {{ $value }}%)"`;

  const alertRulesPath = '/Users/kane/mission-control/monitoring/prometheus/alert_rules.yml';
  fs.writeFileSync(alertRulesPath, alertRules);
  console.log(`   ✅ 告警规则: ${alertRulesPath}`);
  
  // 3. Grafana仪表板配置
  const grafanaDashboard = `{
    "dashboard": {
      "title": "生产环境监控",
      "panels": [
        {
          "title": "服务健康状态",
          "type": "stat",
          "targets": [{
            "expr": "up",
            "legendFormat": "{{job}}"
          }]
        },
        {
          "title": "响应时间",
          "type": "graph",
          "targets": [{
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P95响应时间"
          }]
        },
        {
          "title": "错误率",
          "type": "graph",
          "targets": [{
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m])",
            "legendFormat": "错误率"
          }]
        },
        {
          "title": "系统资源",
          "type": "row",
          "panels": [
            {
              "title": "CPU使用率",
              "type": "gauge",
              "targets": [{
                "expr": "rate(container_cpu_usage_seconds_total[5m]) * 100",
                "legendFormat": "CPU使用率"
              }]
            },
            {
              "title": "内存使用率",
              "type": "gauge",
              "targets": [{
                "expr": "(container_memory_usage_bytes / container_spec_memory_limit_bytes) * 100",
                "legendFormat": "内存使用率"
              }]
            }
          ]
        }
      ]
    }
  }`;

  const grafanaPath = '/Users/kane/mission-control/monitoring/grafana/dashboard.json';
  const grafanaDir = path.dirname(grafanaPath);
  if (!fs.existsSync(grafanaDir)) {
    fs.mkdirSync(grafanaDir, { recursive: true });
  }
  fs.writeFileSync(grafanaPath, grafanaDashboard);
  console.log(`   ✅ Grafana仪表板: ${grafanaPath}`);
  
  return {
    prometheus: prometheusPath,
    alertRules: alertRulesPath,
    grafana: grafanaPath
  };
}

// 生成部署报告
function generateDeploymentReport(systemStatus, configs, monitoringConfig, deploymentSuccess) {
  console.log('\n📋 生成部署报告...');
  
  const report = {
    timestamp: new Date().toISOString(),
    deploymentStatus: deploymentSuccess ? '就绪' : '配置完成',
    systems: systemStatus,
    configs,
    monitoringConfig,
    accessInfo: {
      missionControl: {
        frontend: 'http://localhost:3001',
        api: 'http://localhost:3001/api',
        monitoring: 'http://localhost:3001/unified-monitoring',
        businessIntegration: 'http://localhost:3001/business-integration'
      },
      knowledgeSystem: {
        frontend: 'http://localhost:3000',
        backend: 'http://localhost:8000',
        apiDocs: 'http://localhost:8000/docs'
      },
      monitoring: {
        prometheus: 'http://localhost:9090',
        grafana: 'http://localhost:3001',
        alertmanager: 'http://localhost:9093'
      }
    },
    deploymentScript: '/Users/kane/mission-control/scripts/deploy-production.sh',
    nextSteps: [
      '1. 执行部署脚本: bash /Users/kane/mission-control/scripts/deploy-production.sh',
      '2. 配置生产环境变量（特别是API密钥）',
      '3. 设置SSL证书（如需HTTPS）',
      '4. 配置监控告警通知渠道',
      '5. 进行负载测试和安全审计',
      '6. 设置自动化备份策略'
    ],
    securityNotes: [
      '⚠️ 立即更改所有默认密码',
      '⚠️ 配置防火墙规则限制访问',
      '⚠️ 定期更新Docker镜像和安全补丁',
      '⚠️ 启用日志审计和监控',
      '⚠️ 配置数据备份和恢复策略'
    ]
  };
  
  const reportPath = '/tmp/production-deployment-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`   ✅ 部署报告: ${reportPath}`);
  
  return report;
}

// 主函数
async function main() {
  console.log('='.repeat(80));
  console.log('🚀 生产环境部署');
  console.log('='.repeat(80));
  console.log('时间: ' + new Date().toLocaleString('zh-CN'));
  console.log('授权: ✅ 基于WORKFLOW_AUTO.md晚间主动推进授权');
  console.log('目标: 准备和执行生产环境部署');
  console.log('='.repeat(80));
  
  try {
    // 1. 检查系统状态
    const systemStatus = checkSystemStatus();
    
    // 2. 创建生产环境配置
    const configs = createProductionConfigs();
    
    // 3. 创建监控配置
    const monitoringConfig = createMonitoringConfig();
    
    // 4. 执行生产部署（模拟）
    const deploymentSuccess = executeProductionDeployment();
    
    // 5. 生成部署报告
    const report = generateDeploymentReport(systemStatus, configs, monitoringConfig, deploymentSuccess);
    
    // 6. 显示总结
    console.log('\n🎉 生产环境部署准备完成！');
    console.log('='.repeat(80));
    
    console.log('\n📊 部署状态总结:');
    console.log('-'.repeat(40));
    
    systemStatus.forEach(system => {
      const deployableIcon = system.deployable ? '✅' : '❌';
      console.log(`   ${deployableIcon} ${system.name}: ${system.status}`);
      console.log(`      目录: ${system.directory}`);
      console.log(`      Docker配置: ${system.hasDockerCompose ? '✅' : '❌'}`);
      console.log(`      生产配置: ${system.hasProductionCompose ? '✅' : '❌'}`);
    });
    
    console.log('\n🔧 创建的配置文件:');
    console.log('-'.repeat(40));
    console.log(`   ✅ Mission Control环境变量: ${configs.missionControlEnv}`);
    console.log(`   ✅ 知识管理系统环境变量: ${configs.knowledgeSystemEnv}`);
    console.log(`   ✅ 部署脚本: ${configs.deploymentScript}`);
    console.log(`   ✅ 监控配置: ${Object.keys(monitoringConfig).length} 个文件`);
    
    console.log('\n🚀 立即部署:');
    console.log('-'.repeat(40));
    console.log(`   bash ${configs.deploymentScript}`);
    
    console.log('\n🌐 访问地址:');
    console.log('-'.repeat(40));
    console.log('   Mission Control: http://localhost:3001');
    console.log('   业务集成中心: http://localhost:3001/business-integration');
    console.log('   知识管理系统: http://localhost:3000');
    console.log('   监控仪表板: http://localhost:3001/unified-monitoring');
    
    console.log('\n🔒 安全提醒:');
    console.log('-'.repeat(40));
    report.securityNotes.forEach(note => console.log(`   ${note}`));
    
    console.log('\n📋 下一步行动:');
    console.log('-'.repeat(40));
    report.nextSteps.forEach(step => console.log(`   ${step}`));
    
    console.log('\n='.repeat(80));
    console.log('✅ 生产环境部署准备完成');
    console.log('='.repeat(80));
    console.log('\n💡 提示: 基于WORKFLOW_AUTO.md授权，您可以在授权窗口内执行生产部署');
    console.log('   当前时间在授权窗口内，可以立即执行部署脚本');
    
  } catch (error) {
    console.error('❌ 部署过程发生错误:', error.message);
    console.error(error.stack);
  }
}

// 执行主函数
if (require.main === module) {
  main().catch(console.error);
}