监控时间: \$(date)
监控周期: 24小时

## 服务健康状态
- Mission Control: \$(curl -s http://localhost:3001/health > /dev/null && echo "✅ 健康" || echo "❌ 异常")
- 知识管理前端: \$(curl -s http://localhost:3000 > /dev/null && echo "✅ 运行" || echo "❌ 异常")
- 知识管理后端: \$(curl -s http://localhost:8000/health > /dev/null && echo "✅ 健康" || echo "❌ 异常")

## 性能指标
- CPU使用率: \$(top -l 1 | grep "CPU usage" | awk '{print \$3}' | sed 's/%//')%
- 内存使用: \$(pm2 list | grep "mission-control" | awk '{print \$11, \$12, \$13}')
- 响应时间: \$(curl -s -o /dev/null -w "%{time_total}s" http://localhost:3001/health)秒
- 错误数: \$(pm2 logs mission-control --lines=100 | grep -c "error\|Error\|ERROR" || true)

## 日志分析
### 最近错误
\`\`\`
\$(pm2 logs mission-control --lines=20 --err 2>/dev/null | tail -20 || echo "无错误日志")
\`\`\`

### 最近警告
\`\`\`
\$(pm2 logs mission-control --lines=20 2>/dev/null | grep -i "warn\|warning" | tail -10 || echo "无警告日志")
\`\`\`

## 告警状态
- 服务健康: \$(monitor_services > /dev/null && echo "✅ 正常" || echo "⚠️ 异常")
- 性能阈值: \$(if [ \$(top -l 1 | grep "CPU usage" | awk '{print \$3}' | sed 's/%//') -gt 80 ]; then echo "⚠️ CPU过高"; else echo "✅ 正常"; fi)
- 错误率: \$(if [ \$(pm2 logs mission-control --lines=100 | grep -c "error\|Error\|ERROR" || true) -gt 5 ]; then echo "⚠️ 错误过多"; else echo "✅ 正常"; fi)

## 建议
1. \$(if ! monitor_services > /dev/null; then echo "立即检查异常服务"; else echo "服务运行正常"; fi)
2. \$(if [ \$(top -l 1 | grep "CPU usage" | awk '{print \$3}' | sed 's/%//') -gt 80 ]; then echo "优化CPU使用"; else echo "CPU使用正常"; fi)
3. \$(if [ \$(pm2 logs mission-control --lines=100 | grep -c "error\|Error\|ERROR" || true) -gt 5 ]; then echo "检查错误日志"; else echo "错误率正常"; fi)

## 下一步
1. 定期运行监控脚本
2. 设置自动告警
3. 配置性能优化
4. 更新监控规则

EOF
    
    log_info "监控报告已生成: \$report_file"
}

# 设置定时监控
setup_scheduled_monitoring() {
    log_info "设置定时监控..."
    
    # 检查cron任务
    local cron_job="*/30 * * * * /Users/kane/mission-control/scripts/cicd/monitor.sh monitor >> /Users/kane/mission-control/logs/monitor.log 2>&1"
    
    if crontab -l | grep -q "monitor.sh"; then
        log_info "定时监控任务已存在"
    else
        log_info "添加定时监控任务..."
        (crontab -l 2>/dev/null; echo "\$cron_job") | crontab -
        log_info "定时监控任务已添加: 每30分钟运行一次"
    fi
    
    # 检查日志轮转
    local logrotate_config="/etc/logrotate.d/mission-control"
    if [ ! -f "\$logrotate_config" ]; then
        log_info "创建日志轮转配置..."
        
        sudo tee "\$logrotate_config" > /dev/null << EOF
/Users/kane/mission-control/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 \$(whoami) \$(whoami)
}
EOF
        
        log_info "日志轮转配置已创建"
    else
        log_info "日志轮转配置已存在"
    fi
}

# 主菜单
main_menu() {
    echo ""
    echo "🔍 监控和回滚菜单"
    echo "=".repeat(60)
    echo "1. 监控服务健康"
    echo "2. 监控性能指标"
    echo "3. 监控日志"
    echo "4. 自动回滚检查"
    echo "5. 生成监控报告"
    echo "6. 设置定时监控"
    echo "7. 退出"
    echo "=".repeat(60)
    
    read -p "请选择操作 (1-7): " choice
    
    case \$choice in
        1)
            monitor_services
            ;;
        2)
            monitor_performance
            ;;
        3)
            monitor_logs
            ;;
        4)
            auto_rollback
            ;;
        5)
            generate_monitor_report
            ;;
        6)
            setup_scheduled_monitoring
            ;;
        7)
            echo "退出监控"
            exit 0
            ;;
        *)
            echo "无效选择"
            ;;
    esac
    
    # 返回菜单
    read -p "按回车键返回菜单..."
    main_menu
}

# 执行主菜单
if [ "\$1" = "monitor" ]; then
    monitor_services
    monitor_performance
    monitor_logs
    auto_rollback
    generate_monitor_report
elif [ "\$1" = "setup" ]; then
    setup_scheduled_monitoring
else
    main_menu
fi`;

  const monitorScriptPath = path.join(scriptsDir, 'monitor.sh');
  fs.writeFileSync(monitorScriptPath, monitorScript);
  fs.chmodSync(monitorScriptPath, '755');
  console.log(`   ✅ 监控脚本: ${monitorScriptPath}`);
  
  return {
    build: buildScriptPath,
    deploy: deployScriptPath,
    monitor: monitorScriptPath
  };
}

// 创建package.json脚本
function updatePackageJsonScripts() {
  console.log('\n📦 更新package.json脚本...');
  
  const packagePath = '/Users/kane/mission-control/package.json';
  
  if (!fs.existsSync(packagePath)) {
    console.log('   ❌ package.json不存在');
    return null;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // 添加CI/CD相关脚本
    packageJson.scripts = {
      ...packageJson.scripts,
      // 构建相关
      'build:ci': 'npm run lint && npm run type-check && npm test && npm run build',
      'build:production': 'NODE_ENV=production npm run build',
      'build:staging': 'NODE_ENV=staging npm run build',
      
      // 测试相关
      'test:ci': 'npm test -- --coverage --watchAll=false',
      'test:integration': 'jest --config jest.integration.config.js',
      'test:e2e': 'playwright test',
      'test:performance': 'artillery run tests/performance.yml',
      'test:security': 'npm audit --audit-level=high && npx snyk test',
      'test:coverage': 'npm test -- --coverage',
      'smoke-test': 'node scripts/smoke-test.js',
      
      // 代码质量
      'lint': 'next lint',
      'lint:fix': 'next lint --fix',
      'type-check': 'tsc --noEmit',
      'format': 'prettier --write "**/*.{ts,tsx,js,jsx,json,md}"',
      'format:check': 'prettier --check "**/*.{ts,tsx,js,jsx,json,md}"',
      'complexity': 'npx complexity-report src/ --format=markdown',
      
      // 部署相关
      'deploy:staging': 'bash scripts/cicd/local-deploy.sh staging',
      'deploy:production': 'bash scripts/cicd/local-deploy.sh production',
      'deploy:blue-green': 'bash scripts/cicd/local-deploy.sh blue-green',
      'deploy:canary': 'bash scripts/cicd/local-deploy.sh canary',
      'deploy:configs': 'bash scripts/deployment/deploy-configs.sh',
      
      // 监控相关
      'monitor': 'bash scripts/cicd/monitor.sh monitor',
      'monitor:setup': 'bash scripts/cicd/monitor.sh setup',
      'monitor:report': 'bash scripts/cicd/monitor.sh',
      
      // 安全相关
      'security:audit': 'npm audit --audit-level=high',
      'security:scan': 'npx snyk test',
      'security:secrets': 'gitleaks detect --source . -v',
      'security:keys': 'bash scripts/security/key-management.sh audit',
      
      // 环境验证
      'env:validate': 'bash scripts/security/validate-environment.sh',
      'env:generate-keys': 'bash scripts/security/key-management.sh generate',
      'env:rotate-keys': 'bash scripts/security/key-management.sh rotate',
      
      // 本地开发
      'dev:with-mocks': 'MOCK_API=true npm run dev',
      'dev:with-profiling': 'NODE_OPTIONS=--inspect npm run dev',
      'dev:production-like': 'NODE_ENV=production npm run dev',
      
      // 构建优化
      'analyze': 'ANALYZE=true npm run build',
      'analyze:bundle': 'npx @next/bundle-analyzer',
      'analyze:build': 'NODE_ENV=production npm run build && npm run analyze:bundle',
      
      // 文档生成
      'docs': 'typedoc --out docs src/',
      'docs:api': 'npx @redocly/cli build-docs openapi.yaml --output docs/api.html',
      'docs:deploy': 'npm run docs && gh-pages -d docs'
    };
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log(`   ✅ package.json脚本已更新: ${packagePath}`);
    
    return packageJson.scripts;
  } catch (error) {
    console.log(`   ❌ 更新package.json失败: ${error.message}`);
    return null;
  }
}

// 创建CI/CD配置文件
function createCICDConfigFiles() {
  console.log('\n📄 创建CI/CD配置文件...');
  
  const configDir = '/Users/kane/mission-control/config/cicd';
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // 1. Jest集成测试配置
  const jestIntegrationConfig = `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}'
  ],
  coverageDirectory: 'coverage/integration',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};`;

  const jestIntegrationPath = path.join(configDir, 'jest.integration.config.js');
  fs.writeFileSync(jestIntegrationPath, jestIntegrationConfig);
  console.log(`   ✅ Jest集成测试配置: ${jestIntegrationPath}`);
  
  // 2. 性能测试配置
  const performanceConfig = `config:
  target: "http://localhost:3001"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"
    - duration: 60
      arrivalRate: 10
      name: "Cool down"
  
scenarios:
  - name: "Health check"
    flow:
      - get:
          url: "/health"
  
  - name: "API Gateway"
    flow:
      - post:
          url: "/api/v1/unified"
          json:
            action: "process"
            query: "测试查询"
  
  - name: "Business Integration"
    flow:
      - get:
          url: "/business-integration"
  
  - name: "Knowledge System"
    flow:
      - get:
          url: "http://localhost:3000"`;

  const performanceConfigPath = path.join(configDir, 'performance.yml');
  fs.writeFileSync(performanceConfigPath, performanceConfig);
  console.log(`   ✅ 性能测试配置: ${performanceConfigPath}`);
  
  // 3. 冒烟测试脚本
  const smokeTestScript = `#!/usr/bin/env node

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
        responseTime: \`\${responseTime}ms\`,
        statusCode: response.status
      });
      
      console.log(\`✅ \${service.name}: \${responseTime}ms (状态码: \${response.status})\`);
    } catch (error) {
      results.push({
        service: service.name,
        status: '❌ 失败',
        error: error.message,
        statusCode: error.response?.status || 'N/A'
      });
      
      console.log(\`❌ \${service.name}: \${error.message}\`);
    }
  }
  
  console.log('');
  console.log('📋 冒烟测试结果');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.status === '✅ 通过').length;
  const failed = results.filter(r => r.status === '❌ 失败').length;
  
  console.log(\`通过: \${passed}, 失败: \${failed}, 总计: \${results.length}\`);
  
  if (failed > 0) {
    console.log('');
    console.log('⚠️  失败的测试:');
    results.filter(r => r.status === '❌ 失败').forEach(r => {
      console.log(\`   - \${r.service}: \${r.error}\`);
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
});`;

  const smokeTestPath = path.join(configDir, 'smoke-test.js');
  fs.writeFileSync(smokeTestPath, smokeTestScript);
  fs.chmodSync(smokeTestPath, '755');
  console.log(`   ✅ 冒烟测试脚本: ${smokeTestPath}`);
  
  return {
    jestConfig: jestIntegrationPath,
    performanceConfig: performanceConfigPath,
    smokeTest: smokeTestPath
  };
}

// 生成CI/CD总结报告
function generateCICDSummaryReport(githubWorkflows, localScripts, packageScripts, configFiles) {
  console.log('\n📋 生成CI/CD总结报告...');
  
  const report = {
    timestamp: new Date().toISOString(),
    githubWorkflows: githubWorkflows,
    localScripts: localScripts,
    packageScripts: packageScripts,
    configFiles: configFiles,
    deploymentStrategies: [
      { name: '标准部署', command: 'npm run deploy:production', description: '直接部署到生产环境' },
      { name: '蓝绿部署', command: 'npm run deploy:blue-green', description: '零停机时间部署' },
      { name: '金丝雀发布', command: 'npm run deploy:canary', description: '渐进式流量切换' },
      { name: '预发布部署', command: 'npm run deploy:staging', description: '先部署到预发布环境测试' }
    ],
    qualityGates: [
      '代码格式化检查 (npm run lint)',
      'TypeScript类型检查 (npm run type-check)',
      '单元测试通过率 > 80%',
      '集成测试通过率 > 70%',
      '安全扫描无高危漏洞',
