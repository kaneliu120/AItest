#!/usr/bin/env node

/**
 * 业务集成脚本 - 连接现有业务系统
 * 基于WORKFLOW_AUTO.md晚间主动推进授权
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// 业务系统配置
const BUSINESS_SYSTEMS = {
  // 财务系统
  finance: {
    name: '财务系统',
    path: '/Users/kane/Finance',
    api: '/api/finance',
    status: '待集成'
  },
  // 外包系统
  freelance: {
    name: '外包系统',
    path: '/Users/kane/Freelance',
    api: '/api/freelance',
    status: '待集成'
  },
  // 任务系统
  tasks: {
    name: '任务系统',
    path: '/Users/kane/Tasks',
    api: '/api/tasks',
    status: '待集成'
  },
  // 知识管理系统
  knowledge: {
    name: '知识管理系统',
    path: '/Users/kane/knowledge-management-system',
    api: 'http://localhost:8000/api/v1',
    status: '已运行'
  },
  // My Skill Shop
  myskillshop: {
    name: 'My Skill Shop',
    path: '/Users/kane/my-skill-shop',
    api: 'https://skills-store-api-bjbddhaeathndkap.southeastasia-01.azurewebsites.net',
    status: '生产运行'
  }
};

// 检查系统状态
async function checkSystemStatus(system) {
  console.log(`\n🔍 检查 ${system.name}...`);
  
  // 检查目录是否存在
  if (system.path && !fs.existsSync(system.path)) {
    console.log(`   ❌ 目录不存在: ${system.path}`);
    return { ...system, status: '目录不存在' };
  }
  
  // 检查API端点
  if (system.api) {
    try {
      const url = system.api.startsWith('http') ? system.api : `${BASE_URL}${system.api}`;
      const response = await axios.get(`${url}/health` || url, { timeout: 3000 });
      
      if (response.status === 200) {
        console.log(`   ✅ API健康: ${response.status}`);
        return { ...system, status: '运行中', apiStatus: '健康' };
      }
    } catch (error) {
      // 尝试其他端点
      try {
        const url = system.api.startsWith('http') ? system.api : `${BASE_URL}${system.api}`;
        const response = await axios.get(url, { timeout: 3000 });
        
        if (response.status === 200) {
          console.log(`   ✅ API可访问: ${response.status}`);
          return { ...system, status: '运行中', apiStatus: '可访问' };
        }
      } catch (error2) {
        console.log(`   ⚠️ API不可用: ${error2.message}`);
        return { ...system, status: 'API不可用', apiStatus: '失败' };
      }
    }
  }
  
  return { ...system, status: '待启动' };
}

// 创建集成配置文件
function createIntegrationConfig(systems) {
  console.log('\n📝 创建集成配置文件...');
  
  const config = {
    timestamp: new Date().toISOString(),
    systems: systems.reduce((acc, sys) => {
      acc[sys.name] = {
        path: sys.path,
        api: sys.api,
        status: sys.status,
        apiStatus: sys.apiStatus || '未知'
      };
      return acc;
    }, {}),
    
    // 集成端点
    integrationEndpoints: {
      unifiedGateway: `${BASE_URL}/api/v1/unified`,
      taskDispatcher: `${BASE_URL}/api/v2/dispatcher`,
      knowledgeDev: `${BASE_URL}/api/v4/knowledge-dev`,
      automation: `${BASE_URL}/api/v5/automation`,
      monitoring: `${BASE_URL}/api/v6/monitoring`
    },
    
    // 业务工作流
    businessWorkflows: [
      {
        name: '外包项目管理',
        description: '从外包平台获取项目 → 任务分配 → 知识库记录 → 财务跟踪',
        systems: ['freelance', 'tasks', 'knowledge', 'finance'],
        apiSequence: [
          'GET /api/freelance/projects',
          'POST /api/tasks/create',
          'POST /api/v4/knowledge-dev/enhance',
          'POST /api/finance/record'
        ]
      },
      {
        name: '产品开发流程',
        description: '需求分析 → 知识增强 → 任务分发 → 自动化测试',
        systems: ['knowledge', 'taskDispatcher', 'automation'],
        apiSequence: [
          'POST /api/v4/knowledge-dev/analyze',
          'POST /api/v2/dispatcher/dispatch',
          'POST /api/v5/automation/process-batch'
        ]
      },
      {
        name: '财务监控分析',
        description: '收入跟踪 → 成本分析 → 报告生成 → 知识归档',
        systems: ['finance', 'knowledge', 'monitoring'],
        apiSequence: [
          'GET /api/finance/stats',
          'POST /api/v4/knowledge-dev/archive',
          'GET /api/v6/monitoring/alerts'
        ]
      }
    ]
  };
  
  // 保存配置文件
  const configPath = '/Users/kane/mission-control/config/business-integration.json';
  const configDir = path.dirname(configPath);
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`   ✅ 配置文件已保存: ${configPath}`);
  
  return config;
}

// 创建集成API路由
function createIntegrationAPIs() {
  console.log('\n🔧 创建集成API路由...');
  
  const apiDir = '/Users/kane/mission-control/src/app/api/integration';
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }
  
  // 1. 业务集成状态API
  const statusRoute = path.join(apiDir, 'status/route.ts');
  const statusContent = `import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'business-integration.json');

export async function GET(request: NextRequest) {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json({
        success: false,
        error: '集成配置文件不存在',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }
    
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    
    // 实时检查系统状态
    const systems = Object.entries(config.systems).map(([name, sys]: [string, any]) => ({
      name,
      path: sys.path,
      api: sys.api,
      status: sys.status,
      apiStatus: sys.apiStatus
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        config,
        systems,
        integrationEndpoints: config.integrationEndpoints,
        businessWorkflows: config.businessWorkflows,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('业务集成状态API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}`;
  
  fs.writeFileSync(statusRoute, statusContent);
  console.log(`   ✅ 创建状态API: ${statusRoute}`);
  
  // 2. 业务工作流执行API
  const workflowRoute = path.join(apiDir, 'workflow/route.ts');
  const workflowContent = `import { NextRequest, NextResponse } from 'next/server';
import { unifiedGatewayService } from '@/lib/unified-gateway-service';
import { intelligentTaskDispatcher } from '@/lib/intelligent-task-dispatcher';
import { knowledgeEnhancedDevService } from '@/lib/knowledge-enhanced-dev-service';
import { automationEfficiencyService } from '@/lib/automation-efficiency-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflow, parameters } = body;
    
    if (!workflow) {
      return NextResponse.json({
        success: false,
        error: '缺少 workflow 参数',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    let result;
    
    switch (workflow) {
      case 'outsource-project':
        // 外包项目管理工作流
        const { projectTitle, budget, deadline } = parameters || {};
        
        // 1. 知识增强分析
        const analysis = await knowledgeEnhancedDevService.analyzeTask({
          task: \`外包项目: \${projectTitle}\`,
          context: { budget, deadline }
        });
        
        // 2. 智能任务分发
        const dispatch = await intelligentTaskDispatcher.dispatchTask({
          task: \`管理外包项目: \${projectTitle}\`,
          context: analysis
        });
        
        // 3. 自动化效率优化
        const optimization = await automationEfficiencyService.processBatch({
          tasks: [
            { type: 'project-management', data: { title: projectTitle, analysis, dispatch } }
          ]
        });
        
        result = {
          workflow: 'outsource-project',
          steps: ['知识分析', '任务分发', '效率优化'],
          analysis,
          dispatch,
          optimization,
          timestamp: new Date().toISOString()
        };
        break;
        
      case 'product-development':
        // 产品开发工作流
        const { feature, requirements } = parameters || {};
        
        // 1. 统一网关处理
        const gatewayResult = await unifiedGatewayService.processRequest({
          id: \`dev_\${Date.now()}\`,
          query: \`开发功能: \${feature}\`,
          context: { requirements },
          priority: 'high'
        });
        
        // 2. 知识增强开发
        const devEnhancement = await knowledgeEnhancedDevService.enhanceTask({
          task: \`开发 \${feature}\`,
          context: gatewayResult,
          enhancementLevel: 'high'
        });
        
        // 3. 自动化处理
        const automationResult = await automationEfficiencyService.processBatch({
          tasks: [
            { type: 'development', data: { feature, requirements, enhancement: devEnhancement } }
          ]
        });
        
        result = {
          workflow: 'product-development',
          steps: ['需求分析', '知识增强', '自动化处理'],
          gatewayResult,
          devEnhancement,
          automationResult,
          timestamp: new Date().toISOString()
        };
        break;
        
      case 'finance-monitoring':
        // 财务监控工作流
        const { period, metrics } = parameters || {};
        
        // 模拟财务数据
        const financeData = {
          period: period || 'monthly',
          revenue: Math.random() * 10000 + 5000,
          expenses: Math.random() * 3000 + 1000,
          profit: 0,
          timestamp: new Date().toISOString()
        };
        
        financeData.profit = financeData.revenue - financeData.expenses;
        
        // 知识归档
        const archiveResult = await knowledgeEnhancedDevService.enhanceTask({
          task: '财务报告归档',
          context: financeData,
          enhancementLevel: 'medium'
        });
        
        result = {
          workflow: 'finance-monitoring',
          steps: ['数据收集', '分析计算', '知识归档'],
          financeData,
          archiveResult,
          timestamp: new Date().toISOString()
        };
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: \`未知工作流: \${workflow}\`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('业务工作流API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}`;
  
  fs.writeFileSync(workflowRoute, workflowContent);
  console.log(`   ✅ 创建工作流API: ${workflowRoute}`);
  
  return {
    statusAPI: '/api/integration/status',
    workflowAPI: '/api/integration/workflow'
  };
}

// 创建集成管理界面
function createIntegrationUI() {
  console.log('\n🎨 创建集成管理界面...');
  
  const uiDir = '/Users/kane/mission-control/src/app/business-integration';
  if (!fs.existsSync(uiDir)) {
    fs.mkdirSync(uiDir, { recursive: true });
  }
  
  // 主页面
  const pageContent = `import BusinessIntegrationDashboard from '@/components/integration/business-integration-dashboard';

export default function BusinessIntegrationPage() {
  return <BusinessIntegrationDashboard />;
}`;
  
  fs.writeFileSync(path.join(uiDir, 'page.tsx'), pageContent);
  console.log(`   ✅ 创建主页面: ${uiDir}/page.tsx`);
  
  // 创建组件目录
  const componentsDir = '/Users/kane/mission-control/src/components/integration';
  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
  }
  
  // 仪表板组件
  const dashboardContent = `'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  DollarSign, 
  Briefcase, 
  BookOpen, 
  Workflow, 
  CheckCircle, 
  AlertCircle,
  PlayCircle,
  BarChart3
} from 'lucide-react';

interface SystemStatus {
  name: string;
  path: string;
  api: string;
  status: string;
  apiStatus: string;
}

interface WorkflowResult {
  workflow: string;
  steps: string[];
  timestamp: string;
  [key: string]: any;
}

export default function BusinessIntegrationDashboard() {
  const [systems, setSystems] = useState<SystemStatus[]>([]);
  const [workflowResults, setWorkflowResults] = useState<WorkflowResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrationStatus();
  }, []);

  const fetchIntegrationStatus = async () => {
    try {
      const response = await fetch('/api/integration/status');
      const data = await response.json();
      
      if (data.success && data.data.systems) {
        setSystems(data.data.systems);
      }
    } catch (error) {
      console.error('获取集成状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = async (workflow: string, parameters?: any) => {
    setExecuting(workflow);
    try {
      const response = await fetch('/api/integration/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow, parameters })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWorkflowResults(prev => [data.data, ...prev.slice(0, 4)]);
        alert(\`工作流 "\${workflow}" 执行成功！\`);
      } else {
        alert(\`工作流执行失败: \${data.error}\`);
      }
    } catch (error) {
      console.error('执行工作流失败:', error);
      alert('工作流执行失败，请检查网络连接');
    } finally {
      setExecuting(null);
    }
  };

  const getSystemIcon = (name: string) => {
    switch (name) {
      case '财务系统': return <DollarSign className="h-5 w-5" />;
      case '外包系统': return <Briefcase className="h-5 w-5" />;
      case '任务系统': return <Workflow className="h-5 w-5" />;
      case '知识管理系统': return <BookOpen className="h-5 w-5" />;
      case 'My Skill Shop': return <Building2 className="h-5 w-5" />;
      default: return <Building2 className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '运行中':
      case '生产运行':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">✅ {status}</Badge>;
      case '待集成':
      case '待启动':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">🔄 {status}</Badge>;
      case 'API不可用':
      case '目录不存在':
        return <Badge className="bg-red-100 text-red