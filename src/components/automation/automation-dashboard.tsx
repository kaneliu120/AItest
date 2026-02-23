'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, Pause, RefreshCw, Settings, Plus, 
  BarChart3, Cpu, Clock, AlertCircle, CheckCircle,
  Zap, Server, Database, Bell, Activity
} from 'lucide-react';
import ModulesManager from './modules-manager';
import TasksScheduler from './tasks-scheduler';
import ExecutionsMonitor from './executions-monitor';
// import EventsViewer from './events-viewer'; // Disabled
import FaultDiagnosisDashboard from './fault-diagnosis-dashboard';

interface ServiceStatus {
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  uptime: number;
  components: {
    moduleManager: boolean;
    taskScheduler: boolean;
    dataBus: boolean;
    eventSystem: boolean;
  };
  stats: {
    totalModules: number;
    enabledModules: number;
    totalTasks: number;
    enabledTasks: number;
    activeExecutions: number;
    totalEvents: number;
    totalMessages: number;
  };
  lastError?: string;
}

export default function AutomationDashboard() {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // 获取服务状态
  const fetchServiceStatus = async () => {
    try {
      const response = await fetch('/api/automation?action=status');
      const data = await response.json();
      if (data.success) {
        setServiceStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch service status:', error);
    } finally {
      setLoading(false);
    }
  };

  // 重启服务
  const restartService = async () => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart' })
      });
      const data = await response.json();
      if (data.success) {
        setTimeout(fetchServiceStatus, 2000); // 2秒后重新获取状态
      }
    } catch (error) {
      console.error('Failed to restart service:', error);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchServiceStatus();
    const interval = setInterval(fetchServiceStatus, 10000); // 每10秒更新一次
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载自动化服务状态...</p>
        </div>
      </div>
    );
  }

  if (!serviceStatus) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="mt-4 text-lg font-semibold">无法连接到自动化服务</h3>
        <p className="text-muted-foreground mt-2">请检查服务是否正常运行</p>
        <Button onClick={fetchServiceStatus} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          重试连接
        </Button>
      </div>
    );
  }

  const statusColor = {
    starting: 'text-yellow-500',
    running: 'text-green-500',
    stopping: 'text-yellow-500',
    stopped: 'text-gray-500',
    error: 'text-red-500'
  }[serviceStatus.status];

  const statusText = {
    starting: '启动中',
    running: '运行中',
    stopping: '停止中',
    stopped: '已停止',
    error: '错误'
  }[serviceStatus.status];

  return (
    <div className="space-y-6">
      {/* 头部状态栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">自动化控制中心</h1>
          <p className="text-muted-foreground">
            模块化自动化框架 · 实时监控 · 智能调度
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusColor} animate-pulse`} />
            <span className="font-medium">{statusText}</span>
            <Badge variant="outline" className="ml-2">
              运行时间: {Math.floor(serviceStatus.uptime / 60)}分钟
            </Badge>
          </div>
          <Button onClick={restartService} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            重启服务
          </Button>
        </div>
      </div>

      {/* 状态卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 模块状态 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Cpu className="mr-2 h-4 w-4" />
              模块管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {serviceStatus.stats.enabledModules}/{serviceStatus.stats.totalModules}
                </div>
                <p className="text-xs text-muted-foreground">启用/总数</p>
              </div>
              <Badge variant={serviceStatus.components.moduleManager ? 'default' : 'destructive'}>
                {serviceStatus.components.moduleManager ? '正常' : '异常'}
              </Badge>
            </div>
            <Progress 
              value={(serviceStatus.stats.enabledModules / Math.max(serviceStatus.stats.totalModules, 1)) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* 任务状态 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              任务调度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {serviceStatus.stats.enabledTasks}/{serviceStatus.stats.totalTasks}
                </div>
                <p className="text-xs text-muted-foreground">启用/总数</p>
              </div>
              <Badge variant={serviceStatus.components.taskScheduler ? 'default' : 'destructive'}>
                {serviceStatus.components.taskScheduler ? '正常' : '异常'}
              </Badge>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-muted-foreground">活跃执行: </span>
              <span className="font-medium">{serviceStatus.stats.activeExecutions}</span>
            </div>
          </CardContent>
        </Card>

        {/* 事件状态 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              事件系统
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {serviceStatus.stats.totalEvents.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">总事件数</p>
              </div>
              <Badge variant={serviceStatus.components.eventSystem ? 'default' : 'destructive'}>
                {serviceStatus.components.eventSystem ? '正常' : '异常'}
              </Badge>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-muted-foreground">消息: </span>
              <span className="font-medium">{serviceStatus.stats.totalMessages.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* 数据总线状态 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Database className="mr-2 h-4 w-4" />
              数据总线
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {serviceStatus.stats.totalMessages.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">总消息数</p>
              </div>
              <Badge variant={serviceStatus.components.dataBus ? 'default' : 'destructive'}>
                {serviceStatus.components.dataBus ? '正常' : '异常'}
              </Badge>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-muted-foreground">频道: </span>
              <span className="font-medium">4个</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主功能标签页 */}
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview" className="flex items-center">
            <Activity className="mr-2 h-4 w-4" />
            概览
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center">
            <Cpu className="mr-2 h-4 w-4" />
            模块管理
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            任务调度
          </TabsTrigger>
          <TabsTrigger value="executions" className="flex items-center">
            <Play className="mr-2 h-4 w-4" />
            执行监控
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            事件查看
          </TabsTrigger>
          <TabsTrigger value="fault-diagnosis" className="flex items-center">
            <AlertCircle className="mr-2 h-4 w-4" />
            故障诊断
          </TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>系统概览</CardTitle>
              <CardDescription>
                自动化框架整体运行状态和关键指标
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 组件健康状态 */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">组件健康状态</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(serviceStatus.components).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </div>
                        <Badge variant={value ? 'default' : 'destructive'}>
                          {value ? '正常' : '异常'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 快速操作 */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">快速操作</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      注册新模块
                    </Button>
                    <Button variant="outline" size="sm">
                      <Clock className="mr-2 h-4 w-4" />
                      创建定时任务
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      查看统计报告
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      系统设置
                    </Button>
                  </div>
                </div>

                {/* 系统信息 */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">系统信息</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">服务状态:</span>
                        <span className="font-medium">{statusText}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">运行时间:</span>
                        <span className="font-medium">
                          {Math.floor(serviceStatus.uptime / 3600)}小时 {Math.floor((serviceStatus.uptime % 3600) / 60)}分钟
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">最后更新:</span>
                        <span className="font-medium">刚刚</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">API版本:</span>
                        <span className="font-medium">v1.0.0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 模块管理标签页 */}
        <TabsContent value="modules">
          <ModulesManager />
        </TabsContent>

        {/* 任务调度标签页 */}
        <TabsContent value="tasks">
          <TasksScheduler />
        </TabsContent>

        {/* 执行监控标签页 */}
        <TabsContent value="executions">
          <ExecutionsMonitor />
        </TabsContent>

        {/* 事件查看标签页 */}
        <TabsContent value="events">
          <div className="p-8 text-center text-gray-500">
            事件查看功能开发中...
          </div>
        </TabsContent>

        {/* 故障诊断标签页 */}
        <TabsContent value="fault-diagnosis">
          <FaultDiagnosisDashboard />
        </TabsContent>
      </Tabs>
      </div>

      {/* 错误显示 */}
      {serviceStatus.lastError && (
        <Card className="border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              服务错误
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{serviceStatus.lastError}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={restartService}>
              <RefreshCw className="mr-2 h-4 w-4" />
              尝试重启服务
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}