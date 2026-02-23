'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  Database, 
  RefreshCw,
  TrendingUp,
  XCircle,
  Zap
} from 'lucide-react';

interface MonitoringData {
  performance: {
    totalTasks: number;
    successfulTasks: number;
    errorRate: number;
    avgResponseTime: number;
    cacheHitRate: number;
    requestsPerMinute: number;
    systemDistribution: Record<string, number>;
    taskTypeDistribution: Record<string, number>;
  };
  alerts: {
    active: number;
    total: number;
    bySeverity: {
      critical: number;
      error: number;
      warning: number;
      info: number;
    };
  };
  metrics: {
    total: number;
    recent: number;
  };
  timestamp: string;
}

interface Alert {
  id: string;
  ruleId: string;
  timestamp: string;
  metric: string;
  value: number;
  threshold: number;
  severity: string;
  message: string;
  resolved: boolean;
  resolvedAt?: string;
}

export default function MonitoringPanel() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 加载监控数据
  const loadMonitoringData = async () => {
    setLoading(true);
    try {
      // 加载监控仪表板数据
      const monitoringRes = await fetch('/api/v2/dispatcher?action=monitoring');
      const monitoringData = await monitoringRes.json();
      if (monitoringData.success) setMonitoringData(monitoringData.data);

      // 加载活跃警报
      const alertsRes = await fetch('/api/v2/dispatcher?action=alerts&type=active');
      const alertsData = await alertsRes.json();
      if (alertsData.success) setAlerts(alertsData.data);
    } catch (error) {
      console.error('加载监控数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoringData();
    
    // 自动刷新
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadMonitoringData, 10000); // 每10秒刷新
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // 解决警报
  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/v2/dispatcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve-alert',
          alertId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        loadMonitoringData(); // 重新加载数据
      }
    } catch (error) {
      console.error('解决警报失败:', error);
    }
  };

  // 清空监控数据
  const clearMonitoringData = async () => {
    if (!confirm('确定要清空所有监控数据吗？')) return;
    
    try {
      const response = await fetch('/api/v2/dispatcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-monitoring' })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('监控数据已清空');
        loadMonitoringData();
      }
    } catch (error) {
      console.error('清空监控数据失败:', error);
    }
  };

  // 获取严重性颜色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'error': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // 获取严重性图标
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  // 格式化时间
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (!monitoringData) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">加载监控数据中...</p>
      </div>
    );
  }

  const { performance, alerts: alertStats, metrics, timestamp } = monitoringData;

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                <span className="font-medium">实时监控面板</span>
              </div>
              <Badge variant="outline">
                最后更新: {new Date(timestamp).toLocaleTimeString()}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="autoRefresh" className="text-sm">
                  自动刷新 (10秒)
                </label>
              </div>
              
              <Button variant="outline" size="sm" onClick={loadMonitoringData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新数据
              </Button>
              
              <Button variant="outline" size="sm" onClick={clearMonitoringData}>
                清空数据
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{performance.totalTasks}</div>
                <div className="text-sm text-gray-500">总任务数</div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span>成功率</span>
                <span className="font-medium">
                  {((performance.successfulTasks / performance.totalTasks) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={(performance.successfulTasks / performance.totalTasks) * 100} 
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{formatTime(performance.avgResponseTime)}</div>
                <div className="text-sm text-gray-500">平均响应时间</div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span>请求/分钟</span>
                <span className="font-medium">{performance.requestsPerMinute.toFixed(1)}</span>
              </div>
              <Progress 
                value={Math.min(performance.requestsPerMinute / 10 * 100, 100)} 
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{(performance.cacheHitRate * 100).toFixed(1)}%</div>
                <div className="text-sm text-gray-500">缓存命中率</div>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Database className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span>错误率</span>
                <span className="font-medium">{(performance.errorRate * 100).toFixed(1)}%</span>
              </div>
              <Progress 
                value={performance.errorRate * 100} 
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{alertStats.active}</div>
                <div className="text-sm text-gray-500">活跃警报</div>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span>严重性分布</span>
                <span className="font-medium">
                  {alertStats.bySeverity.critical > 0 ? '⚠️' : '✅'}
                </span>
              </div>
              <div className="flex space-x-1 mt-1">
                {alertStats.bySeverity.critical > 0 && (
                  <div className="h-2 flex-1 bg-red-500 rounded"></div>
                )}
                {alertStats.bySeverity.error > 0 && (
                  <div className="h-2 flex-1 bg-orange-500 rounded"></div>
                )}
                {alertStats.bySeverity.warning > 0 && (
                  <div className="h-2 flex-1 bg-yellow-500 rounded"></div>
                )}
                {alertStats.bySeverity.info > 0 && (
                  <div className="h-2 flex-1 bg-blue-500 rounded"></div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 警报面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
            系统警报
            <Badge variant="outline" className="ml-2">
              {alertStats.active} 活跃 / {alertStats.total} 总计
            </Badge>
          </CardTitle>
          <CardDescription>实时系统状态监控和警报</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div>
                        <div className="font-medium">{alert.message}</div>
                        <div className="text-sm mt-1">
                          <span className="text-gray-600">指标: {alert.metric}</span>
                          <span className="mx-2">•</span>
                          <span className="text-gray-600">值: {alert.value.toFixed(2)}</span>
                          <span className="mx-2">•</span>
                          <span className="text-gray-600">阈值: {alert.threshold}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          触发时间: {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        解决
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <p className="mt-4 text-gray-600">暂无活跃警报，系统运行正常</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 系统分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">系统使用分布</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(performance.systemDistribution).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(performance.systemDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([system, count]) => {
                    const percentage = (count / performance.totalTasks) * 100;
                    return (
                      <div key={system} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{system}</span>
                          <span>{count}次 ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                暂无系统使用数据
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">任务类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(performance.taskTypeDistribution).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(performance.taskTypeDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const percentage = (count / performance.totalTasks) * 100;
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{type}</span>
                          <span>{count}次 ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                暂无任务类型数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 指标统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">指标统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{metrics.total}</div>
              <div className="text-sm text-gray-600">总指标数</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{metrics.recent}</div>
              <div className="text-sm text-gray-600">最近指标</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{performance.requests