import { NextRequest, NextResponse } from 'next/server';
import { workflowCoordinator, PredefinedWorkflows } from '@/lib/workflow-coordinator';

// 成功响应
function successResponse(data: any, meta?: any) {
  return NextResponse.json({
    success: true,
    data,
    meta,
    timestamp: new Date().toISOString()
  });
}

// 错误响应
function errorResponse(message: string, status = 500) {
  return NextResponse.json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  }, { status });
}

// GET: 获取工作流列表或状态
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'list';
    
    switch (action) {
      case 'list':
        // 获取所有工作流定义
        const workflows = workflowCoordinator.getAllWorkflows();
        return successResponse({
          workflows,
          total: workflows.length,
          predefined: Object.values(PredefinedWorkflows).length
        });
        
      case 'status':
        // 获取工作流状态（简化版）
        const status = url.searchParams.get('status') || 'all';
        let instances: any[] = [];
        
        if (status === 'running') {
          // 模拟运行中的实例
          instances = [
            {
              id: 'workflow-evening-proactive-123',
              workflowId: 'evening-proactive',
              status: 'running',
              progress: 45,
              startedAt: new Date(Date.now() - 300000).toISOString(),
              currentStep: 'execute-action'
            }
          ];
        } else {
          // 模拟所有实例
          instances = [
            {
              id: 'workflow-evening-proactive-123',
              workflowId: 'evening-proactive',
              status: 'running',
              progress: 45,
              startedAt: new Date(Date.now() - 300000).toISOString(),
              currentStep: 'execute-action'
            },
            {
              id: 'workflow-finance-weekly-report-456',
              workflowId: 'finance-weekly-report',
              status: 'completed',
              progress: 100,
              startedAt: new Date(Date.now() - 86400000).toISOString(),
              completedAt: new Date(Date.now() - 82800000).toISOString()
            }
          ];
        }
        
        return successResponse({
          instances,
          total: instances.length,
          running: instances.filter(i => i.status === 'running').length
        });
        
      default:
        return errorResponse(`未知操作: ${action}`, 400);
    }
  } catch (error) {
    console.error('工作流API错误:', error);
    return errorResponse(error instanceof Error ? error.message : '未知错误');
  }
}

// POST: 管理工作流
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, workflowId, parameters } = body;
    
    if (!action) {
      return errorResponse('缺少 action 参数', 400);
    }
    
    switch (action) {
      case 'start':
        if (!workflowId) {
          return errorResponse('缺少 workflowId 参数', 400);
        }
        
        const instanceId = await workflowCoordinator.startWorkflow(workflowId, parameters);
        return successResponse({
          instanceId,
          message: `工作流启动成功: ${workflowId}`
        });
        
      case 'stop':
        const { instanceId: stopInstanceId } = body;
        if (!stopInstanceId) {
          return errorResponse('缺少 instanceId 参数', 400);
        }
        
        const stopped = await workflowCoordinator.stopWorkflow(stopInstanceId);
        return successResponse({
          stopped,
          message: stopped ? '工作流停止成功' : '工作流停止失败'
        });
        
      case 'register':
        const { workflow } = body;
        if (!workflow || !workflow.id || !workflow.name) {
          return errorResponse('缺少工作流定义', 400);
        }
        
        workflowCoordinator.registerWorkflow(workflow);
        return successResponse({
          workflowId: workflow.id,
          message: '工作流注册成功'
        });
        
      default:
        return errorResponse(`未知操作: ${action}`, 400);
    }
  } catch (error) {
    console.error('工作流API错误:', error);
    return errorResponse(error instanceof Error ? error.message : '未知错误');
  }
}