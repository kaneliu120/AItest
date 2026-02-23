/**
 * API标准化示例
 * 使用standardApiHandler包装所有API函数
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api-response';
import { standardApiHandler } from '@/middleware/api-standardizer';

// GET请求示例
export const GET = standardApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    
    // 模拟数据
    const items = Array.from({ length: pageSize }, (_, i) => ({
      id: `item-${(page - 1) * pageSize + i + 1}`,
      name: `项目 ${(page - 1) * pageSize + i + 1}`,
      createdAt: new Date().toISOString(),
    }));
    
    const total = 100;
    
    return paginatedResponse(items, total, page, pageSize, {
      message: '数据获取成功',
      requestId,
    });
    
  } catch (error) {
    console.error('GET API错误:', error);
    
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});

// POST请求示例
export const POST = standardApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return errorResponse('名称不能为空', {
        statusCode: 400,
        requestId,
      });
    }
    
    // 模拟创建操作
    const newItem = {
      id: `item-${Date.now()}`,
      name: body.name,
      createdAt: new Date().toISOString(),
      metadata: {
        source: 'example-api',
        requestId,
        processingTime: 0, // 将由中间件填充
      }
    };
    
    return successResponse(newItem, {
      message: '项目创建成功',
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

// PUT请求示例
export const PUT = standardApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const body = await request.json();
    
    if (!body.id || !body.name) {
      return errorResponse('ID和名称不能为空', {
        statusCode: 400,
        requestId,
      });
    }
    
    // 模拟更新操作
    const updatedItem = {
      id: body.id,
      name: body.name,
      updatedAt: new Date().toISOString(),
      metadata: {
        source: 'example-api',
        requestId,
        processingTime: 0,
      }
    };
    
    return successResponse(updatedItem, {
      message: '项目更新成功',
      requestId,
    });
    
  } catch (error) {
    console.error('PUT API错误:', error);
    
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});

// DELETE请求示例
export const DELETE = standardApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return errorResponse('ID不能为空', {
        statusCode: 400,
        requestId,
      });
    }
    
    // 模拟删除操作
    return successResponse(
      { deleted: true, id },
      {
        message: '项目删除成功',
        requestId,
      }
    );
    
  } catch (error) {
    console.error('DELETE API错误:', error);
    
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});