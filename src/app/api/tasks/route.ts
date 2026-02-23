import { taskService } from '@/lib/task-service';
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { standardApiHandler } from '@/middleware/api-standardizer';

export const GET = standardApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'stats';
    
    if (action === 'stats') {
      const stats = await taskService.getTaskStats();
      return successResponse(stats, {
        message: '任务统计获取成功',
        requestId,
      });
    }
    
    if (action === 'list') {
      const tasks = await taskService.getTasks();
      return successResponse({ tasks }, {
        message: '任务列表获取成功',
        requestId,
      });
    }
    
    // 默认返回统计
    const stats = await taskService.getTaskStats();
    return successResponse(stats, {
      message: '任务统计获取成功',
      requestId,
    });
  } catch (error) {
    console.error('任务API错误:', error);
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
    const action = body.action || 'create-task';
    
    if (action === 'create-task') {
      const { title, description, priority } = body;
      
      if (!title) {
        return errorResponse('缺少任务标题', {
          statusCode: 400,
          requestId,
        });
      }
      
      const task = await taskService.createTask({
        title,
        description: description || '',
        priority: priority || 'medium',
      });
      
      return successResponse(task, {
        message: '任务创建成功',
        requestId,
      });
    }
    
    return errorResponse('不支持的操作', {
      statusCode: 400,
      requestId,
    });
  } catch (error) {
    console.error('任务API POST错误:', error);
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});
