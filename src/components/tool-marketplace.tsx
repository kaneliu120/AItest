"use client";

import { Wrench, Zap, BarChart3, FileText, DollarSign, Users, Brain, Code, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const tools = [
  {
    name: "财务跟踪器",
    description: "自动跟踪收入和支出",
    icon: DollarSign,
    category: "财务",
    status: "已安装",
    rating: 4.8,
    color: "bg-green-500/20 text-green-600",
  },
  {
    name: "外包自动化",
    description: "自动搜索和申请项目",
    icon: Users,
    category: "外包",
    status: "开发中",
    rating: 4.5,
    color: "bg-blue-500/20 text-blue-600",
  },
  {
    name: "AI代码生成",
    description: "基于Antigravity的代码助手",
    icon: Brain,
    category: "开发",
    status: "已安装",
    rating: 4.9,
    color: "bg-purple-500/20 text-purple-600",
  },
  {
    name: "任务管理器",
    description: "智能任务分配和跟踪",
    icon: FileText,
    category: "生产力",
    status: "已安装",
    rating: 4.7,
    color: "bg-amber-500/20 text-amber-600",
  },
  {
    name: "数据分析仪表板",
    description: "业务数据可视化",
    icon: BarChart3,
    category: "分析",
    status: "可用",
    rating: 4.6,
    color: "bg-cyan-500/20 text-cyan-600",
  },
  {
    name: "自动化工作流",
    description: "可视化工作流设计",
    icon: Zap,
    category: "自动化",
    status: "开发中",
    rating: 4.4,
    color: "bg-pink-500/20 text-pink-600",
  },
];

export default function ToolMarketplace() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>MCP市场</CardTitle>
          <p className="text-sm text-muted-foreground">
            按需开发和使用MCP
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          请求MCP
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
                    tool.status === "已安装"
                      ? "default"
                      : tool.status === "开发中"
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
              共 {tools.length} 个MCP，{tools.filter(t => t.status === "已安装").length} 个已安装
            </span>
            <Button variant="ghost" size="sm">
              查看全部
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}