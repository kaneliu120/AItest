import {
  Rocket, TrendingUp, Zap, Shield, Cpu, Users,
  BarChart3, ArrowRight, Sparkles, Brain,
} from "lucide-react";
import Link from "next/link";
import DashboardStats from "@/components/dashboard-stats";
import RevenueChart from "@/components/revenue-chart";
import ToolMarketplace from "@/components/tool-marketplace";
import RecentActivities from "@/components/recent-activities";
import MissionProgress from "@/components/mission-progress";
import QuickActions from "@/components/quick-actions";
import EcosystemEntry from "@/components/ecosystem-entry";

const features = [
  {
    icon: Rocket,
    title: "三阶段使命",
    desc: "生存 → 发展 → 扩展，系统化推进业务目标",
    href: "/missions",
    cta: "查看使命",
    primary: true,
  },
  {
    icon: Brain,
    title: "智能需求分析",
    desc: "AI 驱动的需求分析、技术栈推荐和文档生成",
    href: "/requirements-analysis",
    cta: "开始分析",
    primary: false,
  },
  {
    icon: Zap,
    title: "智能自动化",
    desc: "AI 驱动的工作流，自动执行重复任务",
    href: "/automation",
    cta: "探索自动化",
    primary: false,
  },
];

const statusCards = [
  { icon: Shield, title: "AI 助手",   value: "24/7",  sub: "运行中",    color: "blue" },
  { icon: Cpu,    title: "工具数量",  value: "45",    sub: "已连接工具", color: "violet" },
  { icon: Users,  title: "自动化水平", value: "55%",  sub: "生态系统",  color: "emerald" },
];

const colorMap: Record<string, string> = {
  blue:    "bg-blue-50 text-blue-600",
  violet:  "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
};
const badgeMap: Record<string, string> = {
  blue:    "bg-blue-100 text-blue-700",
  violet:  "bg-violet-100 text-violet-700",
  emerald: "bg-emerald-100 text-emerald-700",
};

export default function HomePage() {
  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 px-8 py-8 text-white shadow-md">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 opacity-80" />
            <span className="text-[11px] font-semibold uppercase tracking-widest opacity-80">Mission Control v2.0</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">欢迎回来，凯哥 👋</h1>
          <p className="text-sm text-white/70">
            三阶段使命进行中 · 今日专注时间:&nbsp;
            <span className="font-semibold text-white">2.5 小时</span>
          </p>
        </div>
        {/* Decoration */}
        <div className="absolute -top-16 -right-12 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-24 w-36 h-36 rounded-full bg-white/5 translate-y-1/2" />
      </div>

      {/* ── Feature Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="group bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-200 hover:shadow-[0_4px_20px_rgba(37,99,235,.08)] transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${f.primary ? "bg-blue-600" : "bg-slate-100"}`}>
                <f.icon className={`h-5 w-5 ${f.primary ? "text-white" : "text-slate-600"}`} />
              </div>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1.5">{f.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">{f.desc}</p>
            <Link
              href={f.href}
              className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-all active:scale-95
                ${f.primary
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              {f.cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>

      {/* ── Stats ── */}
      <DashboardStats />

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Charts */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">收入趋势</h2>
                <p className="text-xs text-slate-400 mt-0.5">过去 30 天收入表现</p>
              </div>
              <BarChart3 className="h-4 w-4 text-slate-300" />
            </div>
            <RevenueChart />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">使命进度</h2>
                <p className="text-xs text-slate-400 mt-0.5">三阶段使命完成情况</p>
              </div>
              <Rocket className="h-4 w-4 text-slate-300" />
            </div>
            <MissionProgress />
          </div>
        </div>

        {/* Right: Sidebar widgets */}
        <div className="lg:col-span-2 space-y-4">
          <EcosystemEntry
            monitoringStats={{ healthyTools: 10, totalTools: 11, warningTools: 1, errorTools: 0 }}
            schedulerStats={{ pending: 1, running: 2, completed: 3, health: 67 }}
          />

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">快速操作</h2>
            <QuickActions />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">最近活动</h2>
              <Link href="/activities" className="text-xs text-blue-600 hover:text-blue-700 font-medium">全部</Link>
            </div>
            <RecentActivities />
          </div>
        </div>
      </div>

      {/* ── Status Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statusCards.map((s) => (
          <div key={s.title} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${colorMap[s.color]}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeMap[s.color]}`}>
                活跃
              </span>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">{s.title}</h3>
            <p className="text-3xl font-bold text-slate-900 mb-0.5">{s.value}</p>
            <p className="text-xs text-slate-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Health Banner ── */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <span className="text-emerald-600 font-bold text-lg">✓</span>
        </div>
        <div>
          <p className="font-semibold text-emerald-800">生态系统运行正常</p>
          <p className="text-sm text-emerald-600 mt-0.5">
            监控系统、任务调度器、技能评估系统均已集成到 Mission Control。
          </p>
        </div>
      </div>

    </div>
  );
}
