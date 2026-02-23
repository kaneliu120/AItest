'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Target, Clock, CheckCircle, AlertCircle, TrendingUp, Users, Zap, Flag, Calendar, Award, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function MissionsPage() {
  const [activeTab, setActiveTab] = useState("active");

  const missions = [
    {
      id: 'mission-001',
      title: 'Mission Control Phase 2',
      description: '完成Mission Control第二阶段开发，实现深度集成',
      status: 'completed',
      priority: 'high',
      progress: 100,
      deadline: '2026-02-21',
      team: ['小A', '开发团队'],
      achievements: ['子系统深度集成', '统一架构完成', '性能优化'],
    },
    {
      id: 'mission-002',
      title: 'AI技能平台优化',
      description: '优化My Skill Shop平台功能和用户体验',
      status: 'in-progress',
      priority: 'high',
      progress: 75,
      deadline: '2026-03-15',
      team: ['小A', '产品团队'],
      achievements: ['界面优化完成', '性能提升30%'],
    },
    {
      id: 'mission-003',
      title: '自动化工作流部署',
      description: '部署完整的自动化工作流系统',
      status: 'in-progress',
      priority: 'medium',
      progress: 60,
      deadline: '2026-03-10',
      team: ['小A', '运维团队'],
      achievements: ['核心框架完成', '测试环境部署'],
    },
    {
      id: 'mission-004',
      title: '财务系统升级',
      description: '升级财务系统，添加高级分析功能',
      status: 'pending',
      priority: 'medium',
      progress: 20,
      deadline: '2026-03-20',
      team: ['小A', '财务团队'],
      achievements: ['需求分析完成'],
    },
    {
      id: 'mission-005',
      title: '安全审计',
      description: '完成系统安全审计和漏洞修复',
      status: 'pending',
      priority: 'high',
      progress: 0,
      deadline: '2026-03-05',
      team: ['安全团队'],
      achievements: [],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in-progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      case 'in-progress': return <Clock className="h-5 w-5" />;
      case 'pending': return <AlertCircle className="h-5 w-5" />;
      default: return <Flag className="h-5 w-5" />;
    }
  };

  const activeMissions = missions.filter(m => m.status === 'in-progress').length;
  const completedMissions = missions.filter(m => m.status === 'completed').length;
  const totalProgress = missions.reduce((sum, m) => sum + m.progress, 0) / missions.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">任务中心 🚀</h1>
            <p className="text-muted-foreground">战略任务和项目里程碑管理</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              时间线
            </Button>
            <Button size="sm">
              <Rocket className="h-4 w-4 mr-2" />
              新建任务
            </Button>
          </div>
        </div>

        {/* 任务统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总任务数</p>
                  <p className="text-2xl font-bold">{missions.length}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">进行中</p>
                  <p className="text-2xl font-bold">{activeMissions}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">已完成</p>
                  <p className="text-2xl font-bold">{completedMissions}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总体进度</p>
                  <p className="text-2xl font-bold">{totalProgress.toFixed(0)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 任务列表 */}
        <div className="space-y-6">
          {missions.map((mission) => (
            <Card key={mission.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* 任务头部 */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getStatusColor(mission.status)}`}>
                        {getStatusIcon(mission.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{mission.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(mission.status)}`}>
                            {mission.status === 'completed' ? '已完成' : 
                             mission.status === 'in-progress' ? '进行中' : '待开始'}
                          </span>
                          <span className={`text-xs font-medium ${getPriorityColor(mission.priority)}`}>
                            {mission.priority === 'high' ? '高优先级' : 
                             mission.priority === 'medium' ? '中优先级' : '低优先级'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{mission.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">截止日期: {mission.deadline}</p>
                      <p className="text-sm text-muted-foreground">团队: {mission.team.join(', ')}</p>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>任务进度</span>
                      <span>{mission.progress}%</span>
                    </div>
                    <Progress value={mission.progress} className="h-2" />
                  </div>

                  {/* 成就列表 */}
                  {mission.achievements.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">已达成成就:</p>
                      <div className="flex flex-wrap gap-2">
                        {mission.achievements.map((achievement, index) => (
                          <span key={index} className="px-2 py-1 rounded text-xs bg-green-50 text-green-600 border border-green-200">
                            {achievement}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      查看详情
                    </Button>
                    <Button size="sm" variant="outline">
                      <Users className="h-4 w-4 mr-1" />
                      团队协作
                    </Button>
                    {mission.status !== 'completed' && (
                      <Button size="sm">
                        <Zap className="h-4 w-4 mr-1" />
                        更新进度
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 里程碑 */}
        <Card>
          <CardHeader>
            <CardTitle>里程碑</CardTitle>
            <CardDescription>重要里程碑和完成时间</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { date: '2026-02-21', milestone: 'Mission Control Phase 2 完成', status: 'completed', impact: '高' },
                { date: '2026-02-28', milestone: '自动化测试系统部署', status: 'in-progress', impact: '高' },
                { date: '2026-03-07', milestone: '安全审计完成', status: 'pending', impact: '高' },
                { date: '2026-03-14', milestone: '财务系统升级', status: 'pending', impact: '中' },
                { date: '2026-03-21', milestone: 'AI技能平台发布', status: 'pending', impact: '高' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full mt-1 ${
                      item.status === 'completed' ? 'bg-green-500' :
                      item.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold">{item.milestone}</h4>
                        <p className="text-sm text-muted-foreground">{item.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.impact === '高' ? 'bg-red-50 text-red-600 border-red-200' :
                          item.impact === '中' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                          'bg-green-50 text-green-600 border-green-200'
                        }`}>
                          影响度: {item.impact}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.status === 'completed' ? 'bg-green-50 text-green-600 border-green-200' :
                          item.status === 'in-progress' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {item.status === 'completed' ? '已完成' : 
                           item.status === 'in-progress' ? '进行中' : '待开始'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 团队绩效 */}
        <Card>
          <CardHeader>
            <CardTitle>团队绩效</CardTitle>
            <CardDescription>各团队任务完成情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { team: '开发团队', completed: 8, total: 10, efficiency: 85 },
                { team: '产品团队', completed: 5, total: 7, efficiency: 78 },
                { team: '运维团队', completed: 6, total: 8, efficiency: 82 },
                { team: '财务团队', completed: 3, total: 5, efficiency: 65 },
                { team: '安全团队', completed: 2, total: 3, efficiency: 72 },
              ].map((team, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{team.team}</p>
                        <p className="text-sm text-muted-foreground">
                          完成 {team.completed}/{team.total} 个任务
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{team.efficiency}%</p>
                      <p className="text-sm text-muted-foreground">效率</p>
                    </div>
                  </div>
                  <Progress value={team.efficiency} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 快速操作 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-auto py-4">
            <Award className="h-4 w-4 mr-2" />
            查看成就
          </Button>
          <Button variant="outline" className="h-auto py-4">
            <BarChart3 className="h-4 w-4 mr-2" />
            绩效报告
          </Button>
          <Button className="h-auto py-4">
            <Rocket className="h-4 w-4 mr-2" />
            创建新任务
          </Button>
        </div>
      </div>
    </div>
  );
}