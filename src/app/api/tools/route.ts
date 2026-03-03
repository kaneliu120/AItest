/**
 * /api/tools — 统一工具管理 API
 * Data sources:
 * 1. /api/ecosystem/status（工具生态健康检查）
 * 2. /api/tools/marketplace（工具市场数据）
 * 3. /api/tools/installed（已安装技能管理）
 */
import { NextResponse } from 'next/server';
import { appendMcpAuditLog } from '@/lib/mcp-audit';
import { listMarketplace, listInstalled, installSkill, uninstallSkill, toggleInstalledStatus, updateInstalledSkill } from '@/lib/mcp-store';

const TYPE_LABEL: Record<string, string> = {
  dashboard:  'Dashboard',
  monitoring: 'Monitoring',
  evaluation: 'Evaluation',
  health:     'Health',
  finance:    'Finance',
  freelance:  'Freelance',
  task:       'Tasks',
  ai:         'AI',
  automation: 'Automation',
  knowledge:  'Knowledge Base',
  analytics:  'Analytics',
  ads:        'Ads',
  social:     'Social',
  'ci-cd':    'CI/CD',
  container:  'Container',
  cloud:      'Cloud',
  framework:  'Framework',
  skill:      'Skills',
  product:    'Product',
};

const CATEGORY_MAP: Record<string, string> = {
  dashboard: 'System Core', monitoring: 'System Core', health: 'System Core',
  finance:   'Business Systems', task: 'Business Systems', freelance: 'Business Systems', knowledge: 'Business Systems',
  ai:        'AI & Automation', automation: 'AI & Automation', skill: 'AI & Automation',
  analytics: 'Data & Marketing', ads: 'Data & Marketing', social: 'Data & Marketing',
  'ci-cd':   'Infrastructure', container: 'Infrastructure', cloud: 'Infrastructure',
  framework: 'Infrastructure', evaluation: 'Quality Assurance', product: 'Product',
};

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const origin = reqUrl.origin;
  const page = Math.max(1, Number(reqUrl.searchParams.get('page') || 1));
  const pageSize = Math.min(100, Math.max(1, Number(reqUrl.searchParams.get('pageSize') || 20)));
  const statusFilter = reqUrl.searchParams.get('status') || 'all';
  const categoryFilter = reqUrl.searchParams.get('category') || 'all';
  const search = (reqUrl.searchParams.get('search') || '').trim().toLowerCase();

  let ecosystemData: unknown = null;
  try {
    const res = await fetch(`${origin}/api/ecosystem/status?format=json`, { cache: 'no-store' });
    if (res.ok) ecosystemData = await res.json();
  } catch { /* fallback */ }

  const rawTools = (((ecosystemData as any)?.data?.tools) ?? []) as Array<Record<string, any>>;
  const monitoring     = ((ecosystemData as any)?.data?.monitoring ?? {}) as Record<string, any>;
  const scheduler      = ((ecosystemData as any)?.data?.scheduler  ?? {}) as Record<string, any>;

  // ── 工具列表标准化 ────────────────────────────────────────────────────────
  const tools = rawTools.map(t => ({
    name:        t.name,
    status:      t.status,        // healthy | warning | error
    type:        t.type,
    typeLabel:   TYPE_LABEL[t.type] ?? t.type,
    category:    CATEGORY_MAP[t.type] ?? 'Other',
    version:     t.version ?? '—',
    description: t.details ?? '',
    lastChecked: t.lastChecked,
  }));

  const filteredTools = tools.filter((t) => {
    const statusOk = statusFilter === 'all' || t.status === statusFilter;
    const catOk = categoryFilter === 'all' || t.category === categoryFilter;
    const searchOk = !search || t.name.toLowerCase().includes(search) || t.description.toLowerCase().includes(search);
    return statusOk && catOk && searchOk;
  });

  const totalFiltered = filteredTools.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedTools = filteredTools.slice(start, start + pageSize);

  // ── 按分类分组 ────────────────────────────────────────────────────────────
  const categories: Record<string, typeof filteredTools> = {};
  filteredTools.forEach(t => {
    if (!categories[t.category]) categories[t.category] = [];
    categories[t.category].push(t);
  });

  const categoryList = Object.entries(categories).map(([name, items]) => ({
    name,
    total:   items.length,
    healthy: items.filter(t => t.status === 'healthy').length,
    warning: items.filter(t => t.status === 'warning').length,
    error:   items.filter(t => t.status === 'error').length,
    healthRate: items.length
      ? Math.round(items.filter(t => t.status === 'healthy').length / items.length * 100)
      : 0,
    tools: items,
  }));

  // ── 统计 ─────────────────────────────────────────────────────────────────
  const stats = {
    total:      monitoring.totalTools   ?? tools.length,
    healthy:    monitoring.healthyTools ?? tools.filter(t => t.status === 'healthy').length,
    warning:    monitoring.warningTools ?? tools.filter(t => t.status === 'warning').length,
    error:      monitoring.errorTools   ?? tools.filter(t => t.status === 'error').length,
    healthRate: monitoring.totalTools
      ? Math.round(monitoring.healthyTools / monitoring.totalTools * 100)
      : 0,
  };

  // ── 调度器摘要 ────────────────────────────────────────────────────────────
  const schedulerStats = {
    pending:   scheduler.pending   ?? 0,
    running:   scheduler.running   ?? 0,
    completed: scheduler.completed ?? 0,
    failed:    scheduler.failed    ?? 0,
    total:     scheduler.total     ?? 0,
    health:    scheduler.health    ?? 0,
  };

  // ── 告警（按级别排序）────────────────────────────────────────────────────
  const alerts = (((monitoring as any).recentAlerts ?? []) as Array<Record<string, any>>).sort((a, b) => {
    const order: Record<string, number> = { error: 0, warning: 1, info: 2 };
    return (order[a.level] ?? 3) - (order[b.level] ?? 3);
  });

  const [marketplace, installed] = await Promise.all([listMarketplace(), listInstalled()]);
  const tagCount = new Map<string, number>();
  marketplace.forEach(m => m.tags.forEach(t => tagCount.set(t, (tagCount.get(t) || 0) + 1)));
  const popularCategories = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

  const unifiedStats = {
    ecosystem: {
      total: stats.total,
      healthy: stats.healthy,
      warning: stats.warning,
      error: stats.error,
      healthRate: stats.healthRate,
    },
    marketplace: {
      totalSkills: marketplace.length,
      installedSkills: installed.length,
      popularCategories,
    },
    installed: {
      total: installed.length,
      active: installed.filter(s => s.status === 'active').length,
      disabled: installed.filter(s => s.status === 'disabled').length,
      error: installed.filter(s => s.status === 'error').length,
      totalUsage: installed.reduce((sum, s) => sum + s.usageCount, 0),
    },
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json({
    success:     true,
    generatedAt: new Date().toISOString(),
    stats,
    tools: pagedTools,
    categories:  categoryList,
    scheduler:   schedulerStats,
    alerts,
    unifiedStats, // add unified statistics
    pagination: {
      page: safePage,
      pageSize,
      total: totalFiltered,
      totalPages,
    },
    filters: {
      status: statusFilter,
      category: categoryFilter,
      search: reqUrl.searchParams.get('search') || '',
    },
    endpoints: {
      ecosystem: '/api/tools',
      marketplace: '/api/tools/marketplace',
      installed: '/api/tools/installed',
      actions: '/api/tools (POST)',
    },
  });
}

// ─── POST: 统一工具操作 ───────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, toolId, issue, url, testType, slug, version, status } = body;
    const origin = new URL(request.url).origin;

    // ── 工具生态操作 ──
    if (action === 'diagnose') {
      if (!issue) return Response.json({ success: false, error: 'Missing issue description' }, { status: 400 });
      // 触发完整健康检查 + 返回 AI 建议
      const testRes = await fetch(`${origin}/api/test`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run-all-health' }),
      });
      const testData = testRes.ok ? await testRes.json() : null;
      const passed   = testData?.data?.passed ?? 0;
      const total    = testData?.data?.total  ?? 0;
      const failed   = total - passed;

      const suggestions = failed > 0
        ? [`Found ${failed} failing items - visit the Test Center for details`, 'Check that the corresponding API route file correctly exports a handler', 'Try restarting the Next.js development server']
        : ['All API health checks passed', 'Issue may be from frontend rendering - check console errors', 'Try clearing browser cache'];

      return Response.json({
        success: true,
        data: {
          toolId: toolId ?? 'system',
          issue,
          result: `System diagnostics complete. API checks ${passed}/${total} passed. ${failed > 0 ? `${failed} issue(s) found.` : 'System running normally.'}`,
          suggestions,
          healthCheck: { passed, total, failed },
          timestamp: new Date().toISOString(),
        }
      });
    }

    // ── Web 测试（真实 URL 检测） ──
    if (action === 'run-web-test') {
      const target = url || `${origin}/`;
      const start  = Date.now();
      try {
        const res = await fetch(target, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
        const dur = Date.now() - start;
        return Response.json({
          success: true,
          data: {
            toolId: toolId ?? 'cortexaai',
            url: target, testType: testType ?? 'basic',
            status: res.ok ? 'passed' : 'failed',
            httpStatus: res.status,
            duration: dur,
            result: `${res.ok ? '✅' : '❌'} HTTP ${res.status} · ${dur}ms · Content-Type: ${res.headers.get('content-type') ?? 'unknown'}`,
            timestamp: new Date().toISOString(),
          }
        });
      } catch (e) {
        const dur = Date.now() - start;
        return Response.json({
          success: true,
          data: {
            toolId: toolId ?? 'cortexaai', url: target,
            status: 'error', httpStatus: 0, duration: dur,
            result: `❌ Connection failed: ${e instanceof Error ? e.message : 'Timeout'}`,
            timestamp: new Date().toISOString(),
          }
        });
      }
    }

    // ── 触发自动化联动（通知自动化模块） ──
    if (action === 'sync-automation') {
      await fetch(`${origin}/api/automation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' }),
      });
      return Response.json({ success: true, data: { synced: true, at: new Date().toISOString() } });
    }

    // ── 工具市场操作 ──
    if (action === 'install-skill') {
      if (!slug) return Response.json({ success: false, error: 'Missing skill identifier' }, { status: 400 });
      const out = await installSkill(slug, version);
      await appendMcpAuditLog({ action, slug, success: true, detail: 'install success' });
      return Response.json({ success: true, data: { ...out, installed: true, installedAt: new Date().toISOString() } });
    }

    if (action === 'uninstall-skill') {
      if (!slug) return Response.json({ success: false, error: 'Missing skill identifier' }, { status: 400 });
      await uninstallSkill(slug);
      await appendMcpAuditLog({ action, slug, success: true, detail: 'uninstall success' });
      return Response.json({ success: true, data: { slug, uninstalled: true, uninstalledAt: new Date().toISOString() } });
    }

    // ── 已安装技能操作 ──
    if (action === 'toggle-skill-status') {
      if (!slug) return Response.json({ success: false, error: 'Missing skill identifier' }, { status: 400 });
      const updated = await toggleInstalledStatus(slug, status);
      await appendMcpAuditLog({ action, slug, success: true, detail: `toggle to ${updated.status}` });
      return Response.json({ success: true, data: { ...updated, updatedAt: new Date().toISOString() } });
    }

    if (action === 'update-skill') {
      if (!slug) return Response.json({ success: false, error: 'Missing skill identifier' }, { status: 400 });
      const updated = await updateInstalledSkill(slug, version);
      await appendMcpAuditLog({ action, slug, success: true, detail: `update to ${updated.version}` });
      return Response.json({ success: true, data: { ...updated, updatedAt: new Date().toISOString(), updated: true } });
    }

    return Response.json({ success: false, error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    await appendMcpAuditLog({
      action: 'unknown',
      slug: undefined,
      success: false,
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
    return Response.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
