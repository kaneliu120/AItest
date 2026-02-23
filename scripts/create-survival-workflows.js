#!/usr/bin/env node

/**
 * 创建"生存之战"项目工作流
 */

const http = require('http');

console.log('🚀 创建"生存之战"项目工作流\n');
console.log('服务器: http://localhost:3001\n');

async function registerWorkflow(workflow) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/workflows',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            success: json.success === true,
            status: res.statusCode,
            data: json.data,
            message: json.message,
            requestId: json.requestId,
          });
        } catch (error) {
          resolve({
            success: false,
            status: res.statusCode,
            error: 'JSON解析失败',
            rawData: data.substring(0, 200),
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        status: 0,
        error: `连接失败: ${error.message}`,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        status: 0,
        error: '请求超时',
      });
    });

    req.write(JSON.stringify({
      action: 'register',
      workflow,
    }));

    req.end();
  });
}

// "生存之战"项目工作流定义
const survivalWorkflows = {
  // 阶段1: 生存阶段 (0-3个月) - 建立稳定现金流
  SURVIVAL_PHASE_DAILY: {
    id: 'survival-phase-daily',
    name: '生存阶段每日工作流',
    description: '每日执行生存阶段关键任务：外包项目搜索、提案优化、客户跟进',
    version: '1.0.0',
    steps: [
      {
        id: 'morning-check',
        name: '早间检查',
        description: '检查日历、待办事项、天气、系统状态',
        module: 'monitoring',
        action: 'morning_check',
        parameters: {
          checkCalendar: true,
          checkTodos: true,
          checkWeather: true,
          checkSystem: true,
        },
        timeoutMs: 300000, // 5分钟
        retryAttempts: 2,
        retryDelayMs: 30000,
      },
      {
        id: 'freelance-search',
        name: '外包项目搜索',
        description: '搜索AI相关外包项目',
        module: 'freelance',
        action: 'search_projects',
        parameters: {
          keywords: ['AI', 'Next.js', 'TypeScript', 'automation', 'ChatGPT'],
          platforms: ['upwork', 'freelancer', 'fiverr'],
          maxResults: 15,
          minBudget: 1000,
          maxBudget: 10000,
        },
        timeoutMs: 600000, // 10分钟
        retryAttempts: 3,
        retryDelayMs: 60000,
        dependencies: ['morning-check'],
      },
      {
        id: 'project-filter',
        name: '项目筛选',
        description: '筛选合适的项目并准备提案',
        module: 'freelance',
        action: 'filter_projects',
        parameters: {
          requiredSkills: ['AI', 'web development', 'automation'],
          preferredClients: ['tech', 'startup', 'enterprise'],
          maxApplications: 5,
        },
        timeoutMs: 300000, // 5分钟
        retryAttempts: 2,
        retryDelayMs: 30000,
        dependencies: ['freelance-search'],
      },
      {
        id: 'proposal-creation',
        name: '创建提案',
        description: '为筛选的项目创建定制化提案',
        module: 'freelance',
        action: 'create_proposals',
        parameters: {
          template: 'ai-expert',
          personalize: true,
          includePortfolio: true,
          pricingStrategy: 'competitive',
        },
        timeoutMs: 900000, // 15分钟
        retryAttempts: 2,
        retryDelayMs: 60000,
        dependencies: ['project-filter'],
      },
      {
        id: 'client-followup',
        name: '客户跟进',
        description: '跟进已提交的提案和现有客户',
        module: 'freelance',
        action: 'followup_clients',
        parameters: {
          checkResponses: true,
          sendReminders: true,
          updateStatus: true,
          maxFollowups: 3,
        },
        timeoutMs: 300000, // 5分钟
        retryAttempts: 2,
        retryDelayMs: 30000,
        dependencies: ['proposal-creation'],
      },
      {
        id: 'income-tracking',
        name: '收入跟踪',
        description: '跟踪每日收入和支出',
        module: 'finance',
        action: 'track_daily_income',
        parameters: {
          currency: 'PHP',
          target: 30000, // 月目标30k PHP
          trackExpenses: true,
          generateReport: true,
        },
        timeoutMs: 180000, // 3分钟
        retryAttempts: 2,
        retryDelayMs: 30000,
        dependencies: ['client-followup'],
      },
      {
        id: 'evening-review',
        name: '晚间回顾',
        description: '总结当日进展，计划明日任务',
        module: 'tasks',
        action: 'evening_review',
        parameters: {
          summarizeProgress: true,
          identifyProblems: true,
          planNextDay: true,
          updateMetrics: true,
        },
        timeoutMs: 300000, // 5分钟
        retryAttempts: 2,
        retryDelayMs: 30000,
        dependencies: ['income-tracking'],
      },
    ],
    triggers: [
      {
        type: 'schedule',
        schedule: '0 9 * * *', // 每天9:00 AM
      },
      {
        type: 'manual',
      },
    ],
    metadata: {
      createdBy: 'mission-control',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['survival', 'daily', 'freelance', 'income', 'phase1'],
      missionPhase: '生存阶段 (0-3个月)',
      target: '建立稳定现金流',
      priority: 'critical',
    },
  },

  // My Skill Shop 优化工作流
  MY_SKILL_SHOP_OPTIMIZATION: {
    id: 'my-skill-shop-optimization',
    name: 'My Skill Shop 优化工作流',
    description: '定期优化My Skill Shop平台：修复bug、添加功能、性能优化',
    version: '1.0.0',
    steps: [
      {
        id: 'health-check',
        name: '健康检查',
        description: '检查My Skill Shop部署状态',
        module: 'monitoring',
        action: 'check_service',
        parameters: {
          service: 'my-skill-shop',
          endpoints: ['web', 'api', 'database'],
          timeout: 30000,
        },
        timeoutMs: 120000, // 2分钟
        retryAttempts: 3,
        retryDelayMs: 30000,
      },
      {
        id: 'bug-analysis',
        name: 'Bug分析',
        description: '分析GitHub issues和用户反馈',
        module: 'automation',
        action: 'analyze_bugs',
        parameters: {
          source: 'github',
          repository: 'kaneliu120/my-skill-store-v2',
          label: 'bug',
          priority: 'high',
        },
        timeoutMs: 300000, // 5分钟
        retryAttempts: 2,
        retryDelayMs: 30000,
        dependencies: ['health-check'],
      },
      {
        id: 'feature-planning',
        name: '功能规划',
        description: '规划新功能和优化',
        module: 'tasks',
        action: 'plan_features',
        parameters: {
          basedOn: 'user-feedback',
          priority: 'revenue-impact',
          timeline: '2-weeks',
        },
        timeoutMs: 240000, // 4分钟
        retryAttempts: 2,
        retryDelayMs: 30000,
        dependencies: ['bug-analysis'],
      },
      {
        id: 'development',
        name: '开发实施',
        description: '实施bug修复和功能开发',
        module: 'automation',
        action: 'execute_development',
        parameters: {
          useAI: true,
          framework: 'nextjs',
          testing: true,
        },
        timeoutMs: 1800000, // 30分钟
        retryAttempts: 2,
        retryDelayMs: 120000,
        dependencies: ['feature-planning'],
      },
      {
        id: 'testing',
        name: '测试验证',
        description: '测试修复和功能',
        module: 'automation',
        action: 'run_tests',
        parameters: {
          types: ['unit', 'integration', 'e2e'],
          coverage: 80,
          autoFix: true,
        },
        timeoutMs: 600000, // 10分钟
        retryAttempts: 3,
        retryDelayMs: 60000,
        dependencies: ['development'],
      },
      {
        id: 'deployment',
        name: '部署上线',
        description: '部署到生产环境',
        module: 'automation',
        action: 'deploy',
        parameters: {
          environment: 'production',
          platform: 'azure',
          rollbackOnFailure: true,
        },
        timeoutMs: 900000, // 15分钟
        retryAttempts: 3,
        retryDelayMs: 120000,
        dependencies: ['testing'],
        onFailure: 'stop',
      },
      {
        id: 'post-deployment',
        name: '部署后检查',
        description: '检查部署后的系统状态',
        module: 'monitoring',
        action: 'post_deployment_check',
        parameters: {
          checkEndpoints: true,
          monitorErrors: true,
          verifyMetrics: true,
          duration: '1-hour',
        },
        timeoutMs: 360000, // 6分钟
        retryAttempts: 2,
        retryDelayMs: 60000,
        dependencies: ['deployment'],
      },
    ],
    triggers: [
      {
        type: 'schedule',
        schedule: '0 14 * * 2,5', // 每周二、五14:00
      },
      {
        type: 'event',
        eventType: 'my-skill-shop:issue-reported',
      },
    ],
    metadata: {
      createdBy: 'mission-control',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['my-skill-shop', 'optimization', 'development', 'deployment'],
      missionPhase: '生存阶段 (0-3个月)',
      target: '产品优化和稳定',
      priority: 'high',
    },
  },

  // AI智能体开发工作流
  AI_AGENT_DEVELOPMENT: {
    id: 'ai-agent-development',
    name: 'AI智能体开发工作流',
    description: '开发和优化AI智能体产品线',
    version: '1.0.0',
    steps: [
      {
        id: 'market-research',
        name: '市场研究',
        description: '研究AI智能体市场需求和机会',
        module: 'automation',
        action: 'market_research',
        parameters: {
          topic: 'AI agents',
          sources: ['reddit', 'twitter', 'hackernews', 'producthunt'],
          timeframe: '30-days',
          competitors: true,
        },
        timeoutMs: 600000, // 10分钟
        retryAttempts: 2,
        retryDelayMs: 60000,
      },
      {
        id: 'idea-validation',
        name: '想法验证',
        description: '验证AI智能体想法和可行性',
        module: 'tasks',
        action: 'validate_idea',
        parameters: {
          criteria: ['demand', 'competition', 'feasibility', 'revenue'],
          scoring: 'weighted',
          threshold: 70,
        },
        timeoutMs: 300000, // 5分钟
        retryAttempts: 2,
        retryDelayMs: 30000,
        dependencies: ['market-research'],
      },
      {
        id: 'prototype-development',
        name: '原型开发',
        description: '开发AI智能体原型',
        module: 'automation',
        action: 'develop_prototype',
        parameters: {
          technology: ['openai', 'anthropic', 'open-source'],
          features: ['conversation', 'tool-use', 'memory'],
          timeline: '1-week',
        },
        timeoutMs: 1800000, // 30分钟
        retryAttempts: 2,
        retryDelayMs: 120000,
        dependencies: ['idea-validation'],
      },
      {
        id: 'testing-feedback',
        name: '测试和反馈',
        description: '测试原型并收集反馈',
        module: 'automation',
        action: 'test_and_feedback',
        parameters: {
          testers: 5,
          duration: '3-days',
          metrics: ['usability', 'accuracy', 'speed'],
          collectFeedback: true,
        },
        timeoutMs: 1209600000, // 14天 (模拟)
        retryAttempts: 1,
        retryDelayMs: 86400000,
        dependencies: ['prototype-development'],
      },
      {
        id: 'iteration',
        name: '迭代优化',
        description: '基于反馈进行迭代优化',
        module: 'automation',
        action: 'iterate',
        parameters: {
          basedOn: 'feedback',
          priority: 'critical-issues',
          iterations: 3,
        },
        timeoutMs: 604800000, // 7天 (模拟)
        retryAttempts: 2,
        retryDelayMs: 86400000,
        dependencies: ['testing-feedback'],
      },
      {
        id: 'launch-preparation',
        name: '上线准备',
        description: '准备产品上线',
        module: 'tasks',
        action: 'prepare_launch',
        parameters: {
          marketing: true,
          documentation: true,
          pricing: true,
          support: true,
        },
        timeoutMs: 604800000, // 7天 (模拟)
        retryAttempts: 2,
        retryDelayMs: 86400000,
        dependencies: ['iteration'],
      },
    ],
    triggers: [
      {
        type: 'schedule',
        schedule: '0 10 * * 1', // 每周一10:00
      },
      {
        type: 'manual',
      },
    ],
    metadata: {
      createdBy: 'mission-control',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['ai', 'agent', 'development', 'product'],
      missionPhase: '发展阶段 (3-12个月)',
      target: '打造AI智能体产品线',
      priority: 'medium',
    },
  },

  // 财务周报工作流
  FINANCE_WEEKLY_REVIEW: {
    id: 'finance-weekly-review',
    name: '财务周报工作流',
    description: '每周财务回顾和计划',
    version: '1.0.0',
    steps: [
      {
        id: 'data-collection',
        name: '数据收集',
        description: '收集本周财务数据',
        module: 'finance',
        action: 'collect_weekly_data',
        parameters: {
          incomeSources: ['freelance', 'my-skill-shop', 'other'],
          expenseCategories: ['development', 'marketing', 'personal', 'tools'],
          currency: 'PHP',
        },
        timeoutMs: 300000, // 5分钟
        retryAttempts: 3,
        retryDelayMs: 30000,
      },
      {
        id: 'analysis',
        name: '数据分析',
        description: '分析财务趋势和模式',
        module: 'finance',
        action: 'analyze_finances',
        parameters: {
          metrics: ['revenue', 'expenses', 'profit', 'growth'],
          comparisons: ['week-over-week', 'month-over-month'],
          insights: true,
        },
        timeoutMs: 240000, // 4分钟
        retryAttempts: 2,
        retryDelayMs: 30000,
        dependencies: ['data-collection'],
      },
      {
        id: 'report-generation',
        name: '报告生成',
        description: '生成财务周报',
        module: 'finance',
        action: 'generate_report',
        parameters: {
          format: 'detailed',
          includeCharts: true,
          recommendations: true,
          targets: true,
        },
        timeoutMs: 180000, // 3分钟
        retryAttempts: 2,
        retryDelayMs: 30000,
        dependencies: ['analysis'],
      },
      {
        id: 'planning',
        name: '下周计划',
        description: '制定下周财务计划',
        module: 'tasks',
        action: 'plan_finances',
        parameters: {
          budget: true,
          investments: true,
          savings: true,
          goals: true,
        },
        timeoutMs: 180000, // 3分钟
        retryAttempts: 2,
        retryDelayMs: 30000,
        dependencies: ['report-generation'],
      },
      {
        id: 'notification',
        name: '通知发送',
        description: '发送财务周报通知',
        module: 'automation',
        action: 'send_notification',
        parameters: {
          channel: 'discord',
          format: 'summary',
          priority: 'medium',
        },
        timeoutMs: 120000, // 2分钟
        retryAttempts: 3,
        retryDelayMs: 30000,
        dependencies: ['planning'],
      },
    ],
    triggers: [
      {
        type: 'schedule',
        schedule: '0 9 * * 1', // 每周一9:00
      },
    ],
    metadata: {
      createdBy: 'mission-control',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['finance', 'weekly', 'report', 'planning'],
      missionPhase: '所有阶段',
      target: '财务透明和规划',
      priority: 'high',
    },
  },
};

async function createWorkflows() {
  console.log('🎯 创建"生存之战"项目工作流\n');
  
  const results = [];
  
  for (const [key, workflow] of Object.entries(survivalWorkflows)) {
    console.log(`创建: ${workflow.name}`);
    console.log(`  描述: ${workflow.description}`);
    console.log(`  步骤: ${workflow.steps.length} 个`);
    console.log(`  阶段: ${workflow.metadata.missionPhase}`);
    
    const result = await registerWorkflow(workflow);
    
    if (result.success) {
      console.log(`  ✅ 成功: ${result.message}`);
      console.log(`     工作流ID: ${result.data?.workflowId}`);
    } else {
      console.log(`  ❌ 失败: ${result.error || result.message}`);
    }
    
    results.push({
      workflow: workflow.name,
      success: result.success,
      workflowId: result.data?.workflowId,
      error: result.error,
    });
    
    console.log('');
  }
  
  // 总结
  console.log('📊 创建结果总结\n');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const successRate = (successful / total) * 100;
  
  results.forEach(result => {
    console.log(`  ${result.success ? '✅' : '❌'} ${result.workflow}`);
    if (!result.success) {
      console.log(`     错误: ${result.error}`);
    }
  });
  
  console.log(`\n🎯 创建结果: ${successful}/${total} 成功 (${successRate.toFixed(1)}%)`);
  
  if (successRate >= 75) {
    console.log('\n🎉 "生存之战"项目工作流创建成功！');
    console.log('🚀 系统已准备好支持三阶段使命。');
  } else if (successRate >= 50) {
    console.log('\n⚠️  大部分工作流创建成功，部分需要检查。');
    console.log('🔧 建议修复失败的工作流。');
  } else {
    console.log('\n❌ 工作流创建需要更多调试。');
    console.log('🔧 建议检查API连接和工作流定义。');
  }
  
  console.log('\n💡 下一步建议:');
  console.log('   1. 访问 http://localhost:3001/workflows 查看新工作流');
  console.log('   2. 测试生存阶段每日工作流');
  console.log('   3. 配置定时触发器');
  console.log('   4. 集成真实模块处理器');
  
  // 创建报告
  const report = {
    timestamp: new Date().toISOString(),
    mission: '创建"生存之战"项目工作流',
    workflows: results.map(r => ({
      name: r.workflow,
      success: r.success,
      workflowId: r.workflowId,
    })),
    summary: {
      total,
      successful,
      successRate,
    },
    missionPhases: {
      survival: '生存阶段 (0-3个月) - 建立稳定现金流',
      development: '发展阶段 (3-12个月) - 打造AI智能体产品线',
      expansion: '扩展阶段 (12-36个月) - 成为东南亚AI+iGaming交叉领域专家服务商',
    },
    recommendations: [
      '测试生存阶段每日工作流 (survival-phase-daily)',
      '配置My Skill Shop优化定时触发器',
      '集成真实财务数据源',
      '连接外包平台API',
      '开发AI智能体原型',
    ],
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    'survival-workflows-creation-report.json',
    JSON.stringify(report, null, 2),
    'utf8'
  );
  
  console.log('\n📄 创建报告已保存: survival-workflows-creation-report.json');
  
  return successRate >= 50;
}

createWorkflows().then(success => {
  console.log('\n=== "生存之战"项目工作流创建完成 ===');
  console.log(`时间: ${new Date().toISOString()}`);
  
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('创建执行错误:', error);
  process.exit(1);
});
