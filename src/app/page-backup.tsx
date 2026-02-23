import DashboardStats from "@/components/dashboard-stats";
import RevenueChart from "@/components/revenue-chart";
import ToolMarketplace from "@/components/tool-marketplace";
import RecentActivities from "@/components/recent-activities";
import MissionProgress from "@/components/mission-progress";
import QuickActions from "@/components/quick-actions";
import AutomatedTestingIntegration from "@/components/automated-testing-integration";

export default function Home() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with gradient background */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-2xl glass border border-border/50">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
              <span className="text-2xl">👋</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">欢迎回来，凯哥</h1>
              <p className="text-muted-foreground">
                三阶段使命进行中 · 今日专注时间: <span className="font-semibold text-primary">2.5小时</span>
              </p>
            </div>
          </div>
        </div>
        <QuickActions />
      </div>

      {/* Stats Grid */}
      <DashboardStats />

      {/* Charts & Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="data-card card-hover rounded-2xl p-6 border border-border/50">
            <RevenueChart />
          </div>
          <div className="data-card card-hover rounded-2xl p-6 border border-border/50">
            <MissionProgress />
          </div>
        </div>
        <div className="space-y-8">
          <div className="data-card card-hover rounded-2xl p-6 border border-border/50">
            <ToolMarketplace />
          </div>
          <div className="data-card card-hover rounded-2xl p-6 border border-border/50">
            <RecentActivities />
          </div>
        </div>
      </div>

      {/* Automated Testing Integration */}
      <div className="data-card card-hover rounded-2xl p-6 border border-border/50">
        <AutomatedTestingIntegration />
      </div>

      {/* System Status */}
      <div className="glass rounded-2xl p-8 border border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold gradient-text">系统状态监控</h2>
            <p className="text-muted-foreground">实时监控所有系统组件运行状态</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="font-semibold text-green-400">所有系统运行正常</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="data-card card-hover p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">O</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30 text-sm font-semibold">
                在线
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2">OpenClaw 连接</h3>
            <div className="text-3xl font-bold mb-1">106</div>
            <p className="text-sm text-muted-foreground">技能已连接</p>
          </div>

          <div className="data-card card-hover p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">A</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30 text-sm font-semibold">
                活跃
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2">自动化任务</h3>
            <div className="text-3xl font-bold mb-1">23</div>
            <p className="text-sm text-muted-foreground">运行中</p>
          </div>

          <div className="data-card card-hover p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">T</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30 text-sm font-semibold">
                可用
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2">工具数量</h3>
            <div className="text-3xl font-bold mb-1">12</div>
            <p className="text-sm text-muted-foreground">可用工具</p>
          </div>

          <div className="data-card card-hover p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">S</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 text-sm font-semibold">
                同步
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2">数据同步</h3>
            <div className="text-3xl font-bold mb-1">98%</div>
            <p className="text-sm text-muted-foreground">实时同步</p>
          </div>
        </div>
        
        <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <span className="text-xl">✓</span>
            </div>
            <div>
              <p className="font-semibold text-green-400">系统健康状态优秀</p>
              <p className="text-sm text-green-500/80 mt-1">
                所有核心服务运行正常，自动化任务执行流畅，数据同步实时更新。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}