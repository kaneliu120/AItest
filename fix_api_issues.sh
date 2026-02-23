#!/bin/bash

echo "开始修复API路由文件..."

# 修复finance/route.ts
echo "修复 finance/route.ts..."
cat > /Users/kane/mission-control/src/app/api/finance/route.ts << 'EOF'
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
EOF

# 修复tasks/route.ts
echo "修复 tasks/route.ts..."
cat > /Users/kane/mission-control/src/app/api/tasks/route.ts << 'EOF'
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
EOF

# 修复testing/route.ts
echo "修复 testing/route.ts..."
cat > /Users/kane/mission-control/src/app/api/testing/route.ts << 'EOF'
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
EOF

echo "API路由文件修复完成！"