/**
 * Dashboard 聚合 API
 * 整合 finance / tasks / freelance / health 数据，统一提供给主页组件。
 * 所有子调用均有 graceful fallback，不会因单个服务失败而崩溃。
 */

import { NextResponse } from "next/server";

// ─── 内部请求辅助 ────────────────────────────────────────────────────────────
async function safeGet(url: string, timeout = 3000) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── 类型 ────────────────────────────────────────────────────────────────────
export interface DashboardData {
  /** 财务统计 */
  finance: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    profitMargin: number;
    currentMonthIncome: number;
    currentMonthExpenses: number;
    currentMonthProfit: number;
    monthlyGrowthRate: number; // %
    monthlyTrend: { month: string; income: number; expenses: number; profit: number }[];
    available: boolean;
  };
  /** 外包项目 */
  freelance: {
    activeProjects: number;
    pendingProposals: number;
    avgProgress: number;
    totalBudget: number;
    available: boolean;
  };
  /** 任务统计 */
  tasks: {
    completedTasks: number;
    totalTasks: number;
    completionRate: number;
    inProgressTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    available: boolean;
  };
  /** 系统健康 */
  health: {
    overallHealth: number;
    healthyTools: number;
    totalTools: number;
    warningTools: number;
    errorTools: number;
    cpuUsage: number;
    memoryUsage: number;
    responseTime: number;
    available: boolean;
  };
  /** 自动化系统 */
  automation: {
    activeModules: number;
    totalModules: number;
    successRate: number;
    lastExecution: string;
    available: boolean;
  };
  /** 数据分析 */
  analytics: {
    totalDataSources: number;
    realTimeData: boolean;
    lastUpdated: string;
    available: boolean;
  };
  /** 生成时间 */
  generatedAt: string;
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const base = new URL(request.url).origin;

  // 并行拉取所有数据源
  const [financeData, freelanceData, tasksData, systemMonitoringData, automationData, analyticsData] = await Promise.all([
    safeGet(`${base}/api/finance?action=summary`),
    safeGet(`${base}/api/freelance`),
    safeGet(`${base}/api/tasks?action=stats`),
    safeGet(`${base}/api/system-monitoring`),
    safeGet(`${base}/api/automation?action=status`),
    safeGet(`${base}/api/analytics`),
  ]);

  // ── Finance ───────────────────────────────────────────────────────────────
  const financeAvailable = !!(financeData?.success || financeData?.data);
  const fd = financeData?.data ?? financeData ?? null;

  // 获取月度趋势
  let monthlyTrend: DashboardData["finance"]["monthlyTrend"] = [];
  let currentMonthIncome = 0;
  let currentMonthExpenses = 0;
  let previousMonthIncome = 0;
  let totalIncome = 0;
  let totalExpense = 0;
  let netProfit = 0;
  let profitMargin = 0;

  if (fd?.monthlyTrend?.length) {
    // 数据按最新月份倒序
    const sorted = [...fd.monthlyTrend].sort((a: any, b: any) =>
      b.month.localeCompare(a.month)
    );
    const latest = sorted[0];
    currentMonthIncome = latest?.income ?? 0;
    currentMonthExpenses = latest?.expenses ?? 0;
    previousMonthIncome = sorted[1]?.income ?? 0;
    monthlyTrend = sorted.slice(0, 6).reverse(); // 最近6个月，正序
    
    // 计算总计
    totalIncome = sorted.reduce((sum: number, item: any) => sum + (item.income || 0), 0);
    totalExpense = sorted.reduce((sum: number, item: any) => sum + (item.expenses || 0), 0);
    netProfit = totalIncome - totalExpense;
    profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
  }
  // currentMonth 字段（来自 summary action）
  if (fd?.currentMonth) {
    currentMonthIncome = fd.currentMonth.income ?? currentMonthIncome;
    currentMonthExpenses = fd.currentMonth.expenses ?? currentMonthExpenses;
  }

  // 从summary获取总计数据
  if (fd?.totalIncome !== undefined) totalIncome = fd.totalIncome;
  if (fd?.totalExpense !== undefined) totalExpense = fd.totalExpense;
  if (fd?.netProfit !== undefined) netProfit = fd.netProfit;
  if (fd?.profitMargin !== undefined) profitMargin = fd.profitMargin;

  const currentMonthProfit = currentMonthIncome - currentMonthExpenses;
  const monthlyGrowthRate =
    previousMonthIncome > 0
      ? +((((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100).toFixed(1))
      : 0;

  // ── Freelance ─────────────────────────────────────────────────────────────
  const projects: any[] = freelanceData?.projects ?? freelanceData?.data?.projects ?? [];
  const activeProjects = projects.filter((p: any) => p.status === "active").length;
  const pendingProposals = projects.filter(
    (p: any) => p.status === "pending" || p.status === "proposal"
  ).length;
  const avgProgress = projects.length > 0 
    ? Math.round(projects.reduce((sum: number, p: any) => sum + (p.progress || 0), 0) / projects.length)
    : 0;
  const totalBudget = projects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0);

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const tasksAvailable = !!(tasksData?.success || tasksData?.data);
  const td = tasksData?.data ?? tasksData ?? null;
  const completedTasks = td?.completed ?? td?.completedTasks ?? 0;
  const totalTasks = td?.total ?? td?.totalTasks ?? 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // ── System Monitoring ───────────────────────────────────────────────────────
  const systemMonitoringAvailable = !!(systemMonitoringData?.success || systemMonitoringData?.data);
  const smd = systemMonitoringData?.data ?? systemMonitoringData ?? null;
  const overallHealth = smd?.overallHealth ?? 0;
  const healthyTools = smd?.summary?.healthyComponents ?? 0;
  const totalTools = smd?.summary?.totalComponents ?? 0;
  const warningTools = smd?.summary?.degradedComponents ?? 0;
  const errorTools = smd?.summary?.unhealthyComponents ?? 0;
  const cpuUsage = smd?.metrics?.cpu?.usage ?? 0;
  const memoryUsage = smd?.metrics?.memory?.usage ?? 0;
  const responseTime = smd?.metrics?.network?.latency ?? 0;

  // ── 组装结果 ──────────────────────────────────────────────────────────────
  const result: DashboardData = {
    finance: {
      totalIncome,
      totalExpense,
      netProfit,
      profitMargin,
      currentMonthIncome,
      currentMonthExpenses,
      currentMonthProfit,
      monthlyGrowthRate,
      monthlyTrend,
      available: financeAvailable,
    },
    freelance: {
      activeProjects,
      pendingProposals,
      avgProgress,
      totalBudget,
      available: projects.length > 0,
    },
    tasks: {
      completedTasks,
      totalTasks,
      completionRate,
      inProgressTasks: tasksData?.data?.inProgress || 0,
      pendingTasks: tasksData?.data?.pending || 0,
      overdueTasks: tasksData?.data?.overdue || 0,
      available: tasksAvailable,
    },
    health: {
      overallHealth,
      healthyTools,
      totalTools,
      warningTools,
      errorTools,
      cpuUsage,
      memoryUsage,
      responseTime,
      available: systemMonitoringAvailable,
    },
    automation: {
      activeModules: automationData?.data?.activeModules || 0,
      totalModules: automationData?.data?.totalModules || 4,
      successRate: automationData?.data?.successRate || 0,
      lastExecution: automationData?.data?.lastExecution || new Date().toISOString(),
      available: !!automationData?.success,
    },
    analytics: {
      totalDataSources: analyticsData?.data?.totalDataSources || 5,
      realTimeData: analyticsData?.data?.realTimeData || true,
      lastUpdated: analyticsData?.data?.lastUpdated || new Date().toISOString(),
      available: !!analyticsData?.success,
    },
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ success: true, data: result });
}
