'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import MonitoringPanel from '@/components/dispatcher/monitoring-panel';
import { 
  Activity, 
  Brain, 
  Cpu, 
  Database, 
  Network, 
  RefreshCw, 
  Search, 
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Settings,
  Play,
  TrendingUp,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

interface DispatchStats {
  totalTasks: number;
  successfulTasks: number;
  successRate: number;
  cachedTasks: number;
  cacheRate: number;
  averageExecutionTime: number;
  systemStats: Record<string, any>;
  taskTypeStats: Record<string, any>;
  lastUpdated: string;
}

interface SystemPerformance {
  system: string;
  taskType: string;
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  successRate: number;
  lastUsed: string;
  costPerRequest?: number;
}

interface TaskHistory {
  taskId: string;
  query: string;
  taskType: string;
  priority: string;
  executionTime: number;
  success: boolean;
  cached: boolean;
  timestamp: string;
  systemUsed: string;
  tokenUsage?: number;
}

interface DispatchConfig {
  performanceWeight: number;
  costWeight: number;
  reliabilityWeight: number;
  cacheWeight: number;
  defaultStrategy: string;
  enablePredictiveRouting: boolean;
  enableLoadBalancing: boolean;
  maxParallelTasks: number;
  timeoutMs: number;
}

export default function IntelligentDispatcherPage() {
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [dispatchStats, setDispatchStats] = useState<DispatchStats | null>(null);
  const [systemPerformance, setSystemPerformance] = useState<SystemPerformance[]>([]);
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([]);
  const [config, setConfig] = useState<DispatchConfig | null>(null);
  const [activeTab, setActiveTab] = useState('dispatch');
  const [compareResult, setCompareResult] = useState<any>(null);

  // 示例查询
  const exampleQueries = [
    '开发一个用户登录系统',
    '查找AI模型部署指南',
    '执行数据库备份脚本',
    '生成RESTful API文档',
    '优化前端性能',
    '配置CI/CD流水线'
  ];

  // 加载数据
  const loadData = async () => {
    try {
      // 加载分发统计
      const statsRes = await fetch('/api/v2/dispatcher?action=stats');
      const statsData = await statsRes.json();
      if (statsData.success) setDispatchStats(statsData.data);

      // 加载系统性能
      const perfRes = await fetch('/api/v2/dispatcher?action=performance');
      const perfData = await perfRes.json();
      if (perfData.success) setSystemPerformance(perfData.data);

      // 加载任务历史
      const historyRes = await fetch('/api/v2/dispatcher?action=history&limit=20');
      const historyData = await historyRes.json();
      if (historyData.success) setTaskHistory(historyData.data);

      // 加载配置
      const configRes = await fetch('/api/v2/dispatcher?action=config');
      const configData = await configRes.json();
      if (configData.success) setConfig(configData.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 处理分发
  const handleDispatch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/v2/dispatcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispatch',
          query,
          priority
        })
      });
      
      const data = await response.json();
      setResponse(data);
      
      // 重新加载数据
      setTimeout(loadData, 500);
    } catch (error) {
      console.error('分发失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 比较性能
  const handleCompare = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/v2/dispatcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compare',
          compareQuery: query
        })
      });
      
      const data = await response.json();
      setCompareResult(data.data);
    } catch (error) {
      console.error('比较失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 更新配置
  const handleUpdateConfig = async (updates: Partial<DispatchConfig>) => {
    if (!config) return;

    try {
      const response = await fetch('/api/v2/dispatcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-config',
          config: { ...config, ...updates }
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
        alert('配置更新成功');
      }
    } catch (error) {
      console.error('更新配置失败:', error);
    }
  };

  // 清空历史
  const handleClearHistory = async () => {
    if (!confirm('确定要清空历史记录吗？')) return;

    try {
      const response = await fetch('/api/v2/dispatcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-history' })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('历史记录已清空');
        loadData();
      }
    } catch (error) {
      console.error('清空历史失败:', error);
    }
  };

  // 使用示例查询
  const useExampleQuery = (example: string) => {
    setQuery(example);
  };

  // 获取系统颜色
  const getSystemColor = (system: string) => {
    switch (system) {
      case 'mission-control': return 'text-blue-600 bg-blue-100';
      case 'okms': return 'text-green-600 bg-green-100';
      case 'openclaw': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 获取任务类型颜色
  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'code': return 'text-blue-600 bg-blue-100';
      case 'knowledge': return 'text-green-600 bg-green-100';
      case 'skill': return 'text-purple-600 bg-purple-100';
      case 'mixed': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 格式化时间
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 标题和状态 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Brain className="h-8 w-8 mr-3 text-blue-600" />
            智能任务分发系统
          </h1>
          <p className="text-gray-600">基于性能学习的智能任务路由和优化</p>
        </div>
        <div className="flex items-center space-x-4">
          {dispatchStats && (
            <Badge variant="default" className="text-sm">
              🎯 成功率: {(dispatchStats.successRate * 100).toFixed(1)}%
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="dispatch" className="flex items-center">
            <Play className="h-4 w-4 mr-2" />
            任务分发
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            分析统计
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            实时监控
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            性能优化
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            系统配置
          </TabsTrigger>
        </TabsList>

        {/* 任务分发标签页 */}
        <TabsContent value="dispatch" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：分发面板 */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>智能任务分发</CardTitle>
                  <CardDescription>输入任务描述，系统将智能选择最优执行路径</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="query">任务描述</Label>
                    <Textarea
                      id="query"
                      placeholder="例如：开发一个用户登录系统，包含JWT认证和Redis会话管理"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">任务优先级</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">低优先级</SelectItem>
                        <SelectItem value="medium">中等优先级</SelectItem>
                        <SelectItem value="high">高优先级</SelectItem>
                        <SelectItem value="critical">紧急优先级</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleDispatch} disabled={loading || !query.trim()}>
                      {loading ? '智能分发中...' : '开始智能分发'}
                      <Brain className="ml-2 h-4 w-4" />
                    </Button>
                    
                    <Button variant="outline" onClick={handleCompare} disabled={loading || !query.trim()}>
                      性能比较
                      <BarChart3 className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 示例查询 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">示例任务</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {exampleQueries.map((example, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => useExampleQuery(example)}
                        className="text-xs"
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 响应显示 */}
              {response && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>分发结果</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={getTaskTypeColor(response.data.data.taskType)}>
                          {response.data.data.taskType}
                        </Badge>
                        {response.data.data.cached && (
                          <Badge variant="secondary">缓存命中</Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      请求ID: {response.requestId} | 
                      响应时间: {response.data.data.responseTime}ms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-sm text-gray-500">选择的系统</Label>
                          <div className="font-medium">{response.data.data.source}</div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm text-gray-500">任务类型</Label>
                          <div className="font-medium">{response.data.data.taskType}</div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="text-sm overflow-auto max-h-[200px]">
                          {JSON.stringify(response.data.data.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 性能比较结果 */}
              {compareResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>性能比较结果</CardTitle>
                    <CardDescription>智能分发 vs 基础分发</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center">
                            <Brain className="h-4 w-4 mr-2 text-blue-600" />
                            智能分发
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">响应时间</span>
                              <span className="font-medium">{compareResult.intelligent.responseTime}ms</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">选择的系统</span>
                              <Badge className={getSystemColor(compareResult.intelligent.system)}>
                                {compareResult.intelligent.system}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">缓存状态</span>
                              <span>{compareResult.intelligent.cached ? '✅ 命中' : '❌ 未命中'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center">
                            <Network className="h-4 w-4 mr-2 text-gray-600" />
                            基础分发
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">响应时间</span>
                              <span className="font-medium">{compareResult.basic.responseTime}ms</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">选择的系统</span>
                              <Badge className={getSystemColor(compareResult.basic.system)}>
                                {compareResult.basic.system}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">缓存状态</span>
                              <span>{compareResult.basic.cached ? '✅ 命中' : '❌ 未命中'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                        <span className="font-medium">性能提升: {compareResult.improvement.timeImprovement}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        智能分发系统选择: {compareResult.improvement.systemMatch}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 右侧：统计面板 */}
            <div className="space-y-6">
              {/* 总体统计 */}
              {dispatchStats && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Activity className="h-4 w-4 mr-2" />
                      总体统计
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">总任务</span>
                        <span className="font-medium">{dispatchStats.totalTasks}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">成功率</span>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{(dispatchStats.successRate * 100).toFixed(1)}%</span>
                          <Progress value={dispatchStats.successRate * 100} className="w-20" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">缓存率</span>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{(dispatchStats.cacheRate * 100).toFixed(1)}%</span>
                          <Progress value={dispatchStats.cacheRate * 100} className="w-20" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">平均响应时间</span>
                        <span className="font-medium">{formatTime(dispatchStats.averageExecutionTime)}</span>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <div className="text-sm text-gray-600 mb-2">系统使用分布</div>
                        {Object.entries(dispatchStats.systemStats).map(([system, stats]) => (
                          <div key={system} className="flex items-center justify-between mb-1">
                            <span className="text-xs">{system}</span>
                            <span className="text-xs font-medium">
                              {stats.total} ({((stats.total / dispatchStats.totalTasks) * 100).toFixed(0)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 最近任务 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    最近任务
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {taskHistory.length > 0 ? (
                    <div className="space-y-2">
                      {taskHistory.slice(0, 5).map((task, index) => (
                        <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                          <div className="flex justify-between items-start">
                            <div className="truncate flex-1 mr-2">{task.query}</div>
                            <Badge className={`text-xs ${getSystemColor(task.systemUsed)}`}>
                              {task.systemUsed}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{formatTime(task.executionTime)}</span>
                            <span>{task.cached ? '💾 缓存' : '🔄 实时'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      暂无任务记录
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 快速操作 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">快速操作</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={handleClearHistory}>
                      清空历史记录
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab('config')}>
                      系统配置
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 实时监控标签页 */}
        <TabsContent value="monitoring" className="space-y-6">
          <MonitoringPanel />
        </TabsContent>

        {/* 分析统计标签页 */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>系统性能分析</CardTitle>
              <CardDescription>基于历史数据的智能路由决策分析</CardDescription>
            </CardHeader>
            <CardContent>
              {systemPerformance.length > 0 ? (
                <div className="space-y-6">
                  {/* 系统性能表格 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">系统</th>
                          <th className="text-left py-2">任务类型</th>
                          <th className="text-left py-2">请求数</th>
                          <th className="text-left py-2">成功率</th>
                          <th className="text-left py-2">平均响应时间</th>
                          <th className="text-left py-2">预估成本</th>
                          <th className="text-left py-2">最后使用</th>
                        </tr>
                      </thead>
                      <tbody>
                        {systemPerformance.map((perf, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-2">
                              <Badge className={getSystemColor(perf.system)}>
                                {perf.system}
                              </Badge>
                            </td>
                            <td className="py-2">
                              <Badge className={getTaskTypeColor(perf.taskType)}>
                                {perf.taskType}
                              </Badge>
                            </td>
                            <td className="py-2">{perf.totalRequests}</td>
                            <td className="py-2">
                              <div className="flex items-center">
                                <span className="mr-2">{(perf.successRate * 100).toFixed(1)}%</span>
                                <Progress value={perf.successRate * 100} className="w-16" />
                              </div>
                            </td>
                            <td className="py-2">{formatTime(perf.averageResponseTime)}</td>
                            <td className="py-2">
                              <div className="flex items-center">
                                <DollarSign className="h-3 w-3 mr-1" />
                                {perf.costPerRequest?.toFixed(2) || 'N/A'}
                              </div>
                            </td>
                            <td className="py-2 text-xs text-gray-500">
                              {new Date(perf.lastUsed).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 任务类型分布 */}
                  {dispatchStats && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">任务类型分布</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(dispatchStats.taskTypeStats).map(([type, stats]) => (
                          <Card key={type}>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getTaskTypeColor(type)} mb-2`}>
                                  <span className="font-bold">{type.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <div className="text-sm text-gray-500">{type}</div>
                                <div className="text-xs text-gray-400">
                                  成功率: {((stats.successful / stats.total) * 100).toFixed(1)}%
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  暂无性能数据
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 性能监控标签页 */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>实时性能监控</CardTitle>
              <CardDescription>系统性能趋势和优化建议</CardDescription>
            </CardHeader>
            <CardContent>
              {dispatchStats ? (
                <div className="space-y-6">
                  {/* 关键指标 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{dispatchStats.totalTasks}</div>
                          <div className="text-sm text-gray-500">总任务数</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {(dispatchStats.successRate * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500">成功率</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {(dispatchStats.cacheRate * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500">缓存率</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{formatTime(dispatchStats.averageExecutionTime)}</div>
                          <div className="text-sm text-gray-500">平均响应时间</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 优化建议 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">优化建议</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dispatchStats.cacheRate < 0.3 && (
                          <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
                            <div className="mr-3 mt-0.5">⚠️</div>
                            <div>
                              <div className="font-medium">缓存率较低</div>
                              <div className="text-sm text-gray-600">
                                当前缓存率仅{(dispatchStats.cacheRate * 100).toFixed(1)}%，建议增加缓存TTL或优化缓存策略
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {dispatchStats.successRate < 0.9 && (
                          <div className="flex items-start p-3 bg-red-50 rounded-lg">
                            <div className="mr-3 mt-0.5">❌</div>
                            <div>
                              <div className="font-medium">成功率需要提升</div>
                              <div className="text-sm text-gray-600">
                                当前成功率{(dispatchStats.successRate * 100).toFixed(1)}%，建议检查系统连接和错误处理
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {dispatchStats.averageExecutionTime > 3000 && (
                          <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                            <div className="mr-3 mt-0.5">⏱️</div>
                            <div>
                              <div className="font-medium">响应时间较长</div>
                              <div className="text-sm text-gray-600">
                                平均响应时间{formatTime(dispatchStats.averageExecutionTime)}，建议优化慢查询或增加并行处理
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {dispatchStats.successRate > 0.95 && dispatchStats.cacheRate > 0.5 && (
                          <div className="flex items-start p-3 bg-green-50 rounded-lg">
                            <div className="mr-3 mt-0.5">✅</div>
                            <div>
                              <div className="font-medium">系统运行良好</div>
                              <div className="text-sm text-gray-600">
                                当前系统性能优秀，继续保持当前配置
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  加载性能数据中...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统配置标签页 */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>智能分发配置</CardTitle>
              <CardDescription>调整系统权重和策略参数</CardDescription>
            </CardHeader>
            <CardContent>
              {config ? (
                <div className="space-y-6">
                  {/* 权重配置 */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">决策权重配置</h3>
                    <div className="space-y-4">
                      {[
                        { key: 'performanceWeight', label: '性能权重', description: '响应时间的重要性' },
                        { key: 'costWeight', label: '成本权重', description: '执行成本的重要性' },
                        { key: 'reliabilityWeight', label: '可靠性权重', description: '成功率的重要性' },
                        { key: 'cacheWeight', label: '缓存权重', description: '缓存命中率的重要性' }
                      ].map((item) => (
                        <div key={item.key} className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor={item.key}>{item.label}</Label>
                            <span className="text-sm font-medium">{(config[item.key as keyof DispatchConfig] as number * 100).toFixed(0)}%</span>
                          </div>
                          <input
                            type="range"
                            id={item.key}
                            min="0"
                            max="1"
                            step="0.1"
                            value={config[item.key as keyof DispatchConfig] as number}
                            onChange={(e) => handleUpdateConfig({ [item.key]: parseFloat(e.target.value) })}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 策略配置 */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">执行策略配置</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="defaultStrategy">默认策略</Label>
                        <Select 
                          value={config.defaultStrategy} 
                          onValueChange={(value) => handleUpdateConfig({ defaultStrategy: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="optimistic">乐观执行</SelectItem>
                            <SelectItem value="sequential">顺序执行</SelectItem>
                            <SelectItem value="parallel">并行执行</SelectItem>
                            <SelectItem value="fallback">回退执行</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="maxParallelTasks">最大并行任务数</Label>
                        <input
                          type="number"
                          id="maxParallelTasks"
                          min="1"
                          max="10"
                          value={config.maxParallelTasks}
                          onChange={(e) => handleUpdateConfig({ maxParallelTasks: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="enablePredictiveRouting"
                          checked={config.enablePredictiveRouting}
                          onChange={(e) => handleUpdateConfig({ enablePredictiveRouting: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="enablePredictiveRouting">启用预测性路由</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="enableLoadBalancing"
                          checked={config.enableLoadBalancing}
                          onChange={(e) => handleUpdateConfig({ enableLoadBalancing: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="enableLoadBalancing">启用负载均衡</Label>
                      </div>
                    </div>
                  </div>

                  {/* 配置摘要 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">当前配置摘要</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">总权重:</span>
                          <span className="font-medium">
                            {(config.performanceWeight + config.costWeight + config.reliabilityWeight + config.cacheWeight) * 100}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">默认策略:</span>
                          <span className="font-medium">{config.defaultStrategy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">预测路由:</span>
                          <span className="font-medium">{config.enablePredictiveRouting ? '启用' : '禁用'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">负载均衡:</span>
                          <span className="font-medium">{config.enableLoadBalancing ? '启用' : '禁用'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime"><div className="text-center py-12 text-gray-400">实时监控开发中...</div></TabsContent>
        <TabsContent value="performance"><div className="text-center py-12 text-gray-400">性能分析开发中...</div></TabsContent>
      </Tabs>
    </div>
  );
}
