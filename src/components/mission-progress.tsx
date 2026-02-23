"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Calendar, TrendingUp, CheckCircle } from "lucide-react";

export default function MissionProgress() {
  const phases = [
    {
      name: "阶段1: 生存 (0-3个月)",
      description: "建立稳定现金流",
      progress: 55,
      target: "月收入30k PHP",
      status: "进行中",
      tasks: [
        { name: "外包平台注册", completed: false },
        { name: "第一个项目获得", completed: false },
        { name: "本地变现渠道", completed: true },
        { name: "开发环境搭建", completed: true },
      ]
    },
    {
      name: "阶段2: 发展 (3-12个月)",
      description: "打造AI智能体产品线",
      progress: 15,
      target: "月收入100k PHP",
      status: "规划中",
      tasks: [
        { name: "My Skill Shop优化", completed: true },
        { name: "AI智能体开发", completed: false },
        { name: "团队建设", completed: false },
        { name: "市场扩展", completed: false },
      ]
    },
    {
      name: "阶段3: 扩展 (12-36个月)",
      description: "AI+iGaming专家服务商",
      progress: 5,
      target: "月收入500k PHP",
      status: "规划中",
      tasks: [
        { name: "行业专家地位", completed: false },
        { name: "企业级客户", completed: false },
        { name: "产品矩阵", completed: false },
        { name: "区域影响力", completed: false },
      ]
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          三阶段使命进度
        </CardTitle>
        <CardDescription>
          当前进度: 第一阶段 55% | 总体进度 25%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {phases.map((phase, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{phase.name}</h3>
                  <p className="text-sm text-muted-foreground">{phase.description}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{phase.progress}%</div>
                  <div className="text-xs text-muted-foreground">{phase.status}</div>
                </div>
              </div>
              
              <Progress value={phase.progress} className="h-2" />
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{phase.target}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>{phase.tasks.filter(t => t.completed).length}/{phase.tasks.length} 任务完成</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {phase.tasks.map((task, taskIndex) => (
                  <div key={taskIndex} className="flex items-center gap-2 text-sm">
                    {task.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                    )}
                    <span className={task.completed ? "text-green-600" : "text-muted-foreground"}>
                      {task.name}
                    </span>
                  </div>
                ))}
              </div>
              
              {index < phases.length - 1 && <div className="border-t pt-3" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}