import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const taskId = String(body?.taskId || '').trim();
    const action = String(body?.action || '').trim();
    if (!taskId || !action) return NextResponse.json({ success: false, error: 'taskId/action Required' }, { status: 400 });

    const call = async (endpoint: string, payload: any = {}) => {
      const res = await fetch(`http://localhost:3001/api/task-hierarchy/${taskId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) throw new Error(json?.error || `${endpoint} failed`);
      return json;
    };

    if (action === 'set-troubleshooting') {
      const out = await call('set-troubleshooting');
      return NextResponse.json({ success: true, data: out.data });
    }

    if (action === 'invoice') {
      const out = await call('invoice', { actor: 'ops-alert-action' });
      return NextResponse.json({ success: true, data: out.data });
    }

    return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 400 });
  }
}
