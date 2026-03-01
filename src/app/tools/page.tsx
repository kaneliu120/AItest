'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wrench, Server, CheckCircle, AlertTriangle, XCircle, RefreshCw, Zap, Activity,
  Layers, ShoppingCart, Download, Trash2, Star, TrendingUp,
  Package, ExternalLink, Filter, Search, Plus
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
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
  pagination?: { page: number; pageSize: number; total: number; totalPages: number };
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

interface UpdateCandidate {
  slug: string;
  name: string;
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
}

// ─── MCP Functions ────────────────────────────────────────────────────────────
const statusCfg = {
  healthy: { label: 'Healthy', color: 'text-green-700', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
  warning: { label: 'Warning', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500', icon: <AlertTriangle className="w-4 h-4 text-yellow-500" /> },
  error:   { label: 'Error', color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       dot: 'bg-red-500',   icon: <XCircle className="w-4 h-4 text-red-500" /> },
} as const;

const alertColor = { error: 'bg-red-50 border-red-200 text-red-700', warning: 'bg-yellow-50 border-yellow-200 text-yellow-700', info: 'bg-blue-50 border-blue-200 text-blue-700' } as const;
const CHART_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

const sc = (status: string) => statusCfg[status as keyof typeof statusCfg] ?? statusCfg.warning;

function fmtTime(iso?: string | null) {
  if (!iso) return '—';
  try {
    const d = new Date(iso), diff = Date.now() - d.getTime();
    if (diff < 60000)    return 'just now';
    if (diff < 3600000)  return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return d.toLocaleDateString('zh-CN');
  } catch { return iso; }
}

function parseActionError(status: number, message?: string) {
  if (status >= 400 && status < 500) {
    return { type: 'client' as const, message: message || 'Invalid request, please check and retry' };
  }
  if (status >= 500) {
    return { type: 'server' as const, message: message || 'Service error, please try again later' };
  }
  return { type: 'network' as const, message: message || 'Network error, please retry' };
}

// ─── Main Component ──────────────────────────────────────────────────────────────
export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState('ecosystem');
  const [data, setData] = useState<ToolsData | null>(null);
  const [marketplace, setMarketplace] = useState<MarketplaceSkill[]>([]);
  const [installed, setInstalled] = useState<InstalledSkill[]>([]);
  const [updateCandidates, setUpdateCandidates] = useState<UpdateCandidate[]>([]);
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState({ ecosystem: true, marketplace: false, installed: false });
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'healthy' | 'warning' | 'error'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [marketMeta, setMarketMeta] = useState({
    totalDownloads: 0,
    avgRating: 0,
  });
  const [usageData, setUsageData] = useState<Array<{ day: string; usageCount: number }>>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionErrorType, setActionErrorType] = useState<'client' | 'server' | 'network' | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [lastActionAt, setLastActionAt] = useState<string | null>(null);
  const [marketplaceLoaded, setMarketplaceLoaded] = useState(false);
  const [installedLoaded, setInstalledLoaded] = useState(false);
  const [pendingBySlug, setPendingBySlug] = useState<Record<string, boolean>>({});
  const [pendingActionBySlug, setPendingActionBySlug] = useState<Record<string, 'install' | 'uninstall' | 'toggle' | null>>({});
  const [batchSelected, setBatchSelected] = useState<Record<string, boolean>>({});
  const [batchMode, setBatchMode] = useState(false);
  const [batchAction, setBatchAction] = useState<'enable' | 'disable' | 'uninstall'>('disable');
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const [batchFailedSlugs, setBatchFailedSlugs] = useState<string[]>([]);

  // ── Load MCP ecosystem data ──
  const fetchEcosystem = useCallback(async () => {
    setLoading(l => ({ ...l, ecosystem: true }));
    try {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        status: filterStatus,
        category: selectedCat || 'all',
        search,
      });
      const res = await fetch(`/api/tools?${qs.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Tools fetch error:', e);
    } finally {
      setLoading(l => ({ ...l, ecosystem: false }));
    }
  }, [page, pageSize, filterStatus, selectedCat, search]);

  // ── Load MCP marketplace data ──
  const fetchMarketplace = useCallback(async () => {
    setLoading(l => ({ ...l, marketplace: true }));
    try {
      const res = await fetch('/api/tools/marketplace', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const err = parseActionError(res.status, json.error);
        setActionErrorType(err.type);
        throw new Error(err.message);
      }
      setMarketplace(json.skills || []);
      setMarketplaceLoaded(true);
      setMarketMeta({
        totalDownloads: json.stats?.totalDownloads ?? 0,
        avgRating: json.stats?.avgRating ?? 0,
      });
      setLastRefresh(new Date());
    } catch (e: any) {
      console.error('Marketplace fetch error:', e);
      setActionErrorType('network');
      setActionError(e?.message || 'Failed to load MCP marketplace data');
    } finally {
      setLoading(l => ({ ...l, marketplace: false }));
    }
  }, []);

  // ── Load installed skills ──
  const fetchInstalled = useCallback(async () => {
    setLoading(l => ({ ...l, installed: true }));
    try {
      const res = await fetch('/api/tools/installed', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const err = parseActionError(res.status, json.error);
        setActionErrorType(err.type);
        throw new Error(err.message);
      }
      const skills = (json.skills || []) as InstalledSkill[];
      setInstalled(skills);
      setUpdateCandidates(json.updateCandidates || []);
      setInstalledLoaded(true);
      setUsageData(json.usageTrend || []);
      setLastRefresh(new Date());
    } catch (e: any) {
      console.error('Installed fetch error:', e);
      setActionErrorType('network');
      setActionError(e?.message || 'Failed to load installed MCP data');
    } finally {
      setLoading(l => ({ ...l, installed: false }));
    }
  }, []);

  const setPending = (slug: string, pending: boolean, action: 'install' | 'uninstall' | 'toggle' | null = null) => {
    setPendingBySlug(prev => ({ ...prev, [slug]: pending }));
    setPendingActionBySlug(prev => ({ ...prev, [slug]: pending ? action : null }));
  };

  const selectedInstalledSlugs = useMemo(
    () => Object.entries(batchSelected).filter(([, v]) => v).map(([k]) => k),
    [batchSelected]
  );

  const updateMap = useMemo(() => {
    const m = new Map<string, UpdateCandidate>();
    updateCandidates.forEach((u) => m.set(u.slug, u));
    return m;
  }, [updateCandidates]);

  const runBatchAction = async (retryOnlyFailed = false) => {
    const seed = retryOnlyFailed
      ? installed.filter((s) => batchFailedSlugs.includes(s.slug))
      : installed.filter((s) => selectedInstalledSlugs.includes(s.slug));
    const targets = seed;
    if (targets.length === 0 || batchRunning) return;

    const actionLabel = batchAction === 'enable' ? 'Enable' : batchAction === 'disable' ? 'Disable' : 'Uninstall';
    const ok = window.confirm(`Confirm batch ${actionLabel} ${targets.length} MCPs?`);
    if (!ok) return;

    setBatchRunning(true);
    setBatchProgress({ done: 0, total: targets.length });
    setBatchFailedSlugs([]);
    setActionError(null);
    setActionErrorType(null);
    setActionSuccess(null);

    let success = 0;
    const failed: string[] = [];
    const concurrency = 3;

    const runOne = async (slug: string) => {
      try {
        if (batchAction === 'uninstall') {
          const r = await fetch('/api/tools', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'uninstall-skill', slug }),
          });
          const j = await r.json();
          if (!r.ok || !j.success) throw new Error(j.error || `HTTP ${r.status}`);
        } else {
          const status = batchAction === 'enable' ? 'active' : 'disabled';
          const r = await fetch('/api/tools', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle-skill-status', slug, status }),
          });
          const j = await r.json();
          if (!r.ok || !j.success) throw new Error(j.error || `HTTP ${r.status}`);
        }
        success++;
      } catch {
        failed.push(slug);
      } finally {
        setBatchProgress((p) => ({ ...p, done: p.done + 1 }));
      }
    };

    for (let i = 0; i < targets.length; i += concurrency) {
      const chunk = targets.slice(i, i + concurrency);
      await Promise.all(chunk.map((t) => runOne(t.slug)));
    }

    await Promise.all([fetchInstalled(), fetchMarketplace()]);
    setBatchRunning(false);
    setBatchSelected({});
    setBatchFailedSlugs(failed);
    setLastActionAt(new Date().toISOString());

    if (failed.length > 0) {
      setActionErrorType('server');
      setActionError(`Batch ${actionLabel} complete: ${success} succeeded, ${failed.length} failed (${failed.join(', ')})`);
    } else {
      setActionSuccess(`Batch ${actionLabel} complete: ${success} succeeded`);
    }
  };

  // ── Install Skill ──
  const installSkill = async (slug: string) => {
    if (pendingBySlug[slug]) return;
    setInstalling(slug);
    setPending(slug, true, 'install');
    setActionError(null);
    setActionErrorType(null);
    setActionSuccess(null);
    try {
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'install-skill', slug }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const err = parseActionError(res.status, json.error);
        setActionErrorType(err.type);
        throw new Error(err.message);
      }
      await Promise.all([fetchMarketplace(), fetchInstalled()]);
      setActionSuccess(`MCP ${slug} installed successfully`);
      setLastActionAt(new Date().toISOString());
    } catch (e: any) {
      console.error('Install error:', e);
      setActionErrorType('network');
      setActionError(e?.message || 'Install failed');
    } finally {
      setInstalling(null);
      setPending(slug, false);
    }
  };

  // ── Uninstall Skill ──
  const uninstallSkill = async (slug: string) => {
    if (pendingBySlug[slug]) return;
    setPending(slug, true, 'uninstall');
    setActionError(null);
    setActionErrorType(null);
    setActionSuccess(null);
    try {
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'uninstall-skill', slug }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const err = parseActionError(res.status, json.error);
        setActionErrorType(err.type);
        throw new Error(err.message);
      }
      await Promise.all([fetchMarketplace(), fetchInstalled()]);
      setActionSuccess(`MCP ${slug} uninstalled successfully`);
      setLastActionAt(new Date().toISOString());
    } catch (e: any) {
      console.error('Uninstall error:', e);
      setActionErrorType('network');
      setActionError(e?.message || 'Uninstall failed');
    } finally {
      setPending(slug, false);
    }
  };

  // ── Toggle Skill Status ──
  const toggleSkillStatus = async (slug: string, currentStatus: 'active' | 'disabled' | 'error') => {
    if (pendingBySlug[slug]) return;
    setPending(slug, true, 'toggle');
    setActionError(null);
    setActionErrorType(null);
    setActionSuccess(null);
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-skill-status', slug, status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const err = parseActionError(res.status, json.error);
        setActionErrorType(err.type);
        throw new Error(err.message);
      }
      await fetchInstalled();
      setActionSuccess(`MCP ${slug} status changed to ${newStatus}`);
      setLastActionAt(new Date().toISOString());
    } catch (e: any) {
      console.error('Toggle status error:', e);
      setActionErrorType('network');
      setActionError(e?.message || 'Status toggle failed');
    } finally {
      setPending(slug, false);
    }
  };

  const updateSkillVersion = async (slug: string) => {
    if (updatingSlug || pendingBySlug[slug]) return;
    setUpdatingSlug(slug);
    setActionError(null);
    setActionErrorType(null);
    setActionSuccess(null);
    try {
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-skill', slug }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const err = parseActionError(res.status, json.error);
        setActionErrorType(err.type);
        throw new Error(err.message);
      }
      await fetchInstalled();
      setActionSuccess(`MCP ${slug} version updated successfully`);
      setLastActionAt(new Date().toISOString());
    } catch (e: any) {
      setActionErrorType('network');
      setActionError(e?.message || 'Version update failed');
    } finally {
      setUpdatingSlug(null);
    }
  };

  // ── Initial Load ──
  useEffect(() => {
    fetchEcosystem();
    const t = setInterval(fetchEcosystem, 60000);
    return () => clearInterval(t);
  }, [fetchEcosystem]);

  useEffect(() => {
    setPage(1);
  }, [filterStatus, selectedCat, search]);

  // Load data when switching tabs
  useEffect(() => {
    if (activeTab === 'marketplace' && marketplace.length === 0) {
      fetchMarketplace();
    }
    if (activeTab === 'installed' && installed.length === 0) {
      fetchInstalled();
    }
  }, [activeTab, marketplace.length, installed.length, fetchMarketplace, fetchInstalled]);

  const { stats: ecoStats, tools, categories, scheduler, alerts, pagination } = data || { stats: { total: 0, healthy: 0, warning: 0, error: 0, healthRate: 0 }, tools: [], categories: [], scheduler: { pending: 0, running: 0, completed: 0, failed: 0, total: 0, health: 0 }, alerts: [], pagination: { page: 1, pageSize, total: 0, totalPages: 1 } };

  const visibleTools = tools;

  // Chart data
  const pieData = [
    { name: 'Healthy', value: ecoStats.healthy, fill: CHART_COLORS[0] },
    { name: 'Warning', value: ecoStats.warning, fill: CHART_COLORS[1] },
    { name: 'Error', value: ecoStats.error,   fill: CHART_COLORS[2] },
  ];

  const categoryChartData = categories.map(cat => ({
    name: cat.name,
    Healthy: cat.healthy,
    Warning: cat.warning,
    Error: cat.error,
  }));

  // Usage stats chart data
  const categoryUsageData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    installed.forEach((s) => {
      const m = marketplace.find((x) => x.slug === s.slug);
      const cat = m?.tags?.[0] || 'other';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + s.usageCount);
    });
    return [...categoryMap.entries()]
      .map(([category, usageCount]) => ({ category, usageCount }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 6);
  }, [installed, marketplace]);

  const kpi = useMemo(() => {
    const totalInstalled = installed.length;
    const activeSkills = installed.filter((s) => s.status === 'active').length;
    const usageThisWeek = usageData.reduce((sum, d) => sum + (d.usageCount || 0), 0);
    return {
      totalInstalled,
      activeSkills,
      usageThisWeek,
      totalDownloads: marketMeta.totalDownloads,
      avgRating: marketMeta.avgRating,
    };
  }, [installed, usageData, marketMeta]);

  if (loading.ecosystem && !data && activeTab === 'ecosystem') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-muted-foreground">Loading MCP data...</p>
        </div>
      </div>
    );
  }

  if (!data && activeTab === 'ecosystem') {
    return <div className="p-6 text-red-500">Data load failed</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">MCP Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            MCP Ecosystem · MCP Marketplace · My MCPs · Usage Stats
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchEcosystem}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add MCP
          </Button>
        </div>
      </div>

      {actionSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-2 text-sm flex items-center justify-between gap-3">
          <span>{actionSuccess}</span>
          <span className="text-xs text-green-600">{lastActionAt ? fmtTime(lastActionAt) : 'just now'}</span>
        </div>
      )}

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm flex items-center justify-between gap-3">
          <span>
            [{actionErrorType === 'client' ? 'Request Error' : actionErrorType === 'server' ? 'Service Error' : 'Network Error'}] {actionError}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700"
              onClick={() => {
                if (activeTab === 'marketplace') fetchMarketplace();
                else if (activeTab === 'installed') fetchInstalled();
                else fetchEcosystem();
              }}
            >
              Retry Current Module
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700"
              onClick={() => {
                fetchEcosystem();
                fetchMarketplace();
                fetchInstalled();
              }}
            >
              Full Reload
            </Button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total MCPs', value: ecoStats.total, sub: `${ecoStats.healthRate}% Healthy Rate`, icon: <Wrench className="w-5 h-5 text-blue-500" />, color: 'bg-blue-50 border-blue-100' },
          { label: 'Installed Skills', value: kpi.totalInstalled, sub: `${kpi.activeSkills}  active`, icon: <Package className="w-5 h-5 text-green-500" />, color: 'bg-green-50 border-green-100' },
          { label: 'Marketplace Skills', value: marketplace.length, sub: `${marketplace.filter(s => s.installed).length}  Installed`, icon: <ShoppingCart className="w-5 h-5 text-purple-500" />, color: 'bg-purple-50 border-purple-100' },
          { label: 'This Week Usage', value: kpi.usageThisWeek, sub: 'MCP call count', icon: <TrendingUp className="w-5 h-5 text-orange-500" />, color: 'bg-orange-50 border-orange-100' },
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

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="ecosystem" className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5" /> MCPEcosystem
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <ShoppingCart className="w-3.5 h-3.5" /> MCPMarketplace
          </TabsTrigger>
          <TabsTrigger value="installed" className="flex items-center gap-2">
            <Package className="w-3.5 h-3.5" /> My MCPs
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart className="w-3.5 h-3.5" /> MCPStats
          </TabsTrigger>
        </TabsList>

        {/* ══ MCPEcosystem Tab ══ */}
        <TabsContent value="ecosystem" className="space-y-4">
          {/* Health Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4" /> MCP Health Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-bold">{ecoStats.healthRate}%</div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" /> {ecoStats.healthy} Healthy
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      <AlertTriangle className="w-3 h-3 mr-1" /> {ecoStats.warning} Warning
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <XCircle className="w-3 h-3 mr-1" /> {ecoStats.error} Error
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
                  <Layers className="w-4 h-4" /> Category Health Distribution
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
                      <Bar dataKey="Healthy" stackId="a" fill="#22c55e" />
                      <Bar dataKey="Warning" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="Error" stackId="a" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scheduler Status */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Scheduler Status
                </CardTitle>
                <Badge variant={scheduler.health > 80 ? "default" : scheduler.health > 60 ? "secondary" : "destructive"}>
                  {scheduler.health}% Healthy
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Pending', value: scheduler.pending, color: 'bg-slate-100 text-slate-700' },
                  { label: 'Running', value: scheduler.running, color: 'bg-blue-100 text-blue-700' },
                  { label: 'Completed', value: scheduler.completed, color: 'bg-green-100 text-green-700' },
                  { label: 'Failed', value: scheduler.failed, color: 'bg-red-100 text-red-700' },
                ].map(s => (
                  <div key={s.label} className={`rounded-lg p-3 text-center ${s.color}`}>
                    <div className="text-xs text-slate-500">{s.label}</div>
                    <div className="text-xl font-bold">{s.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* MCP List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">MCP List</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Search MCPs..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <select className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
                    <option value="all">All Status</option>
                    <option value="healthy">Healthy</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                  <select className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg" value={selectedCat || ''} onChange={e => setSelectedCat(e.target.value || null)}>
                    <option value="">All Categories</option>
                    {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name} ({cat.total})</option>)}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {visibleTools.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Filter className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No matching MCPs found</p>
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

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>Page {pagination?.page || 1} / {pagination?.totalPages || 1} · Total {pagination?.total || 0}</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={(pagination?.page || 1) <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={(pagination?.page || 1) >= (pagination?.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Panel */}
          {alerts.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" /> System Alerts
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

        {/* ══ MCPMarketplace Tab ══ */}
        <TabsContent value="marketplace" className="space-y-4">
          {loading.marketplace ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
              <span className="text-slate-500">Loading Marketplace data…</span>
            </div>
          ) : !marketplaceLoaded && marketplace.length === 0 ? (
            <div className="text-center py-10 text-slate-500 border rounded-lg bg-slate-50">
              <p className="font-medium">MCP Marketplace is not available</p>
              <p className="text-sm mt-1">Please check network or try again later</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchMarketplace}>Retry Loading Marketplace</Button>
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
                            <CheckCircle className="w-3 h-3 mr-1" /> Installed
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
                              <ExternalLink className="w-3.5 h-3.5 mr-1" /> Details
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 text-red-600 border-red-300 hover:bg-red-50" onClick={() => uninstallSkill(skill.slug)} disabled={!!pendingBySlug[skill.slug]}>
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> {pendingActionBySlug[skill.slug] === 'uninstall' ? 'UninstallMedium' : 'Uninstall'}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(`https://clawhub.com/skills/${skill.slug}`, '_blank')}>
                              <ExternalLink className="w-3.5 h-3.5 mr-1" /> Details
                            </Button>
                            <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => installSkill(skill.slug)} disabled={installing === skill.slug || !!pendingBySlug[skill.slug]}>
                              {installing === skill.slug ? (
                                <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> InstallMedium</>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5 mr-1" /> Install
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
                Data from <a href="https://clawhub.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">ClawHub.com</a> · {marketplace.length} skills
              </div>
            </>
          )}
        </TabsContent>

        {/* ══ My MCPs Tab ══ */}
        <TabsContent value="installed" className="space-y-4">
          {loading.installed ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
              <span className="text-slate-500">Load installed skills…</span>
            </div>
          ) : !installedLoaded && installed.length === 0 ? (
            <div className="text-center py-10 text-slate-500 border rounded-lg bg-slate-50">
              <p className="font-medium">Installed MCP data is not available</p>
              <p className="text-sm mt-1">Please check service status or try again later</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchInstalled}>Retry Loading Installed</Button>
            </div>
          ) : (
            <>
              {/* Batch Operations */}
              <Card>
                <CardContent className="p-4 flex flex-wrap items-center gap-3">
                  <Button variant={batchMode ? 'default' : 'outline'} size="sm" onClick={() => setBatchMode(v => !v)}>
                    {batchMode ? 'Exit Batch Mode' : 'Batch Operation Mode'}
                  </Button>
                  {batchMode && (
                    <>
                      <select className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg" value={batchAction} onChange={(e) => setBatchAction(e.target.value as any)}>
                        <option value="disable">Batch Disable</option>
                        <option value="enable">Batch Enable</option>
                        <option value="uninstall">Batch Uninstall</option>
                      </select>
                      <Button size="sm" onClick={() => runBatchAction(false)} disabled={batchRunning || selectedInstalledSlugs.length === 0}>
                        {batchRunning ? 'Executing...' : `Execute (${selectedInstalledSlugs.length})`}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => runBatchAction(true)} disabled={batchRunning || batchFailedSlugs.length === 0}>
                        Retry Failed ({batchFailedSlugs.length})
                      </Button>
                      {batchProgress.total > 0 && (
                        <span className="text-xs text-slate-500">Progress {batchProgress.done}/{batchProgress.total}</span>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Skill Management Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500">Installed Skills</div>
                        <div className="text-2xl font-bold">{kpi.totalInstalled}</div>
                      </div>
                      <Package className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500">Active Skills</div>
                        <div className="text-2xl font-bold">{kpi.activeSkills}</div>
                      </div>
                      <Zap className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500">Total Usage Count</div>
                        <div className="text-2xl font-bold">{kpi.usageThisWeek}</div>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Skills List */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Installed Skill Management</CardTitle>
                </CardHeader>
                <CardContent>
                  {installed.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>No installed skills</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveTab('marketplace')}>
                        <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Go to MCP Marketplace
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {installed.map(skill => (
                        <div key={skill.slug} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                            {batchMode && (
                              <input
                                type="checkbox"
                                checked={!!batchSelected[skill.slug]}
                                onChange={(e) => setBatchSelected(prev => ({ ...prev, [skill.slug]: e.target.checked }))}
                              />
                            )}
                            <div className={`w-2 h-2 rounded-full ${skill.status === 'active' ? 'bg-green-500' : skill.status === 'disabled' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                            <div>
                              <div className="font-medium text-slate-800 flex items-center gap-2">
                                {skill.name}
                                {updateMap.get(skill.slug)?.hasUpdate && (
                                  <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-700 bg-blue-50">Update available: v{updateMap.get(skill.slug)?.latestVersion}</Badge>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>v{skill.version}</span>•<span>{skill.description}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-xs text-slate-500">Used {skill.usageCount} times</div>
                              <div className="text-xs text-slate-400">{fmtTime(skill.lastUsed)}</div>
                            </div>
                            <div className="flex items-center gap-1">
                              {updateMap.get(skill.slug)?.hasUpdate && (
                                <Button variant="outline" size="sm" onClick={() => updateSkillVersion(skill.slug)} disabled={updatingSlug === skill.slug || !!pendingBySlug[skill.slug]}>
                                  {updatingSlug === skill.slug ? 'Updating...' : 'Update'}
                                </Button>
                              )}
                              <Button variant="outline" size="sm" onClick={() => toggleSkillStatus(skill.slug, skill.status)} disabled={!!pendingBySlug[skill.slug] || updatingSlug === skill.slug}>
                                {pendingActionBySlug[skill.slug] === 'toggle' ? 'Processing...' : (skill.status === 'active' ? 'Disable' : 'Enable')}
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => uninstallSkill(skill.slug)} disabled={!!pendingBySlug[skill.slug] || updatingSlug === skill.slug}>
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

        {/* ══ MCPStats Tab ══ */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">This Week Usage Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="usageCount" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Category Usage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryUsageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="category" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="usageCount" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Skill Usage Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...installed].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5).map((skill, idx) => (
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
                        <div className="font-medium">{skill.usageCount} times</div>
                        <div className="text-xs text-slate-500">usageCount</div>
                      </div>
                      <Badge variant={skill.status === 'active' ? 'default' : 'secondary'}>
                        {skill.status === 'active' ? 'Active' : 'Disabled'}
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
                <CardTitle className="text-base">Marketplace Popular Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...marketplace].sort((a, b) => b.downloads - a.downloads).slice(0, 3).map(skill => (
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
                        <div className="text-xs text-slate-500">Download</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">MCP Health Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Healthy Rate</span>
                    <span className="font-medium">{ecoStats.healthRate}%</span>
                  </div>
                  <Progress value={ecoStats.healthRate} className="h-2" />
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-bold text-green-700">{ecoStats.healthy}</div>
                      <div className="text-xs text-green-600">Healthy</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <div className="font-bold text-yellow-700">{ecoStats.warning}</div>
                      <div className="text-xs text-yellow-600">Warning</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="font-bold text-red-700">{ecoStats.error}</div>
                      <div className="text-xs text-red-600">Error</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <div className="text-xs text-slate-400 text-center pt-4 border-t border-slate-200">
        <p>Last updated: {lastRefresh ? fmtTime(lastRefresh.toISOString()) : '—'}</p>
        <p className="mt-1">MCP Ecosystem data from /api/ecosystem/status · Marketplace data from ClawHub.com</p>
      </div>
    </div>
  );
}
