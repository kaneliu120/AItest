#!/usr/bin/env node

/**
 * 简化版阶段5代码评审
 */

const fs = require('fs');
const path = require('path');

// 阶段5代码文件列表
const PHASE5_FILES = [
  {
    path: '/Users/kane/mission-control/src/lib/automation-efficiency-service.ts',
    type: 'core-service',
    description: '自动化效率优化核心服务'
  },
  {
    path: '/Users/kane/mission-control/src/app/api/v5/automation/route.ts',
    type: 'api-route',
    description: '自动化效率优化API路由'
  },
  {
    path: '/Users/kane/mission-control/src/app/automation-efficiency/page.tsx',
    type: 'ui-page',
    description: '自动化效率优化管理界面'
  },
  {
    path: '/Users/kane/mission-control/scripts/start-automation-efficiency-workflow.js',
    type: 'workflow-script',
    description: '自动化效率优化工作流脚本'
  }
];

// 读取文件内容
function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

// 基本代码分析
function analyzeFile(fileInfo) {
  const content = readFileContent(fileInfo.path);
  if (!content) {
    return {
      file: fileInfo.path,
      status: 'error',
      error: '文件读取失败'
    };
  }

  const analysis = {
    file: fileInfo.path,
    type: fileInfo.type,
    description: fileInfo.description,
    size: content.length,
    lines: content.split('\n').length,
    issues: [],
    warnings: [],
    suggestions: []
  };

  // 通用检查
  if (content.includes('TODO') || content.includes('FIXME')) {
    analysis.issues.push('文件中包含TODO或FIXME注释');
  }

  if (content.includes('console.log') && fileInfo.type !== 'workflow-script') {
    analysis.warnings.push('生产代码中包含console.log语句');
  }

  // 类型特定检查
  switch (fileInfo.type) {
    case 'core-service':
      if (!content.includes('interface AutomationTask')) {
        analysis.issues.push('缺少AutomationTask接口定义');
      }
      if (!content.includes('class AutomationEfficiencyService')) {
        analysis.issues.push('缺少AutomationEfficiencyService类定义');
      }
      if (!content.includes('processAutomationTask')) {
        analysis.issues.push('缺少processAutomationTask方法');
      }
      if (!content.includes('optimizeTokenUsage')) {
        analysis.issues.push('缺少optimizeTokenUsage方法');
      }
      break;
    
    case 'api-route':
      if (!content.includes('GET')) {
        analysis.issues.push('缺少GET端点');
      }
      if (!content.includes('POST')) {
        analysis.issues.push('缺少POST端点');
      }
      if (!content.includes('try {') || !content.includes('catch (error)')) {
        analysis.warnings.push('缺少完整的错误处理');
      }
      break;
    
    case 'ui-page':
      if (!content.includes('useState') || !content.includes('useEffect')) {
        analysis.warnings.push('可能缺少React状态管理');
      }
      if (!content.includes('grid grid-cols-')) {
        analysis.suggestions.push('建议添加响应式网格布局');
      }
      break;
    
    case 'workflow-script':
      if (!content.includes('async function')) {
        analysis.warnings.push('缺少异步函数定义');
      }
      if (!content.includes('try {') || !content.includes('catch (error)')) {
        analysis.warnings.push('缺少错误处理');
      }
      break;
  }

  return analysis;
}

// 生成报告
function generateReport(analyses) {
  console.log('📋 阶段5代码评审报告');
  console.log('='.repeat(60));
  console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`评审文件: ${analyses.length}个`);
  console.log('');
  
  let totalIssues = 0;
  let totalWarnings = 0;
  let totalSuggestions = 0;
  
  analyses.forEach((analysis, index) => {
    console.log(`${index + 1}. ${path.basename(analysis.file)}`);
    console.log(`   描述: ${analysis.description}`);
    console.log(`   大小: ${analysis.size}字节, 行数: ${analysis.lines}`);
    
    if (analysis.status === 'error') {
      console.log(`   状态: ❌ ${analysis.error}`);
    } else {
      console.log(`   状态: ✅ 分析完成`);
      
      if (analysis.issues.length > 0) {
        console.log(`   问题 (${analysis.issues.length}):`);
        analysis.issues.forEach(issue => {
          console.log(`     - ❌ ${issue}`);
          totalIssues++;
        });
      }
      
      if (analysis.warnings.length > 0) {
        console.log(`   警告 (${analysis.warnings.length}):`);
        analysis.warnings.forEach(warning => {
          console.log(`     - ⚠️ ${warning}`);
          totalWarnings++;
        });
      }
      
      if (analysis.suggestions.length > 0) {
        console.log(`   建议 (${analysis.suggestions.length}):`);
        analysis.suggestions.forEach(suggestion => {
          console.log(`     - 💡 ${suggestion}`);
          totalSuggestions++;
        });
      }
    }
    console.log('');
  });
  
  console.log('📊 总结:');
  console.log(`   总问题: ${totalIssues}`);
  console.log(`   总警告: ${totalWarnings}`);
  console.log(`   总建议: ${totalSuggestions}`);
  console.log('');
  
  if (totalIssues === 0 && totalWarnings === 0) {
    console.log('✅ 阶段5代码质量优秀，无重大问题');
  } else if (totalIssues === 0) {
    console.log('⚠️ 阶段5代码质量良好，有少量警告需要关注');
  } else {
    console.log('❌ 阶段5代码存在关键问题需要修复');
  }
  
  console.log('='.repeat(60));
  
  return {
    timestamp: new Date().toISOString(),
    totalFiles: analyses.length,
    totalIssues,
    totalWarnings,
    totalSuggestions,
    analyses: analyses.map(a => ({
      file: path.basename(a.file),
      type: a.type,
      issues: a.issues.length,
      warnings: a.warnings.length,
      suggestions: a.suggestions.length
    }))
  };
}

// 主函数
async function main() {
  console.log('🚀 阶段5代码评审');
  console.log('='.repeat(60));
  console.log('目标: 快速评审阶段5代码质量');
  console.log('时间: ' + new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(60));
  
  try {
    // 分析所有文件
    console.log('\n🔍 分析代码文件...');
    const analyses = [];
    
    for (const fileInfo of PHASE5_FILES) {
      console.log(`   分析: ${path.basename(fileInfo.path)}`);
      const analysis = analyzeFile(fileInfo);
      analyses.push(analysis);
      
      if (analysis.status === 'error') {
        console.log(`   ❌ 失败: ${analysis.error}`);
      } else {
        console.log(`   ✅ 完成: ${analysis.issues.length}问题, ${analysis.warnings.length}警告`);
      }
    }
    
    // 生成报告
    console.log('\n📋 生成评审报告...');
    const report = generateReport(analyses);
    
    // 保存报告
    const reportPath = '/tmp/phase5-simple-review-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 报告已保存到: ${reportPath}`);
    
    console.log('\n✅ 阶段5代码评审完成!');
    console.log('🚀 可以开始执行阶段6: 统一监控和告警');
    
  } catch (error) {
    console.error('❌ 代码评审失败:', error.message);
  }
}

// 执行
if (require.main === module) {
  main().catch(console.error);
}