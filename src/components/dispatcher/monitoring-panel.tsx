"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  RefreshCw,
  Trash2
} from 'lucide-react';

interface MonitoringData {
  performance: {
    totalTasks: number;
    successfulTasks: number;
    failedTasks: number;
    completionRate: number;
    avgResponseTime: number;
    systemDistribution: Record<string, number>;
    taskTypeDistribution: Record<string, number>;
  };
  alerts: {
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
  timestamp: number;
}

interface Alert {
  id: string;
  message: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export default function MonitoringPanel() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch real dispatch stats from API
  const fetchMonitoringData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v2/dispatcher?action=monitoring', { cache: 'no-store' });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = await res.json();
      const d = json.data ?? json;
      setMonitoringData({
        performance: d.performance ?? {
          totalTasks: 0, successfulTasks: 0, failedTasks: 0,
          completionRate: 0, avgResponseTime: 0,
          systemDistribution: {}, taskTypeDistribution: {}
        },
        alerts: d.alerts ?? { total: 0, bySeverity: { critical: 0, error: 0, warning: 0, info: 0 } },
        metrics: d.metrics ?? { total: 0, recent: 0 },
        timestamp: Date.now(),
      });
      if (Array.isArray(d.alertList)) setAlerts(d.alertList);
    } catch (err) {
      console.error('Failed to fetch monitoring data:', err);
      // Show empty data on failure instead of fake data
      setMonitoringData({
        performance: {
          totalTasks: 0, successfulTasks: 0, failedTasks: 0,
          completionRate: 0, avgResponseTime: 0,
          systemDistribution: {}, taskTypeDistribution: {}
        },
        alerts: { total: 0, bySeverity: { critical: 0, error: 0, warning: 0, info: 0 } },
        metrics: { total: 0, recent: 0 },
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    // Auto-refresh (every 60 seconds)
    const interval = setInterval(() => {
      if (autoRefresh) fetchMonitoringData();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchMonitoringData();
  };

  const handleClearAlerts = () => {
    setAlerts([]);
  };

  if (!monitoringData) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Activity className="h-12 w-12 mx-auto text-gray-400 animate-pulse" />
          <p className="mt-4 text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  const { performance, alerts: alertStats, metrics } = monitoringData;

  return (
    <div className="space-y-6">
      {/* Control panel */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                <span className="font-medium">Real-time Monitor</span>
              </div>
              <Badge variant="outline">
                Last updated: {new Date(monitoringData.timestamp).toLocaleTimeString()}
              </Badge>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="autoRefresh" className="text-sm">
                  Auto refresh
                </label>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleClearAlerts}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Alerts
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{performance.totalTasks}</div>
                <div className="text-sm text-gray-600">Total Tasks</div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span>Success Rate</span>
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
                <div className="text-2xl font-bold">{performance.avgResponseTime}ms</div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span>Performance</span>
                <span className="font-medium">
                  {performance.avgResponseTime < 100 ? 'Excellent' : 
                   performance.avgResponseTime < 200 ? 'Good' : 'Needs Optimization'}
                </span>
              </div>
              <Progress 
                value={Math.max(0, 100 - performance.avgResponseTime / 5)} 
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{alertStats.total}</div>
                <div className="text-sm text-gray-600">Active Alerts</div>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {alertStats.bySeverity.critical > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">Critical</span>
                  <span className="font-medium">{alertStats.bySeverity.critical}</span>
                </div>
              )}
              {alertStats.bySeverity.error > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-orange-600">Error</span>
                  <span className="font-medium">{alertStats.bySeverity.error}</span>
                </div>
              )}
              {alertStats.bySeverity.warning > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-yellow-600">Warning</span>
                  <span className="font-medium">{alertStats.bySeverity.warning}</span>
                </div>
              )}
              {alertStats.bySeverity.info > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600">Info</span>
                  <span className="font-medium">{alertStats.bySeverity.info}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics.total}
            </div>
            <div className="text-sm text-gray-500">
              Systems: 4
            </div>
            <div className="mt-2 text-xs">
              Last updated: Just now
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Live Alerts</CardTitle>
          <CardDescription>System-detected anomalies and warnings</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {alert.severity === 'critical' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                        {alert.severity === 'error' && <AlertTriangle className="h-5 w-5 text-orange-600" />}
                        {alert.severity === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                        {alert.severity === 'info' && <CheckCircle className="h-5 w-5 text-blue-600" />}
                      </div>
                      <div>
                        <div className="font-medium">{alert.message}</div>
                        <div className="text-sm mt-1">
                          <span className="text-gray-600">Metric: {alert.metric}</span>
                          <span className="mx-2">•</span>
                          <span className="text-gray-600">Value: {alert.value.toFixed(2)}</span>
                          <span className="mx-2">•</span>
                          <span className="text-gray-600">Threshold: {alert.threshold}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Triggered: {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'outline'}>
                      {alert.severity === 'critical' ? 'Critical' : 
                       alert.severity === 'error' ? 'Error' : 
                       alert.severity === 'warning' ? 'Warning' : 'Info'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-400" />
              <p className="mt-4 text-gray-600">No active alerts, system running normally</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">System Usage Distribution</CardTitle>
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
                          <span>{system}</span>
                          <span>{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No system distribution data
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Task Type Distribution</CardTitle>
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
                          <span>{type}</span>
                          <span>{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No task type data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metric stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Metric Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{metrics.total}</div>
              <div className="text-sm text-gray-600">Total Metrics</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{metrics.recent}</div>
              <div className="text-sm text-gray-600">Recent Metrics</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">--</div>
              <div className="text-sm text-gray-600">Recent Metrics</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">--</div>
              <div className="text-sm text-gray-600">Recent Metrics</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}