"use client";

import { Button } from "@/components/ui/button";
import { Plus, Search, Rocket, Settings, Zap, Calendar, FileText, Brain } from "lucide-react";
import Link from "next/link";

export default function QuickActions() {
  const actions = [
    {
      label: "需求分析",
      icon: <Brain className="h-4 w-4" />,
      description: "智能需求分析",
      variant: "default" as const,
      href: "/requirements-analysis",
    },
    {
      label: "新项目",
      icon: <Plus className="h-4 w-4" />,
      description: "创建新项目",
      variant: "outline" as const,
      href: "/projects/new",
    },
    {
      label: "搜索项目",
      icon: <Search className="h-4 w-4" />,
      description: "外包平台搜索",
      variant: "outline" as const,
      href: "/freelance/search",
    },
    {
      label: "启动任务",
      icon: <Rocket className="h-4 w-4" />,
      description: "开始今日任务",
      variant: "outline" as const,
      href: "/tasks",
    },
    {
      label: "自动化",
      icon: <Zap className="h-4 w-4" />,
      description: "运行自动化",
      variant: "outline" as const,
      href: "/automation",
    },
    {
      label: "文档",
      icon: <FileText className="h-4 w-4" />,
      description: "技术文档",
      variant: "outline" as const,
      href: "/documents",
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {actions.map((action, index) => (
        <Link key={index} href={action.href || "#"} className="no-underline">
          <Button
            variant={action.variant}
            size="sm"
            className="flex flex-col h-auto py-2 px-3"
            title={action.description}
          >
            <div className="flex items-center gap-2">
              {action.icon}
              <span className="text-sm">{action.label}</span>
            </div>
          </Button>
        </Link>
      ))}
    </div>
  );
}