'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Play, RefreshCw, Download, Trash2, CheckCircle, AlertTriangle,
  Terminal, Globe, Cpu, Shield, BarChart3, Clock, Zap, Activity,
  Search, ChevronRight, Circle,
} from 'lucide-react';

// ─── 类型 ────────────────────────────────────────────────────────────────────
interface TestResult {
  id: string; name: string;
  category: 'api' | 'health' | 'performance' | 'security' | 'custom';
  status: 'passed' | 'failed' | 'running' | 'error';
  duration: number; output: string; timestamp: string;
}
interface Summary {
  totalTests: number; passedTests: number; failedTests: number;
  successRate: number; avgDuration: number; lastRun: string | null;
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  passed:  { color: 'bg-green-100 text-green-700 border-green-200',  dot: 'fill-green-500  text-green-500',  label: '通过' },
  failed:  { color: 'bg-red-100   text-red-700   border-red-200',    dot: 'fill-red-500    text-red-500',    label: '失败' },
  error:   { color: 'bg-red-100   text-red-700   border-red-200',    dot: 'fill-red-500    text-red-500',    label: '错误' },
  running: { color: 'bg-blue-100  text-blue-700  border-blue-200',   dot: 'fill-blue-500   text-blue-500',   label: '运行中' },
};
const CAT_CFG: Record<string, { label: string; icon: React.ReactNode }> = {
  api:         { label: 'API',  icon: <Globe  className="w-3 h-3" /> },
  health:      { label: '健康', icon: <Activity className="w-3 h-3" /> },
  performance: { label: '性能', icon: <Cpu    className="w-3 h-3" /> },
  security:    { label: '安全', icon: <Shield className="w-3 h-3" /> },
  custom:      { label: '自定义', icon: <Terminal className="w-3 h-3" /> },
};
function fmtTime(iso: string) {
  try {
    const d = new Date(iso), now = Date.now(), diff = now - d.getTime();
    if (diff < 60000)  return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    return d.toLocaleTimeString('zh-CN');
  } catch { return iso; }
}

// ─── 主组件 ──────────────────────────────────────────────────────────────────
export default function TestingCenterPage() {
  const [activeTab, setActiveTab]     = useState<'health' | 'performance' | 'security' | 'custom' | 'reports'>('health');
  const [results,   setResults]       = useState<TestResult[]>([]);
  const [summary,   setSummary]       = useState<Summary | null>(null);
  const [running,   setRunning]       = useState<string | null>(null);
  const [customUrl, setCustomUrl]     = useState('http://localhost:3001/api/health');
  const [msg,       setMsg]           = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showMsg = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const fetchSummary = useCallback(async () => {
    try {
      const [sumRes, resRes] = await Promise.all([
        fetch('/api/test?action=summary').then(r => r.json()),
        fetch('/api/test?action=results&limit=30').then(r => r.json()),
      ]);
      if (sumRes.success)  setSummary(sumRes.data);
      if (resRes.success)  setResults(resRes.data.results ?? []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // ── 通用运行测试 ──
  const runTest = async (action: string, label: string) => {
    setRunning(action);
    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg('ok', `${label} 完成，结果已更新`);
        await fetchSummary();
      } else {
        showMsg('err', data.error ?? '执行失败');
      }
    } catch {
      showMsg('err', '请求失败');
    } finally {
      setRunning(null);
    }
  };

  // ── 自定义 URL 测试 ──
  const runCustomUrl = async () => {
    if (!customUrl.trim()) { showMsg('err', '请输入 URL'); return; }
    setRunning('custom');
    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run-custom', url: customUrl }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg('ok', `测试完成: ${data.data.result.status}`);
        await fetchSummary();
      } else { showMsg('err', data.error ?? '失败'); }
    } catch { showMsg('err', '请求失败'); }
    finally { setRunning(null); }
  };

  // ── 导出报告 ──
  const exportReport = async () => {
    try {
      const res = await fetch('/api/test?action=export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `mc-test-report-${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
      showMsg('ok', '报告已导出');
    } catch { showMsg('err', '导出失败'); }
  };

  // ── 清除记录 ──
  const clearResults = async () => {
    await fetch('/api/test', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear-results' }),
    });
    setResults([]); setSummary(null);
    showMsg('ok', '已清除所有测试记录');
  };

  // ── 全部测试 ──
  const runAll = async () => {
    setRunning('all');
    try {
      await Promise.all([
        fetch('/api/test', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'run-all-health'}) }),
        fetch('/api/test', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'run-performance'}) }),
        fetch('/api/test', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'run-security'}) }),
        fetch('/api/test', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'run-diagnostic'}) }),
      ]);
      await fetchSummary();
      showMsg('ok', '全部测试完成');
    } catch { showMsg('err', '部分测试失败'); }
    finally { setRunning(null); }
  };

  // ── 过滤当前 Tab 结果 ──
  const catMap: Record<string, string> = {
    health: 'health', performance: 'performance', security: 'security', custom: 'custom',
  };
  const tabResults = activeTab === 'reports'
    ? results
    : results.filter(r => r.category === catMap[activeTab] || (activeTab === 'health' && r.category === 'api'));

  const passRate = summary?.successRate ?? 0;

  // ── 报告图表数据 ──
  const chartData = (['api','health','performance','security','custom'] as const).map(cat => {
    const catRes = results.filter(r => r.category === cat);
    const passed = catRes.filter(r => r.status === 'passed').length;
    return {
      name: CAT_CFG[cat]?.label ?? cat,
      通过: passed,
      失败: catRes.length - passed,
    };
  }).filter(d => d.通过 + d.失败 > 0);

  const tabs = [
    { id: 'health',      icon: <Activity className="w-3.5 h-3.5" />, label: '健康检查' },
    { id: 'performance', icon: <Cpu      className="w-3.5 h-3.5" />, label: '性能测试' },
    { id: 'security',    icon: <Shield   className="w-3.5 h-3.5" />, label: '安全扫描' },
    { id: 'custom',      icon: <Search   className="w-3.5 h-3.5" />, label: '自定义测试' },
    { id: 'reports',     icon: <BarChart3 className="w-3.5 h-3.5" />, label: '测试报告' },
  ] as const;

  return (
    <div className="p-6 space-y-6">

      {/* ── 消息提示 ── */}
      {msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 transition-all ${
          msg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {msg.type === 'ok' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* ── 页头 ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">测试中心</h1>
          <p className="text-sm text-slate-500 mt-0.5">自动化测试 · 性能监控 · 安全扫描 · 故障诊断</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSummary} disabled={!!running}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${running === 'refresh' ? 'animate-spin' : ''}`} /> 刷新
          </Button>
          <Button size="sm" onClick={runAll} disabled={!!running}
            className="bg-blue-600 hover:bg-blue-700 text-white">
            {running === 'all'
              ? <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />执行中…</>
              : <><Play className="w-3.5 h-3.5 mr-1" />运行全部测试</>
            }
          </Button>
        </div>
      </div>

      {/* ── KPI 卡片 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '总测试数', value: summary?.totalTests ?? 0, icon: <BarChart3 className="w-5 h-5 text-blue-500" />, color: 'bg-blue-50 border-blue-100', sub: '累计执行' },
          { label: '成功率',   value: `${passRate}%`, icon: <CheckCircle className="w-5 h-5 text-green-500" />, color: 'bg-green-50 border-green-100', sub: `${summary?.passedTests ?? 0} 通过 / ${summary?.failedTests ?? 0} 失败` },
          { label: '平均耗时', value: summary?.avgDuration ? `${summary.avgDuration}ms` : '—', icon: <Clock className="w-5 h-5 text-purple-500" />, color: 'bg-purple-50 border-purple-100', sub: '所有测试' },
          { label: '最近运行', value: summary?.lastRun ? fmtTime(summary.lastRun) : '未运行', icon: <Zap className="w-5 h-5 text-orange-500" />, color: 'bg-orange-50 border-orange-100', sub: '上次执行时间' },
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

      {/* ── Tab 栏 ── */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.id
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ══ 健康检查 Tab ══ */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">API 健康检查</h2>
              <p className="text-xs text-slate-500">检测所有 Mission Control API 端点可用性</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => runTest('run-diagnostic', '故障诊断')} disabled={!!running}>
                <Terminal className="w-3.5 h-3.5 mr-1" /> 系统诊断
              </Button>
              <Button size="sm" onClick={() => runTest('run-all-health', 'API健康检查')} disabled={!!running}
                className="bg-green-600 hover:bg-green-700 text-white">
                {running === 'run-all-health'
                  ? <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />检测中…</>
                  : <><Play className="w-3.5 h-3.5 mr-1" />开始检测</>
                }
              </Button>
            </div>
          </div>

          {tabResults.length === 0 ? (
            <Card className="border border-dashed border-slate-300">
              <CardContent className="p-10 text-center text-slate-400">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">点击「开始检测」运行 API 健康检查</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tabResults.map(r => (
                <Card key={r.id} className="border border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Circle className={`w-2.5 h-2.5 shrink-0 ${STATUS_CFG[r.status]?.dot}`} />
                        <span className="font-medium text-slate-800 text-sm">{r.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={`text-[10px] ${STATUS_CFG[r.status]?.color}`}>
                          {STATUS_CFG[r.status]?.label}
                        </Badge>
                        {r.duration > 0 && (
                          <span className="text-[10px] text-slate-400">{r.duration}ms</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-mono bg-slate-50 rounded px-2 py-1.5 truncate">
                      {r.output}
                    </p>
                    <p className="text-[10px] text-slate-300 mt-1.5">{fmtTime(r.timestamp)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ 性能测试 Tab ══ */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">性能基准测试</h2>
              <p className="text-xs text-slate-500">每个端点连续测3次，计算平均响应时间</p>
            </div>
            <Button size="sm" onClick={() => runTest('run-performance', '性能测试')} disabled={!!running}
              className="bg-purple-600 hover:bg-purple-700 text-white">
              {running === 'run-performance'
                ? <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />测试中…</>
                : <><Cpu className="w-3.5 h-3.5 mr-1" />运行性能测试</>
              }
            </Button>
          </div>

          {tabResults.length === 0 ? (
            <Card className="border border-dashed border-slate-300">
              <CardContent className="p-10 text-center text-slate-400">
                <Cpu className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">点击「运行性能测试」开始基准测试</p>
                <p className="text-xs mt-1">测试 4 个核心 API 的响应时间，每个测 3 次取平均</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tabResults.map(r => {
                const pct = Math.min(100, (r.duration / 2000) * 100);
                const barColor = r.duration < 200 ? 'bg-green-500' : r.duration < 500 ? 'bg-yellow-500' : 'bg-red-500';
                return (
                  <Card key={r.id} className="border border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-800 text-sm">{r.name.replace('性能: ', '')}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${r.duration < 200 ? 'text-green-600' : r.duration < 500 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {r.duration}ms
                          </span>
                          <Badge variant="outline" className={`text-[10px] ${STATUS_CFG[r.status]?.color}`}>
                            {STATUS_CFG[r.status]?.label}
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                        <div className={`${barColor} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-slate-500 font-mono">{r.output}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <Card className="border border-slate-200 bg-slate-50">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 font-medium mb-1">评分标准</p>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> &lt; 200ms 优秀</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> 200–500ms 一般</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &gt; 500ms 需优化</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══ 安全扫描 Tab ══ */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">安全扫描</h2>
              <p className="text-xs text-slate-500">检查 CORS 配置、敏感路由暴露、安全响应头</p>
            </div>
            <Button size="sm" onClick={() => runTest('run-security', '安全扫描')} disabled={!!running}
              className="bg-red-600 hover:bg-red-700 text-white">
              {running === 'run-security'
                ? <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />扫描中…</>
                : <><Shield className="w-3.5 h-3.5 mr-1" />开始扫描</>
              }
            </Button>
          </div>

          {tabResults.length === 0 ? (
            <Card className="border border-dashed border-slate-300">
              <CardContent className="p-10 text-center text-slate-400">
                <Shield className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">点击「开始扫描」运行安全检测</p>
                <p className="text-xs mt-1">检测项目：CORS 配置 · 敏感路由 · X-Frame-Options</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tabResults.map(r => (
                <Card key={r.id} className={`border ${r.status === 'passed' ? 'border-green-100 bg-green-50/40' : 'border-red-100 bg-red-50/40'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {r.status === 'passed'
                          ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                          : <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                        }
                        <span className="font-medium text-slate-800 text-sm">{r.name}</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${STATUS_CFG[r.status]?.color}`}>
                        {STATUS_CFG[r.status]?.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 pl-6">{r.output}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ 自定义测试 Tab ══ */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">自定义 URL 测试</CardTitle>
              <CardDescription className="text-xs">输入任意 URL，检测其可用性和响应信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runCustomUrl()}
                  placeholder="https://example.com/api/endpoint"
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={runCustomUrl} disabled={running === 'custom'}
                  className="bg-blue-600 hover:bg-blue-700 text-white">
                  {running === 'custom'
                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                    : <><Play className="w-3.5 h-3.5 mr-1" />测试</>
                  }
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-2">支持 HTTP/HTTPS · 超时 8 秒 · 按 Enter 快速执行</p>
            </CardContent>
          </Card>

          {/* 快速测试按钮 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">快速测试</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { label: '主页面',    url: 'http://localhost:3001/' },
                  { label: '健康 API', url: 'http://localhost:3001/api/health' },
                  { label: '任务 API', url: 'http://localhost:3001/api/tasks?action=stats' },
                  { label: '财务 API', url: 'http://localhost:3001/api/finance?action=summary' },
                  { label: '外包 API', url: 'http://localhost:3001/api/freelance' },
                  { label: '分析 API', url: 'http://localhost:3001/api/analytics' },
                ].map(q => (
                  <Button
                    key={q.url}
                    variant="outline"
                    size="sm"
                    className="justify-start text-xs"
                    onClick={() => { setCustomUrl(q.url); }}
                  >
                    <ChevronRight className="w-3 h-3 mr-1 text-slate-400" />
                    {q.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 自定义测试结果 */}
          {tabResults.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">测试记录</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tabResults.map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50">
                      <Circle className={`w-2 h-2 shrink-0 ${STATUS_CFG[r.status]?.dot}`} />
                      <span className="text-xs text-slate-700 flex-1 truncate font-mono">{r.name.replace('自定义: ', '')}</span>
                      <Badge variant="outline" className={`text-[10px] ${STATUS_CFG[r.status]?.color}`}>
                        {STATUS_CFG[r.status]?.label}
                      </Badge>
                      <span className="text-[10px] text-slate-400">{r.duration}ms</span>
                      <span className="text-[10px] text-slate-300">{fmtTime(r.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ══ 测试报告 Tab ══ */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">测试报告</h2>
              <p className="text-xs text-slate-500">共 {results.length} 条测试记录</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearResults}>
                <Trash2 className="w-3.5 h-3.5 mr-1" /> 清除记录
              </Button>
              <Button variant="outline" size="sm" onClick={exportReport} disabled={results.length === 0}>
                <Download className="w-3.5 h-3.5 mr-1" /> 导出 JSON
              </Button>
            </div>
          </div>

          {/* 成功率概览 */}
          {summary && summary.totalTests > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">总体成功率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-3xl font-bold text-slate-900">{passRate}%</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>通过 {summary.passedTests}</span>
                        <span>失败 {summary.failedTests}</span>
                      </div>
                      <Progress value={passRate} className="h-2" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">平均耗时 {summary.avgDuration}ms · 最近: {summary.lastRun ? fmtTime(summary.lastRun) : '—'}</p>
                </CardContent>
              </Card>

              {chartData.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">分类统计</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="通过" stackId="a" fill="#22c55e" radius={[0,0,0,0]} />
                        <Bar dataKey="失败" stackId="a" fill="#ef4444" radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* 全部结果表格 */}
          <Card>
            <CardContent className="p-0">
              {results.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">暂无测试记录，先运行各类测试</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
                        <th className="text-left p-3 font-medium">测试名称</th>
                        <th className="text-left p-3 font-medium">分类</th>
                        <th className="text-left p-3 font-medium">状态</th>
                        <th className="text-right p-3 font-medium">耗时</th>
                        <th className="text-left p-3 font-medium">输出</th>
                        <th className="text-right p-3 font-medium">时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {results.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-medium text-slate-700 max-w-[140px] truncate">{r.name}</td>
                          <td className="p-3">
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              {CAT_CFG[r.category]?.icon}
                              {CAT_CFG[r.category]?.label}
                            </span>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className={`text-[10px] ${STATUS_CFG[r.status]?.color}`}>
                              {STATUS_CFG[r.status]?.label}
                            </Badge>
                          </td>
                          <td className="p-3 text-right text-slate-400 text-xs">{r.duration > 0 ? `${r.duration}ms` : '—'}</td>
                          <td className="p-3 text-xs text-slate-500 font-mono max-w-[200px] truncate">{r.output}</td>
                          <td className="p-3 text-right text-slate-300 text-xs">{fmtTime(r.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
