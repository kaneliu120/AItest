#!/usr/bin/env node

/**
 * 全面项目审计脚本
 * 检查所有6个阶段系统的状态、测试和部署情况
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const PROJECTS = {
  'mission-control': {
    path: '/Users/kane/mission-control',
    port: 3001,
    status: null,
    deployment: null
  },
  'knowledge-management-system': {
    path: '/Users/kane/knowledge-management-system',
    port: 3000,
    status: null,
    deployment: null
  },
  'okms-backend': {
    path: '/Users/kane/knowledge-management-system/backend',
    port: 8000,
    status: null,
    deployment: null
  }
};

// 检查系统状态
async function checkSystemStatus(projectName, project) {
  console.log(`\n🔍 检查 ${projectName} 状态...`);
  
  try {
    // 检查进程是否运行
    const portCheck = execSync(`lsof -i :${project.port} | grep LISTEN || echo "端口 ${project.port} 未监听"`, { encoding: 'utf8' });
    
    if (portCheck.includes('LISTEN')) {
      console.log(`   ✅ 端口 ${project.port} 正在监听`);
      
      // 尝试API调用
      try {
        const response = await axios.get(`${BASE_URL.replace('3001', project.port)}/health`, { timeout: 5000 });
        project.status = {
          running: true,
          health: response.data,
          port: project.port
        };
        console.log(`   ✅ 健康检查通过: ${JSON.stringify(response.data)}`);
      } catch (apiError) {
        try {
          // 尝试其他端点
          const response = await axios.get(`http://localhost:${project.port}`, { timeout: 5000 });
          project.status = {
            running: true,
            accessible: true,
            port: project.port
          };
          console.log(`   ⚠️ 健康端点不可用，但服务可访问`);
        } catch (error) {
          project.status = {
            running: true,
            accessible: false,
            port: project.port
          };
          console.log(`   ⚠️ 服务运行但无法访问`);
        }
      }
    } else {
      project.status = { running: false, port: project.port };
      console.log(`   ❌ 端口 ${project.port} 未监听，服务未运行`);
    }
  } catch (error) {
    project.status = { error: error.message, port: project.port };
    console.log(`   ❌ 检查失败: ${error.message}`);
  }
  
  return project.status;
}

// 检查部署状态
function checkDeploymentStatus(projectName, project) {
  console.log(`\n📦 检查 ${projectName} 部署状态...`);
  
  try {
    // 检查Docker配置
    const dockerComposePath = path.join(project.path, 'docker-compose.yml');
    const dockerfilePath = path.join(project.path, 'Dockerfile');
    
    const hasDockerCompose = fs.existsSync(dockerComposePath);
    const hasDockerfile = fs.existsSync(dockerfilePath);
    
    // 检查生产配置文件
    const envProductionPath = path.join(project.path, '.env.production');
    const hasEnvProduction = fs.existsSync(envProductionPath);
    
    // 检查部署脚本
    const deployScripts = fs.readdirSync(project.path).filter(file => 
      file.includes('deploy') || file.includes('start') || file.includes('production')
    );
    
    project.deployment = {
      docker: { compose: hasDockerCompose, file: hasDockerfile },
      config: { productionEnv: hasEnvProduction },
      scripts: deployScripts,
      ready: hasDockerCompose || hasEnvProduction
    };
    
    console.log(`   Docker配置: ${hasDockerCompose ? '✅ compose.yml' : '❌ 无'} | ${hasDockerfile ? '✅ Dockerfile' : '❌ 无'}`);
    console.log(`   生产配置: ${hasEnvProduction ? '✅ .env.production' : '❌ 无'}`);
    console.log(`   部署脚本: ${deployScripts.length > 0 ? '✅ ' + deployScripts.join(', ') : '❌ 无'}`);
    
    if (project.deployment.ready) {
      console.log(`   🚀 生产部署就绪: ${project.deployment.ready ? '✅ 是' : '❌ 否'}`);
    }
    
  } catch (error) {
    project.deployment = { error: error.message };
    console.log(`   ❌ 部署检查失败: ${error.message}`);
  }
  
  return project.deployment;
}

// 检查代码质量
function checkCodeQuality(projectName, project) {
  console.log(`\n📝 检查 ${projectName} 代码质量...`);
  
  try {
    // 检查TypeScript错误
    const tsconfigPath = path.join(project.path, 'tsconfig.json');
    const hasTypeScript = fs.existsSync(tsconfigPath);
    
    // 检查package.json
    const packageJsonPath = path.join(project.path, 'package.json');
    const hasPackageJson = fs.existsSync(packageJsonPath);
    
    // 检查构建状态
    const buildDir = path.join(project.path, 'build');
    const distDir = path.join(project.path, 'dist');
    const hasBuild = fs.existsSync(buildDir) || fs.existsSync(distDir);
    
    // 检查测试文件
    const testFiles = [];
    if (fs.existsSync(project.path)) {
      const findTests = (dir) => {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            findTests(fullPath);
          } else if (item.includes('.test.') || item.includes('.spec.')) {
            testFiles.push(path.relative(project.path, fullPath));
          }
        });
      };
      findTests(project.path);
    }
    
    const quality = {
      typescript: hasTypeScript,
      packageJson: hasPackageJson,
      built: hasBuild,
      tests: testFiles.length,
      testFiles: testFiles.slice(0, 5) // 只显示前5个
    };
    
    console.log(`   TypeScript: ${hasTypeScript ? '✅ 配置' : '❌ 无'}`);
    console.log(`   package.json: ${hasPackageJson ? '✅ 存在' : '❌ 无'}`);
    console.log(`   构建输出: ${hasBuild ? '✅ 存在' : '❌ 无'}`);
    console.log(`   测试文件: ${testFiles.length}个`);
    if (testFiles.length > 0) {
      console.log(`   示例测试: ${testFiles.slice(0, 3).join(', ')}${testFiles.length > 3 ? '...' : ''}`);
    }
    
    return quality;
  } catch (error) {
    console.log(`   ❌ 代码质量检查失败: ${error.message}`);
    return { error: error.message };
  }
}

// 检查6个阶段系统
async function checkPhaseSystems() {
  console.log('\n🚀 检查6个阶段系统状态...');
  
  const phases = [
    { name: '阶段1: 统一API网关', endpoint: '/api/v1/unified?action=status' },
    { name: '阶段2: 智能任务分发', endpoint: '/api/v2/dispatcher?action=status' },
    { name: '阶段3: 上下文智能缓存', endpoint: '/api/v3/cache?action=status' },
    { name: '阶段4: 知识增强开发', endpoint: '/api/v4/knowledge-dev?action=status' },
    { name: '阶段5: 自动化效率优化', endpoint: '/api/v5/automation?action=status' },
    { name: '阶段6: 统一监控告警', endpoint: '/api/v6/monitoring?action=status' }
  ];
  
  const results = [];
  
  for (const phase of phases) {
    console.log(`\n🔍 ${phase.name}...`);
    try {
      const response = await axios.get(`${BASE_URL}${phase.endpoint}`, { timeout: 3000 });
      if (response.data.success) {
        console.log(`   ✅ 状态: ${response.data.data.status || 'healthy'}`);
        console.log(`      服务: ${response.data.data.service || 'unknown'}`);
        results.push({ phase: phase.name, status: 'healthy', data: response.data.data });
      } else {
        console.log(`   ⚠️ 状态: 错误 - ${response.data.error}`);
        results.push({ phase: phase.name, status: 'error', error: response.data.error });
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ 服务未运行或端口错误`);
      } else {
        console.log(`   ❌ 检查失败: ${error.message}`);
      }
      results.push({ phase: phase.name, status: 'failed', error: error.message });
    }
  }
  
  return results;
}

// 运行自动化测试
async function runAutomatedTests() {
  console.log('\n🧪 运行自动化测试...');
  
  const tests = [
    { name: '统一网关基本查询', endpoint: '/api/v1/unified', method: 'POST', data: { action: 'process', query: '测试查询' } },
    { name: '智能分发任务', endpoint: '/api/v2/dispatcher', method: 'POST', data: { action: 'dispatch', task: '创建一个React组件' } },
    { name: '监控系统状态', endpoint: '/api/v6/monitoring', method: 'GET', params: { action: 'status' } }
  ];
  
  const testResults = [];
  
  for (const test of tests) {
    console.log(`\n   🔧 ${test.name}...`);
    try {
      let response;
      if (test.method === 'GET') {
        const url = `${BASE_URL}${test.endpoint}?${new URLSearchParams(test.params).toString()}`;
        response = await axios.get(url, { timeout: 5000 });
      } else {
        response = await axios.post(`${BASE_URL}${test.endpoint}`, test.data, { timeout: 5000 });
      }
      
      if (response.data.success) {
        console.log(`      ✅ 测试通过`);
        testResults.push({ test: test.name, status: 'passed', responseTime: response.headers['x-response-time'] || 'unknown' });
      } else {
        console.log(`      ⚠️ 测试失败: ${response.data.error}`);
        testResults.push({ test: test.name, status: 'failed', error: response.data.error });
      }
    } catch (error) {
      console.log(`      ❌ 测试异常: ${error.message}`);
      testResults.push({ test: test.name, status: 'error', error: error.message });
    }
  }
  
  return testResults;
}

// 检查故障和问题
function checkIssuesAndFaults() {
  console.log('\n🔧 检查故障和问题...');
  
  const issues = [];
  
  // 检查Mission Control构建问题
  try {
    const buildLogPath = '/Users/kane/mission-control/.next/build.log';
    if (fs.existsSync(buildLogPath)) {
      const buildLog = fs.readFileSync(buildLogPath, 'utf8');
      const errorCount = (buildLog.match(/error/gi) || []).length;
      const warningCount = (buildLog.match(/warning/gi) || []).length;
      
      if (errorCount > 0 || warningCount > 0) {
        issues.push({
          type: 'build',
          severity: errorCount > 0 ? 'error' : 'warning',
          count: errorCount + warningCount,
          message: `构建日志中有 ${errorCount} 个错误, ${warningCount} 个警告`
        });
        console.log(`   ⚠️ 构建问题: ${errorCount}个错误, ${warningCount}个警告`);
      }
    }
  } catch (error) {
    // 忽略文件不存在错误
  }
  
  // 检查端口冲突
  try {
    const ports = [3000, 3001, 8000];
    ports.forEach(port => {
      try {
        execSync(`lsof -i :${port}`, { stdio: 'pipe' });
      } catch (e) {
        // 端口未使用
      }
    });
  } catch (error) {
    // 忽略检查错误
  }
  
  // 检查磁盘空间
  try {
    const diskInfo = execSync('df -h / | tail -1', { encoding: 'utf8' });
    const usage = parseInt(diskInfo.split(/\s+/)[4]);
    if (usage > 90) {
      issues.push({
        type: 'disk',
        severity: 'warning',
        message: `磁盘使用率 ${usage}%，接近上限`
      });
      console.log(`   ⚠️ 磁盘空间: 使用率 ${usage}%`);
    }
  } catch (error) {
    // 忽略检查错误
  }
  
  if (issues.length === 0) {
    console.log('   ✅ 未发现明显故障');
  }
  
  return issues;
}

// 生成优化建议
function generateOptimizationSuggestions(projectStatuses, phaseResults, testResults, issues) {
  console.log('\n💡 生成优化建议...');
  
  const suggestions = [];
  
  // 基于项目状态的建议
  Object.entries(projectStatuses).forEach(([name, status]) => {
    if (!status.running) {
      suggestions.push({
        priority: 'high',
        category: 'deployment',
        suggestion: `启动 ${name} 服务`,
        action: `cd ${PROJECTS[name].path} && npm run dev`,
        impact: '使系统完全运行'
      });
    }
  });
  
  // 基于阶段系统状态的建议
  phaseResults.forEach(phase => {
    if (phase.status !== 'healthy') {
      suggestions.push({
        priority: phase.status === 'failed' ? 'high' : 'medium',
        category: 'phase-system',
        suggestion: `修复 ${phase.phase} 系统`,
        action: `检查 ${phase.phase} API端点`,
        impact: '确保6阶段系统完整运行'
      });
    }
  });
  
  // 基于测试结果的建议
  const failedTests = testResults.filter(t => t.status !== 'passed');
  if (failedTests.length > 0) {
    suggestions.push({
      priority: 'medium',
      category: 'testing',
      suggestion: `修复 ${failedTests.length} 个失败的自动化测试`,
      action: '检查测试脚本和API响应',
      impact: '提高系统可靠性'
    });
  }
  
  // 基于问题的建议
  issues.forEach(issue => {
    if (issue.severity === 'error') {
      suggestions.push({
        priority: 'high',
        category: issue.type,
        suggestion: `解决 ${issue.message}`,
        action: '检查相关日志和配置',
        impact: '防止系统故障'
      });
    }
  });
  
  // 通用优化建议
  suggestions.push({
    priority: 'low',
    category: 'performance',
    suggestion: '添加性能监控和告警',
    action: '配置阶段6监控系统的告警规则',
    impact: '提前发现性能问题'
  });
  
  suggestions.push({
    priority: 'medium',
    category: 'deployment',
    suggestion: '创建生产环境部署脚本',
    action: '编写docker-compose.production.yml和部署脚本',
    impact: '简化生产部署流程'
  });
  
  suggestions.push({
    priority: 'low',
    category: 'documentation',
    suggestion: '完善API文档和用户指南',
    action: '生成OpenAPI/Swagger文档',
    impact: '提高开发效率'
  });
  
  // 显示建议
  suggestions.forEach((suggestion, index) => {
    const priorityIcon = suggestion.priority === 'high' ? '🔴' : suggestion.priority === 'medium' ? '🟡' : '🟢';
    console.log(`   ${priorityIcon} [${suggestion.priority.toUpperCase()}] ${suggestion.suggestion}`);
  });
  
  return suggestions;
}

// 主函数
async function main() {
  console.log('='.repeat(80));
  console.log('🔍 全面项目审计 - 自动化测试和故障排除');
  console.log('='.repeat(80));
  console.log('时间: ' + new Date().toLocaleString('zh-CN'));
  console.log('目标: 检查所有系统状态，运行测试，识别问题，生成优化建议');
  console.log('='.repeat(80));
  
  const results = {
    projects: {},
    phases: [],
    tests: [],
    issues: [],
    suggestions: []
  };
  
  try {
    // 1. 检查各项目状态
    console.log('\n📊 第1步: 检查项目状态');
    console.log('-'.repeat(40));
    
    for (const [name, project] of Object.entries(PROJECTS)) {
      const status = await checkSystemStatus(name, project);
      const deployment = checkDeploymentStatus(name, project);
      const quality = checkCodeQuality(name, project);
      
      results.projects[name] = {
        status,
        deployment,
        quality
      };
    }
    
    // 2. 检查6个阶段系统
    console.log('\n📊 第2步: 检查6个阶段系统');
    console.log('-'.repeat(40));
    results.phases = await checkPhaseSystems();
    
    // 3. 运行自动化测试
    console.log('\n📊 第3步: 运行自动化测试');
