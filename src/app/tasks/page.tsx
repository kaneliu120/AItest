'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle, Calendar, Plus, Filter, CheckSquare, ListTodo } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 获取任务列表
      const tasksRes = await fetch('/api/tasks?action=tasks');
      const tasksData = await tasksRes.json();
      setTasks(tasksData.data.tasks || []);

      // 获取任务摘要
      const summaryRes = await fetch('/api/tasks?action=summary');
      const summaryData = await summaryRes.json();
      setSummary(summaryData.data);
    } catch (error) {
      console.error('获取任务数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in-progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高优先级';
      case 'medium': return '中优先级';
      case 'low': return '低优先级';
      default: return '普通';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in-progress': return '进行中';
      case 'pending': return '待处理';
      case 'overdue': return '已过期';
      default: return '未知';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载任务数据...</p>
        </div>
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'high').length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">任务管理</h1>
            <p className="text-muted-foreground">管理和跟踪您的日常任务</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              日历视图
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              添加任务
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总任务数</p>
                  <p className="text-2xl font-bold">{tasks.length}</p>
                </div>
                <ListTodo className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">待处理</p>
                  <p className="text-2xl font-bold">{pendingTasks}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">进行中</p>
                  <p className="text-2xl font-bold">{inProgressTasks}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">已完成</p>
                  <p className="text-2xl font-bold">{completedTasks}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">高优先级</p>
                  <p className="text-2xl font-bold">{highPriorityTasks}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 任务进度 */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle>任务进度</CardTitle>
              <CardDescription>整体任务完成情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>总体完成率</span>
                    <span>{summary.completionRate}%</span>
                  </div>
                  <Progress value={summary.completionRate} className="h-3" />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{summary.completedTasks}</div>
                    <div className="text-sm text-muted-foreground">已完成</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{summary.inProgressTasks}</div>
                    <div className="text-sm text-muted-foreground">进行中</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{summary.pendingTasks}</div>
                    <div className="text-sm text-muted-foreground">待处理</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{summary.overdueTasks}</div>
                    <div className="text-sm text-muted-foreground">已过期</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 任务列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 高优先级任务 */}
          <Card>
            <CardHeader>
              <CardTitle>高优先级任务</CardTitle>
              <CardDescription>需要优先处理的任务</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks
                  .filter(t => t.priority === 'high')
                  .slice(0, 5)
                  .map((task) => (
                    <div key={task.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {getPriorityText(task.priority)}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                            {getStatusText(task.status)}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">{formatDate(task.dueDate)}</span>
                      </div>
                      <p className="font-medium mb-1">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      {task.progress !== undefined && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>进度</span>
                            <span>{task.progress}%</span>
                          </div>
                          <Progress value={task.progress} className="h-1" />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
              {highPriorityTasks === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">暂无高优先级任务</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 最近任务 */}
          <Card>
            <CardHeader>
              <CardTitle>最近任务</CardTitle>
              <CardDescription>最近创建和更新的任务</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-600' :
                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {task.status === 'completed' ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : task.status === 'in-progress' ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.category} • 截止: {formatDate(task.dueDate)}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      {task.status === 'completed' ? '查看' : '处理'}
                    </Button>
                  </div>
                ))}
              </div>
              {tasks.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">暂无任务记录</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 任务分类统计 */}
        {summary?.categories && summary.categories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>任务分类统计</CardTitle>
              <CardDescription>按类别统计的任务分布</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.categories.map((category: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.name}</span>
                        <span className="text-sm text-muted-foreground">({category.count}个任务)</span>
                      </div>
                      <span className="text-sm font-medium">{category.completionRate}%</span>
                    </div>
                    <Progress value={category.completionRate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 快速操作 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-auto py-4">
            <Plus className="h-4 w-4 mr-2" />
            添加新任务
          </Button>
          <Button variant="outline" className="h-auto py-4">
            <Calendar className="h-4 w-4 mr-2" />
            查看日历
          </Button>
          <Button className="h-auto py-4">
            <CheckCircle className="h-4 w-4 mr-2" />
            批量完成
          </Button>
        </div>
      </div>
    </div>
  );
}