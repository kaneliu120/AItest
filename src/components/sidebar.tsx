"use client";

import { useState } from "react";
import {
  LayoutDashboard, Wrench, Workflow, BarChart3, Settings,
  Rocket, DollarSign, Calendar, FileText, Users, Brain, Zap,
  ChevronLeft, ChevronRight, Bug, TestTube, Server, CheckSquare,
  Heart, X, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  onClose?: () => void;
  compact?: boolean;
}

const navGroups = [
  {
    label: "概览",
    items: [
      { title: "仪表板",    href: "/",            icon: LayoutDashboard, badge: "3" },
      { title: "健康监控",  href: "/health",       icon: Heart,           badge: "95" },
    ],
  },
  {
    label: "工具",
    items: [
      { title: "工具生态系统", href: "/ecosystem",         icon: Server,      badge: "new" },
      { title: "技能评估",     href: "/skill-evaluator",   icon: CheckSquare, badge: "76" },
      { title: "工具市场",     href: "/tools",             icon: Wrench,      badge: "12" },
      { title: "工作流",       href: "/workflows",         icon: Workflow,    badge: "5" },
    ],
  },
  {
    label: "业务",
    items: [
      { title: "数据分析",   href: "/analytics",    icon: BarChart3 },
      { title: "财务中心",   href: "/finance",      icon: DollarSign, badge: "new" },
      { title: "任务管理",   href: "/tasks",        icon: Calendar },
      { title: "外包平台",   href: "/freelance",    icon: Users,      badge: "8" },
    ],
  },
  {
    label: "AI & 自动化",
    items: [
      { title: "AI 助手",    href: "/ai",                      icon: Brain },
      { title: "需求分析",   href: "/requirements-analysis",   icon: Sparkles, badge: "new" },
      { title: "自动化",     href: "/automation",              icon: Zap },
      { title: "任务中心",   href: "/missions",                icon: Rocket,  badge: "3" },
    ],
  },
  {
    label: "开发",
    items: [
      { title: "测试中心",   href: "/testing",       icon: TestTube, badge: "new" },
      { title: "故障排查",   href: "/troubleshooting", icon: Bug,    badge: "new" },
      { title: "文档中心",   href: "/docs",          icon: FileText },
    ],
  },
];

export function Sidebar({ onClose, compact = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(compact);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col bg-white border-r border-slate-200 transition-all duration-300 h-full",
        collapsed ? "w-[64px]" : compact ? "w-56" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-100 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shrink-0 shadow-sm">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">Mission Control</p>
              <p className="text-[10px] text-slate-400 truncate">智能指挥中心 v2.0</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center mx-auto shadow-sm">
            <Rocket className="w-4 h-4 text-white" />
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {onClose && (
            <button onClick={onClose} className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
          {!compact && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {collapsed
                ? <ChevronRight className="w-4 h-4 text-slate-400" />
                : <ChevronLeft  className="w-4 h-4 text-slate-400" />}
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-3 px-2 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.title : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group relative",
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    {/* Active indicator */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-r-full" />
                    )}

                    <item.icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />

                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.title}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              "text-[10px] font-semibold rounded-full px-1.5 py-0.5",
                              item.badge === "new"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : active
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-slate-100 p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">凯</span>
            </div>
            <Link href="/settings">
              <Settings className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">凯</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">凯哥</p>
              <p className="text-xs text-slate-400 truncate">三阶段使命进行中</p>
            </div>
            <Link href="/settings" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <Settings className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
