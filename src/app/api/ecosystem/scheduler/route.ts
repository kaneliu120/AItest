import { ecosystemService } from '@/lib/ecosystem-service';
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { standardApiHandler } from '@/middleware/api-standardizer';

export const GET = standardApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const stats = await ecosystemService.getSchedulerStats();
    
    return successResponse(stats, {
      message: '任务调度统计获取成功',
      requestId,
    });
  } catch (error) {
    console.error('任务调度器API错误:', error);
    
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
    const action = body.action || 'stats';
    
    if (action === 'stats') {
      const stats = await ecosystemService.getSchedulerStats();
      
      return successResponse(stats, {
        message: '任务调度统计获取成功',
        requestId,
      });
    }
    
    if (action === 'simulate-task') {
      // 模拟任务执行
      const taskResult = {
        id: `task-${Date.now()}`,
        name: body.name || '模拟任务',
        status: 'completed',
        result: 'success',
        duration: Math.floor(Math.random() * 5000) + 1000,
        timestamp: new Date().toISOString(),
      };
      
      return successResponse(taskResult, {
        message: '任务模拟执行成功',
        requestId,
      });
    }
    
    return errorResponse('不支持的操作', {
      statusCode: 400,
      requestId,
    });
  } catch (error) {
    console.error('POST API错误:', error);
    
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});

