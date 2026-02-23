'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Play, Pause, StopCircle, RefreshCw, 
  CheckCircle, XCircle, Clock, BarChart3,
  Workflow, Zap, Shield, TrendingUp
} from 'lucide-react';

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: Array<{
    id: string;
    name: string;
    description: string;
    module: string;
    action: string;
  }>;
  triggers: Array<{
    type: string;
    schedule?: string;
    eventType?: string;
  }>;
}

interface WorkflowInstance {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  currentStep?: string;
  stepsStatus: Record<string, any>;
  startedAt: string;
  completedAt?: string;
  errors: string[];
}

interface WorkflowMetrics {
  totalWorkflows: number;
  runningWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  averageExecutionTime: number;
  successRate: number;
  stepSuccessRate: Record<string, number>;
  moduleUsage: Record<string, number>;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows?action=list');
      const data = await response.json();
      
      if (data.success) {
        setWorkflows(data.data.workflows || []);
      }
    } catch (error) {
      console.error('获取工作流失败:', error);
    }
  };

  const fetchInstances = async () => {
    try {
      const response = await fetch('/api/workflows?action=instances');
      const data = await response.json();
      
      if (data.success) {
        setInstances(data.data.instances || []);
      }
    } catch (error) {
      console.error('获取实例失败:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/workflows?action=metrics');
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('获取指标失败:', error);
    }
  };

  const executeWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          workflowId,
          input: {},
          priority: 'medium'
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`工作流 ${workflowId} 开始执行`);
        fetchInstances();
      } else {
        alert(`执行失败: ${data.error}`);
      }
    } catch (error) {
      console.error('执行工作流失败:', error);
      alert('执行失败');
    }
  };

  const controlWorkflow = async (action: string, instanceId: string) => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, instanceId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`操作成功: ${data.message}`);
        fetchInstances();
      } else {
        alert(`操作失败: ${data.error}`);
      }
    } catch (error) {
      console.error('控制工作流失败:', error);
      alert('操作失败');
    }
  };

  const refreshData = () => {
    setLoading(true);
    Promise.all([fetchWorkflows(), fetchInstances(), fetchMetrics()])
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshData();
    
    // 每30秒刷新一次数据
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: React.ReactNode }> = {
      running: { color: 'bg-blue-100 text-blue-800', icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
      completed: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      failed: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> },
      paused: { color: 'bg-yellow-100 text-yellow-800', icon: <Pause className="w-3 h-3" /> },
      pending: { color: 'bg-gray-100 text-gray-800', icon: <Clock className="w-3 h-3" /> },
    };
    
    const variant = variants[status] || variants.pending;
    
    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        {variant.icon}
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = endTime - startTime;
    
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${Math.floor(duration / 1000)}s`;
    return `${Math.floor(duration / 60000)}m`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="mt-2 text-gray-600">加载工作流数据...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Workflow className="w-8 h-8" />
            工作流协调器
          </h1>
          <p className="text-gray-600 mt-2">
            基于数据总线的自动化工作流协调系统
          </p>
        </div>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            概览
          </TabsTrigger>
          <TabsTrigger value="workflows">
            <Workflow className="w-4 h-4 mr-2" />
            工作流
          </TabsTrigger>
          <TabsTrigger value="instances">
            <Zap className="w-4 h-4 mr-2" />
            实例
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <TrendingUp className="w-4 h-4 mr-2" />
            指标
          </TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 指标卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  总工作流
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.totalWorkflows || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {workflows.length} 个定义
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  运行中
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {metrics?.runningWorkflows || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  当前活跃实例
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  成功率
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {metrics?.successRate?.toFixed(1) || 0}%
                </div>
                <Progress 
                  value={metrics?.successRate || 0} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  平均时间
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.averageExecutionTime ? 
                    `${Math.round(metrics.averageExecutionTime / 1000)}s` : 
                    '0s'
                  }
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  平均执行时间
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 预定义工作流 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                预定义工作流
              </CardTitle>
              <CardDescription>
                系统内置的自动化工作流
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.slice(0, 4).map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{workflow.name}</div>
                      <div className="text-sm text-gray-500">{workflow.description}</div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">v{workflow.version}</Badge>
                        <Badge variant="outline">{workflow.steps.length} 步骤</Badge>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => executeWorkflow(workflow.id)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      执行
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 最近实例 */}
          <Card>
            <CardHeader>
              <CardTitle>最近工作流实例</CardTitle>
              <CardDescription>
                最近执行的工作流实例状态
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {instances.slice(0, 5).map((instance) => (
                  <div key={instance.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(instance.status)}
                      <div>
                        <div className="font-medium">
                          {workflows.find(w => w.id === instance.workflowId)?.name || instance.workflowId}
                        </div>
                        <div className="text-sm text-gray-500">
                          开始: {formatTime(instance.startedAt)}
                          {instance.completedAt && ` | 时长: ${formatDuration(instance.startedAt, instance.completedAt)}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {instance.status === 'running' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => controlWorkflow('pause', instance.id)}
                        >
                          <Pause className="w-3 h-3" />
                        </Button>
                      )}
                      {instance.status === 'paused' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => controlWorkflow('resume', instance.id)}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                      {(instance.status === 'running' || instance.status === 'paused') && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => controlWorkflow('cancel', instance.id)}
                        >
                          <StopCircle className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 工作流标签页 */}
        <TabsContent value="workflows">
          <Card>
            <CardHeader>
              <CardTitle>工作流定义</CardTitle>
              <CardDescription>
                所有已注册的工作流定义
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-lg">{workflow.name}</div>
                        <div className="text-gray-600 mt-1">{workflow.description}</div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">ID: {workflow.id}</Badge>
                          <Badge variant="outline">v{workflow.version}</Badge>
                          <Badge variant="outline">{workflow.steps.length} 步骤</Badge>
                        </div>
                      </div>
                      <Button 
                        onClick={() => executeWorkflow(workflow.id)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        执行
                      </Button>
                    </div>
                    
                    <div className="mt-4">
                      <div className="font-medium mb-2">步骤:</div>
                      <div className="space-y-2">
                        {workflow.steps.map((step, index) => (
                          <div key={step.id} className="flex items-center gap-3 text-sm">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{step.name}</div>
                              <div className="text-gray-500">{step.description}</div>
                            </div>
                            <Badge variant="outline">{step.module}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="font-medium mb-2">触发器:</div>
                      <div className="flex gap-2">
                        {workflow.triggers.map((trigger, index) => (
                          <Badge key={index} variant="secondary">
                            {trigger.type === 'schedule' ? `计划: ${trigger.schedule}` : 
                             trigger.type === 'event' ? `事件: ${trigger.eventType}` : 
                             trigger.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 实例标签页 */}
        <TabsContent value="instances">
          <Card>
            <CardHeader>
              <CardTitle>工作流实例</CardTitle>
              <CardDescription>
                所有执行中的工作流实例
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {instances.map((instance) => {
                  const workflow = workflows.find(w => w.id === instance.workflowId);
                  
                  return (
                    <div key={instance.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(instance.status)}
                            <div className="font-bold text-lg">
                              {workflow?.name || instance.workflowId}
                            </div>
                          </div>
                          <div className="text-gray-600 mt-1">
                            实例ID: {instance.id}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <div className="text-sm">
                              <span className="font-medium">开始:</span> {formatTime(instance.startedAt)}
                            </div>
                            {instance.completedAt && (
                              <div className="text-sm">
                                <span className="font-medium">结束:</span> {formatTime(instance.completedAt)}
                              </div>
                            )}
                            <div className="text-sm">
                              <span className="font-medium">时长:</span> {formatDuration(instance.startedAt, instance.completedAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {instance.status === 'running' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => controlWorkflow('pause', instance.id)}
                            >
                              <Pause className="w-3 h-3" />
                            </Button>
                          )}
                          {instance.status === 'paused' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => controlWorkflow('resume', instance.id)}
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          )}
                          {(instance.status === 'running' || instance.status === 'paused') && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => controlWorkflow('cancel', instance.id)}
                            >
                              <StopCircle className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {instance.currentStep && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <div className="font-medium text-blue-700">当前步骤:</div>
                          <div className="text-blue-600">{instance.currentStep}</div>
                        </div>
                      )}
                      
                      {instance.errors.length > 0 && (
                        <div className="mt-4 p-3 bg-red-50 rounded-lg">
                          <div className="font-medium text-red-700">错误:</div>
                          <ul className="text-red-600 text-sm list-disc list-inside">
                            {instance.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="mt-4">
                        <div className="font-medium mb-2">步骤状态:</div>
                        <div className="space-y-2">
                          {Object.entries(instance.stepsStatus || {}).map(([stepId, stepStatus]) => (
                            <div key={stepId} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(stepStatus.status)}
                                <span>{stepId}</span>
                              </div>
                              <div className="text-gray-500">
                                {stepStatus.startedAt && `开始: ${formatTime(stepStatus.startedAt)}`}
                                {stepStatus.completedAt && ` | 结束: ${formatTime(stepStatus.completedAt)}`}
                                {stepStatus.attempts > 0 && ` | 尝试: ${stepStatus.attempts}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 指标标签页 */}
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>工作流指标</CardTitle>
              <CardDescription>
                详细的工作流执行指标和统计
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics ? (
                <div className="space-y-6">
                  {/* 总体指标 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          执行统计
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>总计:</span>
                            <span className="font-bold">{metrics.totalWorkflows}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>成功:</span>
                            <span className="font-bold text-green-600">{metrics.completedWorkflows}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>失败:</span>
                            <span className="font-bold text-red-600">{metrics.failedWorkflows}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>运行中:</span>
                            <span className="font-bold text-blue-600">{metrics.runningWorkflows}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          性能指标
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>成功率:</span>
                            <span className="font-bold">{metrics.successRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>平均时间:</span>
                            <span className="font-bold">
                              {Math.round(metrics.averageExecutionTime / 1000)}s
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>步骤成功率:</span>
                            <span className="font-bold">
                              {Object.keys(metrics.stepSuccessRate).length > 0 ? 
                                `${Object.values(metrics.stepSuccessRate).reduce((a, b) => a + b, 0) / Object.values(metrics.stepSuccessRate).length}%` : 
                                'N/A'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          模块使用
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(metrics.moduleUsage)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 5)
                            .map(([module, count]) => (
                              <div key={module} className="flex justify-between">
                                <span className="capitalize">{module}:</span>
                                <span className="font-bold">{count}</span>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 步骤成功率图表 */}
                  <Card>
                    <CardHeader>
                      <CardTitle>步骤成功率</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(metrics.stepSuccessRate)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 10)
                          .map(([stepKey, successRate]) => (
                            <div key={stepKey}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="truncate">{stepKey}</span>
                                <span>{successRate.toFixed(1)}%</span>
                              </div>
                              <Progress value={successRate} className="h-2" />
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  暂无指标数据
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}