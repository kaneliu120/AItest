#!/usr/bin/env node

/**
 * 验证代码质量修复效果
 */

const fs = require('fs');
const path = require('path');

async function verifyFixes() {
  console.log('🔍 验证代码质量修复效果...\n');
  
  const results = {
    security: { passed: 0, total: 0 },
    performance: { passed: 0, total: 0 },
    maintainability: { passed: 0, total: 0 },
    reliability: { passed: 0, total: 0 },
    bestPractices: { passed: 0, total: 0 },
  };

  // 检查修复的文件
  const filesToCheck = [
    '/src/lib/requirements-analysis/requirements-analyzer-service-complete.ts',
    '/src/lib/requirements-analysis/grok-ai-service-complete.ts',
    '/src/app/api/requirements-analysis/route.ts',
    '/src/app/requirements-analysis/page.tsx',
    '/scripts/test-phase3-complete.js',
  ];

  for (const file of filesToCheck) {
    await checkFile(file, results);
  }

  // 生成验证报告
  generateVerificationReport(results);
}

async function checkFile(filePath, results) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ 文件不存在: ${filePath}`);
    return;
  }

  console.log(`📄 检查文件: ${filePath}`);
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // 安全检查
    checkSecurity(content, filePath, results);
    
    // 性能检查
    checkPerformance(content, filePath, results);
    
    // 可维护性检查
    checkMaintainability(content, filePath, results);
    
    // 可靠性检查
    checkReliability(content, filePath, results);
    
    // 最佳实践检查
    checkBestPractices(content, filePath, results);
    
  } catch (error) {
    console.log(`   ❌ 检查失败:`, error.message);
  }
}

function checkSecurity(content, filePath, results) {
  const checks = [
    {
      name: '硬编码密钥',
      pattern: /['"]hardcoded-key-[^'"]*['"]/,
      shouldPass: false,
    },
    {
      name: '环境变量验证',
      pattern: /process\.env\.GROK_API_KEY \|\| ''/,
      shouldPass: false,
    },
    {
      name: 'HTTP使用',
      pattern: /'http:\/\/localhost:3000'/,
      shouldPass: false,
    },
  ];

  checks.forEach(check => {
    results.security.total++;
    const hasIssue = check.pattern.test(content);
    
    if (hasIssue === !check.shouldPass) {
      console.log(`   🔴 安全: ${check.name} - 未修复`);
    } else {
      results.security.passed++;
      console.log(`   ✅ 安全: ${check.name} - 已修复`);
    }
  });
}

function checkPerformance(content, filePath, results) {
  const checks = [
    {
      name: 'setTimeout(0)',
      pattern: /setTimeout\([^,]*,\s*0\)/,
      shouldPass: false,
    },
    {
      name: '生产环境console.log',
      pattern: /console\.log\([^)]*\)(?!.*process\.env\.NODE_ENV)/,
      shouldPass: false,
    },
  ];

  checks.forEach(check => {
    results.performance.total++;
    const hasIssue = check.pattern.test(content);
    
    if (hasIssue === !check.shouldPass) {
      console.log(`   🔴 性能: ${check.name} - 未修复`);
    } else {
      results.performance.passed++;
      console.log(`   ✅ 性能: ${check.name} - 已修复`);
    }
  });
}

function checkMaintainability(content, filePath, results) {
  const checks = [
    {
      name: 'TODO注释',
      pattern: /\/\/ TODO:|TODO:/,
      shouldPass: false,
    },
    {
      name: 'function语法',
      pattern: /function\s+\w+\s*\([^)]*\)\s*{/,
      shouldPass: false,
    },
  ];

  checks.forEach(check => {
    results.maintainability.total++;
    const hasIssue = check.pattern.test(content);
    
    if (hasIssue === !check.shouldPass) {
      console.log(`   🔴 可维护性: ${check.name} - 未修复`);
    } else {
      results.maintainability.passed++;
      console.log(`   ✅ 可维护性: ${check.name} - 已修复`);
    }
  });
}

function checkReliability(content, filePath, results) {
  const checks = [
    {
      name: 'Date构造函数',
      pattern: /new Date\([^)]*\)/,
      shouldPass: true, // 允许使用，但应该有安全包装
    },
    {
      name: '错误处理',
      pattern: /try\s*{[^}]*}\s*catch\s*\([^)]*\)\s*{[^}]*}/,
      shouldPass: true,
    },
  ];

  checks.forEach(check => {
    results.reliability.total++;
    const hasIssue = check.pattern.test(content);
    
    if (hasIssue === !check.shouldPass) {
      console.log(`   🔴 可靠性: ${check.name} - 需要改进`);
    } else {
      results.reliability.passed++;
      console.log(`   ✅ 可靠性: ${check.name} - 良好`);
    }
  });
}

function checkBestPractices(content, filePath, results) {
  const checks = [
    {
      name: '== 操作符',
      pattern: /[^!=]=[^=]/,
      shouldPass: false,
    },
    {
      name: '数组索引作为key',
      pattern: /key=\{index\}/,
      shouldPass: false,
    },
    {
      name: '可选链操作符',
      pattern: /\?\./,
      shouldPass: true,
    },
  ];

  checks.forEach(check => {
    results.bestPractices.total++;
    const hasIssue = check.pattern.test(content);
    
    if (hasIssue === !check.shouldPass) {
      console.log(`   🔴 最佳实践: ${check.name} - 未遵循`);
    } else {
      results.bestPractices.passed++;
      console.log(`   ✅ 最佳实践: ${check.name} - 已遵循`);
    }
  });
}

function generateVerificationReport(results) {
  console.log('\n📊 验证报告');
  console.log('=' .repeat(60));
  
  let totalPassed = 0;
  let totalChecks = 0;
  
  Object.entries(results).forEach(([category, stats]) => {
    const percentage = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`   通过: ${stats.passed}/${stats.total} (${percentage}%)`);
    
    totalPassed += stats.passed;
    totalChecks += stats.total;
  });
  
  const overallPercentage = totalChecks > 0 ? Math.round((totalPassed / totalChecks) * 100) : 0;
  
  console.log('\n' + '=' .repeat(60));
  console.log(`总计: ${totalPassed}/${totalChecks} (${overallPercentage}%)`);
  
  // 保存详细报告
  saveDetailedReport(results, totalPassed, totalChecks, overallPercentage);
}

function saveDetailedReport(results, totalPassed, totalChecks, overallPercentage) {
  const reportDir = path.join(__dirname, '..', 'code-review-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportFile = path.join(reportDir, `verification-report-${Date.now()}.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPassed,
      totalChecks,
      overallPercentage,
    },
    categoryResults: results,
    recommendations: generateRecommendations(results),
  };
  
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`\n📁 详细验证报告已保存: ${reportFile}`);
}

function generateRecommendations(results) {
  const recommendations = [];
  
  if (results.security.passed / results.security.total < 0.9) {
    recommendations.push('加强安全审查，特别是环境变量管理');
  }
  
  if (results.performance.passed / results.performance.total < 0.9) {
    recommendations.push('优化性能关键路径，减少不必要的计算');
  }
  
  if (results.maintainability.passed / results.maintainability.total < 0.9) {
    recommendations.push('清理技术债务，完善代码注释');
  }
  
  if (results.reliability.passed / results.reliability.total < 0.9) {
    recommendations.push('加强错误处理和边界条件测试');
  }
  
  if (results.bestPractices.passed / results.bestPractices.total < 0.9) {
    recommendations.push('遵循TypeScript和React最佳实践');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('代码质量优秀，继续保持！');
  }
  
  return recommendations;
}

// 运行验证
verifyFixes().catch(console.error);