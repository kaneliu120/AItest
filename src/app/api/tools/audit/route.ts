import { NextResponse } from 'next/server';
import { listMcpAuditLogs } from '@/lib/mcp-audit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(500, Math.max(1, Number(searchParams.get('limit') || 100)));
    const logs = await listMcpAuditLogs(limit);
    return NextResponse.json({ success: true, data: logs, count: logs.length });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
