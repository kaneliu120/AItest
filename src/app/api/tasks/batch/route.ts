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

type BatchAction = 'complete' | 'delete' | 'status';

function validateBatchPayload(input: unknown): { ok: true; data: { action: BatchAction; ids: string[]; status?: 'pending' | 'in-progress' | 'completed' | 'cancelled' } } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: '请求体必须是对象' };
  const body = input as Record<string, unknown>;
  const action = body.action;
  const ids = body.ids;
  const status = body.status;

  if (action !== 'complete' && action !== 'delete' && action !== 'status') {
    return { ok: false, error: 'action 必须是 complete | delete | status' };
  }
  if (!Array.isArray(ids) || ids.length === 0 || ids.some((v) => typeof v !== 'string' || !v.trim())) {
    return { ok: false, error: 'ids 必须是非空字符串数组' };
  }
  if (action === 'status') {
    if (typeof status !== 'string' || !status.trim()) {
      return { ok: false, error: 'action=status 时必须提供 status' };
    }
    if (!['pending','in-progress','completed','cancelled'].includes(status)) {
      return { ok: false, error: 'status 非法' };
    }
  }

  return { ok: true, data: { action, ids, status: typeof status === 'string' ? (status as 'pending' | 'in-progress' | 'completed' | 'cancelled') : undefined } };
}

export async function POST(request: NextRequest) {
  try {
    const parsed = validateBatchPayload(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error, code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const { action, ids, status } = parsed.data;

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
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : '未知错误' }, { status: 500 });
  }
}
