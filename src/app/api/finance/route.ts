import { financeService } from '@/lib/finance-service';
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { standardApiHandler } from '@/middleware/api-standardizer';

export const GET = standardApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'stats';
    
    if (action === 'stats') {
      const stats = await financeService.getFinancialStats();
      return successResponse(stats, {
        message: '财务统计获取成功',
        requestId,
      });
    }
    
    if (action === 'transactions') {
      const transactions = await financeService.getRecentTransactions();
      return successResponse({ transactions }, {
        message: '交易记录获取成功',
        requestId,
      });
    }
    
    // 默认返回统计
    const stats = await financeService.getFinancialStats();
    return successResponse(stats, {
      message: '财务统计获取成功',
      requestId,
    });
  } catch (error) {
    console.error('财务API错误:', error);
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
    const action = body.action || 'add-transaction';
    
    if (action === 'add-transaction') {
      const { type, amount, description, category } = body;
      
      if (!type || !amount || !description) {
        return errorResponse('缺少必要参数', {
          statusCode: 400,
          requestId,
        });
      }
      
      const transaction = await financeService.addTransaction({
        type,
        amount,
        description,
        category: category || '其他',
        date: new Date().toISOString().split('T')[0],
        currency: 'PHP',
        status: 'completed',
        tags: [],
      });
      
      return successResponse(transaction, {
        message: '交易添加成功',
        requestId,
      });
    }
    
    return errorResponse('不支持的操作', {
      statusCode: 400,
      requestId,
    });
  } catch (error) {
    console.error('财务API POST错误:', error);
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});
