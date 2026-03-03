import { NextRequest, NextResponse } from 'next/server';
import { createMissionTask, listMissionTasks, toTree } from '@/lib/mission-task-store';

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get('mode') || 'tree';
    const tasks = await listMissionTasks();
    return NextResponse.json({
      success: true,
      data: mode === 'flat' ? tasks : toTree(tasks),
      total: tasks.length,
    });
  } catch (error: any) {
    const msg = error?.message || 'Unknown error';
    if (msg.includes('does not exist') || msg.includes('relation')) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        warning: 'Database tables not initialized. Run migrations.',
      });
    }
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.title || !body?.level) {
      return NextResponse.json({ success: false, error: 'title 和 level 必填' }, { status: 400 });
    }
    const task = await createMissionTask({
      parentId: body.parentId || null,
      level: Number(body.level),
      title: body.title,
      description: body.description || '',
      status: body.status || 'pending',
      progress: Number(body.progress || 0),
      targetPrice: body.targetPrice != null ? Number(body.targetPrice) : null,
      currency: body.currency || 'PHP',
      owner: body.owner || null,
      category: body.category || null,
      source: body.source || 'manual',
      metadata: body.metadata || {},
    } as any);
    return NextResponse.json({ success: true, data: task });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '未知错误' }, { status: 500 });
  }
}
