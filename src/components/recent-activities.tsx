"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, AlertCircle, Zap, Code, Users } from "lucide-react";

export default function RecentActivities() {
  const activities = [
    {
      id: 1,
      type: "completed",
      title: "Docker Desktop安装完成",
      description: "开发环境完全就绪",
      time: "今天 10:42",
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    },
    {
      id: 2,
      type: "in-progress",
      title: "自动化测试集成开发",
      description: "Mission Control集成进行中",
      time: "今天 14:29",
      icon: <Code className="h-4 w-4 text-blue-500" />,
    },
    {
      id: 3,
      type: "pending",
      title: "Upwork账号注册",
      description: "等待用户完成注册",
      time: "今天 10:45",
      icon: <Users className="h-4 w-4 text-amber-500" />,
    },
    {
      id: 4,
      type: "completed",
      title: "Discord频道配置",
      description: "7个频道项目映射完成",
      time: "今天 10:55",
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    },
    {
      id: 5,
      type: "completed",
      title: "晚间主动性系统配置",
      description: "今晚20:00首次执行",
      time: "今天 10:12",
      icon: <Zap className="h-4 w-4 text-purple-500" />,
    },
    {
      id: 6,
      type: "alert",
      title: "Google Ads OAuth配置",
      description: "需要完整OAuth凭证",
      time: "今天 13:23",
      icon: <AlertCircle className="h-4 w-4 text-red-500" />,
    },
  ];

  const getStatusColor = (type: string) => {
    switch (type) {
      case "completed": return "text-green-600 bg-green-50";
      case "in-progress": return "text-blue-600 bg-blue-50";
      case "pending": return "text-amber-600 bg-amber-50";
      case "alert": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusText = (type: string) => {
    switch (type) {
      case "completed": return "已完成";
      case "in-progress": return "进行中";
      case "pending": return "等待中";
      case "alert": return "需注意";
      default: return "未知";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          最近活动
        </CardTitle>
        <CardDescription>
          今日系统活动和任务状态
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="mt-1">
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{activity.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(activity.type)}`}>
                    {getStatusText(activity.type)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 今日统计 */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">6</div>
              <div className="text-sm text-muted-foreground">今日活动</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">4</div>
              <div className="text-sm text-muted-foreground">已完成</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}