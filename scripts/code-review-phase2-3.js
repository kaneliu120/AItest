#!/usr/bin/env node

/**
 * 第2阶段和第3阶段代码评审
 */

const fs = require('fs');
const path = require('path');

class CodeReviewer {
  constructor() {
    this.issues = [];
    this.stats = {
      filesReviewed: 0,
      totalLines: 0,
      issuesFound: 0,
      categories: {
        security: 0,
        performance: 0,
        maintainability: 0,
        reliability: 0,
        bestPractices: 0,
      }
    };
  }

  async reviewPhase2() {
    console.log('🔍 开始第2阶段代码评审...\n');
    
    const phase2Files = [
      // 核心服务
      '/src/lib/requirements-analysis/requirements-analyzer-service-complete.ts',
      '/src/lib/requirements-analysis/technical-document-generator-complete.ts',
      '/src/lib/requirements-analysis/document-parser-service.ts',
      
      // API路由
      '/src/app/api/requirements-analysis/route.ts',
      
      // 页面组件
      '/src/app/requirements-analysis/page.tsx',
      
      // 工具脚本
      '/scripts/test-requirements-analysis.js',
    ];

    for (const file of phase2Files) {
      await this.reviewFile(file, 'phase2');
    }
  }

  async reviewPhase3() {
    console.log('\n🔍 开始第3阶段代码评审...\n');
    
    const phase3Files = [
      // AI增强服务
      '/src/lib/requirements-analysis/grok-ai-service-complete.ts',
      
      // 性能优化服务
      '/src/lib/requirements-analysis/performance-optimizer.ts',
      
      // 可视化组件
      '/src/components/requirements-analysis/visual-dashboard.tsx',
      
      // 测试脚本
      '/scripts/test-phase3-complete.js',
      
      // 报告文档
      '/phase3-completion-report.md',
    ];

    for (const file of phase3Files) {
      await this.reviewFile(file, 'phase3');
    }
  }

  async reviewFile(filePath, phase) {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ 文件不存在: ${filePath}`);
      return;
    }

    console.log(`📄 评审文件: ${filePath}`);
    
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      this.stats.filesReviewed++;
      this.stats.totalLines += lines.length;

      // 检查常见问题
      this.checkSecurityIssues(content, filePath, phase);
      this.checkPerformanceIssues(content, filePath, phase);
      this.checkMaintainability(content, filePath, phase);
      this.checkReliability(content, filePath, phase);
      this.checkBestPractices(content, filePath, phase);
      
      // 文件特定检查
      this.checkFileSpecificIssues(content, filePath, phase);
      
    } catch (error) {
      console.log(`❌ 读取文件失败: ${filePath}`, error.message);
    }
  }

  checkSecurityIssues(content, filePath, phase) {
    const securityPatterns = [
      { pattern: /eval\(/, description: '使用eval()函数存在安全风险' },
      { pattern: /process\.env\.([A-Z_]+)/g, description: '环境变量可能未正确配置' },
      { pattern: /password|secret|token|key.*=.*['"][^'"]+['"]/, description: '硬编码密钥或密码' },
      { pattern: /innerHTML.*=/, description: '直接设置innerHTML可能导致XSS攻击' },
      { pattern: /fetch.*http:\/\//, description: '使用HTTP而非HTTPS' },
    ];

    securityPatterns.forEach(({ pattern, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.addIssue('security', filePath, description, phase);
      }
    });
  }

  checkPerformanceIssues(content, filePath, phase) {
    const performancePatterns = [
      { pattern: /for\s*\(.*\)\s*{.*for\s*\(.*\)\s*{/, description: '嵌套循环可能导致性能问题' },
      { pattern: /JSON\.parse\(.*\)\s*in\s+loop/, description: '在循环中解析JSON' },
      { pattern: /setTimeout\(.*0\)/, description: '使用setTimeout(0)可能导致性能问题' },
      { pattern: /\.innerHTML\s*=\s*['"].*['"]/, description: '频繁更新innerHTML' },
      { pattern: /await\s+Promise\.all\(\[/, description: '检查是否使用Promise.all优化异步操作' },
    ];

    performancePatterns.forEach(({ pattern, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.addIssue('performance', filePath, description, phase);
      }
    });
  }

  checkMaintainability(content, filePath, phase) {
    const maintainabilityPatterns = [
      { pattern: /\/\/ TODO:|TODO:/, description: '存在未完成的TODO注释' },
      { pattern: /\/\/ FIXME:|FIXME:/, description: '存在需要修复的FIXME注释' },
      { pattern: /any\s*:/, description: '使用any类型，缺乏类型安全' },
      { pattern: /console\.log\(/, description: '生产代码中存在console.log' },
      { pattern: /function\s+\w+\s*\(\)\s*{/, description: '使用function而非箭头函数' },
    ];

    maintainabilityPatterns.forEach(({ pattern, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.addIssue('maintainability', filePath, description, phase);
      }
    });
  }

  checkReliability(content, filePath, phase) {
    const reliabilityPatterns = [
      { pattern: /try\s*{[^}]*}\s*catch\s*\(\)/, description: '空的catch块' },
      { pattern: /\.catch\(\)/, description: '空的Promise.catch' },
      { pattern: /if\s*\([^)]*\)\s*{[^}]*}\s*(?!else)/, description: '缺少else分支' },
      { pattern: /parseInt\([^)]*\)/, description: 'parseInt缺少基数参数' },
      { pattern: /new\s+Date\([^)]*\)/, description: 'Date构造函数可能解析错误' },
    ];

    reliabilityPatterns.forEach(({ pattern, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.addIssue('reliability', filePath, description, phase);
      }
    });
  }

  checkBestPractices(content, filePath, phase) {
    const bestPracticePatterns = [
      { pattern: /var\s+\w+/, description: '使用var而非let/const' },
      { pattern: /==\s*[^=]/, description: '使用==而非===' },
      { pattern: /!\s*[^=]/, description: '检查是否使用!而非!==' },
      { pattern: /Array\([^)]*\)/, description: '使用Array构造函数而非字面量' },
      { pattern: /Object\.create\(null\)/, description: '检查是否使用Object.create(null)' },
    ];

    bestPracticePatterns.forEach(({ pattern, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.addIssue('bestPractices', filePath, description, phase);
      }
    });
  }

  checkFileSpecificIssues(content, filePath, phase) {
    // TypeScript文件检查
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      this.checkTypeScriptIssues(content, filePath, phase);
    }
    
    // React组件检查
    if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
      this.checkReactIssues(content, filePath, phase);
    }
    
    // API路由检查
    if (filePath.includes('/api/') && filePath.endsWith('/route.ts')) {
      this.checkApiIssues(content, filePath, phase);
    }
  }

  checkTypeScriptIssues(content, filePath, phase) {
    const tsPatterns = [
      { pattern: /as\s+any/, description: '使用as any类型断言' },
      { pattern: /!\s*:\s*any/, description: '使用非空断言操作符' },
      { pattern: /interface\s+\w+\s*{[^}]*\?[^:]*:/, description: '可选属性可能未正确处理' },
      { pattern: /type\s+\w+\s*=\s*string\s*\|\s*number/, description: '宽泛的联合类型' },
    ];

    tsPatterns.forEach(({ pattern, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.addIssue('bestPractices', filePath, description, phase);
      }
    });
  }

  checkReactIssues(content, filePath, phase) {
    const reactPatterns = [
      { pattern: /useState\(\)/, description: 'useState缺少初始值' },
      { pattern: /useEffect\([^,]*,\s*\[\]\)/, description: 'useEffect缺少依赖数组' },
      { pattern: /<div\s+onClick={[^}]*}>/, description: '内联事件处理函数' },
      { pattern: /style={{[^}]*}}/, description: '内联样式对象' },
      { pattern: /key={index}/, description: '使用数组索引作为key' },
    ];

    reactPatterns.forEach(({ pattern, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.addIssue('bestPractices', filePath, description, phase);
      }
    });
  }

  checkApiIssues(content, filePath, phase) {
    const apiPatterns = [
      { pattern: /res\.json\([^)]*\)/, description: 'API响应缺少错误处理' },
      { pattern: /req\.body/, description: '请求体缺少验证' },
      { pattern: /process\.env/, description: '环境变量直接使用' },
      { pattern: /try\s*{[^}]*}\s*catch/, description: '检查错误处理是否完整' },
    ];

    apiPatterns.forEach(({ pattern, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.addIssue('reliability', filePath, description, phase);
      }
    });
  }

  addIssue(category, filePath, description, phase) {
    this.issues.push({
      category,
      filePath,
      description,
      phase,
      severity: this.getSeverity(category),
    });
    
    this.stats.issuesFound++;
    this.stats.categories[category]++;
  }

  getSeverity(category) {
    const severityMap = {
      security: 'high',
      reliability: 'high',
      performance: 'medium',
      maintainability: 'medium',
      bestPractices: 'low',
    };
    return severityMap[category] || 'low';
  }

  generateReport() {
    console.log('\n📊 代码评审报告');
    console.log('=' .repeat(60));
    
    console.log(`\n📈 统计信息:`);
    console.log(`   评审文件数: ${this.stats.filesReviewed}`);
    console.log(`   总代码行数: ${this.stats.totalLines}`);
    console.log(`   发现问题数: ${this.stats.issuesFound}`);
    
    console.log(`\n📋 问题分类:`);
    Object.entries(this.stats.categories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} 个问题`);
    });
    
    console.log(`\n⚠️  按阶段统计:`);
    const phaseStats = {};
    this.issues.forEach(issue => {
      phaseStats[issue.phase] = (phaseStats[issue.phase] || 0) + 1;
    });
    Object.entries(phaseStats).forEach(([phase, count]) => {
      console.log(`   阶段${phase}: ${count} 个问题`);
    });
    
    console.log(`\n🔴 高优先级问题:`);
    const highPriority = this.issues.filter(issue => issue.severity === 'high');
    if (highPriority.length === 0) {
      console.log('   无高优先级问题 ✅');
    } else {
      highPriority.forEach(issue => {
        console.log(`   - ${issue.filePath}: ${issue.description}`);
      });
    }
    
    console.log(`\n🟡 中优先级问题:`);
    const mediumPriority = this.issues.filter(issue => issue.severity === 'medium');
    if (mediumPriority.length === 0) {
      console.log('   无中优先级问题 ✅');
    } else {
      mediumPriority.forEach(issue => {
        console.log(`   - ${issue.filePath}: ${issue.description}`);
      });
    }
    
    console.log(`\n🟢 低优先级问题:`);
    const lowPriority = this.issues.filter(issue => issue.severity === 'low');
    if (lowPriority.length === 0) {
      console.log('   无低优先级问题 ✅');
    } else {
      lowPriority.forEach(issue => {
        console.log(`   - ${issue.filePath}: ${issue.description}`);
      });
    }
    
    console.log(`\n💡 改进建议:`);
    this.generateRecommendations();
    
    // 保存详细报告
    this.saveDetailedReport();
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.stats.categories.security > 0) {
      recommendations.push('1. 加强安全审查，特别是环境变量和API密钥管理');
    }
    
    if (this.stats.categories.performance > 0) {
      recommendations.push('2. 优化性能关键路径，减少不必要的重渲染和计算');
    }
    
    if (this.stats.categories.maintainability > 0) {
      recommendations.push('3. 清理TODO/FIXME注释，完善类型定义');
    }
    
    if (this.stats.categories.reliability > 0) {
      recommendations.push('4. 加强错误处理和边界条件测试');
    }
    
    if (this.stats.categories.bestPractices > 0) {
      recommendations.push('5. 遵循TypeScript和React最佳实践');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('代码质量优秀，继续保持！');
    }
    
    recommendations.forEach(rec => console.log(`   ${rec}`));
  }

  saveDetailedReport() {
    const reportDir = path.join(__dirname, '..', 'code-review-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportFile = path.join(reportDir, `phase2-3-review-${Date.now()}.json`);
    
    const detailedReport = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      issues: this.issues,
      summary: {
        totalIssues: this.stats.issuesFound,
        highPriority: this.issues.filter(i => i.severity === 'high').length,
        mediumPriority: this.issues.filter(i => i.severity === 'medium').length,
        lowPriority: this.issues.filter(i => i.severity === 'low').length,
      },
      recommendations: this.generateDetailedRecommendations(),
    };
    
    fs.writeFileSync(reportFile, JSON.stringify(detailedReport, null, 2));
    console.log(`\n📁 详细报告已保存: ${reportFile}`);
  }

  generateDetailedRecommendations() {
    return {
      security: [
        '实施环境变量验证和加密存储',
        '添加API请求速率限制',
        '实现输入验证和清理',
        '配置CORS策略',
      ],
      performance: [
        '实现代码分割和懒加载',
        '优化数据库查询和缓存策略',
        '减少不必要的重渲染',
        '使用性能监控工具',
      ],
      maintainability: [
        '完善TypeScript类型定义',
        '添加代码注释和文档',
        '建立代码审查流程',
        '实施自动化测试',
      ],
      reliability: [
        '加强错误处理和恢复机制',
        '添加监控和告警',
        '实施回滚策略',
        '定期备份数据',
      ],
      bestPractices: [
        '遵循React Hooks最佳实践',
        '使用函数组件和自定义Hooks',
        '实施状态管理最佳实践',
        '优化组件结构和复用',
      ],
    };
  }
}

async function main() {
  const reviewer = new CodeReviewer();
  
  console.log('🔍 智能需求分析系统 - 第2、3阶段代码评审');
  console.log('=' .repeat(60));
  
  await reviewer.reviewPhase2();
  await reviewer.reviewPhase3();
  
  reviewer.generateReport();
}

main().catch(console.error);