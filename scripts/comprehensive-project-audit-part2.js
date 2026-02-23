    console.log('-'.repeat(40));
    results.tests = await runAutomatedTests();
    
    // 4. 检查故障和问题
    console.log('\n📊 第4步: 检查故障和问题');
    console.log('-'.repeat(40));
    results.issues = checkIssuesAndFaults();
    
    // 5. 生成优化建议
    console.log('\n📊 第5步: 生成优化建议');
    console.log('-'.repeat(40));
    results.suggestions = generateOptimizationSuggestions(
      Object.fromEntries(Object.entries(PROJECTS).map(([name, proj]) => [name, proj.status])),
      results.phases,
      results.tests,
      results.issues
    );
    
    // 6. 生成总结报告
    console.log('\n📋 审计总结报告');
    console.log('='.repeat(80));
    
    // 项目状态统计
    const runningProjects = Object.values(results.projects).filter(p => p.status?.running).length;
    const totalProjects = Object.keys(results.projects).length;
    
    // 阶段系统统计
    const healthyPhases = results.phases.filter(p => p.status === 'healthy').length;
    const totalPhases = results.phases.length;
    
    // 测试统计
    const passedTests = results.tests.filter(t => t.status === 'passed').length;
    const totalTests = results.tests.length;
    
    // 问题统计
    const criticalIssues = results.issues.filter(i => i.severity === 'error').length;
    const warningIssues = results.issues.filter(i => i.severity === 'warning').length;
    
    console.log(`📊 项目状态: ${runningProjects}/${totalProjects} 个运行中`);
    console.log(`📊 阶段系统: ${healthyPhases}/${totalPhases} 个健康`);
    console.log(`📊 自动化测试: ${passedTests}/${totalTests} 个通过`);
    console.log(`📊 发现问题: ${criticalIssues}个严重, ${warningIssues}个警告`);
    console.log(`📊 优化建议: ${results.suggestions.length} 条`);
    
    // 按优先级分组建议
    const highPriority = results.suggestions.filter(s => s.priority === 'high');
    const mediumPriority = results.suggestions.filter(s => s.priority === 'medium');
    const lowPriority = results.suggestions.filter(s => s.priority === 'low');
    
    console.log('\n🎯 优先级建议:');
    console.log(`   高优先级 (${highPriority.length}条):`);
    highPriority.forEach(s => console.log(`      • ${s.suggestion}`));
    
    console.log(`   中优先级 (${mediumPriority.length}条):`);
    mediumPriority.forEach(s => console.log(`      • ${s.suggestion}`));
    
    console.log(`   低优先级 (${lowPriority.length}条):`);
    lowPriority.forEach(s => console.log(`      • ${s.suggestion}`));
    
    // 部署状态评估
    console.log('\n🚀 部署状态评估:');
    const deployableProjects = Object.values(results.projects).filter(p => p.deployment?.ready).length;
    if (deployableProjects > 0) {
      console.log(`   ✅ ${deployableProjects} 个项目已准备好生产部署`);
      
      // 列出可部署项目
      Object.entries(results.projects).forEach(([name, project]) => {
        if (project.deployment?.ready) {
          console.log(`      - ${name}: ${project.deployment.docker.compose ? 'Docker Compose' : '生产配置'} 就绪`);
        }
      });
    } else {
      console.log(`   ⚠️ 暂无项目准备好生产部署，需要配置Docker或生产环境`);
    }
    
    // 系统健康评分
    const healthScore = Math.round(
      (runningProjects / totalProjects * 30) +
      (healthyPhases / totalPhases * 40) +
      (passedTests / totalTests * 20) +
      (results.issues.length === 0 ? 10 : 0)
    );
    
    console.log(`\n🏥 系统健康评分: ${healthScore}/100`);
    console.log(`   ${healthScore >= 80 ? '✅ 优秀' : healthScore >= 60 ? '⚠️ 一般' : '❌ 需要改进'}`);
    
    // 立即行动建议
    console.log('\n⚡ 立即行动建议:');
    if (highPriority.length > 0) {
      console.log(`   1. 解决高优先级问题: ${highPriority[0].suggestion}`);
      console.log(`      行动: ${highPriority[0].action}`);
    } else if (mediumPriority.length > 0) {
      console.log(`   1. 处理中优先级优化: ${mediumPriority[0].suggestion}`);
    } else if (runningProjects < totalProjects) {
      console.log(`   1. 启动未运行的项目服务`);
    } else {
      console.log(`   1. 系统状态良好，可以开始生产部署`);
    }
    
    // 保存审计报告
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        projects: { running: runningProjects, total: totalProjects },
        phases: { healthy: healthyPhases, total: totalPhases },
        tests: { passed: passedTests, total: totalTests },
        issues: { critical: criticalIssues, warning: warningIssues },
        suggestions: results.suggestions.length,
        healthScore
      },
      details: {
        projects: results.projects,
        phases: results.phases,
        tests: results.tests,
        issues: results.issues,
        suggestions: results.suggestions
      }
    };
    
    const reportPath = '/tmp/project-audit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 详细审计报告已保存: ${reportPath}`);
    
    console.log('\n='.repeat(80));
    console.log('✅ 全面项目审计完成');
    console.log('='.repeat(80));
    
    return report;
    
  } catch (error) {
    console.error('❌ 审计过程发生错误:', error.message);
    console.error(error.stack);
    return null;
  }
}

// 执行主函数
if (require.main === module) {
  main().catch(console.error);
}