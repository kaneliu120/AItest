/**
 * /api/tasks/batch - batch操作
 * GET: 返回APIinformation
 * POST: { action: 'complete' | 'delete' | 'status', ids: string[], status?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { taskStore } from '@/lib/task-store';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      api: 'tasks-batch',
      description: 'Task batch operations API',
      methods: ['POST'],
      supportedActions: ['complete', 'delete', 'status'],
      example: {
        method: 'POST',
        body: {
          action: 'complete',
          ids: ['task-1', 'task-2'],
          status: 'completed' // Required only when action='status'
        }
      }
    }
  });
}

type BatchAction = 'complete' | 'delete' | 'status';

function validateBatchPayload(input: unknown): { ok: true; data: { action: BatchAction; ids: string[]; status?: 'pending' | 'in-progress' | 'completed' | 'cancelled' } } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Request body must be an object' };
  const body = input as Record<string, unknown>;
  const action = body.action;
  const ids = body.ids;
  const status = body.status;

  if (action !== 'complete' && action !== 'delete' && action !== 'status') {
    return { ok: false, error: 'action must be complete | delete | status' };
  }
  if (!Array.isArray(ids) || ids.length === 0 || ids.some((v) => typeof v !== 'string' || !v.trim())) {
    return { ok: false, error: 'ids must be a non-empty string array' };
  }
  if (action === 'status') {
    if (typeof status !== 'string' || !status.trim()) {
      return { ok: false, error: 'status must be provided when action=status' };
    }
    if (!['pending','in-progress','completed','cancelled'].includes(status)) {
      return { ok: false, error: 'Invalid status value' };
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

    return NextResponse.json({ success: false, error: 'Unknown operation' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
