import { NextRequest, NextResponse } from 'next/server';
import { financeStore, getTransactions } from '@/lib/finance-store';
import { getAllTasks } from '@/lib/task-store';

const TASK_TYPE_TO_CATEGORY: Record<string, string> = {
  development: 'Development Cost',
  service: 'serverviceIncome',
  booking: 'Booking Income',
  general: 'Operating Cost',
};

type FinanceTaskAction = 'create-task-transaction';

function validateFinanceTaskPayload(input: unknown):
  | { ok: true; body: { action: FinanceTaskAction; taskId: string; type?: 'income' | 'expense'; amount?: number; description?: string; category?: string } }
  | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Request body must be an object' };
  const body = input as Record<string, unknown>;
  if (body.action !== 'create-task-transaction') return { ok: false, error: 'Unsupported operation' };
  if (typeof body.taskId !== 'string' || !body.taskId.trim()) return { ok: false, error: 'Missing valid taskId' };
  if (body.type !== undefined && body.type !== 'income' && body.type !== 'expense') return { ok: false, error: 'type mustYes income or expense' };
  if (body.amount !== undefined && Number.isNaN(Number(body.amount))) return { ok: false, error: 'amount mustYesNumber' };
  return {
    ok: true,
    body: {
      action: 'create-task-transaction',
      taskId: body.taskId,
      type: body.type as 'income' | 'expense' | undefined,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      category: typeof body.category === 'string' ? body.category : undefined,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const action = new URL(request.url).searchParams.get('action') || 'overview';
    const tasks = await getAllTasks();
    const transactions = await getTransactions();

    if (action === 'overview') {
      const taskWithFinance = tasks.filter((t) => transactions.some((tx) => tx.taskId === t.id)).length;
      return NextResponse.json({
        success: true,
        data: {
          totalTasks: tasks.length,
          tasksWithFinance: taskWithFinance,
          associationRate: tasks.length ? Math.round((taskWithFinance / tasks.length) * 100) : 0,
          summary: {
            totalIncome: transactions.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0),
            totalExpense: transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0),
          },
        },
      });
    }

    if (action === 'task-transactions') {
      const taskId = new URL(request.url).searchParams.get('taskId');
      if (!taskId) return NextResponse.json({ success: false, error: 'Missing  taskId', code: 'VALIDATION_ERROR' }, { status: 400 });
      const task = tasks.find((t) => t.id === taskId) || null;
      const taskTransactions = transactions.filter((tx) => tx.taskId === taskId);
      return NextResponse.json({ success: true, data: { task, transactions: taskTransactions } });
    }

    return NextResponse.json({ success: true, data: { tasks: tasks.length, transactions: transactions.length } });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = validateFinanceTaskPayload(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error, code: 'VALIDATION_ERROR' }, { status: 400 });
    }
    const { taskId, type, amount, description, category } = parsed.body;

    if (parsed.body.action === 'create-task-transaction') {
      const tasks = await getAllTasks();
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return NextResponse.json({ success: false, error: 'Taskdoes not exist' }, { status: 404 });

      const tx = await financeStore.addTransaction({
        date: new Date().toISOString().slice(0, 10),
        type: type || 'expense',
        amount: Number(amount || 0),
        description: description || `Related to Task: ${task.title}`,
        category: category || TASK_TYPE_TO_CATEGORY[task.type] || 'Other',
        currency: 'PHP',
        status: 'completed',
        tags: ['Task-Related'],
        taskId,
      });

      return NextResponse.json({ success: true, data: { transaction: tx } });
    }

    return NextResponse.json({ success: false, error: 'Unsupported operation' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
