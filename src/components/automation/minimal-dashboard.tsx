'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Zap, CheckCircle, Activity, Cpu, Play, RefreshCw,
  Clock, AlertCircle, Circle, ChevronRight,
} from 'lucide-react';

// ─── 类型 ────────────────────────────────────────────────────────────────────
interface ComponentStatus {
  taskScheduler: boolean;
  dataSync: boolean;
  healthMonitor: boolean;
  ecosystemWatcher: boolean;
}
interface Stats {
  totalModules: number; enabledModules: number;
  totalTasks: number; enabledTasks: number;
  activeExecutions: number; totalEvents: number; totalMessages: number;
}
interface ServiceStatus {
  status: string; uptime: number; version: string;
  components: ComponentStatus; stats: Stats;
  systemHealth: { cpu: number | null; memory: number | null };
}
interface Module {
  id: string; name: string; status: 'running' | 'idle' | 'error';
  description: string; lastRun: string; nextRun: string;
  runCount: number; successRate: number; category: string;
}
interface Execution {
  id: string; moduleId: string; module: string; action: string;
  status: 'success' | 'running' | 'pending' | 'error';
  duration: string; timestamp: string;
}

// ─── MCP函数 ────────────────────────────────────────────────────────────────
function fmtUptime(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function fmtTime(iso: string) {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 60000)  return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return d.toLocaleDateString('zh-CN');
  } catch { return iso; }
}

const STATUS_LABEL: Record<string, string> = {
  running: '运行中', idle: '空闲', error: '异常',
  success: '成功', pending: '等待', 
};
const STATUS_COLOR = {
  running: 'bg-green-100 text-green-700 border-green-200',
  idle:    'bg-gray-100  text-gray-600  border-gray-200',
  error:   'bg-red-100   text-red-700   border-red-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const COMPONENT_LABELS: Record<keyof ComponentStatus, string> = {
  taskScheduler:    '任务调度器',
  dataSync:         '数据同步',
  healthMonitor:    '健康监控',
  ecosystemWatcher: '生态监控',
};

// ─── 主组件 ──────────────────────────────────────────────────────────────────
export default function MinimalAutomationDashboard() {
  const [service,    setService]    = useState<ServiceStatus | null>(null);
  const [modules,    setModules]    = useState<Module[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState<'overview' | 'modules' | 'executions'>('overview');
  const [triggering, setTriggering] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAll = useCallback(async () => {
    try {
      const [statusRes, modulesRes, execRes] = await Promise.all([
        fetch('/api/automation?action=status').then(r => r.json()),
        fetch('/api/automation?action=modules').then(r => r.json()),
        fetch('/api/automation?action=executions').then(r => r.json()),
      ]);
      if (statusRes.success)  setService(statusRes.data);
      if (modulesRes.success) setModules(modulesRes.data.modules ?? []);
      if (execRes.success)    setExecutions(execRes.data.executions ?? []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Automation fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 60000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const runModule = async (moduleId: string) => {
    setTriggering(moduleId);
    try {
      await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run-module', moduleId }),
      });
      await fetchAll();
    } finally {
      setTriggering(null);
    }
  };

  // ── KPI 数据 ──
  const kpis = [
    {
      label: '总模块',
      value: service?.stats.totalModules ?? 0,
      sub: `${service?.stats.enabledModules ?? 0} 启用中`,
      icon: <Zap className="w-5 h-5 text-blue-500" />,
      color: 'bg-blue-50 border-blue-100',
    },
    {
      label: '运行任务',
      value: service?.stats.totalTasks ?? 0,
      sub: `${service?.stats.activeExecutions ?? 0} 活跃执行`,
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      color: 'bg-green-50 border-green-100',
    },
    {
      label: '累计事件',
      value: service?.stats.totalEvents ?? 0,
      sub: `系统运行 ${fmtUptime(service?.uptime ?? 0)}`,
      icon: <Activity className="w-5 h-5 text-purple-500" />,
      color: 'bg-purple-50 border-purple-100',
    },
    {
      label: '平均成功率',
      value: modules.length
        ? `${Math.round(modules.reduce((a, m) => a + m.successRate, 0) / modules.length)}%`
        : '—',
      sub: `${modules.filter(m => m.status === 'running').length} 个模块运行中`,
      icon: <Cpu className="w-5 h-5 text-orange-500" />,
      color: 'bg-orange-50 border-orange-100',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
        <span className="text-slate-500">加载自动化数据…</span>
      </div>
    );
  }

  const chartData = modules.map(m => ({
    name:  m.name.replace('器', ''),
    成功率: m.successRate,
    运行次数: Math.min(m.runCount, 100),
  }));

  const tabs = [
    { id: 'overview',    label: '概览' },
    { id: 'modules',     label: '模块管理' },
    { id: 'executions',  label: '执行历史' },
  ] as const;

  return (
    <div className="p-6 space-y-6">

      {/* ── 页头 ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">自动化中心</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            系统状态：
            <span className="inline-flex items-center gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
              <span className="text-green-600 font-medium">运行中</span>
            </span>
            <span className="ml-3 text-slate-400">v{service?.version ?? '2.0.0'} · 运行 {fmtUptime(service?.uptime ?? 0)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            <Clock className="w-3 h-3 inline mr-1" />
            {lastRefresh.toLocaleTimeString('zh-CN')} 更新
          </span>
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> 刷新
          </Button>
        </div>
      </div>

      {/* ── KPI 卡片 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className={`border ${k.color}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500">{k.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{k.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{k.sub}</p>
                </div>
                <div className="p-2 rounded-lg bg-white shadow-sm">{k.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tab 栏 ── */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.id
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ 概览 Tab ══ */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 组件状态 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">系统组件状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {service && Object.entries(service.components).map(([key, ok]) => (
                  <div key={key} className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                    {ok
                      ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    }
                    <span className="text-sm text-slate-700">
                      {COMPONENT_LABELS[key as keyof ComponentStatus] ?? key}
                    </span>
                  </div>
                ))}
              </div>
              {service?.systemHealth.cpu !== null && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>CPU 使用率</span>
                    <span>{service?.systemHealth.cpu ?? 0}%</span>
                  </div>
                  <Progress value={service?.systemHealth.cpu ?? 0} className="h-1.5" />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>内存使用率</span>
                    <span>{service?.systemHealth.memory ?? 0}%</span>
                  </div>
                  <Progress value={service?.systemHealth.memory ?? 0} className="h-1.5" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 模块成功率图表 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">模块成功率</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v) => [`${v}%`, '成功率']} />
                  <Bar dataKey="成功率" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 近期执行摘要 */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">近期执行摘要</CardTitle>
                <button
                  onClick={() => setActiveTab('executions')}
                  className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
                >
                  查看全部 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {executions.slice(0, 4).map(e => (
                  <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50">
                    <Circle className={`w-2 h-2 shrink-0 ${
                      e.status === 'success' ? 'fill-green-500 text-green-500'
                      : e.status === 'running' ? 'fill-blue-500 text-blue-500 animate-pulse'
                      : e.status === 'error'   ? 'fill-red-500 text-red-500'
                      : 'fill-yellow-400 text-yellow-400'
                    }`} />
                    <span className="text-sm text-slate-700 flex-1 truncate">{e.module}</span>
                    <span className="text-xs text-slate-400 truncate max-w-[120px]">{e.action}</span>
                    <span className="text-xs text-slate-400 w-12 text-right">{e.duration}</span>
                    <span className="text-xs text-slate-300">{fmtTime(e.timestamp)}</span>
                  </div>
                ))}
                {executions.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">暂无执行记录</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══ 模块管理 Tab ══ */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map(m => (
            <Card key={m.id} className="border border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{m.name}</h3>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${STATUS_COLOR[m.status] ?? ''}`}
                      >
                        {STATUS_LABEL[m.status] ?? m.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{m.category}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={triggering === m.id}
                    onClick={() => runModule(m.id)}
                  >
                    {triggering === m.id
                      ? <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                      : <Play className="w-3 h-3 mr-1" />
                    }
                    {triggering === m.id ? '运行中…' : '运行'}
                  </Button>
                </div>

                <p className="text-sm text-slate-600 mb-4">{m.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>成功率</span>
                    <span className="font-medium text-slate-700">{m.successRate}%</span>
                  </div>
                  <Progress value={m.successRate} className="h-1.5" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wide text-slate-300 mb-0.5">上次运行</span>
                    <span>{fmtTime(m.lastRun)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wide text-slate-300 mb-0.5">下次运行</span>
                    <span>{fmtTime(m.nextRun)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wide text-slate-300 mb-0.5">累计执行</span>
                    <span>{m.runCount} 次</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {modules.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-10 col-span-2">暂无模块数据</p>
          )}
        </div>
      )}

      {/* ══ 执行历史 Tab ══ */}
      {activeTab === 'executions' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">执行历史</CardTitle>
              <span className="text-xs text-slate-400">共 {executions.length} 条记录</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
                    <th className="text-left pb-2 pr-4 font-medium">模块</th>
                    <th className="text-left pb-2 pr-4 font-medium">操作</th>
                    <th className="text-left pb-2 pr-4 font-medium">状态</th>
                    <th className="text-right pb-2 pr-4 font-medium">耗时</th>
                    <th className="text-right pb-2 font-medium">时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {executions.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 pr-4">
                        <span className="font-medium text-slate-700">{e.module}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-500 max-w-[160px] truncate">{e.action}</td>
                      <td className="py-2.5 pr-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${STATUS_COLOR[e.status] ?? ''}`}
                        >
                          {STATUS_LABEL[e.status] ?? e.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-right text-slate-400">{e.duration}</td>
                      <td className="py-2.5 text-right text-slate-300 text-xs">{fmtTime(e.timestamp)}</td>
                    </tr>
                  ))}
                  {executions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">暂无执行记录</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
