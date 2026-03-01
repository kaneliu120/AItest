/**
 * /api/tools — 统一工具管理 API
 * 数据来源：
 * 1. /api/ecosystem/status（工具生态健康检查）
 * 2. /api/tools/marketplace（工具市场数据）
 * 3. /api/tools/installed（已安装技能管理）
 */
import { NextResponse } from 'next/server';

const BASE = 'http://localhost:3001';

const TYPE_LABEL: Record<string, string> = {
  dashboard:  '控制台',
  monitoring: '监控',
  evaluation: '评估',
  health:     '健康',
  finance:    '财务',
  freelance:  '外包',
  task:       '任务',
  ai:         'AI',
  automation: '自动化',
  knowledge:  '知识库',
  analytics:  '分析',
  ads:        '广告',
  social:     '社交',
  'ci-cd':    'CI/CD',
  container:  '容器',
  cloud:      '云服务',
  framework:  '框架',
  skill:      '技能',
  product:    '产品',
};

const CATEGORY_MAP: Record<string, string> = {
  dashboard: '系统核心', monitoring: '系统核心', health: '系统核心',
  finance:   '业务系统', task: '业务系统', freelance: '业务系统', knowledge: '业务系统',
  ai:        'AI与自动化', automation: 'AI与自动化', skill: 'AI与自动化',
  analytics: '数据与营销', ads: '数据与营销', social: '数据与营销',
  'ci-cd':   '基础设施', container: '基础设施', cloud: '基础设施',
  framework: '基础设施', evaluation: '质量保障', product: '产品',
};

export async function GET() {
  let ecosystemData: any = null;
  try {
    const res = await fetch(`${BASE}/api/ecosystem/status?format=json`, { cache: 'no-store' });
    if (res.ok) ecosystemData = await res.json();
  } catch { /* fallback */ }

  const rawTools: any[] = ecosystemData?.data?.tools ?? [];
  const monitoring     = ecosystemData?.data?.monitoring ?? {};
  const scheduler      = ecosystemData?.data?.scheduler  ?? {};

  // ── 工具列表标准化 ────────────────────────────────────────────────────────
  const tools = rawTools.map(t => ({
    name:        t.name,
    status:      t.status,        // healthy | warning | error
    type:        t.type,
    typeLabel:   TYPE_LABEL[t.type] ?? t.type,
    category:    CATEGORY_MAP[t.type] ?? '其他',
    version:     t.version ?? '—',
    description: t.details ?? '',
    lastChecked: t.lastChecked,
  }));

  // ── 按分类分组 ────────────────────────────────────────────────────────────
  const categories: Record<string, typeof tools> = {};
  tools.forEach(t => {
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
  const alerts: any[] = (monitoring.recentAlerts ?? []).sort((a: any, b: any) => {
    const order: Record<string, number> = { error: 0, warning: 1, info: 2 };
    return (order[a.level] ?? 3) - (order[b.level] ?? 3);
  });

  // ── 统一工具管理统计 ─────────────────────────────────────────────────────
  const unifiedStats = {
    ecosystem: {
      total: stats.total,
      healthy: stats.healthy,
      warning: stats.warning,
      error: stats.error,
      healthRate: stats.healthRate,
    },
    marketplace: {
      totalSkills: 10, // 模拟数据，实际应从市场API获取
      installedSkills: 7,
      popularCategories: ['ai', 'automation', 'productivity'],
    },
    installed: {
      total: 7, // 模拟数据，实际应从已安装API获取
      active: 5,
      disabled: 1,
      error: 1,
      totalUsage: 128,
    },
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json({
    success:     true,
    generatedAt: new Date().toISOString(),
    stats,
    tools,
    categories:  categoryList,
    scheduler:   schedulerStats,
    alerts,
    unifiedStats, // 新增统一统计
    endpoints: { // 新增API端点信息
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

    // ── 工具生态操作 ──
    if (action === 'diagnose') {
      if (!issue) return Response.json({ success: false, error: '缺少问题描述' }, { status: 400 });
      // 触发完整健康检查 + 返回 AI 建议
      const testRes = await fetch(`${BASE}/api/test`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run-all-health' }),
      });
      const testData = testRes.ok ? await testRes.json() : null;
      const passed   = testData?.data?.passed ?? 0;
      const total    = testData?.data?.total  ?? 0;
      const failed   = total - passed;

      const suggestions = failed > 0
        ? [`发现 ${failed} 个失败项，建议前往测试中心查看详情`, '检查对应 API 路由文件是否正确导出 handler', '重启 Next.js 开发服务器后重试']
        : ['所有 API 健康检查通过', '问题可能来自前端渲染，检查 console 错误', '尝试清除浏览器缓存后重试'];

      return Response.json({
        success: true,
        data: {
          toolId: toolId ?? 'system',
          issue,
          result: `系统诊断完成。API 检测 ${passed}/${total} 通过。${failed > 0 ? `发现 ${failed} 个异常。` : '系统运行正常。'}`,
          suggestions,
          healthCheck: { passed, total, failed },
          timestamp: new Date().toISOString(),
        }
      });
    }

    // ── Web 测试（真实 URL 检测） ──
    if (action === 'run-web-test') {
      const target = url || `${BASE}/`;
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
            result: `❌ 连接失败: ${e instanceof Error ? e.message : '超时'}`,
            timestamp: new Date().toISOString(),
          }
        });
      }
    }

    // ── 触发自动化联动（通知自动化模块） ──
    if (action === 'sync-automation') {
      await fetch(`${BASE}/api/automation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' }),
      });
      return Response.json({ success: true, data: { synced: true, at: new Date().toISOString() } });
    }

    // ── 工具市场操作 ──
    if (action === 'install-skill') {
      if (!slug) return Response.json({ success: false, error: '缺少技能标识' }, { status: 400 });
      // 模拟安装过程
      await new Promise(resolve => setTimeout(resolve, 1500));
      return Response.json({
        success: true,
        data: {
          slug,
          version: version || 'latest',
          installed: true,
          installedAt: new Date().toISOString(),
          message: `技能 "${slug}" 安装成功`,
        },
      });
    }

    if (action === 'uninstall-skill') {
      if (!slug) return Response.json({ success: false, error: '缺少技能标识' }, { status: 400 });
      // 模拟卸载过程
      await new Promise(resolve => setTimeout(resolve, 1000));
      return Response.json({
        success: true,
        data: {
          slug,
          uninstalled: true,
          uninstalledAt: new Date().toISOString(),
          message: `技能 "${slug}" 卸载成功`,
        },
      });
    }

    // ── 已安装技能操作 ──
    if (action === 'toggle-skill-status') {
      if (!slug) return Response.json({ success: false, error: '缺少技能标识' }, { status: 400 });
      const newStatus = status || 'active';
      await new Promise(resolve => setTimeout(resolve, 500));
      return Response.json({
        success: true,
        data: {
          slug,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          message: `技能 "${slug}" 状态已更新为 ${newStatus}`,
        },
      });
    }

    if (action === 'update-skill') {
      if (!slug) return Response.json({ success: false, error: '缺少技能标识' }, { status: 400 });
      // 模拟更新过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      return Response.json({
        success: true,
        data: {
          slug,
          version: version || 'latest',
          updated: true,
          updatedAt: new Date().toISOString(),
          message: `技能 "${slug}" 更新成功`,
        },
      });
    }

    return Response.json({ success: false, error: '不支持的操作' }, { status: 400 });
  } catch (error) {
    return Response.json({ success: false, error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}
