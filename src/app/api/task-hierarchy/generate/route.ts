import { NextRequest, NextResponse } from 'next/server';

// 输入文档文本，输出可落库的任务草稿（不自动入库）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text: string = body?.text || '';
    if (!text.trim()) return NextResponse.json({ success: false, error: 'text is required' }, { status: 400 });

    const lines = text.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
    const draft: Array<{ level: 1 | 2 | 3; title: string; parentRef?: string }> = [];

    const cleanTitle = (x: string) => x
      .replace(/^[-*•]\s+/, '')
      .replace(/^#+\s+/, '')
      .replace(/^\d+(?:\.\d+)*\s*[.、]\s*/, '')
      .replace(/^、\s*/, '')
      .replace(/^总任务目标\s*[:：]\s*/i, '')
      .replace(/^任务目标\s*[:：]\s*/i, '')
      .replace(/^目标\s*[:：]\s*/i, '')
      .replace(/^goal\s*[:：]\s*/i, '')
      .replace(/^objective\s*[:：]\s*/i, '')
      .trim();

    for (const l of lines) {
      const m3 = l.match(/^\d+\.\d+\s*(.+)$/);
      const m2 = l.match(/^\d+\s*\.?\s*(.+)$/);
      if (m3) {
        draft.push({ level: 3, title: cleanTitle(m3[1]) });
      } else if (m2) {
        draft.push({ level: 2, title: cleanTitle(m2[1]) });
      } else {
        draft.push({ level: 1, title: cleanTitle(l) });
      }
    }

    return NextResponse.json({ success: true, data: { draft, total: draft.length } });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
