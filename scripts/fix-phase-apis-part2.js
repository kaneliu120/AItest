      { name: '阶段4', endpoint: '/api/v4/knowledge-dev?action=status' },
      { name: '阶段5', endpoint: '/api/v5/automation?action=status' },
      { name: '阶段6', endpoint: '/api/v6/monitoring?action=status' }
    ];
    
    const results = [];
    
    for (const phase of phases) {
      console.log(`   ${phase.name}...`);
      try {
        const response = await axios.get(`${BASE_URL}${phase.endpoint}`, { timeout: 3000 });
        if (response.data.success) {
          console.log(`      ✅ 状态: ${response.data.data.status || 'healthy'}`);
          results.push({ phase: phase.name, status: 'healthy' });
        } else {
          console.log(`      ⚠️ 状态: 错误 - ${response.data.error}`);
          results.push({ phase: phase.name, status: 'error' });
        }
      } catch (error) {
        console.log(`      ❌ 不可用: ${error.message}`);
        results.push({ phase: phase.name, status: 'failed' });
      }
    }
    
    // 7. 总结
    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const totalCount = results.length;
    
    console.log('\n📊 修复总结');
    console.log('='.repeat(60));
    console.log(`健康系统: ${healthyCount}/${totalCount}`);
    console.log(`成功率: ${Math.round((healthyCount / totalCount) * 100)}%`);
    
    if (healthyCount === totalCount) {
      console.log('\n🎉 所有阶段系统修复完成！');
      console.log('系统已完全就绪，可以开始生产部署。');
    } else {
      console.log('\n⚠️ 部分系统仍需修复');
      console.log('需要手动检查以下系统:');
      results.filter(r => r.status !== 'healthy').forEach(r => {
        console.log(`   - ${r.phase}: ${r.status}`);
      });
    }
    
    console.log('\n🚀 访问信息:');
    console.log('   Mission Control: http://localhost:3001');
    console.log('   知识管理系统: http://localhost:3000');
    console.log('   知识管理后端: http://localhost:8000');
    console.log('   阶段6监控: http://localhost:3001/unified-monitoring');
    
    console.log('\n='.repeat(60));
    console.log('✅ API修复流程完成');
    
  } catch (error) {
    console.error('❌ 修复过程发生错误:', error.message);
    console.error(error.stack);
  }
}

// 执行主函数
if (require.main === module) {
  main().catch(console.error);
}