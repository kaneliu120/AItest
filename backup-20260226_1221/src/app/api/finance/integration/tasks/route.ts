/**
 * /api/finance/integration/tasks
 * 财务系统与任务管理系统集成 API
 * 功能: 任务成本跟踪、收入关联、财务分析
 */
import { NextRequest, NextResponse } from 'next/server';
import { getTransactions, getStats } from '@/lib/finance-store';
import { getAllTasks } from '@/lib/task-store';

// 任务类型到财务类别的映射
const TASK_TYPE_TO_CATEGORY: Record<string, string> = {
  'development': '开发成本',
  'service': '服务收入',
  'booking': '预约收入',
  'general': '运营成本',
};

// 任务状态到财务状态的映射
const TASK_STATUS_TO_FINANCE: Record<string, string> = {
  'completed': 'completed',
  'in-progress': 'pending',
  'pending': 'pending',
  'cancelled': 'cancelled',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'overview';

  try {
    // ── 概览: 任务财务关联统计 ──
    if (action === 'overview') {
      const tasks = getAllTasks();
      const transactions = getTransactions();
      
      // 统计关联情况
      const taskWithFinance = tasks.filter(t => 
        transactions.some(tx => tx.taskId === t.id)
      ).length;
      
      // 按任务类型统计财务
      const financeByTaskType: Record<string, { income: number; expense: number; count: number }> = {};
      
      tasks.forEach(task => {
        const type = task.type || 'general';
        if (!financeByTaskType[type]) {
          financeByTaskType[type] = { income: 0, expense: 0, count: 0 };
        }
        financeByTaskType[type].count++;
        
        // 查找关联的财务交易
        const relatedTransactions = transactions.filter(tx => tx.taskId === task.id);
        relatedTransactions.forEach(tx => {
          if (tx.type === 'income') {
            financeByTaskType[type].income += tx.amount;
          } else {
            financeByTaskType[type].expense += tx.amount;
          }
        });
      });

      return NextResponse.json({
        success: true,
        data: {
          totalTasks: tasks.length,
          tasksWithFinance: taskWithFinance,
          associationRate: tasks.length > 0 ? Math.round((taskWithFinance / tasks.length) * 100) : 0,
          financeByTaskType,
          summary: {
            totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
            totalExpense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
            taskRelatedIncome: transactions.filter(t => t.type === 'income' && t.taskId).reduce((sum, t) => sum + t.amount, 0),
            taskRelatedExpense: transactions.filter(t => t.type === 'expense' && t.taskId).reduce((sum, t) => sum + t.amount, 0),
          },
        },
      });
    }

    // ── 开发任务成本分析 ──
    if (action === 'dev-cost-analysis') {
      const allTasks = getAllTasks();
      const devTasks = allTasks.filter(task => task.type === 'development');
      const transactions = getTransactions();
      
      const analysis = devTasks.map(task => {
        const relatedTransactions = transactions.filter(tx => tx.taskId === task.id);
        const totalCost = relatedTransactions
          .filter(tx => tx.type === 'expense')
          .reduce((sum, tx) => sum + tx.amount, 0);
        const totalRevenue = relatedTransactions
          .filter(tx => tx.type === 'income')
          .reduce((sum, tx) => sum + tx.amount, 0);
        
        return {
          taskId: task.id,
          taskTitle: task.title,
          taskStatus: task.status,
          taskPriority: task.priority,
          totalCost,
          totalRevenue,
          profit: totalRevenue - totalCost,
          profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
          transactionCount: relatedTransactions.length,
          createdAt: task.createdAt,
        };
      });

      // 总体统计
      const totalCost = analysis.reduce((sum, a) => sum + a.totalCost, 0);
      const totalRevenue = analysis.reduce((sum, a) => sum + a.totalRevenue, 0);
      const avgProfitMargin = analysis.length > 0 
        ? analysis.reduce((sum, a) => sum + a.profitMargin, 0) / analysis.length 
        : 0;

      return NextResponse.json({
        success: true,
        data: {
          analysis,
          summary: {
            totalDevTasks: devTasks.length,
            totalCost,
            totalRevenue,
            totalProfit: totalRevenue - totalCost,
            avgProfitMargin: Math.round(avgProfitMargin * 100) / 100,
            tasksWithCost: analysis.filter(a => a.totalCost > 0).length,
            tasksWithRevenue: analysis.filter(a => a.totalRevenue > 0).length,
          },
        },
      });
    }

    // ── 获取任务关联的财务交易 ──
    if (action === 'task-transactions') {
      const taskId = searchParams.get('taskId');
      if (!taskId) {
        return NextResponse.json({ success: false, error: '缺少 taskId 参数' }, { status: 400 });
      }

      const transactions = getTransactions();
      const taskTransactions = transactions.filter(tx => tx.taskId === taskId);
      
      // 获取任务信息
      const tasks = getAllTasks();
      const task = tasks.find(t => t.id === taskId);

      return NextResponse.json({
        success: true,
        data: {
          task: task || null,
          transactions: taskTransactions,
          summary: {
            totalIncome: taskTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
            totalExpense: taskTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
            net: taskTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) -
                 taskTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
          },
        },
      });
    }

    return NextResponse.json({ success: false, error: '不支持的操作' }, { status: 400 });

  } catch (error) {
    console.error('财务任务集成API错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // ── 为任务创建财务记录 ──
    if (action === 'create-task-transaction') {
      const { taskId, type, amount, description, category, date } = body;
      
      if (!taskId || !type || !amount || !description) {
        return NextResponse.json({ 
          success: false, 
          error: '缺少必要参数: taskId, type, amount, description' 
        }, { status: 400 });
      }

      // 验证任务存在
      const tasks = getAllTasks();
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 });
      }

      // 自动确定类别（如果未提供）
      const autoCategory = category || TASK_TYPE_TO_CATEGORY[task.type] || '其他';
      
      // 自动确定状态
      const autoStatus = TASK_STATUS_TO_FINANCE[task.status] || 'completed';

      const transaction = financeStore.addTransaction({
        date: date || new Date().toISOString().split('T')[0],
        type: type as 'income' | 'expense',
        category: autoCategory,
        description: description,
        amount: Number(amount),
        currency: 'PHP',
        status: autoStatus,
        tags: ['任务关联', task.type || 'general', ...(task.tags || [])],
        taskId,
        metadata: {
          taskTitle: task.title,
          taskType: task.type,
          taskStatus: task.status,
          taskPriority: task.priority,
          autoGenerated: !category, // 标记是否自动生成类别
        },
      });

      return NextResponse.json({
        success: true,
        data: { transaction },
        message: '任务财务记录创建成功',
      });
    }

    // ── 批量关联任务财务 ──
    if (action === 'batch-associate') {
      const { taskIds, transactionType, defaultCategory } = body;
      
      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return NextResponse.json({ success: false, error: '缺少任务ID列表' }, { status: 400 });
      }

      const tasks = getAllTasks();
      const results = [];

      for (const taskId of taskIds) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
          results.push({ taskId, success: false, error: '任务不存在' });
          continue;
        }

        try {
          const transaction = financeStore.addTransaction({
            date: new Date().toISOString().split('T')[0],
            type: transactionType || 'expense',
            category: defaultCategory || TASK_TYPE_TO_CATEGORY[task.type] || '其他',
            description: `任务关联: ${task.title}`,
            amount: 0, // 默认金额为0，需要后续更新
            currency: 'PHP',
            status: TASK_STATUS_TO_FINANCE[task.status] || 'pending',
            tags: ['任务关联', '批量创建', task.type || 'general'],
            taskId,
            metadata: {
              taskTitle: task.title,
              taskType: task.type,
              taskStatus: task.status,
              batchOperation: true,
              needsAmountUpdate: true, // 标记需要更新金额
            },
          });

          results.push({ taskId, success: true, transactionId: transaction.id });
        } catch (error) {
          results.push({ taskId, success: false, error: error instanceof Error ? error.message : '创建失败' });
        }
      }

      const successCount = results.filter(r => r.success).length;
      
      return NextResponse.json({
        success: true,
        data: { results },
        summary: {
          total: taskIds.length,
          success: successCount,
          failed: taskIds.length - successCount,
          successRate: Math.round((successCount / taskIds.length) * 100),
        },
      });
    }

    return NextResponse.json({ success: false, error: '不支持的操作' }, { status: 400 });

  } catch (error) {
    console.error('财务任务集成API POST错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}