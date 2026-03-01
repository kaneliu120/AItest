import {
  Rocket, Zap, Shield, Cpu, Users, TrendingUp, 
  BarChart3, ArrowRight, Sparkles, Brain, CheckCircle,
  DollarSign, Target, Clock, AlertTriangle, PieChart,
  Database, Workflow, BarChart, LineChart, Calendar,
  FileText, Settings, Activity, TrendingDown
} from "lucide-react";
import Link from "next/link";
import DashboardStats from "@/components/dashboard-stats";
import RevenueChart from "@/components/revenue-chart";
import RecentActivities from "@/components/recent-activities";
import MissionProgress from "@/components/mission-progress";
import QuickActions from "@/components/quick-actions";
import EcosystemEntry from "@/components/ecosystem-entry";
import type { DashboardData } from "@/app/api/dashboard/route";

const features = [
  {
    icon: Rocket,
    title: "Three-Phase Mission",
    desc: "Survive → Grow → Expand, systematically advance business goals",
    href: "/missions",
    cta: "View Missions",
    primary: true,
    badge: "Score 80",
    color: "blue",
  },
  {
    icon: BarChart3,
    title: "Analytics Center",
    desc: "Real-time monitoring of finance, tasks, MCP, system, freelance data",
    href: "/analytics",
    cta: "View Analytics",
    primary: false,
    badge: "100% Real Data",
    color: "violet",
  },
  {
    icon: Database,
    title: "Task Management System",
    desc: "Unified task management: Manual + AI + Workflow + Scheduled + Dev pipeline",
    href: "/tasks",
    cta: "Manage Tasks",
    primary: false,
    badge: "5 Tabs",
    color: "emerald",
  },
  {
    icon: Settings,
    title: "MCP Management Hub",
    desc: "Unified MCP management: Ecosystem + Marketplace + My MCPs + Stats",
    href: "/tools",
    cta: "Manage MCPs",
    primary: false,
    badge: "85% Health Rate",
    color: "amber",
  },
  {
    icon: Zap,
    title: "Intelligent Automation",
    desc: "AI-driven workflows, automate repetitive tasks",
    href: "/automation",
    cta: "Explore Automation",
    primary: false,
    badge: "4 Modules",
    color: "indigo",
  },
  {
    icon: Activity,
    title: "System Health Monitor",
    desc: "Real-time monitoring, testing, troubleshooting in one",
    href: "/testing",
    cta: "Check System",
    primary: false,
    badge: "30% Health Score",
    color: "rose",
  },
];

const colorMap: Record<string, string> = {
  blue:    "bg-blue-50 text-blue-600",
  violet:  "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber:   "bg-amber-50 text-amber-600",
  indigo:  "bg-indigo-50 text-indigo-600",
  rose:    "bg-rose-50 text-rose-600",
};
const badgeMap: Record<string, string> = {
  blue:    "bg-blue-100 text-blue-700",
  violet:  "bg-violet-100 text-violet-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber:   "bg-amber-100 text-amber-700",
  indigo:  "bg-indigo-100 text-indigo-700",
  rose:    "bg-rose-100 text-rose-700",
};

async function fetchDashboard(): Promise<DashboardData | null> {
  try {
    const res = await fetch("http://localhost:3001/api/dashboard", { 
      next: { revalidate: 60 }, // revalidate every 60 seconds
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!res.ok) {
      console.warn(`Dashboard API returned ${res.status}: ${res.statusText}`);
      return null;
    }
    
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Dashboard API returned non-JSON response');
      return null;
    }
    
    const json = await res.json();
    
    // Validate response structure
    if (!json || typeof json !== 'object') {
      console.warn('Dashboard API returned invalid JSON');
      return null;
    }
    
    return json.success ? json.data : null;
  } catch (error) {
    console.warn('Failed to fetch dashboard data:', error);
    return null;
  }
}

export default async function HomePage() {
  const dashboard = await fetchDashboard();
  const health = dashboard?.health;
  const freelance = dashboard?.freelance;

  const statusCards = [
    {
      icon: DollarSign,
      title: "Finance Status",
      value: dashboard?.finance?.available ? `₱${(dashboard.finance.totalIncome || 0).toLocaleString()}` : "—",
      sub: dashboard?.finance?.available ? `Net Profit ₱${(dashboard.finance.netProfit || 0).toLocaleString()}` : "Loading",
      color: "emerald",
      trend: dashboard?.finance?.available && dashboard.finance.netProfit > 0 ? "up" : "down",
    },
    {
      icon: CheckCircle,
      title: "Task Completion",
      value: dashboard?.tasks?.available ? `${dashboard.tasks.completionRate || 0}%` : "—",
      sub: dashboard?.tasks?.available ? `${dashboard.tasks.completedTasks || 0}/${dashboard.tasks.totalTasks || 0} Completed` : "Loading",
      color: "blue",
      trend: dashboard?.tasks?.available && dashboard.tasks.completionRate > 80 ? "up" : "down",
    },
    {
      icon: Cpu,
      title: "System Health",
      value: health?.available ? `${health.overallHealth || 0}%` : "—",
      sub: health?.available ? `${health.healthyTools || 0}/${health.totalTools || 0} MCP Healthy` : "Loading",
      color: health?.available && health.overallHealth > 70 ? "emerald" : "rose",
      trend: health?.available && health.overallHealth > 70 ? "up" : "down",
    },
    {
      icon: Users,
      title: "Freelance Projects",
      value: freelance?.available ? String(freelance.activeProjects || 0) : "—",
      sub: freelance?.available ? `Avg Progress ${freelance.avgProgress || 0}%` : "Loading",
      color: "violet",
      trend: freelance?.available && freelance.avgProgress > 50 ? "up" : "down",
    },
    {
      icon: Workflow,
      title: "Automation Modules",
      value: dashboard?.automation?.available ? String(dashboard.automation.activeModules || 0) : "—",
      sub: dashboard?.automation?.available ? `${dashboard.automation.successRate || 0}% Success Rate` : "Loading",
      color: "indigo",
      trend: dashboard?.automation?.available && dashboard.automation.successRate > 80 ? "up" : "down",
    },
    {
      icon: Database,
      title: "Data Integration",
      value: "6/6",
      sub: "All modules integrated",
      color: "amber",
      trend: "up",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 px-8 py-8 text-white shadow-md">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 opacity-80" />
            <span className="text-[11px] font-semibold uppercase tracking-widest opacity-80">Mission Control v2.0</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Welcome back, Kane 👋</h1>
          <p className="text-sm text-white/70">
            Three-phase mission in progress&nbsp;·&nbsp;
            {health?.available
              ? <span className="font-semibold text-white">System Health {health.overallHealth || 0}%</span>
              : <span className="opacity-70">Checking system…</span>
            }
          </p>
        </div>
        {/* Decoration */}
        <div className="absolute -top-16 -right-12 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-24 w-36 h-36 rounded-full bg-white/5 translate-y-1/2" />
      </div>

      {/* ── Feature Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="group bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-200 hover:shadow-[0_4px_20px_rgba(37,99,235,.08)] transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${f.primary ? "bg-blue-600" : colorMap[f.color]}`}>
                <f.icon className={`h-5 w-5 ${f.primary ? "text-white" : `text-${f.color}-600`}`} />
              </div>
              {f.badge && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeMap[f.color]}`}>
                  {f.badge}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-slate-900 mb-1.5">{f.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">{f.desc}</p>
            <Link
              href={f.href}
              className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-all active:scale-95
                ${f.primary
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : `bg-${f.color}-100 text-${f.color}-700 hover:bg-${f.color}-200`}`}
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
                <h2 className="text-sm font-semibold text-slate-900">Revenue Trend</h2>
                <p className="text-xs text-slate-400 mt-0.5">Last 30 days performance</p>
              </div>
              <BarChart3 className="h-4 w-4 text-slate-300" />
            </div>
            <RevenueChart />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Mission Progress</h2>
                <p className="text-xs text-slate-400 mt-0.5">Three-phase mission completion</p>
              </div>
              <Rocket className="h-4 w-4 text-slate-300" />
            </div>
            <MissionProgress />
          </div>
        </div>

        {/* Right: Sidebar widgets */}
        <div className="lg:col-span-2 space-y-4">
          {/* ── System Integration Status ── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">System Integration Status</h2>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                6/6 Integrated
              </span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Task Management System', status: '✅ Done', desc: 'Unified task management (5 tabs)', color: 'emerald' },
                { name: 'MCP Management System', status: '✅ Done', desc: 'Unified MCP management (4 tabs)', color: 'emerald' },
                { name: 'Finance System', status: '✅ Done', desc: 'Task + Knowledge bidirectional integration', color: 'emerald' },
                { name: 'Analytics Center', status: '✅ Done', desc: '100% Real data aggregation', color: 'emerald' },
                { name: 'Automation System', status: '✅ Done', desc: '4 automation modules', color: 'emerald' },
                { name: 'Testing & Diagnostics', status: '✅ Done', desc: 'Testing + Troubleshooting unified', color: 'emerald' },
              ].map((module, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      module.color === 'emerald' ? 'bg-emerald-500' : 
                      module.color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{module.name}</div>
                      <div className="text-xs text-slate-500">{module.desc}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    module.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 
                    module.color === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {module.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <QuickActions />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
              <Link href="/activities" className="text-xs text-blue-600 hover:text-blue-700 font-medium">All</Link>
            </div>
            <RecentActivities />
          </div>
        </div>
      </div>

      {/* ── Status Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statusCards.map((s) => (
          <div key={s.title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${colorMap[s.color]}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1">
                {s.trend && (
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    s.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {s.trend === 'up' ? (
                      <span className="flex items-center gap-0.5">
                        <TrendingUp className="h-3 w-3" /> ↑
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <TrendingDown className="h-3 w-3" /> ↓
                      </span>
                    )}
                  </span>
                )}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeMap[s.color]}`}>
                  Realtime
                </span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">{s.title}</h3>
            <p className="text-3xl font-bold text-slate-900 mb-0.5">{s.value}</p>
            <p className="text-xs text-slate-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── System Health Banner ── */}
      {health?.available ? (
        <div className={`rounded-2xl p-5 flex items-center gap-4 ${
          health.overallHealth > 70 
            ? 'bg-emerald-50 border border-emerald-200' 
            : health.overallHealth > 40
            ? 'bg-amber-50 border border-amber-200'
            : 'bg-rose-50 border border-rose-200'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            health.overallHealth > 70 
              ? 'bg-emerald-100 text-emerald-600' 
              : health.overallHealth > 40
              ? 'bg-amber-100 text-amber-600'
              : 'bg-rose-100 text-rose-600'
          }`}>
            {health.overallHealth > 70 ? (
              <CheckCircle className="h-5 w-5" />
            ) : health.overallHealth > 40 ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-slate-900">
                {health.overallHealth > 70 ? 'System Running Normally' : 
                 health.overallHealth > 40 ? 'System Needs Attention' : 'System Needs Urgent Maintenance'}
              </h3>
              <span className={`text-sm font-bold ${
                health.overallHealth > 70 ? 'text-emerald-700' : 
                health.overallHealth > 40 ? 'text-amber-700' : 'text-rose-700'
              }`}>
                {health.overallHealth}% Health
              </span>
            </div>
            <p className="text-sm text-slate-600">
              {health.healthyTools || 0}/{health.totalTools || 0} MCP Healthy · 
              CPU {health.cpuUsage || 0}% · Memory {health.memoryUsage || 0}% · 
              Response {health.responseTime || 0}ms
            </p>
          </div>
          <Link 
            href="/testing" 
            className="text-sm font-medium px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Detailed Diagnostics
          </Link>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-0.5">System Status Checking</h3>
            <p className="text-sm text-slate-600">Fetching real-time system data...</p>
          </div>
        </div>
      )}

    </div>
  );
}
