import { NextRequest, NextResponse } from 'next/server';
import { automationEfficiencyService, AutomationTask } from '@/lib/automation-efficiency-service';

// 生成任务ID
function generateTaskId(): string {
  return `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET: 获取服务状态和报告
export async function GET(request: NextRequest) {
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
          timestamp: new Date().toISOString()
        });
        
      case 'report':
        // 获取性能报告
        const report = automationEfficiencyService.getPerformanceReport();
        return NextResponse.json({
          success: true,
          data: report,
          timestamp: new Date().toISOString()
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
          timestamp: new Date().toISOString()
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
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: `未知操作: ${action}`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    console.error('自动化效率API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST: 处理自动化任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (!action) {
      return NextResponse.json({
        success: false,
        error: '缺少 action 参数',
        timestamp: new Date().toISOString()
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
          estimatedTime = 30, // 分钟
          automationLevel = 'assisted'
        } = body;
        
        if (!type) {
          return NextResponse.json({
            success: false,
            error: '缺少 type 参数',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        const task: Omit<AutomationTask, 'id' | 'status'> = {
          type: type as any,
          priority: priority as any,
          complexity: complexity as any,
          estimatedTokenUsage: parseInt(estimatedTokenUsage) || 1000,
          estimatedTime: parseInt(estimatedTime) || 30,
          automationLevel: automationLevel as any
        };
        
        // 如果有描述，添加到上下文
        if (description) {
          (task as any).description = description;
        }
        
        const processedTask = await automationEfficiencyService.processAutomationTask(task);
        
        return NextResponse.json({
          success: true,
          data: {
            task: processedTask,
            metrics: processedTask.metrics,
            optimizationStatus: automationEfficiencyService.getServiceStatus().optimizationStatus
          },
          timestamp: new Date().toISOString()
        });
        
      case 'process-batch':
        // 批量处理任务
        const { tasks } = body;
        
        if (!Array.isArray(tasks) || tasks.length === 0) {
          return NextResponse.json({
            success: false,
            error: '缺少有效的 tasks 数组',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        // 限制批量大小
        const limitedTasks = tasks.slice(0, 10).map((t: any, index: number) => ({
          type: t.type || 'code-generation',
          priority: t.priority || 'medium',
          complexity: t.complexity || 'medium',
          estimatedTokenUsage: t.estimatedTokenUsage || 1000,
          estimatedTime: t.estimatedTime || 30,
          automationLevel: t.automationLevel || 'assisted',
          description: t.description || `批量任务 ${index + 1}`
        }));
        
        const batchResults = await automationEfficiencyService.processBatchTasks(limitedTasks);
        
        // 计算统计
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
          timestamp: new Date().toISOString()
        });
        
      case 'initialize':
        // 初始化服务
        await automationEfficiencyService.initialize();
        
        return NextResponse.json({
          success: true,
          data: {
            message: '自动化效率优化服务初始化完成',
            status: automationEfficiencyService.getServiceStatus()
          },
          timestamp: new Date().toISOString()
        });
        
      case 'reset':
        // 重置服务
        await automationEfficiencyService.resetService();
        
        return NextResponse.json({
          success: true,
          data: {
            message: '自动化效率优化服务已重置',
            status: automationEfficiencyService.getServiceStatus()
          },
          timestamp: new Date().toISOString()
        });
        
      case 'test-optimization':
        // 测试优化效果
        const testTasks = [
          {
            type: 'code-generation',
            priority: 'medium',
            complexity: 'medium',
            description: '创建一个用户登录表单组件',
            estimatedTokenUsage: 1500,
            estimatedTime: 45,
            automationLevel: 'full'
          },
          {
            type: 'api-design',
            priority: 'high',
            complexity: 'medium',
            description: '设计用户管理REST API',
            estimatedTokenUsage: 2000,
            estimatedTime: 60,
            automationLevel: 'assisted'
          },
          {
            type: 'optimization',
            priority: 'medium',
            complexity: 'low',
            description: '优化数据库查询性能',
            estimatedTokenUsage: 800,
            estimatedTime: 30,
            automationLevel: 'full'
          }
        ];
        
        const testResults = await automationEfficiencyService.processBatchTasks(testTasks as any);
        
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
          timestamp: new Date().toISOString()
        });
        
      case 'simulate-workload':
        // 模拟工作负载
        const { taskCount = 5 } = body;
        
        const simulatedTasks = Array.from({ length: Math.min(taskCount, 20) }, (_, i) => ({
          type: ['code-generation', 'api-design', 'testing', 'optimization'][i % 4] as any,
          priority: ['low', 'medium', 'high'][i % 3] as any,
          complexity: ['low', 'medium', 'high'][i % 3] as any,
          description: `模拟任务 ${i + 1}: ${['创建组件', '设计API', '编写测试', '性能优化'][i % 4]}`,
          estimatedTokenUsage: 1000 + Math.random() * 1000,
          estimatedTime: 30 + Math.random() * 60,
          automationLevel: ['manual', 'assisted', 'full'][i % 3] as any
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
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: `未知操作: ${action}`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    console.error('自动化效率API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}