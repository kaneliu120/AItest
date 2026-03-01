'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, CheckSquare,
  Cpu, Server, RefreshCw, Activity, AlertTriangle, CheckCircle,
  Clock, Layers, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AnalyticsData {
  overallScore: number;
  generatedAt: string;
  finance: {
    totalIncome: number; totalExpenses: number; netProfit: number;
    profitMargin: number; totalTx: number; currency: string;
    monthlyTrend: Array<{ month: string; income: number; expenses: number; profit: number }>;
    categoryBreakdown: Array<{ name: string; value: number }>;
    recentTransactions: Array<{ id: string; date: string; type: string; category: string; description: string; amount: number }>;
    available: boolean;
  };
  tasks: {
    total: number; completed: number; inProgress: number;
    pending: number; overdue: number; completionRate: number;
    statusDist: Array<{ name: string; value: number; color: string }>;
    available: boolean;
  };
  freelance: {
    total: number; active: number; avgProgress: number; totalBudget: number;
    projects: Array<{ id: string; title: string; progress: number; budget: number; deadline: string; status: string }>;
    available: boolean;
  };
  ecosystem: {
    totalTools: number; healthyTools: number; warningTools: number; errorTools: number;
    healthRate: number;
    recentAlerts: Array<{ level: string; message: string; tool: string }>;
    available: boolean;
  };
  health: {
    overall: number; cpuUsage: number; memoryUsage: number;
    responseTime: number;
    components: Array<{ name: string; status: string; desc: string }>;
    available: boolean;
  };
}

// ─── MCP Functions ────────────────────────────────────────────────────────────
const fmt = (n: number, currency = '') =>
  currency ? `${currency} ${n.toLocaleString()}` : n.toLocaleString();

const healthColor = (score: number) =>
  score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';

const healthBg = (score: number) =>
  score >= 80 ? 'bg-green-50 border-green-200' : score >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';

const statusIcon = (status: string) => {
  if (status === 'healthy' || status === 'up') return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  return <AlertTriangle className="w-4 h-4 text-red-500" />;
};

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Analytics fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const t = setInterval(fetchData, 60000);
    return () => clearInterval(t);
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-muted-foreground">Loading real data...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-6 text-red-500">Data load failed, please check API service</div>;

  const { finance, tasks, freelance, ecosystem, health, overallScore } = data;

  return (
    <div className="space-y-6 pb-8">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            Analytics Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All data from local real sources · 
            {lastRefresh && ` Last updated: ${lastRefresh.toLocaleTimeString('zh-CN')}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`text-center px-4 py-2 rounded-lg border font-bold text-2xl ${healthBg(overallScore)}`}>
            <span className={healthColor(overallScore)}>{overallScore}</span>
            <p className="text-xs text-muted-foreground font-normal">Overall Score</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* ─── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Profit */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold text-green-700">
                  ₱{(finance.netProfit / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  Profit Margin {finance.profitMargin}%
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 opacity-70" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Income ₱{fmt(finance.totalIncome)} · Expenses ₱{fmt(finance.totalExpenses)}
            </div>
          </CardContent>
        </Card>

        {/* Task Completion Rate */}
        <Card className={tasks.completionRate >= 80 ? 'border-blue-200 bg-blue-50' : 'border-yellow-200 bg-yellow-50'}>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Task Completion Rate</p>
                <p className="text-2xl font-bold text-blue-700">{tasks.completionRate}%</p>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                  <CheckSquare className="w-3 h-3" />
                  {tasks.completed}/{tasks.total} Completed
                </p>
              </div>
              <CheckSquare className="w-8 h-8 text-blue-500 opacity-70" />
            </div>
            {tasks.overdue > 0 && (
              <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {tasks.overdue} Overdue
              </div>
            )}
          </CardContent>
        </Card>

        {/* MCP Ecosystem Health */}
        <Card className={ecosystem.healthRate >= 80 ? 'border-purple-200 bg-purple-50' : 'border-yellow-200 bg-yellow-50'}>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">MCP Ecosystem Health</p>
                <p className="text-2xl font-bold text-purple-700">{ecosystem.healthRate}%</p>
                <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                  <Server className="w-3 h-3" />
                  {ecosystem.healthyTools}/{ecosystem.totalTools} Normal
                </p>
              </div>
              <Server className="w-8 h-8 text-purple-500 opacity-70" />
            </div>
            {ecosystem.errorTools > 0 && (
              <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {ecosystem.errorTools} Errors
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Resources */}
        <Card className={`${healthBg(health.overall)} border`}>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">System Health</p>
                <p className={`text-2xl font-bold ${healthColor(health.overall)}`}>{health.overall}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Cpu className="w-3 h-3" />
                  CPU {health.cpuUsage}%
                </p>
              </div>
              <Activity className={`w-8 h-8 opacity-70 ${healthColor(health.overall)}`} />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Memory {health.memoryUsage}% · Response {health.responseTime}ms
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Charts ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Finance Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              Finance Trend (Live Data)
            </CardTitle>
            <CardDescription>Monthly income / expenses / profit</CardDescription>
          </CardHeader>
          <CardContent>
            {finance.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={finance.monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => `₱${Number(v ?? 0).toLocaleString()}`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="income" name="Income" fill="#22c55e" radius={[3,3,0,0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3,3,0,0]} />
                  <Bar dataKey="profit" name="Profit" fill="#3b82f6" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                No monthly trend data (add more finance records)
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-blue-500" />
              Task Status Distribution (Live Data)
            </CardTitle>
            <CardDescription>Total {tasks.total} tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.statusDist.filter(s => s.value > 0).length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={tasks.statusDist.filter(s => s.value > 0)}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      dataKey="value" nameKey="name"
                    >
                      {tasks.statusDist.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {tasks.statusDist.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Completion Rate</span>
                      <span className="text-green-600">{tasks.completionRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">No task data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Active Projects + MCP Alerts ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Freelance Project Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Active Project Progress (Live Data)
            </CardTitle>
            <CardDescription>
              {freelance.active} active projects · Total Budget ₱{fmt(freelance.totalBudget)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {freelance.projects.length > 0 ? (
              <div className="space-y-4">
                {freelance.projects.map(p => (
                  <div key={p.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate max-w-[60%]">{p.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">₱{(p.budget/1000).toFixed(0)}k</span>
                        <span className="font-semibold text-blue-600">{p.progress}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${p.progress}%`,
                          background: p.progress >= 80 ? '#22c55e' : p.progress >= 50 ? '#3b82f6' : '#f59e0b'
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <Badge variant="outline" className="text-[10px] h-4">In Progress</Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {p.deadline}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">No active projects</div>
            )}
          </CardContent>
        </Card>

        {/* MCP Ecosystem Alerts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              MCP Ecosystem Alerts (Live Data)
            </CardTitle>
            <CardDescription>
              {ecosystem.healthyTools} Normal · {ecosystem.warningTools} Warning · {ecosystem.errorTools} Error
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* MCP Status Overview */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Normal', val: ecosystem.healthyTools, color: 'text-green-600 bg-green-50' },
                { label: 'Warning', val: ecosystem.warningTools, color: 'text-yellow-600 bg-yellow-50' },
                { label: 'Error', val: ecosystem.errorTools,  color: 'text-red-600 bg-red-50' },
              ].map(s => (
                <div key={s.label} className={`text-center p-2 rounded-lg ${s.color}`}>
                  <p className="text-xl font-bold">{s.val}</p>
                  <p className="text-xs">{s.label}</p>
                </div>
              ))}
            </div>
            {/* Alerts List */}
            {ecosystem.recentAlerts.length > 0 ? (
              <div className="space-y-2">
                {ecosystem.recentAlerts.slice(0, 4).map((alert, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2 rounded text-xs ${
                    alert.level === 'error' ? 'bg-red-50' : 'bg-yellow-50'
                  }`}>
                    <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                      alert.level === 'error' ? 'text-red-500' : 'text-yellow-500'
                    }`} />
                    <div>
                      <span className="font-medium">{alert.tool}: </span>
                      <span className="text-muted-foreground">{alert.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-green-600 text-center py-4">✅ No alerts, system normal</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── System Components + Recent Transactions ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Components */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              System Component Status (Live Data)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health.components.map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50">
                  <div className="mt-0.5">{statusIcon(c.status)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.desc}</p>
                  </div>
                  <Badge variant={c.status === 'healthy' ? 'default' : 'destructive'} className="text-[10px] shrink-0">
                    {c.status === 'healthy' ? 'Normal' : c.status === 'warning' ? 'Warning' : 'Error'}
                  </Badge>
                </div>
              ))}
            </div>
            {/* Resource Usage Progress Bars */}
            <div className="mt-4 space-y-2">
              {[
                { label: 'CPU', val: health.cpuUsage, color: health.cpuUsage > 80 ? '#ef4444' : '#3b82f6' },
                { label: 'Memory', val: health.memoryUsage, color: health.memoryUsage > 85 ? '#ef4444' : '#8b5cf6' },
              ].map(r => (
                <div key={r.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-medium">{r.val}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${r.val}%`, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Finance Records */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              Recent Finance Records (Live Data)
            </CardTitle>
            <CardDescription>Total {finance.totalTx} transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {finance.recentTransactions.length > 0 ? (
              <div className="space-y-2">
                {finance.recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${tx.type === 'income' ? 'bg-green-500' : 'bg-red-400'}`} />
                      <div>
                        <p className="text-sm font-medium truncate max-w-[180px]">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{tx.category} · {tx.date}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.type === 'income' ? '+' : '-'}₱{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">No finance records</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
