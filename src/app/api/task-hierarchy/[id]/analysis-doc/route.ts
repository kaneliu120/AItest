import { NextRequest, NextResponse } from 'next/server';
import { readAnalysisDoc } from '@/lib/analysis-doc';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const content = readAnalysisDoc(id);
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="analysis-${id}.md"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '未知错误' }, { status: 404 });
  }
}
