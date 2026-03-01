/**
 * /api/freelance — 外包平台 API（SQLite 持久化）
 * GET  ?action=projects|clients|stats
 * POST { action: create-project|update-project|delete-project|create-client|update-client|delete-client, ...fields }
 */
import { NextRequest, NextResponse } from 'next/server';
import { freelanceStore } from '@/lib/freelance-store';

// ── GET ────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const action = new URL(request.url).searchParams.get('action') || 'projects';

    if (action === 'projects' || action === 'list') {
      const projects = freelanceStore.getAllProjects();
      return NextResponse.json({ success: true, data: { projects } });
    }

    if (action === 'clients') {
      const clients = freelanceStore.getAllClients();
      return NextResponse.json({ success: true, data: { clients } });
    }

    if (action === 'stats' || action === 'status') {
      const stats = freelanceStore.getProjectStats();
      return NextResponse.json({ success: true, data: stats });
    }

    return NextResponse.json({ success: false, error: '未知 action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ── POST ───────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // ── 项目操作 ────────────────────────────────────────────────────────────
    if (action === 'create-project') {
      const { title, description, status, source, businessSource, clientId, clientName,
              budget, currency, deadline, category, notes, progress } = body;
      if (!title) return NextResponse.json({ success: false, error: '缺少标题' }, { status: 400 });
      const project = freelanceStore.createProject({
        title, description: description ?? '', status: status ?? '创建',
        source: source ?? 'manual', businessSource: businessSource ?? '直接联系',
        clientId: clientId ?? '', clientName: clientName ?? '',
        budget: Number(budget ?? 0), currency: currency ?? 'PHP',
        deadline: deadline ?? '', progress: Number(progress ?? 0),
        category: category ?? '其他', automationStatus: '', notes: notes ?? '',
      });
      return NextResponse.json({ success: true, data: project });
    }

    if (action === 'update-project') {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 });
      const ok = freelanceStore.updateProject(id, updates);
      const updated = ok ? freelanceStore.getProjectById(id) : null;
      return NextResponse.json({ success: ok, data: updated });
    }

    if (action === 'delete-project') {
      const { id } = body;
      if (!id) return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 });
      const ok = freelanceStore.deleteProject(id);
      return NextResponse.json({ success: ok });
    }

    // ── 客户操作 ────────────────────────────────────────────────────────────
    if (action === 'create-client') {
      const { name, company, email, phone, notes } = body;
      if (!name) return NextResponse.json({ success: false, error: '缺少客户姓名' }, { status: 400 });
      const client = freelanceStore.createClient({ name, company, email, phone, notes });
      return NextResponse.json({ success: true, data: client });
    }

    if (action === 'update-client') {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 });
      freelanceStore.updateClient(id, updates);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete-client') {
      const { id } = body;
      if (!id) return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 });
      return NextResponse.json({ success: freelanceStore.deleteClient(id) });
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
