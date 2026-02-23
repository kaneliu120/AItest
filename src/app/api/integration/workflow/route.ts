import { NextRequest, NextResponse } from 'next/server';
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
      case 'outsource-project': {
        // 外包项目管理工作流
        const { projectTitle, budget, deadline } = parameters || {};
        
        // 1. 知识增强分析
        const analysis = await knowledgeEnhancedDevService.analyzeDevTask(
          `外包项目: ${projectTitle}`,
          { budget, deadline }
        );
        
        // 2. 智能任务分发
        const dispatch = await intelligentTaskDispatcher.dispatchTask({
          id: `workflow-${Date.now()}`,
          query: `管理外包项目: ${projectTitle}`,
          context: analysis
        });
        
        // 3. 自动化效率优化
        const optimization = await automationEfficiencyService.processAutomationTask({
          type: 'optimization',
          priority: 'high',
          complexity: 'medium',
          estimatedTokenUsage: 1000,
          estimatedTime: 5,
          automationLevel: 'full',
          data: { title: projectTitle, analysis, dispatch }
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
      }
        
      case 'product-development': {
        // 产品开发工作流
        const { feature, requirements } = parameters || {};
        
        // 1. 统一网关处理
        const gatewayResult = await unifiedGatewayService.processRequest({
          id: `dev_${Date.now()}`,
          query: `开发功能: ${feature}`,
          context: { requirements },
          priority: 'high'
        });
        
        // 2. 知识增强分析
        const devAnalysis = await knowledgeEnhancedDevService.analyzeDevTask(
          `开发 ${feature}`,
          { requirements, gatewayResult }
        );
        
        // 3. 自动化处理
        const automationResult = await automationEfficiencyService.processAutomationTask({
          type: 'code-generation',
          priority: 'high',
          complexity: 'high',
          estimatedTokenUsage: 2000,
          estimatedTime: 10,
          automationLevel: 'assisted',
          data: { feature, requirements, analysis: devAnalysis }
        });
        
        result = {
          workflow: 'product-development',
          steps: ['需求分析', '知识增强', '自动化处理'],
          gatewayResult,
          devAnalysis,
          automationResult,
          timestamp: new Date().toISOString()
        };
        break;
      }
        
      case 'finance-monitoring': {
        // 财务监控工作流
        const { period } = parameters || {};
        
        // 模拟财务数据
        const financeData = {
          period: period || 'monthly',
          revenue: Math.random() * 10000 + 5000,
          expenses: Math.random() * 3000 + 1000,
          profit: 0,
          timestamp: new Date().toISOString()
        };
        
        financeData.profit = financeData.revenue - financeData.expenses;
        
        // 知识归档分析
        const archiveResult = await knowledgeEnhancedDevService.analyzeDevTask(
          '财务报告归档',
          financeData
        );
        
        result = {
          workflow: 'finance-monitoring',
          steps: ['数据收集', '分析计算', '知识归档'],
          financeData,
          archiveResult,
          timestamp: new Date().toISOString()
        };
        break;
      }
        
      default:
        return NextResponse.json({
          success: false,
          error: `未知工作流: ${workflow}`,
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
}
