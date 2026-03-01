'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Rocket, Target, Clock, CheckCircle, AlertCircle, TrendingUp,
  Zap, Flag, Calendar, Award, BarChart3, RefreshCw, DollarSign,
  Layers, AlertTriangle, XCircle, Star, Bell, FileText
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Mission {
  id: string; title: string; description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number; deadline: string; assignedTo: string;
  tags: string[]; createdAt: string;
}

interface Milestone {
  type: string; date: string; title: string;
  status: 'completed' | 'in-progress' | 'pending';
  impact: string;
}

interface MissionsData {
  overallScore: number;
  generatedAt: string;
  taskStats: {
    total: number; completed: number; inProgress: number;
    pending: number; overdue: number; completionRate: number; cancelled: number;
  };
  missions: Mission[];
  milestones: Milestone[];
  finance: {
    totalIncome: number; totalExpenses: number; netProfit: number;
    profitMargin: number; currency: string;
  };
  freelance: {
    total: number; active: number; avgProgress: number;
    projects: Array<{ id: string; title: string; progress: number; budget: number; deadline: string; status: string; category: string }>;
  };
}

// ─── MCPfunction ────────────────────────────────────────────────────────────────
const statusCfg: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  completed:  { label: 'Completed', color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  icon: <CheckCircle className="w-4 h-4 text-green-600" /> },
  'in-progress': { label: 'In Progress', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200',    icon: <Clock className="w-4 h-4 text-blue-600" /> },
  pending:    { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: <AlertCircle className="w-4 h-4 text-yellow-600" /> },
  cancelled:  { label: 'Cancelled', color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200',     icon: <XCircle className="w-4 h-4 text-gray-400" /> },
};

const priorityCfg: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'text-red-600' },
  high:     { label: 'High',   color: 'text-orange-600' },
  medium:   { label: 'Medium',   color: 'text-yellow-600' },
  low:      { label: 'Low',   color: 'text-green-600' },
};

const progressColor = (p: number) =>
  p === 100 ? '#22c55e' : p >= 50 ? '#3b82f6' : '#f59e0b';

const impactBadge = (impact: string) =>
  impact === 'Critical' ? 'bg-red-100 text-red-700' :
  impact === 'High'   ? 'bg-orange-100 text-orange-700' :
  impact === 'Medium'   ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600';

// ─── Main Component ──────────────────────────────────────────────────────────────────
export default function MissionsPage() {
  const [data, setData] = useState<MissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [goalProgress, setGoalProgress] = useState<Array<{id:string;title:string;progress:number;status:string;budget:number}>>([]);
  const [ops, setOps] = useState<{ totals: { budget: number; invoiced: number; pending: number }; goalMetrics: any[] } | null>(null);
  const [alerts, setAlerts] = useState<{ summary: { total: number; critical: number; warning: number }; alerts: any[] } | null>(null);
  const [actingAlertKey, setActingAlertKey] = useState<string | null>(null);
  const [weeklyReportMd, setWeeklyReportMd] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/missions', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      const h = await fetch('/api/task-hierarchy?mode=flat', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ data: [] }));
      const all = (h?.data || []) as Array<any>;
      const byParent = new Map<string, any[]>();
      all.forEach(x => {
        const p = x.parentId || '__root__';
        byParent.set(p, [...(byParent.get(p) || []), x]);
      });
      const goals = all.filter(x => x.level === 1);
      const collectDesc = (id: string): any[] => {
        const c = byParent.get(id) || [];
        return c.flatMap((n: any) => [n, ...collectDesc(n.id)]);
      };
      const gp = goals.map(g => {
        const desc = collectDesc(g.id);
        const weight = (lv: number) => (lv === 2 ? 0.6 : lv === 3 ? 0.4 : 1);
        const weighted = desc.length
          ? desc.reduce((s: number, d: any) => s + ((Number(d.progress || 0)) * weight(Number(d.level || 3))), 0) /
            desc.reduce((s: number, d: any) => s + weight(Number(d.level || 3)), 0)
          : Number(g.progress || 0);
        const progress = Math.round(weighted);
        const budget = desc.reduce((sum:number, d:any) => sum + Number(d.targetPrice || 0), Number(g.targetPrice || 0));
        return { id: g.id, title: g.title, progress, status: g.status, budget };
      });
      setGoalProgress(gp);
      const opsData = await fetch('/api/missions/ops', { cache: 'no-store' }).then(r => r.json()).catch(() => null);
      if (opsData?.success) setOps(opsData.data);
      const al = await fetch('/api/missions/alerts?hours=24', { cache: 'no-store' }).then(r => r.json()).catch(() => null);
      if (al?.success) setAlerts(al.data);
      const wr = await fetch('/api/missions/weekly-report?days=7', { cache: 'no-store' }).then(r => r.json()).catch(() => null);
      if (wr?.success) setWeeklyReportMd(wr.data?.markdown || '');
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Missions fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 60000);
    return () => clearInterval(t);
  }, [fetchData]);

  const handleAlertAction = async (a: any) => {
    const key = `${a.type}-${a.taskId}`;
    setActingAlertKey(key);
    try {
      let action = '';
      if (a.type === 'test_failed') action = 'set-troubleshooting';
      if (a.type === 'pending_invoice') action = 'invoice';
      if (!action) return;

      await fetch('/api/missions/alerts/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: a.taskId, action }),
      });
      await fetchData();
    } finally {
      setActingAlertKey(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-muted-foreground">Loading mission data...</p>
        </div>
      </div>
    );
  }
  if (!data) return <div className="p-6 text-red-500">Data load failed</div>;

  const { taskStats, missions, milestones, finance, freelance, overallScore } = data;

  // Filter logic
  const filteredMissions = missions.filter(m =>
    filter === 'all'       ? true :
    filter === 'active'    ? ['in-progress', 'pending'].includes(m.status) :
    filter === 'completed' ? m.status === 'completed' : true
  );

  // Chart data: Task Status Distribution
  const statusChart = [
    { name: 'Completed', value: taskStats.completed,  fill: '#22c55e' },
    { name: 'In Progress', value: taskStats.inProgress, fill: '#3b82f6' },
    { name: 'Pending', value: taskStats.pending,    fill: '#f59e0b' },
    { name: 'Cancelled', value: taskStats.cancelled,  fill: '#d1d5db' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 pb-8">

      {/* ─── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="w-6 h-6 text-blue-500" />
            Mission Control Center (Total Goal Progress)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All data from local database (PostgreSQL) ·
            {lastRefresh && ` Last updated: ${lastRefresh.toLocaleTimeString('zh-CN')}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Overall Score */}
          <div className={`text-center px-4 py-2 rounded-lg border font-bold text-2xl ${
            overallScore >= 80 ? 'bg-green-50 border-green-200' :
            overallScore >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
          }`}>
            <span className={
              overallScore >= 80 ? 'text-green-700' :
              overallScore >= 60 ? 'text-yellow-700' : 'text-red-700'
            }>{overallScore}</span>
            <p className="text-xs text-muted-foreground font-normal">Overall Score</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ─── KPI Card ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200 cursor-pointer" onClick={() => window.open('/tasks', '_self')}>
          <CardContent className="pt-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold text-blue-700">{taskStats.total}</p>
                <p className="text-xs text-blue-600 mt-1">Real task records</p>
              </div>
              <Target className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200 cursor-pointer" onClick={() => window.open('/tasks?status=completed', '_self')}>
          <CardContent className="pt-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold text-green-700">{taskStats.completionRate}%</p>
                <p className="text-xs text-green-600 mt-1">{taskStats.completed}/{taskStats.total} Completed</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold text-purple-700">
                  ₱{(finance.netProfit / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-purple-600 mt-1">Profit Margin {finance.profitMargin}%</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200 cursor-pointer" onClick={() => window.open('/tasks?status=in-progress', '_self')}>
          <CardContent className="pt-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold text-orange-700">{freelance.active}</p>
                <p className="text-xs text-orange-600 mt-1">Avg Progress {freelance.avgProgress}%</p>
              </div>
              <Layers className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>


      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-indigo-500" /> Top 6 Goal Progress</CardTitle>
          <CardDescription>Click to navigate to task details · includes target price budget summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goalProgress.map(g => (
              <a key={g.id} href={`/tasks/${g.id}`} className="border rounded p-3 hover:bg-gray-50">
                <div className="text-sm font-medium">{g.title}</div>
                <div className="text-xs text-gray-500 mt-1">Progress {g.progress}% · Status {g.status} · Budget ₱{Number(g.budget||0).toLocaleString()}</div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2"><div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${g.progress}%` }} /></div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600" /> Business Metrics Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            <div className="border rounded p-3"><div className="text-gray-500">Total Budget</div><div className="font-semibold">₱{Number(ops?.totals?.budget || 0).toLocaleString()}</div></div>
            <div className="border rounded p-3"><div className="text-gray-500">Invoiced</div><div className="font-semibold text-green-700">₱{Number(ops?.totals?.invoiced || 0).toLocaleString()}</div></div>
            <div className="border rounded p-3"><div className="text-gray-500">Pending Collection</div><div className="font-semibold text-orange-700">₱{Number(ops?.totals?.pending || 0).toLocaleString()}</div></div>
            <div className="border rounded p-3"><div className="text-gray-500">Overall ROI</div><div className="font-semibold">{(ops?.totals?.budget || 0) > 0 ? Math.round((Number(ops?.totals?.invoiced || 0) / Number(ops?.totals?.budget || 1)) * 100) : 0}%</div></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4 text-red-600" /> Process Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3">
            <div className="border rounded p-3"><div className="text-gray-500">Total Alerts</div><div className="font-semibold">{alerts?.summary?.total || 0}</div></div>
            <div className="border rounded p-3"><div className="text-gray-500">Critical</div><div className="font-semibold text-red-700">{alerts?.summary?.critical || 0}</div></div>
            <div className="border rounded p-3"><div className="text-gray-500">Warning</div><div className="font-semibold text-orange-700">{alerts?.summary?.warning || 0}</div></div>
          </div>
          <div className="space-y-2">
            {(alerts?.alerts || []).slice(0,6).map((a:any) => {
              const k = `${a.type}-${a.taskId}`;
              const canAct = a.type === 'test_failed' || a.type === 'pending_invoice';
              return (
                <div key={k} className="border rounded p-2 text-sm">
                  <div>
                    <span className={a.level === 'critical' ? 'text-red-700 font-medium' : 'text-orange-700 font-medium'}>[{a.level}]</span> {a.title} · {a.message}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <a href={`/tasks/${a.taskId}`} className="px-2 py-1 border rounded text-xs">View Tasks</a>
                    {canAct && (
                      <button
                        className="px-2 py-1 border rounded text-xs"
                        disabled={actingAlertKey === k}
                        onClick={() => handleAlertAction(a)}
                      >
                        {actingAlertKey === k ? 'Processing...' : (a.type === 'test_failed' ? 'Troubleshoot' : 'Record Payment')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {(!alerts || (alerts.alerts || []).length === 0) && <p className="text-sm text-gray-500">No process alerts</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /> Weekly Report Export</CardTitle>
          <CardDescription>Export last 7 days tasks operations weekly report (Markdown)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center">
            <button
              className="px-3 py-2 border rounded"
              onClick={() => {
                const blob = new Blob([weeklyReportMd || '# Weekly Report\n\nNo data available'], { type: 'text/markdown;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `mission-weekly-report-${new Date().toISOString().slice(0,10)}.md`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download Weekly Report .md
            </button>
            <span className="text-xs text-gray-500">{weeklyReportMd ? `Ready (${weeklyReportMd.length} chars)` : 'No weekly report content'}</span>
          </div>
        </CardContent>
      </Card>

      {/* ─── Charts Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution (Donut Chart) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Task Status Distribution (Live Data)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={160}>
                <RadialBarChart
                  cx="50%" cy="50%"
                  innerRadius={30} outerRadius={70}
                  data={statusChart}
                  startAngle={90} endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, taskStats.total]} tick={false} />
                  <RadialBar dataKey="value" background={{ fill: '#f3f4f6' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {statusChart.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: item.fill }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.value}</span>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round(item.value / taskStats.total * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Completion Rate</span>
                    <span className="text-green-600">{taskStats.completionRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Freelance Project Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-500" />
              Freelance Project Progress (Live Data)
            </CardTitle>
            <CardDescription>{freelance.total} projects · {freelance.active} active</CardDescription>
          </CardHeader>
          <CardContent>
            {freelance.projects.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={freelance.projects.map(p => ({ name: p.title.slice(0, 8) + '…', progress: p.progress, budget: Math.round(p.budget / 1000) }))}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v: any, name: any) => name === 'progress' ? [`${Number(v ?? 0)}%`, 'Progress'] : [`₱${Number(v ?? 0)}k`, 'Budget']} />
                  <Bar dataKey="progress" name="Progress" radius={[3, 3, 0, 0]}
                    fill="#3b82f6"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">No active projects</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Task List ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Flag className="w-4 h-4 text-blue-500" />
              Task List (Live SQLite Data)
            </CardTitle>
            <div className="flex gap-2">
              {([['all', 'All'], ['active', 'In Progress'], ['completed', 'Completed']] as const).map(([v, l]) => (
                <Button
                  key={v}
                  variant={filter === v ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setFilter(v)}
                >
                  {l}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No tasks in this category</p>
          ) : (
            <div className="space-y-3">
              {filteredMissions.map(mission => {
                const sc = statusCfg[mission.status] ?? statusCfg.pending;
                const pc = priorityCfg[mission.priority] ?? priorityCfg.medium;
                return (
                  <div key={mission.id} className={`rounded-lg border p-4 ${sc.bg}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-0.5">{sc.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm">{mission.title}</h3>
                            <Badge variant="outline" className={`text-[10px] h-4 ${sc.color}`}>{sc.label}</Badge>
                            <span className={`text-[10px] font-medium ${pc.color}`}>{pc.label}Priority</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{mission.description}</p>
                          {/* Tags */}
                          {mission.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {mission.tags.map((tag, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-white border text-muted-foreground">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-xs shrink-0 space-y-1">
                        <div className="flex items-center gap-1 text-muted-foreground justify-end">
                          <Calendar className="w-3 h-3" />
                          <span>{mission.deadline}</span>
                        </div>
                        <div className="text-muted-foreground">
                          Owner: {mission.assignedTo}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{mission.progress}%</span>
                      </div>
                      <div className="w-full bg-white rounded-full h-1.5 border">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${mission.progress}%`, background: progressColor(mission.progress) }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Milestone Timeline + Finance Summary ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestones */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />
              Milestone Timeline (Live Data)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {milestones.map((item, i) => {
                const dotColor =
                  item.status === 'completed' ? 'bg-green-500' :
                  item.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300';
                const lineColor = i < milestones.length - 1 ?
                  (item.status === 'completed' ? 'bg-green-200' : 'bg-gray-200') : '';
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${dotColor}`} />
                      {i < milestones.length - 1 && (
                        <div className={`w-0.5 h-8 mt-1 ${lineColor}`} />
                      )}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{item.title}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${impactBadge(item.impact)}`}>
                          {item.impact}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Finance Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              Finance Summary (Live Data)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Income/Expense Cards */}
              {[
                { label: 'Total Revenue', val: finance.totalIncome,   icon: <TrendingUp className="w-4 h-4 text-green-500" />, color: 'text-green-700' },
                { label: 'Total Expenses', val: finance.totalExpenses, icon: <AlertTriangle className="w-4 h-4 text-red-400" />,  color: 'text-red-600'   },
                { label: 'Net Profit', val: finance.netProfit,     icon: <Star className="w-4 h-4 text-yellow-500" />,       color: 'text-purple-700' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                  </div>
                  <span className={`font-bold text-base ${item.color}`}>
                    ₱{item.val.toLocaleString()}
                  </span>
                </div>
              ))}
              {/* Profit Margin Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Profit Margin</span>
                  <span className="font-bold text-green-600">{finance.profitMargin}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{ width: `${finance.profitMargin}%` }}
                  />
                </div>
              </div>

              {/* Freelance Project Summary */}
              {freelance.projects.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground font-medium mb-2">Active Projects</p>
                  {freelance.projects.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs py-1">
                      <span className="truncate max-w-[55%] text-muted-foreground">{p.title}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-blue-400" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="font-medium">{p.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Quick Actions ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button variant="outline" className="h-auto py-3" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh All Data
        </Button>
        <Button variant="outline" className="h-auto py-3" onClick={() => window.open('/tasks', '_self')}>
          <Flag className="w-4 h-4 mr-2" />
          Manage Tasks
        </Button>
        <Button variant="outline" className="h-auto py-3" onClick={() => window.open('/analytics', '_self')}>
          <BarChart3 className="w-4 h-4 mr-2" />
          View Analytics Report
        </Button>
      </div>
    </div>
  );
}
