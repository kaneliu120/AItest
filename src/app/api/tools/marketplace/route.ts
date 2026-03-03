import { NextResponse } from 'next/server';
import { listMarketplace, listInstalled, installSkill, uninstallSkill } from '@/lib/mcp-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'downloads';

  const [marketplace, installed] = await Promise.all([listMarketplace(), listInstalled()]);
  const installedMap = new Map(installed.map((x) => [x.slug, x.version]));

  let data = marketplace.map((m) => ({
    ...m,
    installed: installedMap.has(m.slug),
    installedVersion: installedMap.get(m.slug),
  }));

  if (search) {
    data = data.filter(skill =>
      skill.name.toLowerCase().includes(search.toLowerCase()) ||
      skill.description.toLowerCase().includes(search.toLowerCase()) ||
      skill.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    );
  }

  if (category) {
    data = data.filter(skill => skill.tags.includes(category));
  }

  if (sort === 'downloads') data.sort((a, b) => b.downloads - a.downloads);
  else if (sort === 'rating') data.sort((a, b) => b.rating - a.rating);
  else if (sort === 'recent') data.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  const stats = {
    total: data.length,
    installed: data.filter(s => s.installed).length,
    totalDownloads: data.reduce((sum, skill) => sum + skill.downloads, 0),
    avgRating: data.length > 0 ? data.reduce((sum, skill) => sum + skill.rating, 0) / data.length : 0,
    categories: Array.from(new Set(data.flatMap(skill => skill.tags))),
  };

  return NextResponse.json({ success: true, generatedAt: new Date().toISOString(), stats, skills: data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, slug, version } = body;

    if (!slug) return NextResponse.json({ success: false, error: 'Missing skill identifier' }, { status: 400 });

    if (action === 'install') {
      const out = await installSkill(slug, version);
      return NextResponse.json({ success: true, message: `Skill "${slug}" installed`, data: out });
    }

    if (action === 'uninstall') {
      await uninstallSkill(slug);
      return NextResponse.json({ success: true, message: `Skill "${slug}" uninstalled` });
    }

    return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
