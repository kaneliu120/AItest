import { NextRequest, NextResponse } from 'next/server';
import { unifiedGatewayService } from '@/lib/unified-gateway-service';
import { intelligentTaskDispatcher } from '@/lib/intelligent-task-dispatcher';
import { knowledgeEnhancedDevService } from '@/lib/knowledge-enhanced-dev-service';
import { automationEfficiencyService } from '@/lib/automation-efficiency-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  // Deprecated: use /api/workflows (POST action=trigger) or /api/v5/automation for automation tasks.
  // This endpoint is kept for backwards compatibility with business-integration-dashboard.
  const deprecationHeaders = {
    'Deprecation': 'true',
    'Link': '</api/workflows>; rel="successor-version"',
  };
  try {
    const body = await request.json();
    const { workflow, parameters } = body;
    
    if (!workflow) {
      return NextResponse.json({
        success: false,
        error: 'Missing workflow parameter',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    let result;
    
    switch (workflow) {
      case 'outsource-project': {
        // Freelance project management workflow
        const { projectTitle, budget, deadline } = parameters || {};
        
        // 1. Knowledge-enhanced analysis
        const analysis = await knowledgeEnhancedDevService.analyzeDevTask(
          `Freelance project: ${projectTitle}`,
          { budget, deadline }
        );
        
        // 2. Intelligent task dispatch
        const dispatch = await intelligentTaskDispatcher.dispatchTask({
          id: `workflow-${Date.now()}`,
          query: `Manage outsourcing project: ${projectTitle}`,
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
          steps: ['Knowledge analysis', 'Task dispatch', 'Efficiency optimization'],
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
          query: `Develop feature: ${feature}`,
          context: { requirements },
          priority: 'high'
        });
        
        // 2. 知识增强分析
        const devAnalysis = await knowledgeEnhancedDevService.analyzeDevTask(
          `Develop ${feature}`,
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
          steps: ['Requirements analysis', 'Knowledge enhancement', 'Automated processing'],
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
          incomeRecords = fs.existsSync(path.join(financeBase, 'Income')) ? ['Read from ~/Finance/Income'] : [];
          expenseRecords = fs.existsSync(path.join(financeBase, 'Expenses')) ? ['Read from ~/Finance/Expenses'] : [];
        } catch (e) {
          console.error('Failed to read finance files:', e);
        }

        const financeData = {
          period: period || 'all-time',
          revenue,
          expenses,
          profit: revenue - expenses,
          currency: 'PHP',
          dataSource: path.join(homeDir, 'Finance'),
          hasRealData: revenue > 0 || expenses > 0,
          note: revenue === 0 && expenses === 0 ? 'Finance files empty, please add data in ~/Finance/Income and ~/Finance/Expenses' : 'Real data',
          timestamp: new Date().toISOString(),
        };

        result = {
          workflow: 'finance-monitoring',
          steps: ['Read CSV', 'Aggregate calculation', 'Generate report'],
          financeData,
          timestamp: new Date().toISOString()
        };
        break;
      }
        
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown workflow: ${workflow}`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Business workflow API error', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
