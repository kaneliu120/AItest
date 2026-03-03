/**
 * /api/missions - Task center aggregation API (fully real data)
 * Data sources:
 *   · Taskdata     → /api/tasks (SQLite)
 *   · Financedata     → /api/finance (SQLite)
 *   · OutsourceProjectdata → /api/freelance (built-in)
 */
import { NextResponse } from 'next/server';

const BASE = 'http://localhost:3001';

async function safe<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  const [tasksRaw, statsRaw, financeRaw, txRaw, freelanceRaw] = await Promise.all([
    safe<unknown>(`${BASE}/api/tasks?action=list`, null),
    safe<unknown>(`${BASE}/api/tasks?action=stats`, null),
    safe<unknown>(`${BASE}/api/finance?action=summary`, null),
    safe<unknown>(`${BASE}/api/finance?action=transactions`, null),
    safe<unknown>(`${BASE}/api/freelance?action=projects`, null),
  ]);

  // ── TaskList(true实 SQLite data)────────────────────────────────────────────
  const tasks = ((tasksRaw as any)?.data?.tasks ?? []) as Array<Record<string, any>>;

  // 映射for mission 卡片Format
  const missions = tasks.map((t) => ({
    id:          t.id,
    title:       t.title,
    description: t.description,
    status:      t.status,                            // pending | in-progress | completed | cancelled
    priority:    t.priority,                          // low | medium | high | critical
    progress:    t.status === 'completed' ? 100
                  : t.status === 'in-progress' ? 50
                  : t.status === 'cancelled'   ? 0
                  : 0,
    deadline:    t.dueDate ? t.dueDate.split('T')[0] : '-',
    assignedTo:  t.assignedTo ?? 'Unassigned',
    tags:        t.tags ?? [],
    createdAt:   t.createdAt,
    updatedAt:   t.updatedAt,
  }));

  // ── TaskStatistics(real data)───────────────────────────────────────────────────
  const stats = ((statsRaw as any)?.data ?? {}) as Record<string, any>;
  const taskStats = {
    total:          stats.totalTasks      ?? tasks.length,
    completed:      stats.completedTasks  ?? tasks.filter((t) => t.status === 'completed').length,
    inProgress:     stats.inProgressTasks ?? tasks.filter((t) => t.status === 'in-progress').length,
    pending:        stats.pendingTasks    ?? tasks.filter((t) => t.status === 'pending').length,
    overdue:        stats.overdueTasks    ?? 0,
    completionRate: stats.completionRate  ?? 0,
    cancelled:      tasks.filter((t) => t.status === 'cancelled').length,
  };

  // ── FinanceSummary(real data)───────────────────────────────────────────────────
  const fin = ((financeRaw as any)?.data ?? {}) as Record<string, any>;
  const financeSummary = {
    totalIncome:   fin.totalIncome   ?? 0,
    totalExpenses: fin.totalExpenses ?? 0,
    netProfit:     fin.netProfit     ?? 0,
    profitMargin:  fin.profitMargin  ?? 0,
    currency:      fin.currency      ?? 'PHP',
  };

  // ── 最近交易作forFinancemilestone(real data)────────────────────────────────────
  const transactions = (((txRaw as any)?.data?.transactions) ?? []) as Array<Record<string, any>>;
  const financeMilestones = transactions
    .filter((t) => t.type === 'income')
    .slice(0, 3)
    .map((t) => ({
      id:          t.id,
      date:        t.date,
      title:       t.description,
      amount:      t.amount,
      currency:    t.currency,
      category:    t.category,
      status:      t.status === 'completed' ? 'completed' : 'pending',
    }));

  // ── OutsourceProject(true实Registerdata, 模拟ProjectDetails)───────────────────────────────
  const freelanceProjects = (((freelanceRaw as any)?.data?.projects) ?? []) as Array<Record<string, any>>;
  const activeProjects = freelanceProjects.filter((p: any) => p.status === 'active');

  // ── milestone(TaskDue Date + FinanceIncomeEvent合and)─────────────────────────────
  const milestones = [
    // Completed tasks as milestones
    ...tasks
      .filter((t) => t.status === 'completed')
      .map((t) => ({
        type:   'task',
        date:   (t.dueDate ?? t.updatedAt ?? '').split('T')[0],
        title:  `✅ ${t.title}`,
        status: 'completed',
        impact: t.priority === 'critical' ? 'Critical' : t.priority === 'high' ? 'High' : t.priority === 'medium' ? 'Medium' : 'Low',
      })),
    // Todo task due dates
    ...tasks
      .filter((t) => ['pending', 'in-progress'].includes(t.status) && t.dueDate)
      .map((t) => ({
        type:   'task',
        date:   t.dueDate.split('T')[0],
        title:  t.title,
        status: t.status === 'in-progress' ? 'in-progress' : 'pending',
        impact: t.priority === 'critical' ? 'Critical' : t.priority === 'high' ? 'High' : t.priority === 'medium' ? 'Medium' : 'Low',
      })),
    // Income milestones
    ...financeMilestones.map((m) => ({
      type:   'finance',
      date:   m.date,
      title:  `💰 ${m.title}`,
      status: m.status,
      impact: m.amount >= 50000 ? 'Critical' : m.amount >= 20000 ? 'High' : 'Medium',
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  // ── Overall completion rate (tasks + outsourcing)─────────────────────────────────────────────
  const projectAvgProgress = activeProjects.length
    ? Math.round(activeProjects.reduce((s: number, p) => s + p.progress, 0) / activeProjects.length)
    : 0;

  const overallScore = Math.round(
    taskStats.completionRate * 0.5 +
    projectAvgProgress       * 0.3 +
    (financeSummary.profitMargin > 80 ? 100 : financeSummary.profitMargin) * 0.2
  );

  return NextResponse.json({
    success:         true,
    generatedAt:     new Date().toISOString(),
    overallScore,
    taskStats,
    missions,
    milestones,
    finance:         financeSummary,
    freelance: {
      total:         freelanceProjects.length,
      active:        activeProjects.length,
      projects:      activeProjects,
      avgProgress:   projectAvgProgress,
    },
  });
}
