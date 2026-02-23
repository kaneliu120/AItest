#!/usr/bin/env node

/**
 * 执行阶段5代码评审和修复
 */

const fs = require('fs');
const path = require('path');

// 导入评审函数
const { analyzeCodeFile, reviewCodeWithAutomationEfficiency, generateCodeReviewReport, autoFixCodeIssues } = require('./phase5-code-review.js');

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

async function main() {
  console.log('🚀 阶段5代码评审和修复');
  console.log('='.repeat(60));
  console.log('目标: 评审阶段5代码，发现问题并自动修复');
  console.log('时间: ' + new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(60));
  
  try {
    // 1. 分析所有代码文件
    console.log('\n🔍 分析阶段5代码文件...');
    const fileAnalyses = [];
    
    for (const fileInfo of PHASE5_FILES) {
      console.log(`   分析: ${path.basename(fileInfo.path)}`);
      const analysis = analyzeCodeFile(fileInfo);
      fileAnalyses.push(analysis);
      
      if (analysis.status === 'error') {
        console.log(`   ❌ 分析失败: ${analysis.error}`);
      } else {
        console.log(`   ✅ 分析完成: ${analysis.issues.length}问题, ${analysis.warnings.length}警告`);
      }
    }
    
    // 2. 使用自动化效率优化系统进行评审
    console.log('\n🤖 使用自动化效率优化系统进行代码评审...');
    const automationResults = await reviewCodeWithAutomationEfficiency();
    
    if (automationResults) {
      console.log('✅ 自动化评审完成');
      console.log(`   处理任务: ${automationResults.batchResults.total}`);
      console.log(`   完成任务: ${automationResults.batchResults.completed}`);
      console.log(`   成功率: ${automationResults.batchResults.successRate}`);
    } else {
      console.log('⚠️ 自动化评审跳过或失败，继续手动评审');
    }
    
    // 3. 生成评审报告
    console.log('\n📋 生成代码评审报告...');
    const reviewReport = generateCodeReviewReport(fileAnalyses, automationResults);
    
    // 4. 自动修复代码问题
    console.log('\n🔧 开始自动修复代码问题...');
    const fixResults = await autoFixCodeIssues(fileAnalyses);
    
    console.log(`\n✅ 修复完成: ${fixResults.totalFixes}个问题已修复`);
    console.log(`   修复文件: ${fixResults.filesFixed}个`);
    
    if (fixResults.filesFixedList.length > 0) {
      console.log('   修复的文件:');
      fixResults.filesFixedList.forEach(file => {
        console.log(`     - ${file}`);
      });
    }
    
    // 5. 重新分析修复后的文件
    console.log('\n🔍 重新分析修复后的代码文件...');
    const reanalyses = [];
    
    for (const fileInfo of PHASE5_FILES) {
      if (fixResults.filesFixedList.includes(path.basename(fileInfo.path))) {
        console.log(`   重新分析: ${path.basename(fileInfo.path)}`);
        const reanalysis = analyzeCodeFile(fileInfo);
        reanalyses.push(reanalysis);
        
        const originalAnalysis = fileAnalyses.find(a => a.file === fileInfo.path);
        if (originalAnalysis && reanalysis) {
          const issuesFixed = originalAnalysis.issues.length - reanalysis.issues.length;
          const warningsFixed = originalAnalysis.warnings.length - reanalysis.warnings.length;
          
          console.log(`     修复: ${issuesFixed}问题, ${warningsFixed}警告`);
        }
      }
    }
    
    // 6. 生成最终报告
    console.log('\n📋 生成最终修复报告...');
    
    const finalReport = {
      timestamp: new Date().toISOString(),
      executionTime: new Date().toLocaleString('zh-CN'),
      originalStats: reviewReport.summary,
      fixResults: {
        totalFixes: fixResults.totalFixes,
        filesFixed: fixResults.filesFixed,
        fixesApplied: fixResults.fixesApplied
      },
      finalStatus: {
        remainingIssues: reanalyses.reduce((sum, a) => sum + a.issues.length, 0),
        remainingWarnings: reanalyses.reduce((sum, a) => sum + a.warnings.length, 0),
        averageComplianceScore: Math.round(
          reanalyses
            .filter(a => a.complianceScore !== undefined)
            .reduce((sum, a) => sum + a.complianceScore, 0) / 
          Math.max(1, reanalyses.filter(a => a.complianceScore !== undefined).length)
        )
      },
      recommendations: []
    };
    
    // 生成建议
    if (finalReport.finalStatus.remainingIssues > 0) {
      finalReport.recommendations.push({
        priority: 'high',
        area: '剩余问题',
        suggestion: '修复剩余的关键问题',
        action: '手动检查并修复无法自动修复的问题'
      });
    }
    
    if (finalReport.finalStatus.averageComplianceScore < 90) {
      finalReport.recommendations.push({
        priority: 'medium',
        area: '标准合规',
        suggestion: '进一步提高代码标准合规性',
        action: '根据评审标准完善代码结构'
      });
    }
    
    // 输出最终报告
    console.log('\n📋 阶段5代码评审和修复最终报告:');
    console.log('='.repeat(60));
    console.log(`执行时间: ${finalReport.executionTime}`);
    console.log('');
    console.log('📊 原始状态:');
    console.log(`   文件数: ${finalReport.originalStats.totalFiles}`);
    console.log(`   问题数: ${finalReport.originalStats.totalIssues}`);
    console.log(`   警告数: ${finalReport.originalStats.totalWarnings}`);
    console.log(`   合规分数: ${finalReport.originalStats.averageComplianceScore}%`);
    console.log('');
    console.log('🔧 修复结果:');
    console.log(`   修复问题: ${finalReport.fixResults.totalFixes}个`);
    console.log(`   修复文件: ${finalReport.fixResults.filesFixed}个`);
    console.log('');
    console.log('📈 最终状态:');
    console.log(`   剩余问题: ${finalReport.finalStatus.remainingIssues}`);
    console.log(`   剩余警告: ${finalReport.finalStatus.remainingWarnings}`);
    console.log(`   最终合规: ${finalReport.finalStatus.averageComplianceScore}%`);
    console.log('');
    
    if (finalReport.recommendations.length > 0) {
      console.log('💡 后续建议:');
      finalReport.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.area}:`);
        console.log(`      建议: ${rec.suggestion}`);
        console.log(`      行动: ${rec.action}`);
      });
    }
    
    console.log('='.repeat(60));
    
    // 保存报告
    const reportPath = '/tmp/phase5-code-review-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);
    
    console.log('\n✅ 阶段5代码评审和修复完成!');
    console.log('🚀 可以开始执行阶段6: 统一监控和告警');
    
  } catch (error) {
    console.error('❌ 阶段5代码评审失败:', error.message);
    console.error(error.stack);
  }
}

// 执行主函数
if (require.main === module) {
  main().catch(console.error);
}