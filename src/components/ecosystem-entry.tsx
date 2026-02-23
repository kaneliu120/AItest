import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, Zap, Activity, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface EcosystemEntryProps {
  monitoringStats?: {
    healthyTools: number;
    totalTools: number;
    warningTools: number;
    errorTools: number;
  };
  schedulerStats?: {
    pending: number;
    running: number;
    completed: number;
    health: number;
  };
}

export default function EcosystemEntry({ monitoringStats, schedulerStats }: EcosystemEntryProps) {
  const healthPercentage = monitoringStats 
    ? Math.round((monitoringStats.healthyTools / monitoringStats.totalTools) * 100)
    : 0;

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
            <CardDescription>
              统一监控和管理所有自动化工具
            </CardDescription>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            healthPercentage >= 90 ? 'bg-green-100 text-green-800' :
            healthPercentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {healthPercentage}% 健康
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 监控状态 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">系统监控</span>
              </div>
              {monitoringStats ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">健康工具</span>
                    <span className="font-medium">{monitoringStats.healthyTools}/{monitoringStats.totalTools}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">警告</span>
                    <span className="text-yellow-600 font-medium">{monitoringStats.warningTools}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">故障</span>
                    <span className="text-red-600 font-medium">{monitoringStats.errorTools}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">加载中...</div>
              )}
            </div>

            {/* 调度状态 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">任务调度</span>
              </div>
              {schedulerStats ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">运行中</span>
                    <span className="font-medium">{schedulerStats.running}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">待处理</span>
                    <span className="font-medium">{schedulerStats.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">成功率</span>
                    <span className="font-medium">{schedulerStats.health}%</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">加载中...</div>
              )}
            </div>
          </div>

          {/* 状态指示器 */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">整体健康度</span>
              <span className="text-sm font-bold">{healthPercentage}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  healthPercentage >= 90 ? 'bg-green-500' :
                  healthPercentage >= 70 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${healthPercentage}%` }}
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="pt-4">
            <Button asChild className="w-full" variant="default">
              <Link href="/ecosystem">
                进入生态系统管理
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <div className="flex gap-2 mt-3">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <a href="http://localhost:3004" target="_blank" rel="noopener noreferrer">
                  监控系统
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1">
                <a href="http://localhost:3006" target="_blank" rel="noopener noreferrer">
                  调度器
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}