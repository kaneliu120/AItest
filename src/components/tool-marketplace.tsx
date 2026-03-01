"use client";

import { Wrench, Zap, BarChart3, FileText, DollarSign, Users, Brain, Code, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const tools = [
  {
    name: "Finance Tracker",
    description: "Auto-track income and expenses",
    icon: DollarSign,
    category: "Finance",
    status: "Installed",
    rating: 4.8,
    color: "bg-green-500/20 text-green-600",
  },
  {
    name: "Freelance Automation",
    description: "Auto-search and apply for projects",
    icon: Users,
    category: "Freelance",
    status: "In Development",
    rating: 4.5,
    color: "bg-blue-500/20 text-blue-600",
  },
  {
    name: "AI Code Generation",
    description: "Antigravity-based code assistant",
    icon: Brain,
    category: "Development",
    status: "Installed",
    rating: 4.9,
    color: "bg-purple-500/20 text-purple-600",
  },
  {
    name: "Task Manager",
    description: "Smart task assignment and tracking",
    icon: FileText,
    category: "Productivity",
    status: "Installed",
    rating: 4.7,
    color: "bg-amber-500/20 text-amber-600",
  },
  {
    name: "Data Analytics Dashboard",
    description: "Business data visualization",
    icon: BarChart3,
    category: "Analytics",
    status: "Available",
    rating: 4.6,
    color: "bg-cyan-500/20 text-cyan-600",
  },
  {
    name: "Automation Workflows",
    description: "Visual workflow design",
    icon: Zap,
    category: "Automation",
    status: "In Development",
    rating: 4.4,
    color: "bg-pink-500/20 text-pink-600",
  },
];

export default function ToolMarketplace() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>MCP Marketplace</CardTitle>
          <p className="text-sm text-muted-foreground">
            Develop and use MCPs on demand
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Request MCP
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tools.map((tool, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${tool.color}`}>
                  <tool.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">{tool.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {tool.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={tool.color}>
                  {tool.category}
                </Badge>
                <Badge
                  variant={
                    tool.status === "Installed"
                      ? "default"
                      : tool.status === "In Development"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {tool.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {tools.length} MCPs, {tools.filter(t => t.status === "Installed").length} installed
            </span>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}