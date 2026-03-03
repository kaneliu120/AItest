import { NextRequest, NextResponse } from 'next/server';
import { createMissionTask } from '@/lib/mission-task-store';

// will generate Draft写入data库(Defaultby顺序挂载)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const draft = Array.isArray(body?.draft) ? body.draft : [];
    if (!draft.length) return NextResponse.json({ success: false, error: 'draft cannot be empty' }, { status: 400 });

    let lastL1: string | null = null;
    let lastL2: string | null = null;
    const created: any[] = [];

    for (const item of draft) {
      const level = Number(item.level);
      const title = String(item.title || '').trim();
      if (!title || ![1,2,3].includes(level)) continue;

      const parentId = level === 1 ? null : (level === 2 ? lastL1 : lastL2);
      const row = await createMissionTask({
        level: level as 1 | 2 | 3,
        parentId,
        title,
        description: String(item.description || ''),
        status: 'pending',
        progress: 0,
        targetPrice: item.targetPrice != null ? Number(item.targetPrice) : null,
        currency: 'PHP',
        owner: null,
        category: String(item.category || ''),
        source: 'doc',
        metadata: { from: 'generate-commit' },
      });

      if (level === 1) { lastL1 = row.id; lastL2 = null; }
      if (level === 2) { lastL2 = row.id; }
      created.push(row);
    }

    return NextResponse.json({ success: true, data: { createdCount: created.length, created } });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
