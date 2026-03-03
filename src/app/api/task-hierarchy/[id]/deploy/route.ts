import { NextRequest, NextResponse } from 'next/server';
import { moveStage } from '@/lib/workflow-stage';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    // split deploy into two steps if needed
    if (body?.readyOnly) {
      const res = await moveStage(id, 'deploy_ready', 'deploy-ready', body?.actor, body?.payload);
      return NextResponse.json({ success: true, data: res });
    }
    const res = await moveStage(id, 'deployed', 'deploy', body?.actor, body?.payload);
    return NextResponse.json({ success: true, data: res });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 400 });
  }
}
