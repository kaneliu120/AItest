/**
 * Analytics aggregation API
 * Integrates real data from finance / tasks / freelance / ecosystem / health
 */
import { NextRequest, NextResponse } from 'next/server';

async function safeGet(url: string, timeout = 4000) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    clearTimeout(timer);
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const base = new URL(request.url).origin;

  const [financeRaw, transactionsRaw, tasksRaw, freelanceRaw, ecoRaw, healthRaw] =
    await Promise.all([
      safeGet(`${base}/api/finance?action=summary`),
      safeGet(`${base}/api/finance?action=transactions`),
      safeGet(`${base}/api/tasks?action=stats`),
      safeGet(`${base}/api/freelance`),
      safeGet(`${base}/api/ecosystem/status?format=json`),
      safeGet(`${base}/api/health`),
    ]);

  // ── Finance ───────────────────────────────────────────────────────────────
  const fd = financeRaw?.data ?? null;
  const transactions: any[] = transactionsRaw?.data?.transactions ?? [];

  const finance = {
    totalIncome:    fd?.totalIncome    ?? 0,
    totalExpenses:  fd?.totalExpenses  ?? 0,
    netProfit:      fd?.netProfit      ?? 0,
    profitMargin:   fd?.profitMargin   ?? 0,
    totalTx:        fd?.totalTransactions ?? 0,
    monthlyTrend:   fd?.monthlyTrend   ?? [],
    currentMonth:   fd?.currentMonth   ?? { income: 0, expenses: 0, profit: 0 },
    currency:       fd?.currency       ?? 'PHP',
    // Income vs Expense category pie chart data
    categoryBreakdown: (() => {
      const map: Record<string, number> = {};
      transactions.forEach(t => {
        if (t.type === 'income') {
          map[t.category] = (map[t.category] ?? 0) + t.amount;
        }
      });
      return Object.entries(map).map(([name, value]) => ({ name, value }));
    })(),
    recentTransactions: transactions.slice(0, 5),
    available: !!fd,
  };

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const td = tasksRaw?.data ?? null;
  const tasks = {
    total:          td?.totalTasks    ?? 0,
    completed:      td?.completedTasks ?? 0,
    inProgress:     td?.inProgressTasks ?? 0,
    pending:        td?.pendingTasks  ?? 0,
    overdue:        td?.overdueTasks  ?? 0,
    completionRate: td?.completionRate ?? 0,
    // Status distribution (for pie chart)
    statusDist: td ? [
      { name: 'Completed', value: td.completedTasks  ?? 0, color: '#22c55e' },
      { name: 'In Progress', value: td.inProgressTasks ?? 0, color: '#3b82f6' },
      { name: 'Pending', value: td.pendingTasks    ?? 0, color: '#f59e0b' },
      { name: 'Overdue', value: td.overdueTasks    ?? 0, color: '#ef4444' },
    ] : [],
    available: !!td,
  };

  // ── Freelance ─────────────────────────────────────────────────────────────
  const projects: any[] = freelanceRaw?.data?.projects ?? [];
  const activeProjects  = projects.filter(p => p.status === 'active');
  const totalBudget     = activeProjects.reduce((s, p) => s + (p.budget ?? 0), 0);
  const avgProgress     = activeProjects.length
    ? Math.round(activeProjects.reduce((s, p) => s + (p.progress ?? 0), 0) / activeProjects.length)
    : 0;

  const freelance = {
    total:         projects.length,
    active:        activeProjects.length,
    completed:     projects.filter(p => p.status === 'completed').length,
    totalBudget,
    avgProgress,
    projects:      activeProjects.slice(0, 5),
    available:     projects.length > 0,
  };

  // ── Ecosystem ─────────────────────────────────────────────────────────────
  const ed = ecoRaw?.data?.monitoring ?? null;
  const ecosystem = {
    totalTools:   ed?.totalTools   ?? 0,
    healthyTools: ed?.healthyTools ?? 0,
    warningTools: ed?.warningTools ?? 0,
    errorTools:   ed?.errorTools   ?? 0,
    healthRate:   ed?.totalTools
      ? Math.round((ed.healthyTools / ed.totalTools) * 100)
      : 0,
    recentAlerts: (ed?.recentAlerts ?? []).slice(0, 5),
    available:    !!ed,
  };

  // ── System Health ─────────────────────────────────────────────────────────
  const hd = healthRaw?.data ?? null;
  const metrics = hd?.metrics ?? {};
  const components: any[] = hd?.components ?? [];

  const health = {
    overall:       hd?.overallHealth ?? 0,
    cpuUsage:      metrics.cpuUsage    ?? 0,
    memoryUsage:   metrics.memoryUsage ?? 0,
    diskUsage:     metrics.diskUsage   ?? 0,
    responseTime:  metrics.responseTime ?? 0,
    components:    components.map(c => ({
      name:   c.name,
      status: c.status,
      desc:   c.description,
    })),
    available: !!hd,
  };

  // ── Overall score ─────────────────────────────────────────────────────────
  const overallScore = Math.round(
    (tasks.completionRate * 0.3) +
    (ecosystem.healthRate * 0.3) +
    (health.overall       * 0.2) +
    (freelance.avgProgress * 0.2)
  );

  return NextResponse.json({
    success: true,
    generatedAt: new Date().toISOString(),
    overallScore,
    finance,
    tasks,
    freelance,
    ecosystem,
    health,
  });
}
