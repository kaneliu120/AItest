'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Briefcase, Users, TrendingUp, DollarSign, Plus, Edit3, Trash2,
  RefreshCw, ChevronDown, X, Search, CheckCircle, Clock, Zap,
  BookOpen, Bot, UserPlus, Filter, ChevronRight
} from 'lucide-react';

// ─── 类型 ────────────────────────────────────────────────────────────────────
type ProjectStatus = '创建' | '分析' | '接单' | '自动化' | '发布' | '待付款' | '已付款' | '已完成' | '已取消';
type ProjectSource = 'knowledge_base' | 'manual' | 'ai';

interface Project {
  id: string; title: string; description: string;
  status: ProjectStatus; source: ProjectSource; businessSource: string;
  clientId: string; clientName: string;
  budget: number; currency: string; deadline: string; progress: number;
  category: string; automationStatus: string; notes: string;
  createdAt: string; updatedAt: string;
}

interface Client {
  id: string; name: string; company: string; email: string;
  phone: string; notes: string; totalSpent: number; projectsCount: number;
}

interface Stats {
  total: number; totalBudget: number; earned: number;
  active: number; statusMap: Record<string, number>; sourceMap: Record<string, number>;
}

// ─── 配置 ────────────────────────────────────────────────────────────────────
// 项目状态流程：创建→分析→接单→自动化→发布→待付款→已付款→已完成
const STATUS_FLOW: ProjectStatus[] = ['创建','分析','接单','自动化','发布','待付款','已付款','已完成','已取消'];

const STATUS_CFG: Record<ProjectStatus, { color: string; bg: string; dot: string }> = {
  '创建':   { color: 'text-gray-700',   bg: 'bg-gray-50 border-gray-200',     dot: 'bg-gray-400' },
  '分析':   { color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     dot: 'bg-blue-400' },
  '接单':   { color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-500' },
  '自动化': { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
  '发布':   { color: 'text-cyan-700',   bg: 'bg-cyan-50 border-cyan-200',     dot: 'bg-cyan-500' },
  '待付款': { color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500' },
  '已付款': { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  '已完成': { color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   dot: 'bg-green-500' },
  '已取消': { color: 'text-red-600',    bg: 'bg-red-50 border-red-200',       dot: 'bg-red-400' },
};

const SOURCE_CFG: Record<ProjectSource, { label: string; icon: React.ReactNode; color: string }> = {
  knowledge_base: { label: '知识库', icon: <BookOpen className="w-3 h-3" />, color: 'text-blue-600' },
  manual:         { label: '手动',   icon: <Edit3 className="w-3 h-3" />,    color: 'text-gray-600' },
  ai:             { label: 'AI推荐', icon: <Bot className="w-3 h-3" />,      color: 'text-purple-600' },
};

const BIZ_SOURCES = ['直接联系','知识库分析','Upwork','Fiverr','Freelancer','LinkedIn','推荐','内部项目','其他'];
const CATEGORIES  = ['AI开发','Web开发','移动开发','数据分析','系统开发','自动化','UI设计','其他'];
const fmt = (n: number) => `₱${n.toLocaleString()}`;

// ─── 项目状态进度条 ───────────────────────────────────────────────────────────
function StatusStepper({ status }: { status: ProjectStatus }) {
  const steps = STATUS_FLOW.filter(s => s !== '已取消');
  const idx   = steps.indexOf(status);
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto py-0.5">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
            i < idx  ? 'text-green-600 bg-green-50' :
            i === idx ? `${STATUS_CFG[status].color} ${STATUS_CFG[status].bg}` :
                       'text-gray-400'
          }`}>
            {i < idx && <CheckCircle className="w-2.5 h-2.5" />}
            {i === idx && <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />}
            {s}
          </div>
          {i < steps.length - 1 && <ChevronRight className="w-2.5 h-2.5 text-gray-300 shrink-0" />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── 弹窗：添加/编辑项目 ─────────────────────────────────────────────────────
function ProjectDialog({ project, clients, onClose, onSave }: {
  project: Project | null;
  clients: Client[];
  onClose: () => void;
  onSave: (data: Partial<Project>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    title:          project?.title ?? '',
    description:    project?.description ?? '',
    status:         (project?.status ?? '创建') as ProjectStatus,
    source:         (project?.source ?? 'manual') as ProjectSource,
    businessSource: project?.businessSource ?? '直接联系',
    clientId:       project?.clientId ?? '',
    clientName:     project?.clientName ?? '',
    budget:         String(project?.budget ?? ''),
    currency:       project?.currency ?? 'PHP',
    deadline:       project?.deadline ?? '',
    progress:       String(project?.progress ?? 0),
    category:       project?.category ?? '其他',
    notes:          project?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const f = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await onSave({
      ...form,
      budget:   Number(form.budget) || 0,
      progress: Math.min(100, Math.max(0, Number(form.progress) || 0)),
    });
    setSaving(false);
  };

  const Input = ({ label, name, type = 'text', placeholder = '' }: any) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <input type={type} value={(form as any)[name]} onChange={e => f(name, e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
    </div>
  );
  const Select = ({ label, name, options }: { label: string; name: string; options: string[] | {v:string;l:string}[] }) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <select value={(form as any)[name]} onChange={e => f(name, e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
        {options.map((o: any) =>
          typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>
        )}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
          <h2 className="font-bold text-base">{project ? '编辑项目' : '添加项目'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input label="项目标题 *" name="title" placeholder="输入项目名称..." />
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">项目描述</label>
            <textarea value={form.description} onChange={e => f('description', e.target.value)}
              rows={3} placeholder="详细描述..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select label="项目状态" name="status" options={STATUS_FLOW.map(s => ({v:s,l:s}))} />
            <Select label="数据来源" name="source" options={[
              {v:'manual',l:'手动添加'},{v:'knowledge_base',l:'知识库分析'},{v:'ai',l:'AI推荐'}
            ]} />
          </div>

          <Select label="业务来源（渠道）" name="businessSource" options={BIZ_SOURCES} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">客户</label>
              <select value={form.clientId}
                onChange={e => {
                  const c = clients.find(x => x.id === e.target.value);
                  setForm(p => ({ ...p, clientId: e.target.value, clientName: c?.name ?? '' }));
                }}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">— 选择客户 —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
              </select>
            </div>
            <Select label="项目分类" name="category" options={CATEGORIES} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="预算 (PHP)" name="budget" type="number" placeholder="0" />
            <Input label="进度 (%)" name="progress" type="number" placeholder="0" />
          </div>

          <Input label="截止日期" name="deadline" type="date" />

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">备注</label>
            <textarea value={form.notes} onChange={e => f('notes', e.target.value)}
              rows={2} placeholder="备注信息..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">取消</Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <RefreshCw className="w-4 h-4 animate-spin mr-1" />}
              {project ? '保存更改' : '添加项目'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── 弹窗：添加客户 ───────────────────────────────────────────────────────────
function ClientDialog({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-base">添加新客户</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {[
            { l: '姓名 *', k: 'name', ph: '客户姓名' },
            { l: '公司',   k: 'company', ph: '公司名称（可选）' },
            { l: '邮箱',   k: 'email', ph: 'email@example.com' },
            { l: '电话',   k: 'phone', ph: '+63 912...' },
          ].map(({ l, k, ph }) => (
            <div key={k}>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{l}</label>
              <input value={(form as any)[k]} onChange={e => f(k, e.target.value)} placeholder={ph}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">备注</label>
            <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">取消</Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <RefreshCw className="w-4 h-4 animate-spin mr-1" />}添加客户
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── 主组件 ──────────────────────────────────────────────────────────────────
export default function FreelancePage() {
  const [projects, setProjects]   = useState<Project[]>([]);
  const [clients,  setClients]    = useState<Client[]>([]);
  const [stats,    setStats]      = useState<Stats | null>(null);
  const [loading,  setLoading]    = useState(true);

  const [dialog,   setDialog]     = useState<'project' | 'client' | null>(null);
  const [editProj, setEditProj]   = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [search,   setSearch]     = useState('');
  const [actionId, setActionId]   = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // 分页
  const [page,     setPage]       = useState(1);
  const [pageSize, setPageSize]   = useState(10);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes, sRes] = await Promise.all([
        fetch('/api/freelance?action=projects', { cache: 'no-store' }),
        fetch('/api/freelance?action=clients',  { cache: 'no-store' }),
        fetch('/api/freelance?action=stats',    { cache: 'no-store' }),
      ]);
      const [pd, cd, sd] = await Promise.all([pRes.json(), cRes.json(), sRes.json()]);
      setProjects(pd.data?.projects ?? []);
      setClients(cd.data?.clients ?? []);
      setStats(sd.data ?? null);
      setLastRefresh(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { setPage(1); }, [statusFilter, search]);

  // ── 过滤 + 分页 ────────────────────────────────────────────────────────────
  const activeProjects = projects.filter(p =>
    ['接单','自动化','发布','待付款'].includes(p.status)
  );

  const filtered = projects.filter(p =>
    (statusFilter === 'all' || p.status === statusFilter) &&
    (!search || p.title.toLowerCase().includes(search.toLowerCase()) ||
     p.clientName.toLowerCase().includes(search.toLowerCase()) ||
     p.businessSource.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const pageStart  = (safePage - 1) * pageSize;
  const paginated  = filtered.slice(pageStart, pageStart + pageSize);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleSaveProject = async (data: Partial<Project>) => {
    const action = editProj ? 'update-project' : 'create-project';
    const body   = editProj ? { ...data, id: editProj.id } : data;
    await fetch('/api/freelance', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    });
    setDialog(null); setEditProj(null); await fetchAll();
  };

  const handleSaveClient = async (data: any) => {
    await fetch('/api/freelance', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create-client', ...data }),
    });
    setDialog(null); await fetchAll();
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('确认删除此项目？')) return;
    setActionId(id);
    await fetch('/api/freelance', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete-project', id }),
    });
    setActionId(null); await fetchAll();
  };

  const handleStatusChange = async (project: Project, status: ProjectStatus) => {
    setActionId(project.id + '-st');
    await fetch('/api/freelance', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-project', id: project.id, status }),
    });
    setActionId(null); await fetchAll();
  };

  // ── 渲染辅助 ───────────────────────────────────────────────────────────────
  const progressColor = (p: number) => p === 100 ? '#22c55e' : p >= 50 ? '#3b82f6' : '#f59e0b';

  const ProjectCard = ({ p, compact = false }: { p: Project; compact?: boolean }) => {
    const sc  = STATUS_CFG[p.status] ?? STATUS_CFG['创建'];
    const src = SOURCE_CFG[p.source];
    return (
      <div className={`group rounded-lg border p-4 hover:shadow-sm transition-all ${sc.bg}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* 标题行 */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{p.title}</span>
              {/* 状态 */}
              <div className="relative group/st">
                <button className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border ${sc.bg} ${sc.color} hover:shadow-sm`}
                  disabled={actionId === p.id + '-st'}>
                  {actionId === p.id + '-st' ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />}
                  {p.status}
                  <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                </button>
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border z-20 hidden group-hover/st:block min-w-[90px]">
                  {STATUS_FLOW.map(s => (
                    <button key={s} onClick={() => handleStatusChange(p, s)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${STATUS_CFG[s]?.color ?? ''} ${p.status === s ? 'font-bold' : ''}`}>
                      <span className={`w-2 h-2 rounded-full ${STATUS_CFG[s]?.dot ?? 'bg-gray-300'}`} />{s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* 描述 */}
            {!compact && p.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.description}</p>
            )}
            {/* 元数据 */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-muted-foreground">
              {p.clientName && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{p.clientName}</span>}
              <span className="flex items-center gap-1">{src.icon} <span className={src.color}>{src.label}</span></span>
              {p.businessSource && <span className="px-1.5 py-0.5 bg-white rounded border">{p.businessSource}</span>}
              {p.deadline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.deadline}</span>}
              <span className="font-medium text-green-700">{fmt(p.budget)}</span>
            </div>
            {/* 进度条 */}
            {!compact && (
              <div className="mt-2">
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-muted-foreground">进度</span>
                  <span className="font-medium">{p.progress}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-1.5 border">
                  <div className="h-1.5 rounded-full" style={{ width: `${p.progress}%`, background: progressColor(p.progress) }} />
                </div>
              </div>
            )}
            {/* 状态流程（仅活跃项目）*/}
            {!compact && p.status !== '已取消' && p.status !== '已完成' && (
              <div className="mt-2"><StatusStepper status={p.status} /></div>
            )}
          </div>
          {/* 操作按钮 */}
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => { setEditProj(p); setDialog('project'); }}
              className="p-1.5 rounded hover:bg-blue-100 text-blue-500" title="编辑">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleDeleteProject(p.id)}
              className="p-1.5 rounded hover:bg-red-100 text-red-500" title="删除"
              disabled={actionId === p.id}>
              {actionId === p.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const totalEarned = stats?.earned ?? 0;
  const totalActive = stats?.active ?? activeProjects.length;

  return (
    <div className="space-y-6 pb-8">

      {/* ── 标题栏 ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-500" />
            外包平台
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {projects.length} 个项目 · {clients.length} 个客户 ·
            {lastRefresh && ` 更新 ${lastRefresh.toLocaleTimeString('zh-CN')}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {/* 添加新客户 */}
          <Button variant="outline" size="sm" onClick={() => setDialog('client')}>
            <UserPlus className="w-4 h-4 mr-1" /> 添加新客户
          </Button>
          {/* 添加项目 */}
          <Button size="sm" onClick={() => { setEditProj(null); setDialog('project'); }}>
            <Plus className="w-4 h-4 mr-1" /> 添加项目
          </Button>
        </div>
      </div>

      {/* ── KPI 卡片 ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '活跃项目', val: totalActive,       icon: <Zap className="w-7 h-7 text-indigo-400" />,  color: 'bg-indigo-50 border-indigo-200' },
          { label: '总项目数', val: projects.length,   icon: <Briefcase className="w-7 h-7 text-blue-400" />, color: 'bg-blue-50 border-blue-200' },
          { label: '客户数',   val: clients.length,    icon: <Users className="w-7 h-7 text-green-400" />,  color: 'bg-green-50 border-green-200' },
          { label: '已入账',   val: fmt(totalEarned),  icon: <DollarSign className="w-7 h-7 text-yellow-400" />, color: 'bg-yellow-50 border-yellow-200' },
        ].map(c => (
          <Card key={c.label} className={`border ${c.color}`}>
            <CardContent className="pt-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-2xl font-bold mt-0.5">{c.val}</p>
                </div>
                {c.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── 活跃项目 ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" />
            活跃项目（接单→自动化→发布→待付款）
          </CardTitle>
          <CardDescription>{activeProjects.length} 个项目正在推进</CardDescription>
        </CardHeader>
        <CardContent>
          {activeProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂无活跃项目</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeProjects.map(p => <ProjectCard key={p.id} p={p} />)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 项目列表（分页）──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              项目列表
              <span className="text-muted-foreground font-normal text-sm">({filtered.length} 条)</span>
            </CardTitle>
            {/* 搜索 + 状态过滤 */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="搜索项目/客户/渠道..."
                  className="pl-8 pr-3 py-1.5 text-sm border rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="w-3.5 h-3.5" /></button>}
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="all">全部状态</option>
                {STATUS_FLOW.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400" /></div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂无匹配项目</p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginated.map(p => <ProjectCard key={p.id} p={p} compact />)}
            </div>
          )}

          {/* ── 分页工具条 ──────────────────────────────────────────────── */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4 flex-wrap gap-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>第 <strong>{pageStart + 1}</strong>–<strong>{Math.min(pageStart + pageSize, filtered.length)}</strong> 条，共 <strong>{filtered.length}</strong> 条</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">每页</span>
                  <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300">
                    {[10, 20, 50].map(n => <option key={n} value={n}>{n} 条</option>)}
                  </select>
                </div>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(1)} disabled={safePage === 1}
                    className="px-2 py-1 text-xs rounded border hover:bg-gray-50 disabled:opacity-40">«</button>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                    className="px-2.5 py-1 text-xs rounded border hover:bg-gray-50 disabled:opacity-40">‹</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => totalPages <= 5 || p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce<(number | '...')[]>((acc, p, i, arr) => {
                      if (i > 0 && (p as number) - (arr[i-1] as number) > 1) acc.push('...');
                      acc.push(p); return acc;
                    }, [])
                    .map((item, idx) =>
                      item === '...' ? <span key={`d${idx}`} className="px-1 text-xs text-muted-foreground">…</span> :
                      <button key={item} onClick={() => setPage(item as number)}
                        className={`w-7 h-7 text-xs rounded border ${safePage === item ? 'bg-blue-500 text-white border-blue-500 font-semibold' : 'hover:bg-gray-50'}`}>
                        {item}
                      </button>
                    )
                  }
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                    className="px-2.5 py-1 text-xs rounded border hover:bg-gray-50 disabled:opacity-40">›</button>
                  <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages}
                    className="px-2 py-1 text-xs rounded border hover:bg-gray-50 disabled:opacity-40">»</button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 客户列表 ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-green-500" />
            客户列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">暂无客户，点击「添加新客户」</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {clients.map(c => (
                <div key={c.id} className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50 hover:shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{c.name}</p>
                    {c.company && <p className="text-xs text-muted-foreground">{c.company}</p>}
                    {c.email   && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
                    <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{c.projectsCount} 个项目</span>
                      {c.totalSpent > 0 && <span className="text-green-600 font-medium">{fmt(c.totalSpent)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 弹窗 ─────────────────────────────────────────────────────────────── */}
      {dialog === 'project' && (
        <ProjectDialog project={editProj} clients={clients} onClose={() => { setDialog(null); setEditProj(null); }} onSave={handleSaveProject} />
      )}
      {dialog === 'client' && (
        <ClientDialog onClose={() => setDialog(null)} onSave={handleSaveClient} />
      )}
    </div>
  );
}
