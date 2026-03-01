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
        // 财务监控工作流 — 读取真实 CSV 文件
        const { period } = parameters || {};
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');
        const homeDir = os.homedir();
        const financeBase = path.join(homeDir, 'Finance');

        let revenue = 0;
        let expenses = 0;
        let incomeRecords: string[] = [];
        let expenseRecords: string[] = [];

        // 递归读取 CSV 文件
        function readCsvDir(dir: string): number {
          let total = 0;
          if (!fs.existsSync(dir)) return 0;
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              total += readCsvDir(fullPath);
            } else if (entry.name.endsWith('.csv')) {
              const lines = fs.readFileSync(fullPath, 'utf8').split('\n').filter(l => l.trim() && !l.startsWith('Date') && !l.startsWith('YYYY'));
              lines.forEach(l => {
                const parts = l.split(',');
                const amount = parseFloat(parts[2]) || 0;
                if (amount > 0) total += amount;
              });
            }
          }
          return total;
        }

        try {
          revenue = readCsvDir(path.join(financeBase, 'Income'));
          expenses = readCsvDir(path.join(financeBase, 'Expenses'));
          incomeRecords = fs.existsSync(path.join(financeBase, 'Income')) ? ['从 ~/Finance/Income 读取'] : [];
          expenseRecords = fs.existsSync(path.join(financeBase, 'Expenses')) ? ['从 ~/Finance/Expenses 读取'] : [];
        } catch (e) {
          console.error('读取财务文件失败:', e);
        }

        const financeData = {
          period: period || 'all-time',
          revenue,
          expenses,
          profit: revenue - expenses,
          currency: 'PHP',
          dataSource: path.join(homeDir, 'Finance'),
          hasRealData: revenue > 0 || expenses > 0,
          note: revenue === 0 && expenses === 0 ? '财务文件为空，请在 ~/Finance/Income 和 ~/Finance/Expenses 中添加数据' : '真实数据',
          timestamp: new Date().toISOString(),
        };

        result = {
          workflow: 'finance-monitoring',
          steps: ['读取CSV', '汇总计算', '生成报告'],
          financeData,
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
