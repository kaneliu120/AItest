/**
 * /api/freelance - OutsourcePlatform API(SQLite 持久化)
 * GET  ?action=projects|clients|stats
 * POST { action: create-project|update-project|delete-project|create-client|update-client|delete-client, ...fields }
 */
import { NextRequest, NextResponse } from 'next/server';
import { freelanceStore } from '@/lib/freelance-store';

type FreelanceAction =
  | 'create-project' | 'update-project' | 'delete-project'
  | 'create-client' | 'update-client' | 'delete-client';

function validateFreelancePayload(input: unknown): { ok: true; body: Record<string, unknown>; action: FreelanceAction } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Request body must be an object' };
  const body = input as Record<string, unknown>;
  const action = body.action;
  const allowed: FreelanceAction[] = ['create-project','update-project','delete-project','create-client','update-client','delete-client'];
  if (typeof action !== 'string' || !allowed.includes(action as FreelanceAction)) {
    return { ok: false, error: 'Invalid action' };
  }
  if (['update-project','delete-project','update-client','delete-client'].includes(action) && (typeof body.id !== 'string' || !body.id.trim())) {
    return { ok: false, error: 'Missing valid id' };
  }
  if (action === 'create-project' && (typeof body.title !== 'string' || !body.title.trim())) {
    return { ok: false, error: 'Missing title' };
  }
  if (action === 'create-client' && (typeof body.name !== 'string' || !body.name.trim())) {
    return { ok: false, error: 'Missing client name' };
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

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
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

    // ── Project操作 ────────────────────────────────────────────────────────────
    if (action === 'create-project') {
      const { title, description, status, source, businessSource, clientId, clientName,
              budget, currency, deadline, category, notes, progress } = body;
      if (!title) return NextResponse.json({ success: false, error: 'Missing title' }, { status: 400 });
      const project = await freelanceStore.createProject({
        title: asStr(title),
        description: asStr(description),
        status: asStr(status, 'Create'),
        source: asStr(source, 'manual'),
        businessSource: asStr(businessSource, 'Direct Contact'),
        clientId: asStr(clientId),
        clientName: asStr(clientName),
        budget: Number(budget ?? 0),
        currency: asStr(currency, 'PHP'),
        deadline: asStr(deadline),
        progress: Number(progress ?? 0),
        category: asStr(category, 'Other'),
        automationStatus: '',
        notes: asStr(notes),
      });
      return NextResponse.json({ success: true, data: project });
    }

    if (action === 'update-project') {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ success: false, error: 'Missing  id' }, { status: 400 });
      const pid = asStr(id);
      const ok = await freelanceStore.updateProject(pid, updates);
      const updated = ok ? await freelanceStore.getProjectById(pid) : null;
      return NextResponse.json({ success: ok, data: updated });
    }

    if (action === 'delete-project') {
      const { id } = body;
      if (!id) return NextResponse.json({ success: false, error: 'Missing  id' }, { status: 400 });
      const ok = await freelanceStore.deleteProject(asStr(id));
      return NextResponse.json({ success: ok });
    }

    // ── client操作 ────────────────────────────────────────────────────────────
    if (action === 'create-client') {
      const { name, company, email, phone, notes } = body;
      if (!name) return NextResponse.json({ success: false, error: 'Missing client name' }, { status: 400 });
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
      if (!id) return NextResponse.json({ success: false, error: 'Missing  id' }, { status: 400 });
      await freelanceStore.updateClient(asStr(id), updates);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete-client') {
      const { id } = body;
      if (!id) return NextResponse.json({ success: false, error: 'Missing  id' }, { status: 400 });
      return NextResponse.json({ success: await freelanceStore.deleteClient(asStr(id)) });
    }

    return NextResponse.json({ success: false, error: 'Unknown operation' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
