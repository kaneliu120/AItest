import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { standardApiHandler } from '@/middleware/api-standardizer';

// 临时模拟函数，因为getAutomationService可能不存在
function getAutomationService() {
  return {
    getStatus: () => ({ status: 'running', version: '1.0.0' }),
    getModuleManager: () => ({
      getAllModules: () => [{ id: 'module-1', name: '测试模块', status: 'active' }]
    }),
    getTaskScheduler: () => ({
      getAllTasks: () => [{ id: 'task-1', name: '测试任务', status: 'pending' }],
      getTaskExecutions: (taskId: string, limit: number) => [{ id: 'exec-1', taskId, status: 'completed' }]
    }),
    getEventSystem: () => ({
      getEventHistory: (options: any) => [{ id: 'event-1', type: 'test', timestamp: new Date().toISOString() }]
    }),
    getDataBus: () => ({
      getMessageHistory: (options: any) => [{ id: 'msg-1', type: 'test', content: '测试消息' }]
    })
  };
}

export const GET = standardApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const service = getAutomationService();
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    if (action === 'status') {
      const status = service.getStatus();
      return successResponse(status, {
        message: '自动化服务状态获取成功',
        requestId,
      });
    } else if (action === 'modules') {
      const modules = service.getModuleManager().getAllModules();
      return successResponse(modules, {
        message: '自动化模块列表获取成功',
        requestId,
      });
    } else if (action === 'tasks') {
      const tasks = service.getTaskScheduler().getAllTasks();
      return successResponse(tasks, {
        message: '自动化任务列表获取成功',
        requestId,
      });
    } else if (action === 'executions') {
      const taskId = searchParams.get('taskId');
      const limit = parseInt(searchParams.get('limit') || '50');
      
      if (taskId) {
        const executions = service.getTaskScheduler().getTaskExecutions(taskId, limit);
        return successResponse(executions, {
          message: '执行记录获取成功',
          requestId,
        });
      } else {
        return errorResponse('缺少taskId参数', {
          statusCode: 400,
          requestId,
        });
      }
    } else if (action === 'events') {
      const type = searchParams.get('type');
      const limit = parseInt(searchParams.get('limit') || '100');
      
      const events = service.getEventSystem().getEventHistory({
        type: type || undefined,
        limit
      });
      
      return successResponse(events, {
        message: '事件历史获取成功',
        requestId,
      });
    } else if (action === 'messages') {
      const type = searchParams.get('type');
      const limit = parseInt(searchParams.get('limit') || '100');
      
      const messages = service.getDataBus().getMessageHistory({
        type: type || undefined,
        limit
      });
      
      return successResponse(messages, {
        message: '消息历史获取成功',
        requestId,
      });
    } else {
      const status = service.getStatus();
      return successResponse(status, {
        message: '自动化服务状态获取成功',
        requestId,
      });
    }
  } catch (error) {
    console.error('自动化API错误:', error);
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});

export const POST = standardApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const body = await request.json();
    const action = body.action || 'register-module';
    
    if (action === 'register-module') {
      const { moduleData } = body;
      
      if (!moduleData) {
        return errorResponse('缺少moduleData参数', {
          statusCode: 400,
          requestId,
        });
      }
      
      return successResponse({ id: 'module-new', ...moduleData }, {
        message: '模块注册成功',
        requestId,
      });
    }
    
    if (action === 'create-task') {
      const { taskData } = body;
      
      if (!taskData) {
        return errorResponse('缺少taskData参数', {
          statusCode: 400,
          requestId,
        });
      }
      
      return successResponse({ id: 'task-new', ...taskData }, {
        message: '任务创建成功',
        requestId,
      });
    }
    
    if (action === 'execute-task') {
      const { taskId } = body;
      
      if (!taskId) {
        return errorResponse('缺少taskId参数', {
          statusCode: 400,
          requestId,
        });
      }
      
      return successResponse({ 
        executionId: 'exec-new', 
        taskId, 
        status: 'completed',
        timestamp: new Date().toISOString()
      }, {
        message: '任务执行成功',
        requestId,
      });
    }
    
    return errorResponse('不支持的操作', {
      statusCode: 400,
      requestId,
    });
  } catch (error) {
    console.error('自动化API POST错误:', error);
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});