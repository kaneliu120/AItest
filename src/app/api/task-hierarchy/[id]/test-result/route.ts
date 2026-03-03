import { NextRequest, NextResponse } from 'next/server';
import { moveStage } from '@/lib/workflow-stage';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const pass = Boolean(body?.pass);
    const to = pass ? 'test_passed' : 'test_failed';
    const res = await moveStage(id, to, 'test-result', body?.actor, body?.payload);
    return NextResponse.json({ success: true, data: res });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '未知错误' }, { status: 400 });
  }
}
