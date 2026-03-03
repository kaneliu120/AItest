import { NextRequest, NextResponse } from 'next/server';
import { moveStage } from '@/lib/workflow-stage';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const res = await moveStage(id, 'outsource_confirmed', 'outsource-confirm', body?.actor, body?.payload);
    return NextResponse.json({ success: true, data: res });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 400 });
  }
}
