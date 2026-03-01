"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, Zap, Activity, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import type { DashboardData } from "@/app/api/dashboard/route";

type HealthData = DashboardData["health"];

export default function EcosystemEntry() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setHealth(json.data.health);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const healthPct = health?.available ? health.overallHealth : 0;
  const badgeColor =
    healthPct >= 90
      ? "bg-green-100 text-green-800"
      : healthPct >= 70
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800";

  const barColor =
    healthPct >= 90 ? "bg-green-500" : healthPct >= 70 ? "bg-yellow-500" : "bg-red-500";

  return (
    <Card className="card-hover border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                <Server className="h-5 w-5 text-blue-500" />
              </div>
              工具生态系统
            </CardTitle>
            <CardDescription>统一监控和管理所有自动化工具</CardDescription>
          </div>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
              {health?.available ? `${healthPct}% 健康` : "加载失败"}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* 两栏统计 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 系统监控 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">系统监控</span>
              </div>
              {loading ? (
                <div className="space-y-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : health?.available ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">健康工具</span>
                    <span className="font-medium">
                      {health.healthyTools}/{health.totalTools}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">警告</span>
                    <span className={health.warningTools > 0 ? "text-yellow-600 font-medium" : "font-medium"}>
                      {health.warningTools}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">故障</span>
                    <span className={health.errorTools > 0 ? "text-red-600 font-medium" : "font-medium"}>
                      {health.errorTools}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">无法获取数据</p>
              )}
            </div>

            {/* 任务调度 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">任务调度</span>
              </div>
              {loading ? (
                <div className="space-y-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">运行中</span>
                    <span className="font-medium text-slate-500">—</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">待处理</span>
                    <span className="font-medium text-slate-500">—</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">成功率</span>
                    <span className="font-medium text-slate-500">—</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 健康度进度条 */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">整体健康度</span>
              <span className="text-sm font-bold">{loading ? "…" : `${healthPct}%`}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${healthPct}%` }}
              />
            </div>
          </div>

          {/* 按钮 */}
          <div className="pt-4">
            <Button asChild className="w-full" variant="default">
              <Link href="/ecosystem">
                进入生态系统管理
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <div className="flex gap-2 mt-3">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href="/health">监控系统</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href="/automation">调度器</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
