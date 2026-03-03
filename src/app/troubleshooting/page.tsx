'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Bug, Search, AlertTriangle, CheckCircle, Clock, RefreshCw,
  Terminal, Server, Cpu, Shield, Download, Play,
  ChevronRight, Circle, Activity, Zap, ExternalLink,
} from 'lucide-react';

// ─── Type ────────────────────────────────────────────────────────────────────
interface Issue {
  id: string; component: string;
  severity: 'high' | 'medium' | 'low';
  description: string; detectedAt: string;
  status: 'active' | 'investigating' | 'resolved';
  solution: string; category: string;
  testResultId?: string; fixAction?: string;
}
interface IssueSummary {
  total: number; active: number; investigating: number; resolved: number;
  high: number; medium: number; low: number;
}
interface SystemSnapshot {
  system:     { cpu: number|null; memory: number|null; uptime: number; nodeRss: number; nodeHeap: number };
  testing:    { total: number; passed: number; failed: number; successRate: number; lastRun: string|null };
  automation: { status: string; modules: number; tasks: number };
}
interface DiagTool {
  id: string; name: string; description: string; icon: string;
  duration: string; action: string; category: string;
}

// ─── Config ────────────────────────────────────────────────────────────────────
const SEV_CFG = {
  high:   { badge: 'bg-red-100 text-red-700 border-red-200',      dot: 'fill-red-500 text-red-500',      label: 'Critical', bar: 'bg-red-500' },
  medium: { badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'fill-yellow-500 text-yellow-500', label: 'Medium', bar: 'bg-yellow-500' },
  low:    { badge: 'bg-green-100 text-green-700 border-green-200', dot: 'fill-green-500 text-green-500',   label: 'Low', bar: 'bg-green-500' },
};
const STA_CFG = {
  active:        { color: 'text-red-600',    icon: <AlertTriangle className="w-4 h-4" />, label: 'Active' },
  investigating: { color: 'text-yellow-600', icon: <Clock         className="w-4 h-4" />, label: 'Investigating' },
  resolved:      { color: 'text-green-600',  icon: <CheckCircle   className="w-4 h-4" />, label: 'Resolved' },
};
const TOOL_ICONS: Record<string, React.ReactNode> = {
  server:   <Server   className="w-5 h-5" />,
  cpu:      <Cpu      className="w-5 h-5" />,
  shield:   <Shield   className="w-5 h-5" />,
  terminal: <Terminal className="w-5 h-5" />,
};
function fmtTime(iso: string | null) {
  if (!iso) return '-';
  try {
    const d = new Date(iso), now = Date.now(), diff = now - d.getTime();
    if (diff < 60000)    return 'just now';
    if (diff < 3600000)  return `${Math.floor(diff / 60000)}  minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}  hours ago`;
    return d.toLocaleDateString('zh-CN');
  } catch { return iso; }
}
function fmtUptime(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ─── Main Component ──────────────────────────────────────────────────────────────────
export default function TroubleshootingPage() {
  const [tab,        setTab]        = useState<'issues' | 'tools' | 'snapshot'>('issues');
  const [issues,     setIssues]     = useState<Issue[]>([]);
  const [summary,    setSummary]    = useState<IssueSummary | null>(null);
  const [snapshot,   setSnapshot]   = useState<SystemSnapshot | null>(null);
  const [tools,      setTools]      = useState<DiagTool[]>([]);
  const [scanning,   setScanning]   = useState(false);
  const [scanPct,    setScanPct]    = useState(0);
  const [scanMsg,    setScanMsg]    = useState('');
  const [runningTool, setRunningTool] = useState<string | null>(null);
  const [fixingId,   setFixingId]   = useState<string | null>(null);
  const [msg,        setMsg]        = useState<{ type: 'ok'|'err'; text: string } | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState<'all' | 'active' | 'resolved'>('all');

  const toast = (type: 'ok'|'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4500);
  };

  // ── Data Loading ──
  const fetchData = useCallback(async () => {
    try {
      const [issuesRes, snapRes, toolsRes] = await Promise.all([
        fetch('/api/troubleshooting?action=issues').then(r => r.json()),
        fetch('/api/troubleshooting?action=system-snapshot').then(r => r.json()),
        fetch('/api/troubleshooting?action=tools').then(r => r.json()),
      ]);
      if (issuesRes.success) { setIssues(issuesRes.data.issues); setSummary(issuesRes.data.summary); }
      if (snapRes.success)   setSnapshot(snapRes.data);
      if (toolsRes.success)  setTools(toolsRes.data.tools);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Full System Scan ──
  const fullScan = async () => {
    setScanning(true); setScanPct(0); setScanMsg('Starting scan...');
    // Simulated progress(Real scan approx. 10-20s)
    const steps = [
      [10, 'Detection API Healthy...'],
      [30, 'Run Performance Test...'],
      [55, 'Run Security Scan...'],
      [75, 'System Diagnostics running...'],
      [90, 'Summary analysis results...'],
    ];
    let i = 0;
    const timer = setInterval(() => {
      if (i < steps.length) {
        setScanPct(steps[i][0] as number);
        setScanMsg(steps[i][1] as string);
        i++;
      }
    }, 2500);

    try {
      const res = await fetch('/api/troubleshooting', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full-scan' }),
      });
      const data = await res.json();
      clearInterval(timer);
      setScanPct(100); setScanMsg('Scan complete ✅');
      setTimeout(async () => {
        await fetchData();
        setScanning(false);
        toast('ok', data.data?.message ?? 'System scan complete, issue list updated');
      }, 800);
    } catch {
      clearInterval(timer);
      setScanning(false);
      toast('err', 'Scan failed, Please try again later');
    }
  };

  // ── Run Individual Diagnostics ──
  const runTool = async (tool: DiagTool) => {
    setRunningTool(tool.id);
    try {
      const res = await fetch('/api/troubleshooting', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run-tool', toolAction: tool.action }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        toast('ok', `${tool.name} Execution complete, Issue list updated`);
      } else { toast('err', data.message ?? 'Execution failed'); }
    } catch { toast('err', 'Request failed'); }
    finally { setRunningTool(null); }
  };

  // ── Mark Resolved ──
  const markResolved = async (issue: Issue) => {
    setFixingId(issue.id);
    try {
      const res = await fetch('/api/troubleshooting', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', issueId: issue.id }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        toast('ok', `"${issue.component}"Marked as resolved`);
      } else { toast('err', data.message ?? 'Operation failed'); }
    } catch { toast('err', 'Request failed'); }
    finally { setFixingId(null); }
  };

  // ── Apply Fix ──
  const applyFix = async (issue: Issue) => {
    setFixingId(issue.id + '_fix');
    try {
      const res = await fetch('/api/troubleshooting', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply-fix', issueId: issue.id }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        toast('ok', data.message ?? 'Fix applied');
      } else { toast('err', data.message ?? 'Fix failed'); }
    } catch { toast('err', 'Request failed'); }
    finally { setFixingId(null); }
  };

  // ── Export Report ──
  const exportReport = async () => {
    try {
      const res = await fetch('/api/troubleshooting', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export-report' }),
      });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `troubleshooting-report-${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
      toast('ok', 'Diagnostic report exported');
    } catch { toast('err', 'Export failed'); }
  };

  // ── Filter Issues ──
  const filtered = issues.filter(i => {
    if (filter === 'active')   return i.status === 'active' || i.status === 'investigating';
    if (filter === 'resolved') return i.status === 'resolved';
    return true;
  });

  const tabs = [
    { id: 'issues',   label: 'Issue List',   icon: <Bug       className="w-3.5 h-3.5" /> },
    { id: 'tools',    label: 'DiagnosticsMCP',   icon: <Terminal  className="w-3.5 h-3.5" /> },
    { id: 'snapshot', label: 'System Snapshot',   icon: <Activity  className="w-3.5 h-3.5" /> },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
        <span className="text-slate-500">Loading fault data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Message Prompt ── */}
      {msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 transition-all ${
          msg.type === 'ok'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50   text-red-700   border border-red-200'
        }`}>
          {msg.type === 'ok' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Troubleshooting Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Data Source: Testing center real-time results ·
            <span className="ml-1 text-blue-500">
              {summary?.total ?? 0}  issues
              {(summary?.active ?? 0) > 0
                ? <span className="text-red-500 ml-1">({summary?.active}  Active)</span>
                : <span className="text-green-500 ml-1">(System healthy)</span>
              }
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="w-3.5 h-3.5 mr-1" /> Export Report
          </Button>
          <Button size="sm" onClick={fullScan} disabled={scanning}
            className="bg-blue-600 hover:bg-blue-700 text-white">
            {scanning
              ? <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />Scanning...</>
              : <><Search    className="w-3.5 h-3.5 mr-1" />Full System Scan</>
            }
          </Button>
        </div>
      </div>

      {/* ── Scan progress bar ── */}
      {scanning && (
        <Card className="border border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-700">{scanMsg}</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{scanPct}%</span>
            </div>
            <Progress value={scanPct} className="h-2" />
            <p className="text-xs text-blue-500 mt-2">Calling testing center API: Health Check → Performance Test → Security Scan → System Diagnostics</p>
          </CardContent>
        </Card>
      )}

      {/* ── KPI Card ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Issues',   value: summary?.active ?? 0,       icon: <AlertTriangle className="w-5 h-5 text-red-500" />,    color: 'bg-red-50 border-red-100',    click: () => { setTab('issues'); setFilter('active'); } },
          { label: 'Investigating',     value: summary?.investigating ?? 0, icon: <Clock         className="w-5 h-5 text-yellow-500" />, color: 'bg-yellow-50 border-yellow-100' },
          { label: 'Resolved',     value: summary?.resolved ?? 0,      icon: <CheckCircle   className="w-5 h-5 text-green-500" />,  color: 'bg-green-50 border-green-100', click: () => { setTab('issues'); setFilter('resolved'); } },
          { label: 'Critical Issues',   value: summary?.high ?? 0,          icon: <Bug           className="w-5 h-5 text-orange-500" />, color: 'bg-orange-50 border-orange-100' },
        ].map(k => (
          <Card key={k.label}
            className={`border ${k.color} ${k.click ? 'cursor-pointer hover:shadow-sm transition-shadow' : ''}`}
            onClick={k.click}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500">{k.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{k.value}</p>
                </div>
                <div className="p-2 rounded-lg bg-white shadow-sm">{k.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ══ Issue List Tab ══ */}
      {tab === 'issues' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-2">
            {(['all','active','resolved'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                  filter === f ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}>
                {f === 'all' ? `All (${summary?.total ?? 0})` : f === 'active' ? `Active (${summary?.active ?? 0})` : `Resolved (${summary?.resolved ?? 0})`}
              </button>
            ))}
            <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Data from Testing Center live results
              <button onClick={fetchData} className="ml-1 text-blue-400 hover:text-blue-600">Refresh</button>
            </span>
          </div>

          {/* Healthy state when no issues */}
          {filtered.length === 0 && (
            <Card className={`border ${(summary?.active ?? 0) === 0 ? 'border-green-200 bg-green-50/40' : 'border-dashed border-slate-300'}`}>
              <CardContent className="p-10 text-center">
                {(summary?.total ?? 0) === 0 ? (
                  <>
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p className="text-green-700 font-medium">System running healthy</p>
                    <p className="text-sm text-slate-500 mt-1">Testing center detected no failures</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={fullScan} disabled={scanning}>
                      <Play className="w-3.5 h-3.5 mr-1" /> Run Full System Scan to detect potential issues
                    </Button>
                  </>
                ) : (
                  <>
                    <Bug className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm text-slate-400">No data for this filter</p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Issue Card */}
          {filtered.map(issue => (
            <Card key={issue.id} className={`border ${
              issue.status === 'resolved' ? 'border-green-100 bg-green-50/30 opacity-70'
              : issue.severity === 'high' ? 'border-red-200' : 'border-slate-200'
            }`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <Circle className={`w-2.5 h-2.5 mt-1.5 shrink-0 ${SEV_CFG[issue.severity]?.dot}`} />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800">{issue.component}</h3>
                        <Badge variant="outline" className={`text-[10px] ${SEV_CFG[issue.severity]?.badge}`}>
                          {SEV_CFG[issue.severity]?.label}
                        </Badge>
                        <span className={`flex items-center gap-1 text-xs ${STA_CFG[issue.status]?.color}`}>
                          {STA_CFG[issue.status]?.icon}
                          {STA_CFG[issue.status]?.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Detected at {fmtTime(issue.detectedAt)} · Category: {issue.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {issue.status !== 'resolved' && (
                      <>
                        <Button variant="outline" size="sm" className="h-7 text-xs"
                          disabled={fixingId === issue.id}
                          onClick={() => markResolved(issue)}>
                          {fixingId === issue.id
                            ? <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                            : <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                          }
                          Mark Resolved
                        </Button>
                        <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={fixingId === issue.id + '_fix'}
                          onClick={() => applyFix(issue)}>
                          {fixingId === issue.id + '_fix'
                            ? <><RefreshCw className="w-3 h-3 animate-spin mr-1" />Fixing...</>
                            : <><Zap className="w-3 h-3 mr-1" />Apply Fix</>
                          }
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Issue Description */}
                <div className="bg-slate-50 rounded-lg px-3 py-2 mb-3">
                  <p className="text-xs text-slate-600 font-mono">{issue.description}</p>
                </div>

                {/* Solution */}
                <div className="flex items-start gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-400 mr-1">Suggested Fixes: </span>
                    <span className="text-xs text-slate-600">{issue.solution}</span>
                  </div>
                </div>

                {/* Navigate to Testing Center */}
                {issue.testResultId && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-blue-400">
                    <ExternalLink className="w-3 h-3" />
                    <a href="/testing" className="hover:text-blue-600 underline">View detailed results in Testing Center</a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ══ DiagnosticsMCP Tab ══ */}
      {tab === 'tools' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">DiagnosticsMCP</h2>
              <p className="text-xs text-slate-500">All MCP calls Testing Center API to run real detection</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map(tool => (
              <Card key={tool.id} className="border border-slate-200 hover:border-blue-200 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        tool.category === 'health' ? 'bg-green-100 text-green-600'
                        : tool.category === 'performance' ? 'bg-purple-100 text-purple-600'
                        : tool.category === 'security' ? 'bg-red-100 text-red-600'
                        : 'bg-slate-100 text-slate-600'
                      }`}>
                        {TOOL_ICONS[tool.icon] ?? <Terminal className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{tool.name}</h3>
                        <p className="text-xs text-slate-400">Estimated duration {tool.duration}</p>
                      </div>
                    </div>
                    <Button size="sm" className="h-7 text-xs"
                      variant={runningTool === tool.id ? 'outline' : 'default'}
                      disabled={!!runningTool}
                      onClick={() => runTool(tool)}>
                      {runningTool === tool.id
                        ? <><RefreshCw className="w-3 h-3 animate-spin mr-1" />Executing...</>
                        : <><Play className="w-3 h-3 mr-1" />Execute</>
                      }
                    </Button>
                  </div>
                  <p className="text-sm text-slate-600">{tool.description}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-blue-400">
                    <ExternalLink className="w-3 h-3" />
                    <a href="/testing" className="hover:text-blue-600 underline">View results in Testing Center</a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* One-Click Full Scan */}
          <Card className="border border-blue-200 bg-blue-50/40">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">Full Diagnostics</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Run all diagnostics simultaneously for comprehensive system status detection</p>
                </div>
                <Button onClick={fullScan} disabled={scanning}
                  className="bg-blue-600 hover:bg-blue-700 text-white">
                  {scanning
                    ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Scanning...</>
                    : <><Play       className="w-4 h-4 mr-2" />One-Click Full Scan</>
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══ System Snapshot Tab ══ */}
      {tab === 'snapshot' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">System Snapshot</h2>
              <p className="text-xs text-slate-500">Aggregate real-time status of subsystems</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          </div>

          {snapshot && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* System Resources */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-500" /> System Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {snapshot.system.cpu !== null && (
                    <>
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>CPU Usage</span><span>{snapshot.system.cpu}%</span>
                        </div>
                        <Progress value={snapshot.system.cpu} className="h-1.5" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Memory Usage</span><span>{snapshot.system.memory}%</span>
                        </div>
                        <Progress value={snapshot.system.memory ?? 0} className="h-1.5" />
                      </div>
                    </>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                    <div><span className="block text-[10px] text-slate-300 uppercase tracking-wide mb-0.5">Node RSS</span>{snapshot.system.nodeRss} MB</div>
                    <div><span className="block text-[10px] text-slate-300 uppercase tracking-wide mb-0.5">Heap Used</span>{snapshot.system.nodeHeap} MB</div>
                    <div className="col-span-2"><span className="block text-[10px] text-slate-300 uppercase tracking-wide mb-0.5">Uptime</span>{fmtUptime(snapshot.system.uptime)}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Testing Center Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" /> Testing Center
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Success Rate</span><span>{snapshot.testing.successRate}%</span>
                    </div>
                    <Progress value={snapshot.testing.successRate} className="h-1.5" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-center">
                    <div className="bg-slate-50 rounded p-2">
                      <div className="text-lg font-bold text-slate-800">{snapshot.testing.total}</div>
                      <div className="text-slate-400">Total</div>
                    </div>
                    <div className="bg-green-50 rounded p-2">
                      <div className="text-lg font-bold text-green-700">{snapshot.testing.passed}</div>
                      <div className="text-green-600">Passed</div>
                    </div>
                    <div className="bg-red-50 rounded p-2">
                      <div className="text-lg font-bold text-red-700">{snapshot.testing.failed}</div>
                      <div className="text-red-600">Failed</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Recent Run: {fmtTime(snapshot.testing.lastRun)}</p>
                  <a href="/testing" className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
                    <ExternalLink className="w-3 h-3" /> Go to Testing Center
                  </a>
                </CardContent>
              </Card>

              {/* Automation Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" /> Automation System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${snapshot.automation.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="text-sm font-medium text-slate-700">
                      {snapshot.automation.status === 'running' ? 'Running' : snapshot.automation.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div><span className="block text-[10px] text-slate-300 uppercase tracking-wide mb-0.5">Module Count</span>{snapshot.automation.modules}</div>
                    <div><span className="block text-[10px] text-slate-300 uppercase tracking-wide mb-0.5">Task Count</span>{snapshot.automation.tasks}</div>
                  </div>
                  <a href="/automation" className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
                    <ExternalLink className="w-3 h-3" /> Go to Automation Center
                  </a>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
