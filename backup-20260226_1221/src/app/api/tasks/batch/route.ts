/**
 * /api/tasks/batch — 批量操作
 * GET: 返回API信息
 * POST: { action: 'complete' | 'delete' | 'status', ids: string[], status?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { taskStore } from '@/lib/task-store';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      api: 'tasks-batch',
      description: '任务批量操作API',
      methods: ['POST'],
      supportedActions: ['complete', 'delete', 'status'],
      example: {
        method: 'POST',
        body: {
          action: 'complete',
          ids: ['task-1', 'task-2'],
          status: 'completed' // 仅当action='status'时需要
        }
      }
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const { action, ids, status } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: '请提供任务 ID 列表' }, { status: 400 });
    }

    let affected = 0;

    if (action === 'complete') {
      for (const id of ids) {
        const ok = await taskStore.updateTask(id, { status: 'completed' });
        if (ok) affected++;
      }
      return NextResponse.json({ success: true, data: { affected, action: 'complete' } });
    }

    if (action === 'delete') {
      for (const id of ids) {
        const ok = await taskStore.deleteTask(id);
        if (ok) affected++;
      }
      return NextResponse.json({ success: true, data: { affected, action: 'delete' } });
    }

    if (action === 'status' && status) {
      for (const id of ids) {
        const ok = await taskStore.updateTask(id, { status });
        if (ok) affected++;
      }
      return NextResponse.json({ success: true, data: { affected, action: 'status', status } });
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
