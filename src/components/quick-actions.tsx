"use client";

import { Button } from "@/components/ui/button";
import { Plus, Search, Rocket, Settings, Zap, Calendar, FileText, Brain } from "lucide-react";
import Link from "next/link";

export default function QuickActions() {
  const actions = [
    {
      label: "Requirements Analysis",
      icon: <Brain className="h-4 w-4" />,
      description: "AI Requirements Analysis",
      variant: "default" as const,
      href: "/requirements-analysis",
    },
    {
      label: "New Project",
      icon: <Plus className="h-4 w-4" />,
      description: "Create New Project",
      variant: "outline" as const,
      href: "/projects/new",
    },
    {
      label: "Search Projects",
      icon: <Search className="h-4 w-4" />,
      description: "Freelance Platform Search",
      variant: "outline" as const,
      href: "/freelance/search",
    },
    {
      label: "Start Tasks",
      icon: <Rocket className="h-4 w-4" />,
      description: "Start today's tasks",
      variant: "outline" as const,
      href: "/tasks",
    },
    {
      label: "Automation",
      icon: <Zap className="h-4 w-4" />,
      description: "Run automation",
      variant: "outline" as const,
      href: "/automation",
    },
    {
      label: "Documents",
      icon: <FileText className="h-4 w-4" />,
      description: "Technical docs",
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