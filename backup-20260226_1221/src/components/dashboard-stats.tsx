"use client";

import { useEffect, useState } from "react";
import {
  DollarSign, TrendingUp, Users, Clock, Target, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/app/api/dashboard/route";

// ── 骨架屏 ─────────────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
        <div className="h-8 w-8 bg-slate-100 rounded-lg" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-24 bg-slate-200 rounded animate-pulse mb-2" />
        <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}

// ── 空状态标签 ──────────────────────────────────────────────────────────────
function NoData({ label = "暂无数据" }: { label?: string }) {
  return (
    <span className="text-xs text-slate-400 italic">{label}</span>
  );
}

export default function DashboardStats() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)}
      </div>
    );
  }

  // ── 从 API 数据构建卡片配置 ──────────────────────────────────────────────
  const { finance, freelance, tasks, health } = data ?? {
    finance: { currentMonthIncome: 0, monthlyGrowthRate: 0, available: false },
    freelance: { activeProjects: 0, pendingProposals: 0, available: false },
    tasks: { completed: 0, total: 0, completionRate: 0, available: false },
    health: { overallHealth: 0, available: false },
  };

  const fmtPHP = (n: number) =>
    n >= 1000 ? `₱${(n / 1000).toFixed(1)}k` : `₱${n.toLocaleString()}`;

  const stats = [
    {
      title: "本月收入",
      value: finance.available ? fmtPHP(finance.currentMonthIncome) : null,
      change: finance.available
        ? `${finance.monthlyGrowthRate >= 0 ? "+" : ""}${finance.monthlyGrowthRate}%`
        : null,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      description: "距离目标 ₱30,000",
      changeColor: finance.monthlyGrowthRate >= 0 ? "text-green-600" : "text-red-500",
    },
    {
      title: "外包项目",
      value: freelance.available ? String(freelance.activeProjects) : null,
      change: freelance.available ? `+${freelance.activeProjects} 进行中` : null,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      description: freelance.available
        ? `${freelance.pendingProposals} 个提案待回复`
        : "暂无数据",
      changeColor: "text-blue-600",
    },
    {
      title: "系统健康",
      value: health.available ? `${health.overallHealth}%` : null,
      change: health.available
        ? `${health.healthyTools}/${health.totalTools} 正常`
        : null,
      icon: TrendingUp,
      color: health.available && health.overallHealth >= 90
        ? "text-emerald-600"
        : "text-amber-600",
      bgColor: health.available && health.overallHealth >= 90
        ? "bg-emerald-500/10"
        : "bg-amber-500/10",
      description: health.available
        ? health.warningTools > 0 ? `${health.warningTools} 个警告` : "全部健康"
        : "暂无数据",
      changeColor: "text-emerald-600",
    },
    {
      title: "任务完成",
      value: tasks.available ? `${tasks.completed}/${tasks.total}` : null,
      change: tasks.available ? `${tasks.completionRate}%` : null,
      icon: Target,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      description: "本周任务进度",
      changeColor: "text-amber-600",
    },
    {
      title: "自动化节省",
      value: null,           // 暂无真实数据源
      change: null,
      icon: Clock,
      color: "text-cyan-600",
      bgColor: "bg-cyan-500/10",
      description: "通过自动化节省",
      changeColor: "text-cyan-600",
    },
    {
      title: "AI工具使用",
      value: health.available ? String(health.totalTools) : null,
      change: health.available ? "活跃中" : null,
      icon: Zap,
      color: "text-pink-600",
      bgColor: "bg-pink-500/10",
      description: "Mission Control 工具",
      changeColor: "text-pink-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stat.value ?? <NoData />}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {stat.change && (
                <span className={`text-xs font-medium ${stat.changeColor}`}>
                  {stat.change}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {stat.description}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
