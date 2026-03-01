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
      cron: '*/30 * * * *', // Default every 30 minutes
      enabled: true
    },
    parameters: {} as Record<string, any>,
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 5000,
      backoffMultiplier: 2
    }
  });

  // Fetch all tasks
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

  // Fetch all modules
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

  // Enable/disable task
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

  // Trigger task manually
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
        // Can show success message
        console.log('Task triggered:', data);
      }
    } catch (error) {
      console.error('Failed to trigger task:', error);
    }
  };

  // Create new task
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

  // Get task stats
  const getTaskStats = (task: ScheduledTask): TaskStats => {
    const successRate = task.metadata.runCount > 0
      ? Math.round((task.metadata.successCount / task.metadata.runCount) * 100)
      : 0;

    return {
      totalRuns: task.metadata.runCount,
      successRate,
      averageDuration: 0, // Calculate from execution records in production
      lastRun: task.metadata.lastRun || null,
      nextRun: task.metadata.nextRun || null
    };
  };

  // Parse cron expression to readable format
  const parseCronExpression = (cron: string): string => {
    const parts = cron.split(' ');
    if (parts.length !== 5) return cron;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Simple parse
    if (cron === '*/5 * * * *') return 'Every 5 minutes';
    if (cron === '*/15 * * * *') return 'Every 15 minutes';
    if (cron === '*/30 * * * *') return 'Every 30 minutes';
    if (cron === '0 * * * *') return 'Every hour';
    if (cron === '0 */6 * * *') return 'Every 6 hours';
    if (cron === '0 0 * * *') return 'Every day at midnight';
    if (cron === '0 9 * * 1-5') return 'Weekdays at 9am';
    if (cron === '0 0 * * 0') return 'Every Sunday midnight';

    return cron;
  };

  // Get module name
  const getModuleName = (moduleId: string): string => {
    const module = modules.find(m => m.id === moduleId);
    return module ? module.name : moduleId;
  };

  // Initial load
  useEffect(() => {
    fetchTasks();
    fetchModules();
    const interval = setInterval(fetchTasks, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Filter tasks
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
          <p className="mt-2 text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Task Scheduler</h2>
          <p className="text-muted-foreground">
            Manage scheduled tasks and monitor execution
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
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTasks}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Scheduled Task</DialogTitle>
                <DialogDescription>
                  Configure the schedule and parameters for an automation task
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                {/* Module selection */}
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="task-module">Select Module</Label>
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

                {/* Action name */}
                <div className="space-y-2">
                  <Label htmlFor="task-action">Action Name</Label>
                  <Input
                    id="task-action"
                    value={newTask.action}
                    onChange={(e) => setNewTask({...newTask, action: e.target.value})}
                    placeholder="e.g. run-test"
                  />
                </div>

                {/* Cron expression */}
                <div className="space-y-2">
                  <Label htmlFor="task-cron">Cron Expression</Label>
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
                      <SelectItem value="*/5 * * * *">Every 5 minutes</SelectItem>
                      <SelectItem value="*/15 * * * *">Every 15 minutes</SelectItem>
                      <SelectItem value="*/30 * * * *">Every 30 minutes</SelectItem>
                      <SelectItem value="0 * * * *">Every hour</SelectItem>
                      <SelectItem value="0 */6 * * *">Every 6 hours</SelectItem>
                      <SelectItem value="0 0 * * *">Every day at midnight</SelectItem>
                      <SelectItem value="0 9 * * 1-5">Weekdays at 9am</SelectItem>
                      <SelectItem value="0 0 * * 0">Every Sunday midnight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Retry policy */}
                <div className="space-y-2">
                  <Label htmlFor="task-retries">Max Retries</Label>
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
                  <Label htmlFor="task-retry-delay">Retry Delay (ms)</Label>
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

                {/* Parameters */}
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="task-parameters">Task Parameters (JSON)</Label>
                  <Textarea
                    id="task-parameters"
                    value={JSON.stringify(newTask.parameters, null, 2)}
                    onChange={(e) => {
                      try {
                        const params = JSON.parse(e.target.value);
                        setNewTask({...newTask, parameters: params});
                      } catch {
                        // Keep original value
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
                  Cancel
                </Button>
                <Button onClick={createTask}>
                  Create Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Task stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{tasks.length}</div>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {tasks.filter(t => t.schedule.enabled).length}
              </div>
              <p className="text-sm text-muted-foreground">Enabled</p>
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
              <p className="text-sm text-muted-foreground">Avg Success Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {tasks.reduce((sum, t) => sum + t.metadata.runCount, 0)}
              </div>
              <p className="text-sm text-muted-foreground">Total Executions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task list */}
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
                      title="Trigger Manually"
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleTask(task.id, !task.schedule.enabled)}
                      title={task.schedule.enabled ? 'Disable Task' : 'Enable Task'}
                    >
                      {task.schedule.enabled ? (
                        <Pause className="h-4 w-4 text-green-600" />
                      ) : (
                        <Play className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" title="Edit">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Status info */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${task.schedule.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="font-medium">
                        {task.schedule.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  {/* Success rate */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Success Rate</p>
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

                  {/* Run count */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Run Count</p>
                    <p className="font-medium">{stats.totalRuns}</p>
                  </div>

                  {/* Next run */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Next Run</p>
                    <p className="font-medium">
                      {stats.nextRun 
                        ? new Date(stats.nextRun).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                        : 'Not scheduled'}
                    </p>
                  </div>
                </div>

                {/* Parameters */}
                {task.parameters && Object.keys(task.parameters).length > 0 && (
                  <div className="mt-4 p-3 bg-muted/50 rounded text-sm">
                    <p className="font-medium mb-1">Parameters:</p>
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(task.parameters, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Retry policy */}
                {task.retryPolicy && (
                  <div className="mt-3 text-sm">
                    <p className="text-muted-foreground">Retry Policy:</p>
                    <div className="flex gap-4 mt-1">
                      <span>Max retries: {task.retryPolicy.maxRetries}</span>
                      <span>Retry delay: {task.retryPolicy.retryDelay}ms</span>
                      <span>Backoff: {task.retryPolicy.backoffMultiplier}x</span>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">
                      {new Date(task.metadata.created).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Run:</span>
                    <span className="font-medium">
                      {stats.lastRun 
                        ? new Date(stats.lastRun).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Module ID:</span>
                    <span className="font-medium">{task.moduleId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cron Expression:</span>
                    <span className="font-medium font-mono">{task.schedule.cron}</span>
                  </div>
                </div>

                {/* Error info */}
                {task.metadata.lastError && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
                    <p className="font-medium text-red-700 mb-1">Last Error:</p>
                    <p className="text-red-600">{task.metadata.lastError}</p>
                  </div>
                )}
              </CardContent>
              <div className="px-6 py-3 bg-muted/50 border-t flex justify-between">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Eye className="mr-1 h-3 w-3" />
                  View Executions
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Settings className="mr-1 h-3 w-3" />
                  Edit Config
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredTasks.length === 0 && (
        <Card className="text-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No Tasks</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {filter === 'all' 
              ? 'No scheduled tasks yet'
              : filter === 'enabled'
              ? 'No enabled tasks'
              : 'No disabled tasks'}
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create First Task
          </Button>
        </Card>
      )}
    </div>
  );
}