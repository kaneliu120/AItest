/**
 * /api/freelance — 外包平台 API（SQLite 持久化）
 * GET  ?action=projects|clients|stats
 * POST { action: create-project|update-project|delete-project|create-client|update-client|delete-client, ...fields }
 */
import { NextRequest, NextResponse } from 'next/server';
import { freelanceStore } from '@/lib/freelance-store';

type FreelanceAction =
  | 'create-project' | 'update-project' | 'delete-project'
  | 'create-client' | 'update-client' | 'delete-client';

function validateFreelancePayload(input: unknown): { ok: true; body: Record<string, unknown>; action: FreelanceAction } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: '请求体必须是对象' };
  const body = input as Record<string, unknown>;
  const action = body.action;
  const allowed: FreelanceAction[] = ['create-project','update-project','delete-project','create-client','update-client','delete-client'];
  if (typeof action !== 'string' || !allowed.includes(action as FreelanceAction)) {
    return { ok: false, error: '无效 action' };
  }
  if (['update-project','delete-project','update-client','delete-client'].includes(action) && (typeof body.id !== 'string' || !body.id.trim())) {
    return { ok: false, error: '缺少有效 id' };
  }
  if (action === 'create-project' && (typeof body.title !== 'string' || !body.title.trim())) {
    return { ok: false, error: '缺少标题' };
  }
  if (action === 'create-client' && (typeof body.name !== 'string' || !body.name.trim())) {
    return { ok: false, error: '缺少客户姓名' };
  }
  return { ok: true, body, action: action as FreelanceAction };
}

// ── GET ────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const action = new URL(request.url).searchParams.get('action') || 'projects';

    if (action === 'projects' || action === 'list') {
      const projects = await freelanceStore.getAllProjects();
      return NextResponse.json({ success: true, data: { projects } });
    }

    if (action === 'clients') {
      const clients = await freelanceStore.getAllClients();
      return NextResponse.json({ success: true, data: { clients } });
    }

    if (action === 'stats' || action === 'status') {
      const stats = await freelanceStore.getProjectStats();
      return NextResponse.json({ success: true, data: stats });
    }

    return NextResponse.json({ success: false, error: '未知 action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : '未知错误' }, { status: 500 });
  }
}

// ── POST ───────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const parsed = validateFreelancePayload(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error, code: 'VALIDATION_ERROR' }, { status: 400 });
    }
    const { body, action } = parsed;
    const asStr = (v: unknown, d = '') => (typeof v === 'string' ? v : d);

    // ── 项目操作 ────────────────────────────────────────────────────────────
    if (action === 'create-project') {
      const { title, description, status, source, businessSource, clientId, clientName,
              budget, currency, deadline, category, notes, progress } = body;
      if (!title) return NextResponse.json({ success: false, error: '缺少标题' }, { status: 400 });
      const project = await freelanceStore.createProject({
        title: asStr(title),
        description: asStr(description),
        status: asStr(status, '创建'),
        source: asStr(source, 'manual'),
        businessSource: asStr(businessSource, '直接联系'),
        clientId: asStr(clientId),
        clientName: asStr(clientName),
        budget: Number(budget ?? 0),
        currency: asStr(currency, 'PHP'),
        deadline: asStr(deadline),
        progress: Number(progress ?? 0),
        category: asStr(category, '其他'),
        automationStatus: '',
        notes: asStr(notes),
      });
      return NextResponse.json({ success: true, data: project });
    }

    if (action === 'update-project') {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 });
      const pid = asStr(id);
      const ok = await freelanceStore.updateProject(pid, updates);
      const updated = ok ? await freelanceStore.getProjectById(pid) : null;
      return NextResponse.json({ success: ok, data: updated });
    }

    if (action === 'delete-project') {
      const { id } = body;
      if (!id) return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 });
      const ok = await freelanceStore.deleteProject(asStr(id));
      return NextResponse.json({ success: ok });
    }

    // ── 客户操作 ────────────────────────────────────────────────────────────
    if (action === 'create-client') {
      const { name, company, email, phone, notes } = body;
      if (!name) return NextResponse.json({ success: false, error: '缺少客户姓名' }, { status: 400 });
      const client = await freelanceStore.createClient({
        name: asStr(name),
        company: asStr(company),
        email: asStr(email),
        phone: asStr(phone),
        notes: asStr(notes),
      });
      return NextResponse.json({ success: true, data: client });
    }

    if (action === 'update-client') {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 });
      await freelanceStore.updateClient(asStr(id), updates);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete-client') {
      const { id } = body;
      if (!id) return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 });
      return NextResponse.json({ success: await freelanceStore.deleteClient(asStr(id)) });
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : '未知错误' }, { status: 500 });
  }
}
