"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Calendar, TrendingUp, CheckCircle } from "lucide-react";

export default function MissionProgress() {
  const phases = [
    {
      name: "Phase 1: Survival (0-3 months)",
      description: "Establish stable cash flow",
      progress: 55,
      target: "Monthly income 30k PHP",
      status: "In Progress",
      tasks: [
        { name: "Register on freelance platform", completed: false },
        { name: "Get first project", completed: false },
        { name: "Local monetization channels", completed: true },
        { name: "Dev environment setup", completed: true },
      ]
    },
    {
      name: "Phase 2: Growth (3-12 months)",
      description: "Build AI agent product line",
      progress: 15,
      target: "Monthly income 100k PHP",
      status: "Planning",
      tasks: [
        { name: "My Skill Shop optimization", completed: true },
        { name: "AI agent development", completed: false },
        { name: "Team building", completed: false },
        { name: "Market expansion", completed: false },
      ]
    },
    {
      name: "Phase 3: Scale (12-36 months)",
      description: "AI+iGaming expert service provider",
      progress: 5,
      target: "Monthly income 500k PHP",
      status: "Planning",
      tasks: [
        { name: "Industry expert status", completed: false },
        { name: "Enterprise clients", completed: false },
        { name: "Product matrix", completed: false },
        { name: "Regional influence", completed: false },
      ]
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          3-Phase Mission Progress
        </CardTitle>
        <CardDescription>
          Current: Phase 1 55% | Overall 25%
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
                  <span>{phase.tasks.filter(t => t.completed).length}/{phase.tasks.length} tasks done</span>
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