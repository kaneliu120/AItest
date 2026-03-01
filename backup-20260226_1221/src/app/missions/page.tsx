'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Rocket, Target, Clock, CheckCircle, AlertCircle, TrendingUp,
  Zap, Flag, Calendar, Award, BarChart3, RefreshCw, DollarSign,
  Layers, AlertTriangle, XCircle, Star
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

// ─── 类型 ────────────────────────────────────────────────────────────────────
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

// ─── 工具函数 ────────────────────────────────────────────────────────────────
const statusCfg: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  completed:  { label: '已完成', color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  icon: <CheckCircle className="w-4 h-4 text-green-600" /> },
  'in-progress': { label: '进行中', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200',    icon: <Clock className="w-4 h-4 text-blue-600" /> },
  pending:    { label: '待开始', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: <AlertCircle className="w-4 h-4 text-yellow-600" /> },
  cancelled:  { label: '已取消', color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200',     icon: <XCircle className="w-4 h-4 text-gray-400" /> },
};

const priorityCfg: Record<string, { label: string; color: string }> = {
  critical: { label: '紧急', color: 'text-red-600' },
  high:     { label: '高',   color: 'text-orange-600' },
  medium:   { label: '中',   color: 'text-yellow-600' },
  low:      { label: '低',   color: 'text-green-600' },
};

const progressColor = (p: number) =>
  p === 100 ? '#22c55e' : p >= 50 ? '#3b82f6' : '#f59e0b';

const impactBadge = (impact: string) =>
  impact === '极高' ? 'bg-red-100 text-red-700' :
  impact === '高'   ? 'bg-orange-100 text-orange-700' :
  impact === '中'   ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600';

// ─── 主组件 ──────────────────────────────────────────────────────────────────
export default function MissionsPage() {
  const [data, setData] = useState<MissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/missions', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
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

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-muted-foreground">加载任务数据中...</p>
        </div>
      </div>
    );
  }
  if (!data) return <div className="p-6 text-red-500">数据加载失败</div>;

  const { taskStats, missions, milestones, finance, freelance, overallScore } = data;

  // 过滤逻辑
  const filteredMissions = missions.filter(m =>
    filter === 'all'       ? true :
    filter === 'active'    ? ['in-progress', 'pending'].includes(m.status) :
    filter === 'completed' ? m.status === 'completed' : true
  );

  // 图表数据：任务状态分布
  const statusChart = [
    { name: '已完成', value: taskStats.completed,  fill: '#22c55e' },
    { name: '进行中', value: taskStats.inProgress, fill: '#3b82f6' },
    { name: '待开始', value: taskStats.pending,    fill: '#f59e0b' },
    { name: '已取消', value: taskStats.cancelled,  fill: '#d1d5db' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 pb-8">

      {/* ─── 标题栏 ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="w-6 h-6 text-blue-500" />
            任务中心
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            所有数据来自本地数据库（SQLite）·
            {lastRefresh && ` 最后更新: ${lastRefresh.toLocaleTimeString('zh-CN')}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 综合评分 */}
          <div className={`text-center px-4 py-2 rounded-lg border font-bold text-2xl ${
            overallScore >= 80 ? 'bg-green-50 border-green-200' :
            overallScore >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
          }`}>
            <span className={
              overallScore >= 80 ? 'text-green-700' :
              overallScore >= 60 ? 'text-yellow-700' : 'text-red-700'
            }>{overallScore}</span>
            <p className="text-xs text-muted-foreground font-normal">综合评分</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* ─── KPI 卡片 ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">总任务数</p>
                <p className="text-2xl font-bold text-blue-700">{taskStats.total}</p>
                <p className="text-xs text-blue-600 mt-1">真实任务记录</p>
              </div>
              <Target className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">完成率</p>
                <p className="text-2xl font-bold text-green-700">{taskStats.completionRate}%</p>
                <p className="text-xs text-green-600 mt-1">{taskStats.completed}/{taskStats.total} 已完成</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">净利润</p>
                <p className="text-2xl font-bold text-purple-700">
                  ₱{(finance.netProfit / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-purple-600 mt-1">利润率 {finance.profitMargin}%</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">活跃项目</p>
                <p className="text-2xl font-bold text-orange-700">{freelance.active}</p>
                <p className="text-xs text-orange-600 mt-1">均进度 {freelance.avgProgress}%</p>
              </div>
              <Layers className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 图表行 ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 任务状态分布（环形图）*/}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              任务状态分布（真实数据）
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
                    <span>完成率</span>
                    <span className="text-green-600">{taskStats.completionRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 外包项目进度 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-500" />
              外包项目进度（真实数据）
            </CardTitle>
            <CardDescription>共 {freelance.total} 个项目 · {freelance.active} 个活跃</CardDescription>
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
                  <Tooltip formatter={(v: number, name: string) => name === 'progress' ? [`${v}%`, '进度'] : [`₱${v}k`, '预算']} />
                  <Bar dataKey="progress" name="进度" radius={[3, 3, 0, 0]}
                    fill="#3b82f6"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">暂无活跃项目</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── 任务列表 ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Flag className="w-4 h-4 text-blue-500" />
              任务列表（真实 SQLite 数据）
            </CardTitle>
            <div className="flex gap-2">
              {([['all', '全部'], ['active', '进行中'], ['completed', '已完成']] as const).map(([v, l]) => (
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
            <p className="text-center text-muted-foreground py-8 text-sm">该分类下暂无任务</p>
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
                            <span className={`text-[10px] font-medium ${pc.color}`}>{pc.label}优先</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{mission.description}</p>
                          {/* 标签 */}
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
                          负责人: {mission.assignedTo}
                        </div>
                      </div>
                    </div>

                    {/* 进度条 */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">进度</span>
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

      {/* ─── 里程碑时间轴 + 财务摘要 ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 里程碑 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />
              里程碑时间轴（真实数据）
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

        {/* 财务摘要 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              财务摘要（真实数据）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 收支卡片 */}
              {[
                { label: '总收入', val: finance.totalIncome,   icon: <TrendingUp className="w-4 h-4 text-green-500" />, color: 'text-green-700' },
                { label: '总支出', val: finance.totalExpenses, icon: <AlertTriangle className="w-4 h-4 text-red-400" />,  color: 'text-red-600'   },
                { label: '净利润', val: finance.netProfit,     icon: <Star className="w-4 h-4 text-yellow-500" />,       color: 'text-purple-700' },
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
              {/* 利润率进度条 */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">利润率</span>
                  <span className="font-bold text-green-600">{finance.profitMargin}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{ width: `${finance.profitMargin}%` }}
                  />
                </div>
              </div>

              {/* 外包项目汇总 */}
              {freelance.projects.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground font-medium mb-2">活跃项目</p>
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

      {/* ─── 快捷操作 ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button variant="outline" className="h-auto py-3" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新所有数据
        </Button>
        <Button variant="outline" className="h-auto py-3" onClick={() => window.open('/tasks', '_self')}>
          <Flag className="w-4 h-4 mr-2" />
          管理任务
        </Button>
        <Button variant="outline" className="h-auto py-3" onClick={() => window.open('/analytics', '_self')}>
          <BarChart3 className="w-4 h-4 mr-2" />
          查看分析报告
        </Button>
      </div>
    </div>
  );
}
