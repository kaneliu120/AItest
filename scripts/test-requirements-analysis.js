#!/usr/bin/env node

/**
 * 测试需求分析系统
 */

const fs = require('fs');
const path = require('path');

// 测试数据
const testRequirements = `# 项目需求文档

## 项目概述
开发一个智能任务管理系统，支持团队协作和项目管理。

## 功能需求

### 1. 用户管理
- 用户注册和登录
- 个人资料管理
- 权限控制

### 2. 项目管理
- 创建和管理项目
- 项目成员管理
- 项目进度跟踪

### 3. 任务管理
- 创建和分配任务
- 任务状态跟踪
- 截止日期提醒

### 4. 团队协作
- 实时聊天
- 文件共享
- 评论和反馈

## 非功能需求
- 性能: 页面加载时间 < 2秒
- 安全: 用户数据加密存储
- 可用性: 支持移动端访问

## 业务需求
- 提高团队协作效率30%
- 减少项目管理时间20%
- 支持100个并发用户`;

async const testAnalysis = () => {
  console.log('🚀 测试需求分析系统...\n');
  
  try {
    // 1. 测试API端点
    console.log('1. 测试API状态...');
    const statusResponse = await fetch('http://localhost:3000/api/requirements-analysis?action=status');
    const statusData = await statusResponse.json();
    
    if (statusData.success) {
      console.log('✅ API状态正常:', statusData.data.status);
      console.log('   支持格式:', statusData.data.supportedFormats.join(', '));
    } else {
      console.log('❌ API状态异常');
      return;
    }
    
    // 2. 测试文本分析
    console.log('\n2. 测试文本分析...');
    const formData = new FormData();
    formData.append('text', testRequirements);
    formData.append('generateDocs', 'true');
    
    const analysisResponse = await fetch('http://localhost:3000/api/requirements-analysis', {
      method: 'POST',
      body: formData,
    });
    
    const analysisData = await analysisResponse.json();
    
    if (analysisData.success) {
      console.log('✅ 文本分析成功');
      console.log('   文档信息:');
      console.log('     - 文件名:', analysisData.data.document.filename);
      console.log('     - 文件类型:', analysisData.data.document.fileType);
      console.log('     - 单词数:', analysisData.data.document.metadata.wordCount);
      
      console.log('\n   分析结果:');
      console.log('     - 功能需求数:', analysisData.data.analysis.categories.functional.length);
      console.log('     - 非功能需求数:', analysisData.data.analysis.categories.nonFunctional.length);
      console.log('     - 业务需求数:', analysisData.data.analysis.categories.business.length);
      console.log('     - 总体复杂度:', analysisData.data.analysis.complexity.overall + '/10');
      console.log('     - 风险评估数:', analysisData.data.analysis.risks.length);
      console.log('     - 总预估工时:', analysisData.data.analysis.effortEstimation.totalHours + '小时');
      
      console.log('\n   技术栈推荐:');
      console.log('     - 前端:', analysisData.data.analysis.techStack.frontend.map(t => t.framework).join(', '));
      console.log('     - 后端:', analysisData.data.analysis.techStack.backend.map(t => t.framework).join(', '));
      console.log('     - 数据库:', analysisData.data.analysis.techStack.database.map(t => t.type).join(', '));
      console.log('     - 部署平台:', analysisData.data.analysis.techStack.deployment.map(t => t.platform).join(', '));
      
      if (analysisData.data.documents) {
        console.log('\n   生成文档:');
        Object.entries(analysisData.data.documents).forEach(([key, doc]) => {
          console.log(`     - ${key}: ${doc.title} (${doc.metadata.wordCount}字)`);
        });
      }
      
      // 3. 保存测试结果
      console.log('\n3. 保存测试结果...');
      const testDir = path.join(__dirname, '..', 'test-results');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      const resultFile = path.join(testDir, `test-analysis-${Date.now()}.json`);
      fs.writeFileSync(resultFile, JSON.stringify(analysisData, null, 2));
      console.log(`✅ 测试结果保存到: ${resultFile}`);
      
      // 4. 生成示例文档
      console.log('\n4. 生成示例文档...');
      const docsDir = path.join(testDir, 'generated-docs');
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }
      
      if (analysisData.data.documents) {
        Object.entries(analysisData.data.documents).forEach(([key, doc]) => {
          const docFile = path.join(docsDir, `${doc.type}-${doc.id}.md`);
          fs.writeFileSync(docFile, doc.content);
          console.log(`   - ${doc.type}.md 已生成`);
        });
      }
      
      // 5. 验证功能完整性
      console.log('\n5. 功能完整性验证...');
      const checks = [
        { name: '文档解析', condition: analysisData.data.document?.content?.length > 0 },
        { name: '需求分析', condition: analysisData.data.analysis?.categories?.functional?.length > 0 },
        { name: '技术栈推荐', condition: analysisData.data.analysis?.techStack?.frontend?.length > 0 },
        { name: '复杂度评估', condition: analysisData.data.analysis?.complexity?.overall > 0 },
        { name: '风险评估', condition: analysisData.data.analysis?.risks?.length >= 0 },
        { name: '工作量估算', condition: analysisData.data.analysis?.effortEstimation?.totalHours > 0 },
        { name: '文档生成', condition: analysisData.data.documents ? Object.keys(analysisData.data.documents).length > 0 : false },
      ];
      
      let passed = 0;
      checks.forEach(check => {
        if (check.condition) {
          console.log(`   ✅ ${check.name}`);
          passed++;
        } else {
          console.log(`   ❌ ${check.name}`);
        }
      });
      
      console.log(`\n📊 测试总结: ${passed}/${checks.length} 项通过`);
      
      if (passed === checks.length) {
        console.log('\n🎉 所有测试通过！需求分析系统功能完整。');
      } else {
        console.log('\n⚠️  部分测试失败，请检查相关功能。');
      }
      
    } else {
      console.log('❌ 文本分析失败:', analysisData.error);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    
    // 检查服务器是否运行
    console.log('\n🔍 检查服务器状态...');
    try {
      const checkResponse = await fetch(process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000');
      if (checkResponse.ok) {
        console.log('✅ 服务器运行正常');
      } else {
        console.log('❌ 服务器可能未运行或端口被占用');
        console.log('   请运行: cd /Users/kane/mission-control && npm run dev');
      }
    } catch (serverError) {
      console.log('❌ 无法连接到服务器');
      console.log('   请确保开发服务器正在运行:');
      console.log('   1. cd /Users/kane/mission-control');
      console.log('   2. npm run dev');
    }
  }
}

// 运行测试
testAnalysis().catch(console.error);