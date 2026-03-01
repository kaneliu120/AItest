'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wrench, Server, CheckCircle, AlertTriangle, XCircle, RefreshCw, Zap, Activity,
  BarChart3, Clock, Layers, ShoppingCart, Download, Trash2, Star, TrendingUp,
  Package, ExternalLink, Filter, Search, Plus, Settings
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';

// ─── 类型 ────────────────────────────────────────────────────────────────────
interface Tool {
  name: string; status: string; type: string; typeLabel: string;
  category: string; version: string; description: string; lastChecked: string;
}

interface CategoryInfo {
  name: string; total: number; healthy: number; warning: number; error: number;
  healthRate: number; tools: Tool[];
}

interface ToolsData {
  generatedAt: string;
  stats: { total: number; healthy: number; warning: number; error: number; healthRate: number };
  tools: Tool[];
  categories: CategoryInfo[];
  scheduler: { pending: number; running: number; completed: number; failed: number; total: number; health: number };
  alerts: Array<{ level: string; message: string; tool: string; timestamp: string }>;
}

interface MarketplaceSkill {
  slug: string;
  name: string;
  description: string;
  version: string;
  downloads: number;
  rating: number;
  author: string;
  tags: string[];
  installed: boolean;
  installedVersion?: string;
}

interface InstalledSkill {
  slug: string;
  name: string;
  version: string;
  description: string;
  location: string;
  status: 'active' | 'disabled' | 'error';
  lastUsed: string;
  usageCount: number;
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────
const statusCfg = {
  healthy: { label: '正常', color: 'text-green-700', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
  warning: { label: '警告', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500', icon: <AlertTriangle className="w-4 h-4 text-yellow-500" /> },
  error:   { label: '错误', color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       dot: 'bg-red-500',   icon: <XCircle className="w-4 h-4 text-red-500" /> },
} as const;

const alertColor = { error: 'bg-red-50 border-red-200 text-red-700', warning: 'bg-yellow-50 border-yellow-200 text-yellow-700', info: 'bg-blue-50 border-blue-200 text-blue-700' } as const;
const CHART_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

const sc = (status: string) => statusCfg[status as keyof typeof statusCfg] ?? statusCfg.warning;

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

// ─── 主组件 ──────────────────────────────────────────────────────────────────
export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState('ecosystem');
  const [data, setData] = useState<ToolsData | null>(null);
  const [marketplace, setMarketplace] = useState<MarketplaceSkill[]>([]);
  const [installed, setInstalled] = useState<InstalledSkill[]>([]);
  const [loading, setLoading] = useState({ ecosystem: true, marketplace: false, installed: false });
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'healthy' | 'warning' | 'error'>('all');
  const [search, setSearch] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalInstalled: 0,
    activeSkills: 0,
    totalDownloads: 0,
    avgRating: 0,
    usageThisWeek: 0,
  });

  // ── 加载工具生态数据 ──
  const fetchEcosystem = useCallback(async () => {
    setLoading(l => ({ ...l, ecosystem: true }));
    try {
      const res = await fetch('/api/tools', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Tools fetch error:', e);
    } finally {
      setLoading(l => ({ ...l, ecosystem: false }));
    }
  }, []);

  // ── 加载工具市场数据 ──
  const fetchMarketplace = useCallback(async () => {
    setLoading(l => ({ ...l, marketplace: true }));
    try {
      // 模拟 ClawHub 市场数据（实际应调用 /api/tools/marketplace）
      const mockMarketplace: MarketplaceSkill[] = [
        { slug: 'github', name: 'GitHub 集成', description: 'GitHub API 集成，支持 PR、Issue、CI/CD 监控', version: '2.1.0', downloads: 1245, rating: 4.8, author: 'openclaw', tags: ['github', 'ci-cd', 'automation'], installed: true, installedVersion: '2.1.0' },
        { slug: 'discord', name: 'Discord 机器人', description: 'Discord 聊天机器人，支持命令、通知、自动化', version: '1.5.2', downloads: 892, rating: 4.6, author: 'openclaw', tags: ['discord', 'chat', 'automation'], installed: true, installedVersion: '1.5.2' },
        { slug: 'openai', name: 'OpenAI 集成', description: 'GPT、Whisper、DALL-E API 集成，支持对话和图像生成', version: '3.0.1', downloads: 2103, rating: 4.9, author: 'openai', tags: ['ai', 'gpt', 'image'], installed: false },
        { slug: 'google-ads', name: 'Google Ads', description: 'Google Ads API 集成，支持广告数据分析和优化', version: '1.2.0', downloads: 567, rating: 4.3, author: 'google', tags: ['ads', 'analytics', 'marketing'], installed: false },
        { slug: 'slack', name: 'Slack 集成', description: 'Slack 工作区集成，支持消息发送和自动化', version: '1.8.0', downloads: 743, rating: 4.5, author: 'slack', tags: ['slack', 'chat', 'automation'], installed: false },
        { slug: 'notion', name: 'Notion 集成', description: 'Notion API 集成，支持页面、数据库同步', version: '2.0.0', downloads: 987, rating: 4.7, author: 'notion', tags: ['notion', 'productivity', 'database'], installed: false },
        { slug: 'calendar', name: '日历集成', description: 'Google Calendar、Apple Calendar 集成，支持事件管理', version: '1.3.0', downloads: 654, rating: 4.4, author: 'openclaw', tags: ['calendar', 'productivity'], installed: false },
        { slug: 'weather', name: '天气服务', description: '全球天气数据，支持预报和警报', version: '1.0.1', downloads: 432, rating: 4.2, author: 'openclaw', tags: ['weather', 'api'], installed: false },
      ];
      setMarketplace(mockMarketplace);
    } catch (e) {
      console.error('Marketplace fetch error:', e);
    } finally {
      setLoading(l => ({ ...l, marketplace: false }));
    }
  }, []);

  // ── 加载已安装技能 ──
  const fetchInstalled = useCallback(async () => {
    setLoading(l => ({ ...l, installed: true }));
    try {
      // 模拟已安装技能数据（实际应调用 /api/tools/installed）
      const mockInstalled: InstalledSkill[] = [
        { slug: 'github', name: 'GitHub 集成', version: '2.1.0', description: 'GitHub API 集成', location: '/opt/homebrew/lib/node_modules/openclaw/skills/github', status: 'active', lastUsed: '2026-02-24T10:30:00Z', usageCount: 42 },
        { slug: 'discord', name: 'Discord 机器人', version: '1.5.2', description: 'Discord 聊天机器人', location: '/opt/homebrew/lib/node_modules/openclaw/skills/discord', status: 'active', lastUsed: '2026-02-24T14:20:00Z', usageCount: 28 },
        { slug: 'clawhub', name: 'ClawHub CLI', version: '1.0.0', description: '技能市场 CLI', location: '/opt/homebrew/lib/node_modules/openclaw/skills/clawhub', status: 'active', lastUsed: '2026-02-23T16:45:00Z', usageCount: 5 },
        { slug: 'weather', name: '天气服务', version: '1.0.1', description: '全球天气数据', location: '/opt/homebrew/lib/node_modules/openclaw/skills/weather', status: 'disabled', lastUsed: '2026-02-20T09:15:00Z', usageCount: 12 },
        { slug: 'apple-reminders', name: 'Apple 提醒', version: '1.2.0', description: 'Apple Reminders 集成', location: '/opt/homebrew/lib/node_modules/openclaw/skills/apple-reminders', status: 'active', lastUsed: '2026-02-24T08:45:00Z', usageCount: 18 },
      ];
      setInstalled(mockInstalled);
      
      // 计算统计
      setStats({
        totalInstalled: mockInstalled.length,
        activeSkills: mockInstalled.filter(s => s.status === 'active').length,
        totalDownloads: 5321,
        avgRating: 4.6,
        usageThisWeek: 105,
      });
    } catch (e) {
      console.error('Installed fetch error:', e);
    } finally {
      setLoading(l => ({ ...l, installed: false }));
    }
  }, []);

  // ── 安装技能 ──
  const installSkill = async (slug: string) => {
    setInstalling(slug);
    try {
      // 模拟安装（实际应调用 /api/tools/install）
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 更新市场状态
      setMarketplace(prev => prev.map(skill => 
        skill.slug === slug ? { ...skill, installed: true, installedVersion: skill.version } : skill
      ));
      
      // 添加到已安装列表
      const skill = marketplace.find(s => s.slug === slug);
      if (skill) {
        const newInstalled: InstalledSkill = {
          slug: skill.slug,
          name: skill.name,
          version: skill.version,
          description: skill.description,
          location: `/opt/homebrew/lib/node_modules/openclaw/skills/${skill.slug}`,
          status: 'active',
          lastUsed: new Date().toISOString(),
          usageCount: 0,
        };
        setInstalled(prev => [...prev, newInstalled]);
        setStats(prev => ({ ...prev, totalInstalled: prev.totalInstalled + 1, activeSkills: prev.activeSkills + 1 }));
      }
    } catch (e) {
      console.error('Install error:', e);
    } finally {
      setInstalling(null);
    }
  };

  // ── 卸载技能 ──
  const uninstallSkill = async (slug: string) => {
    try {
      // 模拟卸载
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新市场状态
      setMarketplace(prev => prev.map(skill => 
        skill.slug === slug ? { ...skill, installed: false, installedVersion: undefined } : skill
      ));
      
      // 从已安装列表移除
      setInstalled(prev => prev.filter(s => s.slug !== slug));
      setStats(prev => ({ 
        ...prev, 
        totalInstalled: prev.totalInstalled - 1,
        activeSkills: prev.activeSkills - (installed.find(s => s.slug === slug)?.status === 'active' ? 1 : 0)
      }));
    } catch (e) {
      console.error('Uninstall error:', e);
    }
  };

  // ── 切换技能状态 ──
  const toggleSkillStatus = async (slug: string, currentStatus: 'active' | 'disabled' | 'error') => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    setInstalled(prev => prev.map(skill => 
      skill.slug === slug ? { ...skill, status: newStatus } : skill
    ));
    
    setStats(prev => ({
      ...prev,
      activeSkills: newStatus === 'active' ? prev.activeSkills + 1 : prev.activeSkills - 1
    }));
  };

  // ── 初始加载 ──
  useEffect(() => {
    fetchEcosystem();
    const t = setInterval(fetchEcosystem, 60000);
    return () => clearInterval(t);
  }, [fetchEcosystem]);

  // 切换标签时加载对应数据
  useEffect(() => {
    if (activeTab === 'marketplace' && marketplace.length === 0) {
      fetchMarketplace();
    }
    if (activeTab === 'installed' && installed.length === 0) {
      fetchInstalled();
    }
  }, [activeTab, marketplace.length, installed.length, fetchMarketplace, fetchInstalled]);

  if (loading.ecosystem && !data && activeTab === 'ecosystem') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-muted-foreground">加载工具数据中...</p>
        </div>
      </div>
    );
  }
  if (!data && activeTab === 'ecosystem') return <div className="p-6 text-red-500">数据加载失败</div>;

  const { stats: ecoStats, tools, categories, scheduler, alerts } = data || { stats: { total: 0, healthy: 0, warning: 0, error: 0, healthRate: 0 }, tools: [], categories: [], scheduler: { pending: 0, running: 0, completed: 0, failed: 0, total: 0, health: 0 }, alerts: [] };

  // 过滤工具列表
  const visibleTools = tools.filter(t =>
    (filterStatus === 'all' || t.status === filterStatus) &&
    (selectedCat === null || t.category === selectedCat) &&
    (search === '' || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()))
  );

  // 图表数据
  const pieData = [
    { name: '正常', value: ecoStats.healthy, fill: CHART_COLORS[0] },
    { name: '警告', value: ecoStats.warning, fill: CHART_COLORS[1] },
    { name: '错误', value: ecoStats.error,   fill: CHART_COLORS[2] },
  ];

  const categoryChartData = categories.map(cat => ({
    name: cat.name,
    正常: cat.healthy,
    警告: cat.warning,
    错误: cat.error,
  }));

  // 使用统计图表数据
  const usageData = [
    { day: '周一', 使用次数: 15 },
    { day: '周二', 使用次数: 22 },
    { day: '周三', 使用次数: 18 },
    { day: '周四', 使用次数: 25 },
    { day: '周五', 使用次数: 20 },
    { day: '周六', 使用次数: 12 },
    { day: '周日', 使用次数: 8 },
  ];

  const categoryUsageData = [
    { category: 'AI与自动化', 使用次数: 45 },
    { category: '系统核心', 使用次数: 38 },
    { category: '业务系统', 使用次数: 32 },
    { category: '数据与营销', 使用次数: 25 },
    { category: '基础设施', 使用次数: 18 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">工具管理</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            工具生态 · 工具市场 · 我的工具 · 使用统计
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchEcosystem}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> 刷新
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-3.5 h-3.5 mr-1" /> 添加工具
          </Button>
        </div>
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '总工具数', value: ecoStats.total, sub: `${ecoStats.healthRate}% 健康率`, icon: <Wrench className="w-5 h-5 text-blue-500" />, color: 'bg-blue-50 border-blue-100' },
          { label: '已安装技能', value: stats.totalInstalled, sub: `${stats.activeSkills} 个活跃`, icon: <Package className="w-5 h-5 text-green-500" />, color: 'bg-green-50 border-green-100' },
          { label: '市场技能', value: marketplace.length, sub: `${marketplace.filter(s => s.installed).length} 个已安装`, icon: <ShoppingCart className="w-5 h-5 text-purple-500" />, color: 'bg-purple-50 border-purple-100' },
          { label: '本周使用', value: stats.usageThisWeek, sub: '工具调用次数', icon: <TrendingUp className="w-5 h-5 text-orange-500" />, color: 'bg-orange-50 border-orange-100' },
        ].map(k => (
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

      {/* 主标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="ecosystem" className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5" /> 工具生态
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <ShoppingCart className="w-3.5 h-3.5" /> 工具市场
          </TabsTrigger>
          <TabsTrigger value="installed" className="flex items-center gap-2">
            <Package className="w-3.5 h-3.5" /> 我的工具
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart className="w-3.5 h-3.5" /> 工具统计
          </TabsTrigger>
        </TabsList>

        {/* ══ 工具生态 Tab ══ */}
        <TabsContent value="ecosystem" className="space-y-4">
          {/* 健康概览 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4" /> 工具健康状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-bold">{ecoStats.healthRate}%</div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" /> {ecoStats.healthy} 正常
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      <AlertTriangle className="w-3 h-3 mr-1" /> {ecoStats.warning} 警告
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <XCircle className="w-3 h-3 mr-1" /> {ecoStats.error} 错误
                    </Badge>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4" /> 分类健康分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="正常" stackId="a" fill="#22c55e" />
                      <Bar dataKey="警告" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="错误" stackId="a" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 调度器状态 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4" /> 调度器状态
                </CardTitle>
                <Badge variant={scheduler.health > 80 ? "default" : scheduler.health > 60 ? "secondary" : "destructive"}>
                  {scheduler.health}% 健康
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: '待处理', value: scheduler.pending, color: 'bg-slate-100 text-slate-700' },
                  { label: '运行中', value: scheduler.running, color: 'bg-blue-100 text-blue-700' },
                  { label: '已完成', value: scheduler.completed, color: 'bg-green-100 text-green-700' },
                  { label: '失败', value: scheduler.failed, color: 'bg-red-100 text-red-700' },
                ].map(s => (
                  <div key={s.label} className={`rounded-lg p-3 text-center ${s.color}`}>
                    <div className="text-xs text-slate-500">{s.label}</div>
                    <div className="text-xl font-bold">{s.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 工具列表 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">工具列表</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="搜索工具..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <select className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
                    <option value="all">全部状态</option>
                    <option value="healthy">正常</option>
                    <option value="warning">警告</option>
                    <option value="error">错误</option>
                  </select>
                  <select className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg" value={selectedCat || ''} onChange={e => setSelectedCat(e.target.value || null)}>
                    <option value="">全部分类</option>
                    {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name} ({cat.total})</option>)}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {visibleTools.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Filter className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>没有找到匹配的工具</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleTools.map(t => (
                    <div key={t.name} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${sc(t.status).dot}`} />
                        <div>
                          <div className="font-medium text-slate-800">{t.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{t.typeLabel}</span>•<span>{t.category}</span>•<span>v{t.version}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={sc(t.status).bg}>{sc(t.status).label}</Badge>
                        <span className="text-xs text-slate-400">{fmtTime(t.lastChecked)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 告警面板 */}
          {alerts.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" /> 系统告警
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.slice(0, 3).map((alert, idx) => (
                    <div key={idx} className={`p-3 rounded-lg ${alertColor[alert.level as keyof typeof alertColor]}`}>
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{alert.tool}</div>
                        <span className="text-xs">{fmtTime(alert.timestamp)}</span>
                      </div>
                      <div className="text-sm mt-1">{alert.message}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══ 工具市场 Tab ══ */}
        <TabsContent value="marketplace" className="space-y-4">
          {loading.marketplace ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
              <span className="text-slate-500">加载市场数据…</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketplace.map(skill => (
                  <Card key={skill.slug} className={`border ${skill.installed ? 'border-green-200' : 'border-slate-200'} hover:shadow-sm transition-shadow`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-bold text-slate-900">{skill.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">by {skill.author}</div>
                        </div>
                        {skill.installed && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" /> 已安装
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">{skill.description}</p>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {skill.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" /> {skill.downloads}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" /> {skill.rating}
                          </span>
                          <span>v{skill.version}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {skill.installed ? (
                          <>
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(`https://clawhub.com/skills/${skill.slug}`, '_blank')}>
                              <ExternalLink className="w-3.5 h-3.5 mr-1" /> 详情
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 text-red-600 border-red-300 hover:bg-red-50" onClick={() => uninstallSkill(skill.slug)}>
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> 卸载
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(`https://clawhub.com/skills/${skill.slug}`, '_blank')}>
                              <ExternalLink className="w-3.5 h-3.5 mr-1" /> 详情
                            </Button>
                            <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => installSkill(skill.slug)} disabled={installing === skill.slug}>
                              {installing === skill.slug ? (
                                <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> 安装中</>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5 mr-1" /> 安装
                                </>
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center text-sm text-slate-500">
                数据来自 <a href="https://clawhub.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">ClawHub.com</a> · 共 {marketplace.length} 个技能
              </div>
            </>
          )}
        </TabsContent>

        {/* ══ 我的工具 Tab ══ */}
        <TabsContent value="installed" className="space-y-4">
          {loading.installed ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
              <span className="text-slate-500">加载已安装技能…</span>
            </div>
          ) : (
            <>
              {/* 技能管理概览 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500">已安装技能</div>
                        <div className="text-2xl font-bold">{stats.totalInstalled}</div>
                      </div>
                      <Package className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500">活跃技能</div>
                        <div className="text-2xl font-bold">{stats.activeSkills}</div>
                      </div>
                      <Zap className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500">总使用次数</div>
                        <div className="text-2xl font-bold">{stats.usageThisWeek}</div>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 技能列表 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">已安装技能管理</CardTitle>
                </CardHeader>
                <CardContent>
                  {installed.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>暂无已安装技能</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveTab('marketplace')}>
                        <ShoppingCart className="w-3.5 h-3.5 mr-1" /> 前往工具市场
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {installed.map(skill => (
                        <div key={skill.slug} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${skill.status === 'active' ? 'bg-green-500' : skill.status === 'disabled' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                            <div>
                              <div className="font-medium text-slate-800">{skill.name}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>v{skill.version}</span>•<span>{skill.description}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-xs text-slate-500">使用 {skill.usageCount} 次</div>
                              <div className="text-xs text-slate-400">{fmtTime(skill.lastUsed)}</div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="sm" onClick={() => toggleSkillStatus(skill.slug, skill.status)}>
                                {skill.status === 'active' ? '禁用' : '启用'}
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => uninstallSkill(skill.slug)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ══ 工具统计 Tab ══ */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">本周使用趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="使用次数" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">分类使用分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryUsageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="category" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="使用次数" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">技能使用排行</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {installed.sort((a, b) => b.usageCount - a.usageCount).slice(0, 5).map((skill, idx) => (
                  <div key={skill.slug} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-medium">{skill.name}</div>
                        <div className="text-xs text-slate-500">v{skill.version}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">{skill.usageCount} 次</div>
                        <div className="text-xs text-slate-500">使用次数</div>
                      </div>
                      <Badge variant={skill.status === 'active' ? 'default' : 'secondary'}>
                        {skill.status === 'active' ? '活跃' : '禁用'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">市场热门技能</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketplace.sort((a, b) => b.downloads - a.downloads).slice(0, 3).map(skill => (
                    <div key={skill.slug} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <div>
                          <div className="font-medium">{skill.name}</div>
                          <div className="text-xs text-slate-500">{skill.author}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{skill.downloads}</div>
                        <div className="text-xs text-slate-500">下载</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">工具健康状态</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>整体健康率</span>
                    <span className="font-medium">{ecoStats.healthRate}%</span>
                  </div>
                  <Progress value={ecoStats.healthRate} className="h-2" />
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-bold text-green-700">{ecoStats.healthy}</div>
                      <div className="text-xs text-green-600">正常</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <div className="font-bold text-yellow-700">{ecoStats.warning}</div>
                      <div className="text-xs text-yellow-600">警告</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="font-bold text-red-700">{ecoStats.error}</div>
                      <div className="text-xs text-red-600">错误</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 页脚信息 */}
      <div className="text-xs text-slate-400 text-center pt-4 border-t border-slate-200">
        <p>最后更新: {lastRefresh ? fmtTime(lastRefresh.toISOString()) : '—'}</p>
        <p className="mt-1">工具生态数据来自 /api/ecosystem/status · 市场数据来自 ClawHub.com</p>
      </div>
    </div>
  );
}
