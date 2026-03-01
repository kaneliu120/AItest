'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Plus, RefreshCw, Play, CheckCircle, AlertTriangle, Clock,
  Calendar, Zap, Globe, Bot, Workflow, User, Tag,
  Circle, ChevronRight, Trash2, Edit3, ExternalLink,
  Download, Search, X, Filter,
} from 'lucide-react';

// ─── 类型 ────────────────────────────────────────────────────────────────────
type TaskStatus   = 'pending' | 'in-progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
type TaskSource   = 'manual' | 'ai' | 'module' | 'workflow' | 'booking';
type TaskType     = 'general' | 'development' | 'booking' | 'service';

interface Task {
  id: string; title: string; description: string;
  priority: TaskPriority; status: TaskStatus;
  source: TaskSource; type: TaskType;
  createdAt: string; updatedAt: string;
  dueDate?: string; assignedTo?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
}

interface ScannerState {
  lastScanAt: string | null; lastResult: string;
  totalScanned: number; totalCreated: number;
  isRunning: boolean; error: string | null;
  nextScanAt: string | null; interval: number;
  timerActive: boolean;
}

// ─── 配置 ────────────────────────────────────────────────────────────────────
const PRI_CFG: Record<TaskPriority, { label: string; color: string; dot: string }> = {
  critical: { label: '紧急', color: 'bg-red-100 text-red-700 border-red-200',    dot: 'bg-red-500' },
  high:     { label: '高',   color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  medium:   { label: '中',   color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  low:      { label: '低',   color: 'bg-green-100 text-green-700 border-green-200',  dot: 'bg-green-400' },
};
const STA_CFG: Record<TaskStatus, { label: string; color: string }> = {
  pending:     { label: '待处理', color: 'bg-slate-100 text-slate-600' },
  'in-progress': { label: '进行中', color: 'bg-blue-100 text-blue-700' },
  completed:   { label: '已完成', color: 'bg-green-100 text-green-700' },
  cancelled:   { label: '已取消', color: 'bg-red-100 text-red-600' },
};
const SRC_CFG: Record<TaskSource, { label: string; icon: React.ReactNode; color: string }> = {
  manual:   { label: '手动',   icon: <User     className="w-3 h-3" />, color: 'bg-slate-100 text-slate-600' },
  ai:       { label: 'AI',     icon: <Bot      className="w-3 h-3" />, color: 'bg-purple-100 text-purple-600' },
  module:   { label: '模块',   icon: <Zap      className="w-3 h-3" />, color: 'bg-orange-100 text-orange-600' },
  workflow: { label: '工作流', icon: <Workflow  className="w-3 h-3" />, color: 'bg-cyan-100 text-cyan-700' },
  booking:  { label: '预约',   icon: <Calendar className="w-3 h-3" />, color: 'bg-indigo-100 text-indigo-700' },
};
const TYPE_CFG: Record<TaskType, { label: string; color: string; autoFlow?: boolean }> = {
  general:     { label: '通用',   color: 'bg-slate-100 text-slate-600' },
  development: { label: '开发',   color: 'bg-violet-100 text-violet-700', autoFlow: true },
  booking:     { label: '预约',   color: 'bg-indigo-100 text-indigo-700' },
  service:     { label: '服务',   color: 'bg-teal-100 text-teal-700' },
};

function fmtTime(iso?: string | null) {
  if (!iso) return '—';
  try {
    const d = new Date(iso), diff = Date.now() - d.getTime();
    if (diff < 60000)    return '刚刚';
    if (diff < 3600000)  return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return d.toLocaleDateString('zh-CN');
  } catch { return iso; }
}
function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('zh-CN'); } catch { return iso; }
}

// ─── 添加/编辑任务对话框 ─────────────────────────────────────────────────────
function TaskDialog({ task, onSave, onClose }: {
  task?: Task | null;
  onSave: (data: Partial<Task>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title:       task?.title       ?? '',
    description: task?.description ?? '',
    priority:    task?.priority    ?? 'medium' as TaskPriority,
    type:        task?.type        ?? 'general' as TaskType,
    source:      task?.source      ?? 'manual' as TaskSource,
    dueDate:     task?.dueDate     ?? '',
    assignedTo:  task?.assignedTo  ?? '',
    tags:        task?.tags?.join(', ') ?? '',
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-base">{task ? '编辑任务' : '添加任务'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <input
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="任务标题 *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <textarea
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
            placeholder="任务描述"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">优先级</label>
              <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}>
                {(['critical','high','medium','low'] as TaskPriority[]).map(p => <option key={p} value={p}>{PRI_CFG[p].label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">任务类型</label>
              <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TaskType }))}>
                <option value="general">通用任务</option>
                <option value="development">开发任务（→自动化）</option>
                <option value="service">服务任务</option>
                <option value="booking">预约任务</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">来源</label>
              <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as TaskSource }))}>
                <option value="manual">手动添加</option>
                <option value="ai">AI添加</option>
                <option value="workflow">工作流</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">截止日期</label>
              <input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" value={form.dueDate?.split('T')[0] ?? ''} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
          <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" placeholder="负责人" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} />
          <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" placeholder="标签（逗号分隔）" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          {form.type === 'development' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 rounded-lg border border-violet-200">
              <Zap className="w-4 h-4 text-violet-600 shrink-0" />
              <p className="text-xs text-violet-700">开发类任务将自动流转到<strong>自动化模块</strong>进行跟踪</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 p-5 pt-0 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" onClick={() => form.title && onSave({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) })} className="bg-blue-600 hover:bg-blue-700 text-white">
            {task ? '保存修改' : '创建任务'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── 主组件 ──────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const [tasks,    setTasks]    = useState<Task[]>([]);
  const [scanner,  setScanner]  = useState<ScannerState | null>(null);
  const [tab,      setTab]      = useState<'all' | 'booking' | 'dev' | 'workflow' | 'stats'>('all');
  const [search,   setSearch]   = useState('');
  const [filterSrc, setFilterSrc] = useState<TaskSource | 'all'>('all');
  const [filterSta, setFilterSta] = useState<TaskStatus | 'all'>('all');
  const [loading,  setLoading]  = useState(true);
  const [scanning, setScanning] = useState(false);
  const [dialog,   setDialog]   = useState<{ mode: 'add' | 'edit'; task?: Task } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [msg,      setMsg]      = useState<{ type: 'ok'|'err'; text: string } | null>(null);
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const toast = (type: 'ok'|'err', text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

  // ── 数据加载 ──
  const fetchAll = useCallback(async () => {
    try {
      const [tasksRes, scanRes] = await Promise.all([
        fetch('/api/tasks?action=list').then(r => r.json()),
        fetch('/api/workflows/bookings?action=status').then(r => r.json()),
      ]);
      if (tasksRes.success)  setTasks(tasksRes.data?.tasks ?? tasksRes.data ?? []);
      if (scanRes.success)   setScanner(scanRes.data.scanner);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── 扫描预约 ──
  const scanBookings = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/workflows/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan-now' }),
      });
      const data = await res.json();
      if (data.success) {
        toast('ok', data.message ?? '扫描完成');
        await fetchAll();
      } else { toast('err', data.error ?? '扫描失败'); }
    } catch { toast('err', '扫描请求失败'); }
    finally { setScanning(false); }
  };

  const toggleTimer = async (start: boolean) => {
    const res = await fetch('/api/workflows/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: start ? 'start-timer' : 'stop-timer', interval: 30 }),
    });
    const data = await res.json();
    if (data.success) { toast('ok', start ? '定时扫描已启动（30分钟间隔）' : '定时扫描已停止'); await fetchAll(); }
  };

  // ── CRUD ──
  const saveTask = async (data: Partial<Task>) => {
    const isEdit = dialog?.mode === 'edit' && dialog.task;
    const res = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: isEdit ? 'update' : 'create',
        ...(isEdit ? { id: dialog!.task!.id } : {}),
        ...data,
      }),
    });
    const d = await res.json();
    if (d.success) { toast('ok', isEdit ? '任务已更新' : '任务已创建'); setDialog(null); await fetchAll(); }
    else toast('err', d.error ?? '操作失败');
  };

  const deleteTask = async (id: string) => {
    setDeleting(id);
    const res = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    const d = await res.json();
    if (d.success) { toast('ok', '任务已删除'); await fetchAll(); }
    else toast('err', d.error ?? '删除失败');
    setDeleting(null);
  };

  const updateStatus = async (id: string, status: TaskStatus) => {
    await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-status', id, status }),
    });
    await fetchAll();
  };

  // ── 统计 ──
  const stats = {
    total:      tasks.length,
    pending:    tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed:  tasks.filter(t => t.status === 'completed').length,
    booking:    tasks.filter(t => t.source === 'booking').length,
    dev:        tasks.filter(t => t.type === 'development').length,
    workflow:   tasks.filter(t => t.source === 'workflow' || t.source === 'booking').length,
  };

  // ── 过滤 ──
  const filterTasks = (list: Task[]) => {
    let r = list;
    if (search)           r = r.filter(t => (t.title + t.description + t.tags.join(' ')).toLowerCase().includes(search.toLowerCase()));
    if (filterSrc !== 'all') r = r.filter(t => t.source === filterSrc);
    if (filterSta !== 'all') r = r.filter(t => t.status === filterSta);
    return r;
  };

  const tabTasks = () => {
    if (tab === 'booking') return filterTasks(tasks.filter(t => t.source === 'booking'));
    if (tab === 'dev')     return filterTasks(tasks.filter(t => t.type === 'development'));
    if (tab === 'workflow') return filterTasks(tasks.filter(t => t.source === 'workflow'));
    return filterTasks(tasks);
  };

  const filtered  = tabTasks();
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged     = filtered.slice((page - 1) * pageSize, page * pageSize);

  const tabList = [
    { id: 'all',      label: `全部 (${stats.total})`,       icon: <Filter  className="w-3.5 h-3.5" /> },
    { id: 'booking',  label: `预约任务 (${stats.booking})`, icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'dev',      label: `开发任务 (${stats.dev})`,     icon: <Zap      className="w-3.5 h-3.5" /> },
    { id: 'workflow', label: `工作流任务 (${stats.workflow})`, icon: <Workflow className="w-3.5 h-3.5" /> },
    { id: 'stats',    label: '统计',                        icon: <CheckCircle className="w-3.5 h-3.5" /> },
  ] as const;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
      <span className="text-slate-500">加载任务数据…</span>
    </div>
  );

  return (
    <div className="p-6 space-y-5">

      {/* ── 消息提示 ── */}
      {msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${
          msg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {msg.type === 'ok' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* ── 对话框 ── */}
      {dialog && <TaskDialog task={dialog.task} onSave={saveTask} onClose={() => setDialog(null)} />}

      {/* ── 页头 ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">任务管理</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            手动 · AI添加 · 工作流触发 · 预约扫描
            {stats.dev > 0 && <span className="ml-2 text-violet-600">· {stats.dev} 个开发任务已流转自动化</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> 刷新
          </Button>
          <Button size="sm" onClick={() => setDialog({ mode: 'add' })} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-3.5 h-3.5 mr-1" /> 添加任务
          </Button>
        </div>
      </div>

      {/* ── KPI 卡片 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '全部任务',  value: stats.total,      sub: `${stats.completed} 已完成`,       icon: <Filter    className="w-5 h-5 text-blue-500" />,   color: 'bg-blue-50 border-blue-100',    click: () => { setTab('all'); setFilterSta('all'); } },
          { label: '进行中',    value: stats.inProgress, sub: `${stats.pending} 待处理`,          icon: <Clock     className="w-5 h-5 text-yellow-500" />, color: 'bg-yellow-50 border-yellow-100', click: () => { setTab('all'); setFilterSta('in-progress'); } },
          { label: '预约任务',  value: stats.booking,    sub: '来自工作流扫描',                  icon: <Calendar  className="w-5 h-5 text-indigo-500" />, color: 'bg-indigo-50 border-indigo-100', click: () => setTab('booking') },
          { label: '开发任务',  value: stats.dev,        sub: '→ 已流转自动化模块',              icon: <Zap       className="w-5 h-5 text-violet-500" />, color: 'bg-violet-50 border-violet-100', click: () => setTab('dev') },
        ].map(k => (
          <Card key={k.label} className={`border ${k.color} cursor-pointer hover:shadow-sm`} onClick={k.click}>
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
        {tabList.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ══ 工作流配置 Tab ══ */}
      {tab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['manual','ai','workflow','booking'] as TaskSource[]).map(src => {
              const cnt = tasks.filter(t => t.source === src).length;
              return (
                <Card key={src} className="border border-slate-200">
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-2">{SRC_CFG[src].icon}</div>
                    <div className="text-2xl font-bold">{cnt}</div>
                    <div className="text-xs text-slate-500">{SRC_CFG[src].label}来源</div>
                    <div className="text-xs text-slate-400 mt-0.5">{tasks.length > 0 ? Math.round(cnt / tasks.length * 100) : 0}%</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">任务类型分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(['general','development','service','booking'] as TaskType[]).map(type => {
                  const cnt = tasks.filter(t => t.type === type).length;
                  const pct = tasks.length > 0 ? Math.round(cnt / tasks.length * 100) : 0;
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <div className="flex items-center gap-2">
                          <span>{TYPE_CFG[type].label}</span>
                          {TYPE_CFG[type].autoFlow && <span className="flex items-center gap-1 text-violet-600"><Zap className="w-2.5 h-2.5" />→ 自动化</span>}
                        </div>
                        <span>{cnt} 个 ({pct}%)</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          {stats.dev > 0 && (
            <Card className="border border-violet-200 bg-violet-50/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-violet-600" />
                    <div>
                      <p className="font-medium text-slate-800 text-sm">开发任务 → 自动化模块</p>
                      <p className="text-xs text-slate-500">{stats.dev} 个开发任务已流转到自动化中心跟踪</p>
                    </div>
                  </div>
                  <a href="/automation" className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800">
                    <ExternalLink className="w-3.5 h-3.5" /> 前往自动化
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ══ 工作流配置 Tab (workflow) ══ */}
      {tab === 'workflow' && (
        <div className="space-y-4">
          {/* 预约扫描器 */}
          <Card className="border border-cyan-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-600" /> 预约记录扫描器
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    定时扫描 myskillstore.fun 预约记录，自动生成任务
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleTimer(!scanner?.timerActive)}
                    className={scanner?.timerActive ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}>
                    {scanner?.timerActive ? '停止定时' : '启动定时'}
                  </Button>
                  <Button size="sm" onClick={scanBookings} disabled={scanning}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white">
                    {scanning ? <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />扫描中…</> : <><Play className="w-3.5 h-3.5 mr-1" />立即扫描</>}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: '上次扫描', value: fmtTime(scanner?.lastScanAt ?? null) },
                  { label: '下次扫描', value: scanner?.timerActive ? fmtTime(scanner?.nextScanAt ?? null) : '未启动' },
                  { label: '累计扫描', value: `${scanner?.totalScanned ?? 0} 条` },
                  { label: '生成任务', value: `${scanner?.totalCreated ?? 0} 个` },
                ].map(s => (
                  <div key={s.label} className="bg-cyan-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-slate-400">{s.label}</div>
                    <div className="text-sm font-semibold text-slate-700 mt-0.5">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${scanner?.timerActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <div>
                  <p className="text-xs font-medium text-slate-700">
                    {scanner?.timerActive ? `定时扫描运行中（每 ${scanner.interval} 分钟）` : '定时扫描已停止'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{scanner?.lastResult ?? '尚未运行'}</p>
                </div>
              </div>
              {scanner?.error && (
                <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />{scanner.error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 数据来源说明 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">任务来源渠道</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { icon: <User className="w-4 h-4 text-slate-500" />, label: '手动添加', desc: '凯哥直接在任务管理中创建', color: 'bg-slate-100' },
                  { icon: <Bot className="w-4 h-4 text-purple-500" />, label: 'AI 添加', desc: '小A根据对话指令自动创建任务', color: 'bg-purple-50' },
                  { icon: <Globe className="w-4 h-4 text-cyan-600" />, label: '工作流 · 预约扫描', desc: `扫描 ${scanner ? 'myskillstore.fun/en/admin/bookings' : '...'} 新记录，自动生成服务任务`, color: 'bg-cyan-50' },
                  { icon: <Zap className="w-4 h-4 text-violet-600" />, label: '开发任务 → 自动化', desc: '开发类任务自动流转到自动化模块，仅此类型生效', color: 'bg-violet-50' },
                ].map(r => (
                  <div key={r.label} className={`flex items-start gap-3 p-3 ${r.color} rounded-lg`}>
                    <div className="mt-0.5 shrink-0">{r.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{r.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══ 任务列表（全部/预约/开发/工作流） ══ */}
      {tab !== 'stats' && tab !== 'workflow' && (
        <div className="space-y-4">
          {/* 开发任务流转提示 */}
          {tab === 'dev' && stats.dev > 0 && (
            <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-lg border border-violet-200">
              <Zap className="w-4 h-4 text-violet-600 shrink-0" />
              <p className="text-xs text-violet-700">
                以下 {stats.dev} 个开发任务已流转到<strong>自动化模块</strong>跟踪执行。
                其他类型任务（通用/服务/预约）<strong>不会</strong>流转到自动化。
              </p>
              <a href="/automation" className="shrink-0 text-xs text-violet-600 hover:underline flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />自动化
              </a>
            </div>
          )}

          {tab === 'booking' && (
            <div className="flex items-center gap-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
              <Calendar className="w-4 h-4 text-cyan-600 shrink-0" />
              <p className="text-xs text-cyan-700">预约任务来自工作流扫描器，类型为 AI 安装服务。</p>
              <Button size="sm" variant="outline" className="ml-auto h-7 text-xs border-cyan-300 text-cyan-700 hover:bg-cyan-50" onClick={scanBookings} disabled={scanning}>
                {scanning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <><Play className="w-3 h-3 mr-1" />立即扫描</>}
              </Button>
            </div>
          )}

          {/* 搜索/过滤栏 */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="搜索任务…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            {tab === 'all' && (
              <select className="px-3 py-2 text-sm border border-slate-200 rounded-lg" value={filterSrc} onChange={e => { setFilterSrc(e.target.value as TaskSource | 'all'); setPage(1); }}>
                <option value="all">全部来源</option>
                {(['manual','ai','workflow','booking'] as TaskSource[]).map(s => <option key={s} value={s}>{SRC_CFG[s].label}</option>)}
              </select>
            )}
            <select className="px-3 py-2 text-sm border border-slate-200 rounded-lg" value={filterSta} onChange={e => { setFilterSta(e.target.value as TaskStatus | 'all'); setPage(1); }}>
              <option value="all">全部状态</option>
              {(['pending','in-progress','completed','cancelled'] as TaskStatus[]).map(s => <option key={s} value={s}>{STA_CFG[s].label}</option>)}
            </select>
          </div>

          {/* 任务列表 */}
          {paged.length === 0 ? (
            <Card className="border border-dashed border-slate-300">
              <CardContent className="p-10 text-center text-slate-400">
                <Filter className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">暂无任务</p>
                {tab === 'booking' && <Button variant="outline" size="sm" className="mt-4" onClick={scanBookings}><Play className="w-3.5 h-3.5 mr-1" />扫描预约记录</Button>}
                {(tab === 'all' || tab === 'dev') && <Button variant="outline" size="sm" className="mt-4" onClick={() => setDialog({ mode: 'add' })}><Plus className="w-3.5 h-3.5 mr-1" />添加任务</Button>}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {paged.map(t => (
                <Card key={t.id} className={`border ${t.type === 'development' ? 'border-violet-200' : t.source === 'booking' ? 'border-indigo-200' : 'border-slate-200'} hover:shadow-sm transition-shadow`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Circle className={`w-2.5 h-2.5 mt-1.5 shrink-0 ${PRI_CFG[t.priority].dot} fill-current`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 text-sm leading-snug truncate">{t.title}</p>
                            {t.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.description.split('\n')[0]}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setDialog({ mode: 'edit', task: t })} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            <button onClick={() => deleteTask(t.id)} disabled={deleting === t.id} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                              {deleting === t.id ? <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {/* 状态下拉 */}
                          <select
                            value={t.status}
                            onChange={e => updateStatus(t.id, e.target.value as TaskStatus)}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer ${STA_CFG[t.status].color}`}
                          >
                            {(['pending','in-progress','completed','cancelled'] as TaskStatus[]).map(s => <option key={s} value={s}>{STA_CFG[s].label}</option>)}
                          </select>

                          <Badge variant="outline" className={`text-[10px] ${PRI_CFG[t.priority].color}`}>{PRI_CFG[t.priority].label}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${TYPE_CFG[t.type].color} flex items-center gap-0.5`}>
                            {t.type === 'development' && <Zap className="w-2.5 h-2.5" />}
                            {TYPE_CFG[t.type].label}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${SRC_CFG[t.source].color} flex items-center gap-0.5`}>
                            {SRC_CFG[t.source].icon}{SRC_CFG[t.source].label}
                          </Badge>

                          {t.dueDate && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{fmtDate(t.dueDate)}</span>}
                          {t.assignedTo && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><User className="w-2.5 h-2.5" />{t.assignedTo}</span>}
                          {t.tags.map(tag => <span key={tag} className="text-[10px] text-slate-400 flex items-center gap-0.5"><Tag className="w-2.5 h-2.5" />{tag}</span>)}
                        </div>

                        {/* 预约详情展开 */}
                        {t.source === 'booking' && t.metadata && (
                          <div className="mt-2 p-2 bg-indigo-50 rounded text-xs text-indigo-700 space-y-0.5">
                            {t.metadata.customerName && <div>客户：{String(t.metadata.customerName)}</div>}
                            {t.metadata.email && <div>邮箱：{String(t.metadata.email)}</div>}
                            {t.metadata.phone && <div>电话：{String(t.metadata.phone)}</div>}
                            {t.metadata.bookingStatus && <div>预约状态：{String(t.metadata.bookingStatus)}</div>}
                          </div>
                        )}

                        {t.type === 'development' && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-violet-600">
                            <ChevronRight className="w-3 h-3" />
                            <span>已流转到</span>
                            <a href="/automation" className="underline hover:text-violet-800">自动化模块</a>
                          </div>
                        )}

                        <div className="mt-1.5 text-[10px] text-slate-300">{fmtTime(t.updatedAt)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 分页 */}
          {filtered.length > pageSize && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span>第 {(page-1)*pageSize+1}–{Math.min(page*pageSize, filtered.length)} 条，共 {filtered.length} 条</span>
              <div className="flex items-center gap-1">
                <select className="px-2 py-1 border border-slate-200 rounded text-xs" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
                  {[10,20,50].map(n => <option key={n} value={n}>{n}条/页</option>)}
                </select>
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1} className="px-2 py-1 border rounded disabled:opacity-40 hover:bg-slate-50">‹</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.min(Math.max(1, page - 2), totalPages - 4) + i;
                  return p >= 1 && p <= totalPages ? (
                    <button key={p} onClick={() => setPage(p)} className={`px-2 py-1 border rounded ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-slate-50'}`}>{p}</button>
                  ) : null;
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages} className="px-2 py-1 border rounded disabled:opacity-40 hover:bg-slate-50">›</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
