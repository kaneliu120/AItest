"use client";

import { DollarSign, TrendingUp, Users, Clock, Target, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const stats = [
  {
    title: "本月收入",
    value: "₱8,500",
    change: "+12.5%",
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    description: "距离目标 ₱30,000",
  },
  {
    title: "外包项目",
    value: "3",
    change: "+1 进行中",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    description: "2个提案待回复",
  },
  {
    title: "工作效率",
    value: "78%",
    change: "+5.2%",
    icon: TrendingUp,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    description: "本周平均专注时间",
  },
  {
    title: "任务完成",
    value: "24/30",
    change: "80%",
    icon: Target,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    description: "本周任务进度",
  },
  {
    title: "自动化节省",
    value: "15.5h",
    change: "本周",
    icon: Clock,
    color: "text-cyan-600",
    bgColor: "bg-cyan-500/10",
    description: "通过自动化节省",
  },
  {
    title: "AI工具使用",
    value: "8",
    change: "活跃中",
    icon: Zap,
    color: "text-pink-600",
    bgColor: "bg-pink-500/10",
    description: "Antigravity等工具",
  },
];

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium ${stat.color}`}>
                {stat.change}
              </span>
              <span className="text-xs text-muted-foreground">
                {stat.description}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}