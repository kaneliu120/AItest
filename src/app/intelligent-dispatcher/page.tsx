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

  // Example queries
  const exampleQueries = [
    'Develop a user login system',
    'Find an AI model deployment guide',
    'Run a database backup script',
    'Generate RESTful API documentation',
    'Optimize frontend performance',
    'Configure a CI/CD pipeline'
  ];

  // Load data
  const loadData = async () => {
    try {
      // Load dispatch stats
      const statsRes = await fetch('/api/v2/dispatcher?action=stats');
      const statsData = await statsRes.json();
      if (statsData.success) setDispatchStats(statsData.data);

      // Load system performance
      const perfRes = await fetch('/api/v2/dispatcher?action=performance');
      const perfData = await perfRes.json();
      if (perfData.success) setSystemPerformance(perfData.data);

      // Load task history
      const historyRes = await fetch('/api/v2/dispatcher?action=history&limit=20');
      const historyData = await historyRes.json();
      if (historyData.success) setTaskHistory(historyData.data);

      // Load config
      const configRes = await fetch('/api/v2/dispatcher?action=config');
      const configData = await configRes.json();
      if (configData.success) setConfig(configData.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle dispatch
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
      
      // Reload data
      setTimeout(loadData, 500);
    } catch (error) {
      console.error('Dispatch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Compare performance
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
      console.error('Comparison failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update config
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
        alert('Config updated successfully');
      }
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  };

  // Clear history
  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear history?')) return;

    try {
      const response = await fetch('/api/v2/dispatcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-history' })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('History cleared');
        loadData();
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  // Use example query
  const useExampleQuery = (example: string) => {
    setQuery(example);
  };

  // Get system color
  const getSystemColor = (system: string) => {
    switch (system) {
      case 'mission-control': return 'text-blue-600 bg-blue-100';
      case 'okms': return 'text-green-600 bg-green-100';
      case 'openclaw': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get task type color
  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'code': return 'text-blue-600 bg-blue-100';
      case 'knowledge': return 'text-green-600 bg-green-100';
      case 'skill': return 'text-purple-600 bg-purple-100';
      case 'mixed': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Format time
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Title and status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Brain className="h-8 w-8 mr-3 text-blue-600" />
            Intelligent Task Dispatch System
          </h1>
          <p className="text-gray-600">AI-powered task routing and optimization based on performance learning</p>
        </div>
        <div className="flex items-center space-x-4">
          {dispatchStats && (
            <Badge variant="default" className="text-sm">
              🎯 Success Rate: {(dispatchStats.successRate * 100).toFixed(1)}%
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="dispatch" className="flex items-center">
            <Play className="h-4 w-4 mr-2" />
            Dispatch
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Live Monitor
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Config
          </TabsTrigger>
        </TabsList>

        {/* Dispatch tab */}
        <TabsContent value="dispatch" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Dispatch panel */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Intelligent Task Dispatch</CardTitle>
                  <CardDescription>Enter your task description and the system will intelligently select the optimal execution path</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="query">Task Description</Label>
                    <Textarea
                      id="query"
                      placeholder="e.g. Develop a user login system with JWT auth and Redis session management"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Task Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="critical">Critical Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleDispatch} disabled={loading || !query.trim()}>
                      {loading ? 'Dispatching...' : 'Start Intelligent Dispatch'}
                      <Brain className="ml-2 h-4 w-4" />
                    </Button>
                    
                    <Button variant="outline" onClick={handleCompare} disabled={loading || !query.trim()}>
                      Compare Performance
                      <BarChart3 className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Example queries */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Example Tasks</CardTitle>
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

              {/* Response display */}
              {response && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Dispatch Result</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={getTaskTypeColor(response.data.data.taskType)}>
                          {response.data.data.taskType}
                        </Badge>
                        {response.data.data.cached && (
                          <Badge variant="secondary">Cache Hit</Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      Request ID: {response.requestId} | Response Time: {response.data.data.responseTime}ms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-sm text-gray-500">Selected System</Label>
                          <div className="font-medium">{response.data.data.source}</div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm text-gray-500">Task Type</Label>
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

              {/* Performance comparison result */}
              {compareResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Comparison Result</CardTitle>
                    <CardDescription>Intelligent Dispatch vs Basic Dispatch</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center">
                            <Brain className="h-4 w-4 mr-2 text-blue-600" />
                            Intelligent Dispatch
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Response Time</span>
                              <span className="font-medium">{compareResult.intelligent.responseTime}ms</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Selected System</span>
                              <Badge className={getSystemColor(compareResult.intelligent.system)}>
                                {compareResult.intelligent.system}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Cache Status</span>
                              <span>{compareResult.intelligent.cached ? '✅ Hit' : '❌ Miss'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center">
                            <Network className="h-4 w-4 mr-2 text-gray-600" />
                            Basic Dispatch
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Response Time</span>
                              <span className="font-medium">{compareResult.basic.responseTime}ms</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Selected System</span>
                              <Badge className={getSystemColor(compareResult.basic.system)}>
                                {compareResult.basic.system}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Cache Status</span>
                              <span>{compareResult.basic.cached ? '✅ Hit' : '❌ Miss'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                        <span className="font-medium">Performance Gain: {compareResult.improvement.timeImprovement}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Intelligent dispatch chose: {compareResult.improvement.systemMatch}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Stats panel */}
            <div className="space-y-6">
              {/* Overall stats */}
              {dispatchStats && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Activity className="h-4 w-4 mr-2" />
                      Overall Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Tasks</span>
                        <span className="font-medium">{dispatchStats.totalTasks}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{(dispatchStats.successRate * 100).toFixed(1)}%</span>
                          <Progress value={dispatchStats.successRate * 100} className="w-20" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Cache Rate</span>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{(dispatchStats.cacheRate * 100).toFixed(1)}%</span>
                          <Progress value={dispatchStats.cacheRate * 100} className="w-20" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avg Response Time</span>
                        <span className="font-medium">{formatTime(dispatchStats.averageExecutionTime)}</span>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <div className="text-sm text-gray-600 mb-2">System Usage Distribution</div>
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

              {/* Recent tasks */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Recent Tasks
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
                            <span>{task.cached ? '💾 Cached' : '🔄 Live'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No task history
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={handleClearHistory}>
                      Clear History
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab('config')}>
                      System Config
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Live monitor tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <MonitoringPanel />
        </TabsContent>

        {/* Analytics tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Performance Analysis</CardTitle>
              <CardDescription>Intelligent routing decision analysis based on historical data</CardDescription>
            </CardHeader>
            <CardContent>
              {systemPerformance.length > 0 ? (
                <div className="space-y-6">
                  {/* System performance table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">System</th>
                          <th className="text-left py-2">Task Type</th>
                          <th className="text-left py-2">Requests</th>
                          <th className="text-left py-2">Success Rate</th>
                          <th className="text-left py-2">Avg Response Time</th>
                          <th className="text-left py-2">Est. Cost</th>
                          <th className="text-left py-2">Last Used</th>
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

                  {/* Task type distribution */}
                  {dispatchStats && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Task Type Distribution</h3>
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
                                  Success Rate: {((stats.successful / stats.total) * 100).toFixed(1)}%
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
                  No performance data
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance monitoring tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Performance Monitoring</CardTitle>
              <CardDescription>System performance trends and optimization suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              {dispatchStats ? (
                <div className="space-y-6">
                  {/* Key metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{dispatchStats.totalTasks}</div>
                          <div className="text-sm text-gray-500">Total Tasks</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {(dispatchStats.successRate * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500">Success Rate</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {(dispatchStats.cacheRate * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500">Cache Rate</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{formatTime(dispatchStats.averageExecutionTime)}</div>
                          <div className="text-sm text-gray-500">Avg Response Time</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Optimization suggestions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Optimization Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dispatchStats.cacheRate < 0.3 && (
                          <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
                            <div className="mr-3 mt-0.5">⚠️</div>
                            <div>
                              <div className="font-medium">Low Cache Rate</div>
                              <div className="text-sm text-gray-600">
                                Current cache rate is only {(dispatchStats.cacheRate * 100).toFixed(1)}%, consider increasing cache TTL or optimizing cache strategy
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {dispatchStats.successRate < 0.9 && (
                          <div className="flex items-start p-3 bg-red-50 rounded-lg">
                            <div className="mr-3 mt-0.5">❌</div>
                            <div>
                              <div className="font-medium">Success Rate Needs Improvement</div>
                              <div className="text-sm text-gray-600">
                                Current success rate {(dispatchStats.successRate * 100).toFixed(1)}%, check system connections and error handling
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {dispatchStats.averageExecutionTime > 3000 && (
                          <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                            <div className="mr-3 mt-0.5">⏱️</div>
                            <div>
                              <div className="font-medium">High Response Time</div>
                              <div className="text-sm text-gray-600">
                                Average response time {formatTime(dispatchStats.averageExecutionTime)}, consider optimizing slow queries or adding parallel processing
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {dispatchStats.successRate > 0.95 && dispatchStats.cacheRate > 0.5 && (
                          <div className="flex items-start p-3 bg-green-50 rounded-lg">
                            <div className="mr-3 mt-0.5">✅</div>
                            <div>
                              <div className="font-medium">System Running Well</div>
                              <div className="text-sm text-gray-600">
                                Current system performance is excellent, maintain current configuration
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
                  Loading performance data...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System config tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Intelligent Dispatch Config</CardTitle>
              <CardDescription>Adjust system weights and strategy parameters</CardDescription>
            </CardHeader>
            <CardContent>
              {config ? (
                <div className="space-y-6">
                  {/* Weight config */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Decision Weight Configuration</h3>
                    <div className="space-y-4">
                      {[
                        { key: 'performanceWeight', label: 'Performance Weight', description: 'Importance of response time' },
                        { key: 'costWeight', label: 'Cost Weight', description: 'Importance of execution cost' },
                        { key: 'reliabilityWeight', label: 'Reliability Weight', description: 'Importance of success rate' },
                        { key: 'cacheWeight', label: 'Cache Weight', description: 'Importance of cache hit rate' }
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

                  {/* Strategy config */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Execution Strategy Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="defaultStrategy">Default Strategy</Label>
                        <Select 
                          value={config.defaultStrategy} 
                          onValueChange={(value) => handleUpdateConfig({ defaultStrategy: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="optimistic">Optimistic</SelectItem>
                            <SelectItem value="sequential">Sequential</SelectItem>
                            <SelectItem value="parallel">Parallel</SelectItem>
                            <SelectItem value="fallback">Fallback</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="maxParallelTasks">Max Parallel Tasks</Label>
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
                        <Label htmlFor="enablePredictiveRouting">Enable Predictive Routing</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="enableLoadBalancing"
                          checked={config.enableLoadBalancing}
                          onChange={(e) => handleUpdateConfig({ enableLoadBalancing: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="enableLoadBalancing">Enable Load Balancing</Label>
                      </div>
                    </div>
                  </div>

                  {/* Config summary */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Current Config Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Weight:</span>
                          <span className="font-medium">
                            {(config.performanceWeight + config.costWeight + config.reliabilityWeight + config.cacheWeight) * 100}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Default Strategy:</span>
                          <span className="font-medium">{config.defaultStrategy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Predictive Routing:</span>
                          <span className="font-medium">{config.enablePredictiveRouting ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Load Balancing:</span>
                          <span className="font-medium">{config.enableLoadBalancing ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime"><div className="text-center py-12 text-gray-400">Real-time monitoring coming soon...</div></TabsContent>
        <TabsContent value="performance"><div className="text-center py-12 text-gray-400">Performance analysis coming soon...</div></TabsContent>
      </Tabs>
    </div>
  );
}
