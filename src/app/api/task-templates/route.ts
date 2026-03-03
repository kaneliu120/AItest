import { NextRequest, NextResponse } from 'next/server';
import { TASK_TEMPLATES } from '@/lib/task-templates';
import { createMissionTask, listMissionTasks } from '@/lib/mission-task-store';

export async function GET() {
  return NextResponse.json({ success: true, data: TASK_TEMPLATES.map(t => ({ key: t.key, goalTitle: t.goalTitle, count: t.nodes.length })) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const key = String(body?.key || '').trim();
    const fillOnlyMissing = body?.fillOnlyMissing !== false;
    const tpl = TASK_TEMPLATES.find(t => t.key === key || t.goalTitle === key);
    if (!tpl) return NextResponse.json({ success: false, error: '模板不存在' }, { status: 404 });

    const all = await listMissionTasks();
    const goal = all.find(t => t.level === 1 && t.title === tpl.goalTitle);
    if (!goal) return NextResponse.json({ success: false, error: '未找到对应一级目标' }, { status: 400 });

    const created: any[] = [];

    for (const n of tpl.nodes) {
      let l2 = all.find(t => t.parentId === goal.id && t.level === 2 && t.title === n.title);
      if (!l2 && !fillOnlyMissing) {
        l2 = await createMissionTask({ parentId: goal.id, level: 2, title: n.title, description: '', status: 'pending', progress: 0, currency: 'PHP', source: 'template', metadata: { template: key } } as any);
        created.push(l2);
      }
      if (!l2 && fillOnlyMissing) {
        l2 = await createMissionTask({ parentId: goal.id, level: 2, title: n.title, description: '', status: 'pending', progress: 0, currency: 'PHP', source: 'template', metadata: { template: key } } as any);
        created.push(l2);
      }
      if (n.children?.length && l2) {
        for (const c of n.children) {
          const l3 = all.find(t => t.parentId === l2!.id && t.level === 3 && t.title === c.title);
          if (!l3) {
            const row = await createMissionTask({ parentId: l2.id, level: 3, title: c.title, description: '', status: 'pending', progress: 0, currency: 'PHP', source: 'template', metadata: { template: key } } as any);
            created.push(row);
          }
        }
      }
    }

    return NextResponse.json({ success: true, data: { key, goalTitle: tpl.goalTitle, createdCount: created.length, created } });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '未知错误' }, { status: 500 });
  }
}
