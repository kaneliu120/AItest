'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Clock, Play, Pause, Trash2, Edit, Eye, 
  RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Calendar, Zap, Settings, Plus, Filter
} from 'lucide-react';

interface ScheduledTask {
  id: string;
  moduleId: string;
  action: string;
  schedule: {
    cron: string;
    timezone?: string;
    enabled: boolean;
  };
  parameters?: Record<string, any>;
  metadata: {
    created: string;
    updated: string;
    lastRun?: string;
    nextRun?: string;
    runCount: number;
    successCount: number;
    lastError?: string;
  };
  retryPolicy?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
}

interface TaskStats {
  totalRuns: number;
  successRate: number;
  averageDuration: number;
  lastRun: string | null;
  nextRun: string | null;
}

export default function TasksScheduler() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [newTask, setNewTask] = useState({
    moduleId: '',
    action: '',
    schedule: {
      cron: '*/30 * * * *', // 默认每30分钟
      enabled: true
    },
    parameters: {} as Record<string, any>,
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 5000,
      backoffMultiplier: 2
    }
  });

  // 获取所有任务
  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/automation?action=tasks');
      const data = await response.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取所有模块
  const fetchModules = async () => {
    try {
      const response = await fetch('/api/automation?action=modules');
      const data = await response.json();
      if (data.success) {
        setModules(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    }
  };

  // 启用/禁用任务
  const toggleTask = async (taskId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-task',
          taskId,
          enabled
        })
      });
      const data = await response.json();
      if (data.success) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  // 手动触发任务
  const triggerTask = async (taskId: string) => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger-task',
          taskId
        })
      });
      const data = await response.json();
      if (data.success) {
        // 可以显示成功消息
        console.log('Task triggered:', data);
      }
    } catch (error) {
      console.error('Failed to trigger task:', error);
    }
  };

  // 创建新任务
  const createTask = async () => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-task',
          taskData: newTask
        })
      });
      const data = await response.json();
      if (data.success) {
        setShowCreateDialog(false);
        setNewTask({
          moduleId: '',
          action: '',
          schedule: {
            cron: '*/30 * * * *',
            enabled: true
          },
          parameters: {},
          retryPolicy: {
            maxRetries: 3,
            retryDelay: 5000,
            backoffMultiplier: 2
          }
        });
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  // 获取任务统计
  const getTaskStats = (task: ScheduledTask): TaskStats => {
    const successRate = task.metadata.runCount > 0
      ? Math.round((task.metadata.successCount / task.metadata.runCount) * 100)
      : 0;

    return {
      totalRuns: task.metadata.runCount,
      successRate,
      averageDuration: 0, // 实际应用中需要从执行记录计算
      lastRun: task.metadata.lastRun || null,
      nextRun: task.metadata.nextRun || null
    };
  };

  // 解析cron表达式为可读格式
  const parseCronExpression = (cron: string): string => {
    const parts = cron.split(' ');
    if (parts.length !== 5) return cron;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // 简单解析
    if (cron === '*/5 * * * *') return '每5分钟';
    if (cron === '*/15 * * * *') return '每15分钟';
    if (cron === '*/30 * * * *') return '每30分钟';
    if (cron === '0 * * * *') return '每小时';
    if (cron === '0 */6 * * *') return '每6小时';
    if (cron === '0 0 * * *') return '每天午夜';
    if (cron === '0 9 * * 1-5') return '工作日早上9点';
    if (cron === '0 0 * * 0') return '每周日午夜';

    return cron;
  };

  // 获取模块名称
  const getModuleName = (moduleId: string): string => {
    const module = modules.find(m => m.id === moduleId);
    return module ? module.name : moduleId;
  };

  // 初始加载
  useEffect(() => {
    fetchTasks();
    fetchModules();
    const interval = setInterval(fetchTasks, 30000); // 每30秒更新一次
    return () => clearInterval(interval);
  }, []);

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    if (filter === 'enabled') return task.schedule.enabled;
    if (filter === 'disabled') return !task.schedule.enabled;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">加载任务列表...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">任务调度</h2>
          <p className="text-muted-foreground">
            管理定时任务，监控任务执行状态
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部任务</SelectItem>
                <SelectItem value="enabled">已启用</SelectItem>
                <SelectItem value="disabled">已禁用</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTasks}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                创建任务
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>创建定时任务</DialogTitle>
                <DialogDescription>
                  配置自动化任务的执行计划和参数
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                {/* 模块选择 */}
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="task-module">选择模块</Label>
                  <Select
                    value={newTask.moduleId}
                    onValueChange={(value) => setNewTask({...newTask, moduleId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map(module => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.name} ({module.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 动作名称 */}
                <div className="space-y-2">
                  <Label htmlFor="task-action">动作名称</Label>
                  <Input
                    id="task-action"
                    value={newTask.action}
                    onChange={(e) => setNewTask({...newTask, action: e.target.value})}
                    placeholder="例如: run-test"
                  />
                </div>

                {/* Cron表达式 */}
                <div className="space-y-2">
                  <Label htmlFor="task-cron">Cron表达式</Label>
                  <Select
                    value={newTask.schedule.cron}
                    onValueChange={(value) => setNewTask({
                      ...newTask,
                      schedule: {...newTask.schedule, cron: value}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*/5 * * * *">每5分钟</SelectItem>
                      <SelectItem value="*/15 * * * *">每15分钟</SelectItem>
                      <SelectItem value="*/30 * * * *">每30分钟</SelectItem>
                      <SelectItem value="0 * * * *">每小时</SelectItem>
                      <SelectItem value="0 */6 * * *">每6小时</SelectItem>
                      <SelectItem value="0 0 * * *">每天午夜</SelectItem>
                      <SelectItem value="0 9 * * 1-5">工作日早上9点</SelectItem>
                      <SelectItem value="0 0 * * 0">每周日午夜</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 重试策略 */}
                <div className="space-y-2">
                  <Label htmlFor="task-retries">最大重试次数</Label>
                  <Input
                    id="task-retries"
                    type="number"
                    min="0"
                    max="10"
                    value={newTask.retryPolicy.maxRetries}
                    onChange={(e) => setNewTask({
                      ...newTask,
                      retryPolicy: {...newTask.retryPolicy, maxRetries: parseInt(e.target.value)}
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-retry-delay">重试延迟(毫秒)</Label>
                  <Input
                    id="task-retry-delay"
                    type="number"
                    min="1000"
                    step="1000"
                    value={newTask.retryPolicy.retryDelay}
                    onChange={(e) => setNewTask({
                      ...newTask,
                      retryPolicy: {...newTask.retryPolicy, retryDelay: parseInt(e.target.value)}
                    })}
                  />
                </div>

                {/* 参数配置 */}
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="task-parameters">任务参数 (JSON格式)</Label>
                  <Textarea
                    id="task-parameters"
                    value={JSON.stringify(newTask.parameters, null, 2)}
                    onChange={(e) => {
                      try {
                        const params = JSON.parse(e.target.value);
                        setNewTask({...newTask, parameters: params});
                      } catch {
                        // 保持原值
                      }
                    }}
                    placeholder='{"key": "value"}'
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  取消
                </Button>
                <Button onClick={createTask}>
                  创建任务
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 任务统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{tasks.length}</div>
              <p className="text-sm text-muted-foreground">总任务数</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {tasks.filter(t => t.schedule.enabled).length}
              </div>
              <p className="text-sm text-muted-foreground">启用任务</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {tasks.length > 0 
                  ? Math.round(tasks.reduce((sum, t) => {
                      const stats = getTaskStats(t);
                      return sum + stats.successRate;
                    }, 0) / tasks.length)
                  : 0}%
              </div>
              <p className="text-sm text-muted-foreground">平均成功率</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {tasks.reduce((sum, t) => sum + t.metadata.runCount, 0)}
              </div>
              <p className="text-sm text-muted-foreground">总执行次数</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 任务列表 */}
      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const stats = getTaskStats(task);
          const moduleName = getModuleName(task.moduleId);
          const cronDescription = parseCronExpression(task.schedule.cron);

          return (
            <Card key={task.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      {moduleName} - {task.action}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {cronDescription}
                      </Badge>
                      <span className="text-xs">ID: {task.id.substring(0, 8)}...</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => triggerTask(task.id)}
                      title="手动触发"
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleTask(task.id, !task.schedule.enabled)}
                      title={task.schedule.enabled ? '禁用任务' : '启用任务'}
                    >
                      {task.schedule.enabled ? (
                        <Pause className="h-4 w-4 text-green-600" />
                      ) : (
                        <Play className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" title="编辑">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* 状态信息 */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">状态</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${task.schedule.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="font-medium">
                        {task.schedule.enabled ? '已启用' : '已禁用'}
                      </span>
                    </div>
                  </div>

                  {/* 成功率 */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">成功率</p>
                    <div className="flex items-center gap-2">
                      {stats.successRate >= 90 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : stats.successRate >= 70 ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{stats.successRate}%</span>
                    </div>
                  </div>

                  {/* 运行次数 */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">运行次数</p>
                    <p className="font-medium">{stats.totalRuns}</p>
                  </div>

                  {/* 下次运行 */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">下次运行</p>
                    <p className="font-medium">
                      {stats.nextRun 
                        ? new Date(stats.nextRun).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                        : '无计划'}
                    </p>
                  </div>
                </div>

                {/* 参数信息 */}
                {task.parameters && Object.keys(task.parameters).length > 0 && (
                  <div className="mt-4 p-3 bg-muted/50 rounded text-sm">
                    <p className="font-medium mb-1">任务参数:</p>
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(task.parameters, null, 2)}
                    </pre>
                  </div>
                )}

                {/* 重试策略 */}
                {task.retryPolicy && (
                  <div className="mt-3 text-sm">
                    <p className="text-muted-foreground">重试策略:</p>
                    <div className="flex gap-4 mt-1">
                      <span>最大重试: {task.retryPolicy.maxRetries}次</span>
                      <span>重试延迟: {task.retryPolicy.retryDelay}ms</span>
                      <span>退避系数: {task.retryPolicy.backoffMultiplier}x</span>
                    </div>
                  </div>
                )}

                {/* 元数据 */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">创建时间:</span>
                    <span className="font-medium">
                      {new Date(task.metadata.created).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">最后运行:</span>
                    <span className="font-medium">
                      {stats.lastRun 
                        ? new Date(stats.lastRun).toLocaleString()
                        : '从未'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">模块ID:</span>
                    <span className="font-medium">{task.moduleId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cron表达式:</span>
                    <span className="font-medium font-mono">{task.schedule.cron}</span>
                  </div>
                </div>

                {/* 错误信息 */}
                {task.metadata.lastError && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
                    <p className="font-medium text-red-700 mb-1">最后错误:</p>
                    <p className="text-red-600">{task.metadata.lastError}</p>
                  </div>
                )}
              </CardContent>
              <div className="px-6 py-3 bg-muted/50 border-t flex justify-between">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Eye className="mr-1 h-3 w-3" />
                  查看执行记录
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Settings className="mr-1 h-3 w-3" />
                  编辑配置
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 空状态 */}
      {filteredTasks.length === 0 && (
        <Card className="text-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">暂无任务</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {filter === 'all' 
              ? '还没有创建任何定时任务'
              : filter === 'enabled'
              ? '没有已启用的任务'
              : '没有已禁用的任务'}
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            创建第一个任务
          </Button>
        </Card>
      )}
    </div>
  );
}