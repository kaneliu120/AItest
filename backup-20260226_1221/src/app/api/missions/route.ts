/**
 * /api/missions — 任务中心聚合 API（全真实数据）
 * 数据来源：
 *   · 任务数据     → /api/tasks (SQLite)
 *   · 财务数据     → /api/finance (SQLite)
 *   · 外包项目数据 → /api/freelance (内置)
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
    safe<any>(`${BASE}/api/tasks?action=list`, null),
    safe<any>(`${BASE}/api/tasks?action=stats`, null),
    safe<any>(`${BASE}/api/finance?action=summary`, null),
    safe<any>(`${BASE}/api/finance?action=transactions`, null),
    safe<any>(`${BASE}/api/freelance?action=projects`, null),
  ]);

  // ── 任务列表（真实 SQLite 数据）────────────────────────────────────────────
  const tasks: any[] = tasksRaw?.data?.tasks ?? [];

  // 映射为 mission 卡片格式
  const missions = tasks.map((t: any) => ({
    id:          t.id,
    title:       t.title,
    description: t.description,
    status:      t.status,                            // pending | in-progress | completed | cancelled
    priority:    t.priority,                          // low | medium | high | critical
    progress:    t.status === 'completed' ? 100
                  : t.status === 'in-progress' ? 50
                  : t.status === 'cancelled'   ? 0
                  : 0,
    deadline:    t.dueDate ? t.dueDate.split('T')[0] : '—',
    assignedTo:  t.assignedTo ?? '未指定',
    tags:        t.tags ?? [],
    createdAt:   t.createdAt,
    updatedAt:   t.updatedAt,
  }));

  // ── 任务统计（真实数据）───────────────────────────────────────────────────
  const stats = statsRaw?.data ?? {};
  const taskStats = {
    total:          stats.totalTasks      ?? tasks.length,
    completed:      stats.completedTasks  ?? tasks.filter((t: any) => t.status === 'completed').length,
    inProgress:     stats.inProgressTasks ?? tasks.filter((t: any) => t.status === 'in-progress').length,
    pending:        stats.pendingTasks    ?? tasks.filter((t: any) => t.status === 'pending').length,
    overdue:        stats.overdueTasks    ?? 0,
    completionRate: stats.completionRate  ?? 0,
    cancelled:      tasks.filter((t: any) => t.status === 'cancelled').length,
  };

  // ── 财务摘要（真实数据）───────────────────────────────────────────────────
  const fin = financeRaw?.data ?? {};
  const financeSummary = {
    totalIncome:   fin.totalIncome   ?? 0,
    totalExpenses: fin.totalExpenses ?? 0,
    netProfit:     fin.netProfit     ?? 0,
    profitMargin:  fin.profitMargin  ?? 0,
    currency:      fin.currency      ?? 'PHP',
  };

  // ── 最近交易作为财务里程碑（真实数据）────────────────────────────────────
  const transactions: any[] = txRaw?.data?.transactions ?? [];
  const financeMilestones = transactions
    .filter((t: any) => t.type === 'income')
    .slice(0, 3)
    .map((t: any) => ({
      id:          t.id,
      date:        t.date,
      title:       t.description,
      amount:      t.amount,
      currency:    t.currency,
      category:    t.category,
      status:      t.status === 'completed' ? 'completed' : 'pending',
    }));

  // ── 外包项目（真实注册数据，模拟项目详情）───────────────────────────────
  const freelanceProjects: any[] = freelanceRaw?.data?.projects ?? [];
  const activeProjects = freelanceProjects.filter((p: any) => p.status === 'active');

  // ── 里程碑（任务截止日期 + 财务收入事件合并）─────────────────────────────
  const milestones = [
    // 已完成任务作为里程碑
    ...tasks
      .filter((t: any) => t.status === 'completed')
      .map((t: any) => ({
        type:   'task',
        date:   (t.dueDate ?? t.updatedAt ?? '').split('T')[0],
        title:  `✅ ${t.title}`,
        status: 'completed',
        impact: t.priority === 'critical' ? '极高' : t.priority === 'high' ? '高' : t.priority === 'medium' ? '中' : '低',
      })),
    // 待办任务截止日期
    ...tasks
      .filter((t: any) => ['pending', 'in-progress'].includes(t.status) && t.dueDate)
      .map((t: any) => ({
        type:   'task',
        date:   t.dueDate.split('T')[0],
        title:  t.title,
        status: t.status === 'in-progress' ? 'in-progress' : 'pending',
        impact: t.priority === 'critical' ? '极高' : t.priority === 'high' ? '高' : t.priority === 'medium' ? '中' : '低',
      })),
    // 收入里程碑
    ...financeMilestones.map((m: any) => ({
      type:   'finance',
      date:   m.date,
      title:  `💰 ${m.title}`,
      status: m.status,
      impact: m.amount >= 50000 ? '极高' : m.amount >= 20000 ? '高' : '中',
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  // ── 整体完成率（任务 + 外包）─────────────────────────────────────────────
  const projectAvgProgress = activeProjects.length
    ? Math.round(activeProjects.reduce((s: number, p: any) => s + p.progress, 0) / activeProjects.length)
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
