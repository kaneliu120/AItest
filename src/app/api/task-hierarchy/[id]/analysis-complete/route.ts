import { NextRequest, NextResponse } from 'next/server';
import { moveStage, setAnalysisDoc } from '@/lib/workflow-stage';
import { generateAnalysisDoc } from '@/lib/analysis-doc';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    let url = String(body?.analysis_doc_url || '').trim();

    // 未提供则自动导出 markdown 文档
    if (!url) {
      const out = await generateAnalysisDoc(id);
      url = out.downloadUrl;
    }

    await setAnalysisDoc(id, url);
    const res = await moveStage(id, 'analysis_done', 'analysis-complete', body?.actor, { ...(body?.payload || {}), analysis_doc_url: url });
    return NextResponse.json({ success: true, data: res });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '未知错误' }, { status: 400 });
  }
}
