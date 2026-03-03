import { NextRequest, NextResponse } from 'next/server';
import { automationEfficiencyService, AutomationTask } from '@/lib/automation-efficiency-service';
import { logger } from '@/lib/logger';
import { makeRequestId, logApiStart, logApiEnd, logApiError } from '@/lib/observability';

// 生成任务ID
function generateTaskId(): string {
  return `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET: 获取服务状态和报告
export async function GET(request: NextRequest) {
  const requestId = makeRequestId('api');
  logApiStart(request.nextUrl.pathname, requestId, { method: 'GET' });
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'status';
    
    switch (action) {
      case 'status':
        // 获取服务状态
        const status = automationEfficiencyService.getServiceStatus();
        return NextResponse.json({
          success: true,
          data: status,
          timestamp: new Date().toISOString(),
          requestId,
        });
        
      case 'report':
        // 获取性能报告
        const report = automationEfficiencyService.getPerformanceReport();
        return NextResponse.json({
          success: true,
          data: report,
          timestamp: new Date().toISOString(),
        });
        
      case 'metrics':
        // 获取详细指标
        const statusData = automationEfficiencyService.getServiceStatus();
        return NextResponse.json({
          success: true,
          data: {
            metrics: statusData.metrics,
            optimizationStatus: statusData.optimizationStatus,
            performance: statusData.performance
          },
          timestamp: new Date().toISOString(),
        });
        
      case 'recommendations':
        // 获取优化建议
        const statusWithRecs = automationEfficiencyService.getServiceStatus();
        return NextResponse.json({
          success: true,
          data: {
            recommendations: statusWithRecs.recommendations || [],
            optimizationStatus: statusWithRecs.optimizationStatus
          },
          timestamp: new Date().toISOString(),
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          timestamp: new Date().toISOString(),
          requestId,
        }, { status: 400 });
    }
  } catch (error) {
    logApiError('api/v5/automation', requestId, error);
    logger.error('Automation efficiency API error', error, { module: 'api/v5/automation', requestId });
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      requestId,
    }, { status: 500 });
  }
}

// POST: 处理自动化任务
export async function POST(request: NextRequest) {
  const requestId = makeRequestId('api');
  logApiStart(request.nextUrl.pathname, requestId, { method: 'POST' });
  try {
    const body = await request.json();
    const { action } = body;
    
    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Missing action parameter',
        timestamp: new Date().toISOString(),
        requestId,
      }, { status: 400 });
    }
    
    switch (action) {
      case 'process-task':
        // 处理单个自动化任务
        const { 
          type, 
          priority = 'medium', 
          complexity = 'medium',
          description,
          estimatedTokenUsage = 1000,
          estimatedTime = 30, // minutes
          automationLevel = 'assisted'
        } = body;
        
        if (!type) {
          return NextResponse.json({
            success: false,
            error: 'Missing type parameter',
            timestamp: new Date().toISOString(),
            requestId,
          }, { status: 400 });
        }
        
        const task: Omit<AutomationTask, 'id' | 'status'> = {
          type: type as AutomationTask['type'],
          priority: priority as AutomationTask['priority'],
          complexity: complexity as AutomationTask['complexity'],
          estimatedTokenUsage: parseInt(estimatedTokenUsage) || 1000,
          estimatedTime: parseInt(estimatedTime) || 30,
          automationLevel: automationLevel as AutomationTask['automationLevel']
        };
        
        // 如果有描述，添加到上下文
        if (description) {
          task.data = { ...(task.data || {}), description };
        }
        
        const processedTask = await automationEfficiencyService.processAutomationTask(task);
        
        return NextResponse.json({
          success: true,
          data: {
            task: processedTask,
            metrics: processedTask.metrics,
            optimizationStatus: automationEfficiencyService.getServiceStatus().optimizationStatus
          },
          timestamp: new Date().toISOString(),
        });
        
      case 'process-batch':
        // 批量处理任务
        const { tasks } = body;
        
        if (!Array.isArray(tasks) || tasks.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Missing valid tasks array',
            timestamp: new Date().toISOString(),
            requestId,
          }, { status: 400 });
        }
        
        // Limit batch size
        const limitedTasks: Array<Omit<AutomationTask, 'id' | 'status'>> = tasks.slice(0, 10).map((t: Record<string, unknown>, index: number) => ({
          type: (t.type as AutomationTask['type']) || 'code-generation',
          priority: (t.priority as AutomationTask['priority']) || 'medium',
          complexity: (t.complexity as AutomationTask['complexity']) || 'medium',
          estimatedTokenUsage: Number(t.estimatedTokenUsage ?? 1000),
          estimatedTime: Number(t.estimatedTime ?? 30),
          automationLevel: (t.automationLevel as AutomationTask['automationLevel']) || 'assisted',
          data: { description: String(t.description ?? `Batch task ${index + 1}`) }
        }));
        
        const batchResults = await automationEfficiencyService.processBatchTasks(limitedTasks);
        
        // Calculate statistics
        const completed = batchResults.filter(r => r.status === 'completed').length;
        const totalTokenSavings = batchResults
          .filter(r => r.status === 'completed' && r.metrics)
          .reduce((sum, r) => sum + (r.metrics?.tokenSavings || 0), 0);
        
        const totalTimeSavings = batchResults
          .filter(r => r.status === 'completed' && r.metrics)
          .reduce((sum, r) => sum + (r.metrics?.timeSavings || 0), 0);
        
        const avgQuality = batchResults
          .filter(r => r.status === 'completed' && r.metrics)
          .reduce((sum, r) => sum + (r.metrics?.qualityScore || 0), 0) / Math.max(1, completed);
        
        return NextResponse.json({
          success: true,
          data: {
            total: batchResults.length,
            completed,
            successRate: `${((completed / batchResults.length) * 100).toFixed(1)}%`,
            totalTokenSavings: totalTokenSavings.toFixed(0),
            totalTimeSavings: totalTimeSavings.toFixed(2),
            averageQuality: avgQuality.toFixed(3),
            results: batchResults.map(r => ({
              id: r.id,
              type: r.type,
              status: r.status,
              metrics: r.metrics
            }))
          },
          timestamp: new Date().toISOString(),
        });
        
      case 'initialize':
        // 初始化服务
        await automationEfficiencyService.initialize();
        
        return NextResponse.json({
          success: true,
          data: {
            message: 'Automation efficiency service initialized',
            status: automationEfficiencyService.getServiceStatus()
          },
          timestamp: new Date().toISOString(),
        });
        
      case 'reset':
        // 重置服务
        await automationEfficiencyService.resetService();
        
        return NextResponse.json({
          success: true,
          data: {
            message: 'Automation efficiency service reset',
            status: automationEfficiencyService.getServiceStatus()
          },
          timestamp: new Date().toISOString(),
        });
        
      case 'test-optimization':
        // 测试优化效果
        const testTasks = [
          {
            type: 'code-generation',
            priority: 'medium',
            complexity: 'medium',
            description: 'Create a user login form component',
            estimatedTokenUsage: 1500,
            estimatedTime: 45,
            automationLevel: 'full'
          },
          {
            type: 'api-design',
            priority: 'high',
            complexity: 'medium',
            description: 'Design a user management REST API',
            estimatedTokenUsage: 2000,
            estimatedTime: 60,
            automationLevel: 'assisted'
          },
          {
            type: 'optimization',
            priority: 'medium',
            complexity: 'low',
            description: 'Optimize database query performance',
            estimatedTokenUsage: 800,
            estimatedTime: 30,
            automationLevel: 'full'
          }
        ];
        
        const testResults = await automationEfficiencyService.processBatchTasks(testTasks as Array<Omit<AutomationTask, 'id' | 'status'>>);
        
        const testCompleted = testResults.filter(r => r.status === 'completed').length;
        const testTokenSavings = testResults
          .filter(r => r.status === 'completed' && r.metrics)
          .reduce((sum, r) => sum + (r.metrics?.tokenSavings || 0), 0);
        
        const testTimeSavings = testResults
          .filter(r => r.status === 'completed' && r.metrics)
          .reduce((sum, r) => sum + (r.metrics?.timeSavings || 0), 0);
        
        const serviceStatus = automationEfficiencyService.getServiceStatus();
        
        return NextResponse.json({
          success: true,
          data: {
            testSummary: {
              totalTasks: testTasks.length,
              completedTasks: testCompleted,
              successRate: `${((testCompleted / testTasks.length) * 100).toFixed(1)}%`,
              totalTokenSavings: testTokenSavings.toFixed(0),
              totalTimeSavings: testTimeSavings.toFixed(2),
              estimatedCostSavings: `$${(testTokenSavings * 0.002 / 1000 + testTimeSavings * 50).toFixed(2)}`
            },
            optimizationProgress: {
              tokenReduction: serviceStatus.optimizationStatus.currentTokenReduction,
              efficiencyGain: serviceStatus.optimizationStatus.currentEfficiencyGain,
              onTrack: serviceStatus.optimizationStatus.onTrack
            },
            recommendations: serviceStatus.recommendations || []
          },
          timestamp: new Date().toISOString(),
        });
        
      case 'simulate-workload':
        // 模拟工作负载
        const { taskCount = 5 } = body;
        
        const simulatedTasks = Array.from({ length: Math.min(taskCount, 20) }, (_, i) => ({
          type: ['code-generation', 'api-design', 'testing', 'optimization'][i % 4] as AutomationTask['type'],
          priority: ['low', 'medium', 'high'][i % 3] as AutomationTask['priority'],
          complexity: ['low', 'medium', 'high'][i % 3] as AutomationTask['complexity'],
          description: `Mock task ${i + 1}: ${['Create component', 'Design API', 'Write tests', 'Performance optimization'][i % 4]}`,
          estimatedTokenUsage: 1000 + (i * 200),  // deterministic estimate
          estimatedTime: 30 + (i * 10),  // deterministic estimate
          automationLevel: ['manual', 'assisted', 'full'][i % 3] as AutomationTask['automationLevel']
        }));
        
        const simulationResults = await automationEfficiencyService.processBatchTasks(simulatedTasks);
        
        const simCompleted = simulationResults.filter(r => r.status === 'completed').length;
        const totalEstimatedTokens = simulatedTasks.reduce((sum, t) => sum + t.estimatedTokenUsage, 0);
        const totalActualTokens = simulationResults
          .filter(r => r.status === 'completed' && r.metrics)
          .reduce((sum, r) => sum + (r.metrics?.actualTokenUsage || 0), 0);
        
        const tokenReductionRate = totalEstimatedTokens > 0 ? 
          ((totalEstimatedTokens - totalActualTokens) / totalEstimatedTokens) * 100 : 0;
        
        return NextResponse.json({
          success: true,
          data: {
            simulation: {
              taskCount: simulatedTasks.length,
              completedCount: simCompleted,
              successRate: `${((simCompleted / simulatedTasks.length) * 100).toFixed(1)}%`,
              estimatedTokens: totalEstimatedTokens.toFixed(0),
              actualTokens: totalActualTokens.toFixed(0),
              tokenReduction: `${tokenReductionRate.toFixed(1)}%`,
              targetReduction: '70%',
              onTarget: tokenReductionRate >= 70
            },
            detailedResults: simulationResults.map(r => ({
              id: r.id,
              type: r.type,
              status: r.status,
              tokenSavings: r.metrics?.tokenSavings?.toFixed(0) || '0',
              timeSavings: r.metrics?.timeSavings?.toFixed(2) || '0.00'
            }))
          },
          timestamp: new Date().toISOString(),
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          timestamp: new Date().toISOString(),
          requestId,
        }, { status: 400 });
    }
  } catch (error) {
    logApiError('api/v5/automation', requestId, error);
    logger.error('Automation efficiency API error', error, { module: 'api/v5/automation', requestId });
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      requestId,
    }, { status: 500 });
  }
}
