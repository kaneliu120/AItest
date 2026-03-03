import { NextResponse } from 'next/server';
import { listInstalled, listUpdateCandidates, toggleInstalledStatus, updateInstalledSkill } from '@/lib/mcp-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'usage';

  let data = await listInstalled();

  if (status) data = data.filter(skill => skill.status === status);

  if (sort === 'usage') data = data.sort((a, b) => b.usageCount - a.usageCount);
  else if (sort === 'recent') data = data.sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime());
  else if (sort === 'name') data = data.sort((a, b) => a.name.localeCompare(b.name));

  const stats = {
    total: data.length,
    active: data.filter(s => s.status === 'active').length,
    disabled: data.filter(s => s.status === 'disabled').length,
    error: data.filter(s => s.status === 'error').length,
    totalUsage: data.reduce((sum, skill) => sum + skill.usageCount, 0),
    avgUsage: data.length > 0 ? Math.round(data.reduce((sum, skill) => sum + skill.usageCount, 0) / data.length) : 0,
  };

  const usageTrend = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toLocaleDateString('zh-CN', { weekday: 'short' });
    return { day: key, using times数: Math.max(0, Math.round(stats.avgUsage * (0.5 + Math.random()))) };
  });

  const updateCandidates = await listUpdateCandidates();
  return NextResponse.json({ success: true, generatedAt: new Date().toISOString(), stats, skills: data, usageTrend, updateCandidates });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, slug, status, version } = body;

    if (!slug) return NextResponse.json({ success: false, error: 'Missing skill identifier' }, { status: 400 });

    if (action === 'toggle-status') {
      const updated = await toggleInstalledStatus(slug, status);
      return NextResponse.json({ success: true, message: `Skill "${updated.name}" status updated`, data: updated });
    }

    if (action === 'update') {
      const updated = await updateInstalledSkill(slug, version);
      return NextResponse.json({ success: true, message: `Skill "${updated.name}" Updated successfully`, data: updated });
    }

    return NextResponse.json({ success: false, error: 'Unsupported operation' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
