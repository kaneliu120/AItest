'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play, Pause, RefreshCw, Eye, Filter, Search, 
  Clock, CheckCircle, XCircle, AlertTriangle,
  Download, Trash2, BarChart3, Calendar, Zap
} from 'lucide-react';

interface TaskExecution {
  id: string;
  taskId: string;
  taskName: string;
  moduleId: string;
  moduleName: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  result?: any;
  error?: string;
  retryCount: number;
  parameters?: Record<string, any>;
  metadata: {
    triggeredBy: 'schedule' | 'manual' | 'event';
    priority: number;
    tags: string[];
  };
}

interface ExecutionStats {
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  todayExecutions: number;
  activeExecutions: number;
  failedExecutions: number;
}

export default function ExecutionsMonitor() {
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'running' | 'success' | 'failed'>('all');
  const [search, setSearch] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);

  // 获取执行记录
  const fetchExecutions = async () => {
    try {
      const response = await fetch('/api/automation?action=executions');
      const data = await response.json();
      if (data.success) {
        setExecutions(data.data.executions || []);
        setStats(data.data.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    } finally {
      setLoading(false);
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
        // 显示成功消息
        console.log('Task triggered:', data);
        // 刷新执行记录
        setTimeout(fetchExecutions, 2000);
      }
    } catch (error) {
      console.error('Failed to trigger task:', error);
    }
  };

  // 取消执行
  const cancelExecution = async (executionId: string) => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel-execution',
          executionId
        })
      });
      const data = await response.json();
      if (data.success) {
        fetchExecutions();
      }
    } catch (error) {
      console.error('Failed to cancel execution:', error);
    }
  };

  // 获取执行状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取执行状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'running': return <Play className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // 格式化持续时间
  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };

  // 过滤执行记录
  const filteredExecutions = executions.filter(exec => {
    // 状态过滤
    if (filter !== 'all' && exec.status !== filter) return false;
    
    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        exec.taskName.toLowerCase().includes(searchLower) ||
        exec.moduleName.toLowerCase().includes(searchLower) ||
        exec.id.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // 初始加载
  useEffect(() => {
    fetchExecutions();
    const interval = setInterval(fetchExecutions, 10000); // 每10秒更新一次
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">加载执行记录...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">执行监控</h2>
          <p className="text-muted-foreground">
            监控任务执行状态，查看执行结果和错误信息
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchExecutions}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.totalExecutions}</div>
                <p className="text-sm text-muted-foreground">总执行次数</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.successRate}%</div>
                <p className="text-sm text-muted-foreground">成功率</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{formatDuration(stats.averageDuration)}</div>
                <p className="text-sm text-muted-foreground">平均耗时</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.activeExecutions}</div>
                <p className="text-sm text-muted-foreground">活跃执行</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.failedExecutions}</div>
                <p className="text-sm text-muted-foreground">失败次数</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 过滤和搜索 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">搜索</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="搜索任务名称、模块名称或执行ID..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="filter">状态过滤</Label>
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="running">运行中</SelectItem>
                  <SelectItem value="success">成功</SelectItem>
                  <SelectItem value="failed">失败</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 执行记录列表 */}
      <div className="space-y-4">
        {filteredExecutions.map((exec) => (
          <Card key={exec.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getStatusIcon(exec.status)}
                    {exec.taskName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{exec.moduleName}</Badge>
                    <Badge className={getStatusColor(exec.status)}>
                      {exec.status === 'success' ? '成功' :
                       exec.status === 'running' ? '运行中' :
                       exec.status === 'failed' ? '失败' :
                       exec.status === 'pending' ? '等待中' : '已取消'}
                    </Badge>
                    <span className="text-xs">ID: {exec.id.substring(0, 8)}...</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {exec.status === 'running' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => cancelExecution(exec.id)}
                      title="取消执行"
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedExecution(selectedExecution === exec.id ? null : exec.id)}
                    title="查看详情"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">开始时间</p>
                  <p className="font-medium">
                    {new Date(exec.startTime).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">持续时间</p>
                  <p className="font-medium">{formatDuration(exec.duration)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">重试次数</p>
                  <p className="font-medium">{exec.retryCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">触发方式</p>
                  <p className="font-medium">
                    {exec.metadata.triggeredBy === 'schedule' ? '定时' :
                     exec.metadata.triggeredBy === 'manual' ? '手动' : '事件'}
                  </p>
                </div>
              </div>

              {/* 详情展开 */}
              {selectedExecution === exec.id && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  {/* 参数信息 */}
                  {exec.parameters && Object.keys(exec.parameters).length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">执行参数:</p>
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        {JSON.stringify(exec.parameters, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* 结果信息 */}
                  {exec.result && (
                    <div>
                      <p className="text-sm font-medium mb-2">执行结果:</p>
                      <pre className="text-xs bg-green-50 p-3 rounded overflow-x-auto">
                        {JSON.stringify(exec.result, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* 错误信息 */}
                  {exec.error && (
                    <div>
                      <p className="text-sm font-medium mb-2 text-red-600">错误信息:</p>
                      <pre className="text-xs bg-red-50 p-3 rounded overflow-x-auto">
                        {exec.error}
                      </pre>
                    </div>
                  )}

                  {/* 标签 */}
                  {exec.metadata.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">标签:</p>
                      <div className="flex flex-wrap gap-1">
                        {exec.metadata.tags.map(tag => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <div className="px-6 py-3 bg-muted/50 border-t flex justify-between">
              <div className="text-xs text-muted-foreground">
                优先级: {exec.metadata.priority}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => triggerTask(exec.taskId)}
              >
                <Zap className="mr-1 h-3 w-3" />
                重新执行
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* 空状态 */}
      {filteredExecutions.length === 0 && (
        <Card className="text-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">暂无执行记录</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {search || filter !== 'all' 
              ? '没有匹配的执行记录'
              : '还没有任务执行记录'}
          </p>
          {search && (
            <Button variant="outline" onClick={() => setSearch('')}>
              清除搜索
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}