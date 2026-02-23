import { testingService } from '@/lib/testing-service';
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { standardApiHandler } from '@/middleware/api-standardizer';

export const GET = standardApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'stats';
    
    if (action === 'stats') {
      const stats = await testingService.getTestStats();
      return successResponse(stats, {
        message: '测试统计获取成功',
        requestId,
      });
    }
    
    if (action === 'test-cases') {
      const testCases = await testingService.getTestCases();
      return successResponse({ testCases }, {
        message: '测试用例获取成功',
        requestId,
      });
    }
    
    // 默认返回统计
    const stats = await testingService.getTestStats();
    return successResponse(stats, {
      message: '测试统计获取成功',
      requestId,
    });
  } catch (error) {
    console.error('测试API错误:', error);
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
    const action = body.action || 'run-test';
    
    if (action === 'run-test') {
      const { testId } = body;
      
      if (!testId) {
        return errorResponse('缺少测试ID', {
          statusCode: 400,
          requestId,
        });
      }
      
      const result = await testingService.runTest(testId);
      return successResponse(result, {
        message: '测试执行完成',
        requestId,
      });
    }
    
    return errorResponse('不支持的操作', {
      statusCode: 400,
      requestId,
    });
  } catch (error) {
    console.error('测试API POST错误:', error);
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});
