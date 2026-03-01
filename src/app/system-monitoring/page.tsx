'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Server,
  Zap,
  Database,
  Globe,
  Clock,
  TrendingUp,
  TrendingDown,
  Settings,
  Eye,
  EyeOff,
  Key,
  Cloud,
  Brain,
  Code,
  MessageSquare,
  BarChart3,
} from 'lucide-react';

interface SystemMetrics {
  timestamp: string;
  cpu: {
    usage: number;
    load1m: number;
    load5m: number;
    load15m: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    usage: number;
    path: string;
  };
  network: {
    interfaces: Array<{
      name: string;
      address: string;
      family: string;
      internal: boolean;
    }>;
    latency?: number;
  };
  processes: {
    total: number;
    nodeProcesses: number;
  };
  node: {
    version: string;
    uptime: number;
    heapUsed: number;
    heapTotal: number;
    rss: number;
    pid: number;
  };
}

interface ComponentHealth {
  id: string;
  name: string;
  type: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime?: number;
  lastCheck: string;
}

interface Alert {
  id: string;
  componentId: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
}

interface MonitoringData {
  timestamp: string;
  overallHealth: number;
  summary: {
    totalComponents: number;
    healthyComponents: number;
    degradedComponents: number;
    unhealthyComponents: number;
    activeAlerts: number;
    criticalAlerts: number;
    warningAlerts: number;
  };
  metrics: SystemMetrics;
  components: ComponentHealth[];
  alerts: Alert[];
}

interface ExternalApiStats {
  totalApis: number;
  activeApis: number;
  inactiveApis: number;
  needsSetupApis: number;
  errorApis: number;
  byProvider: Record<string, number>;
  byCategory: Record<string, number>;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
}

export default function SimpleSystemMonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [externalApiStats, setExternalApiStats] = useState<ExternalApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Loading system monitoring data
      const response = await fetch('/api/system-monitoring');
      if (!response.ok) throw new Error(`APIError: ${response.status}`);
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      setData(result.data);
      
      // Loading externalAPIStats
      try {
        const apiStatsResponse = await fetch('/api/external-apis?action=stats');
        if (apiStatsResponse.ok) {
          const apiStatsResult = await apiStatsResponse.json();
          if (apiStatsResult.success) {
            setExternalApiStats(apiStatsResult.data);
          }
        }
      } catch (apiError) {
        console.warn('Unable to load external API stats:', apiError);
      }
      
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (autoRefresh) {
      const interval = setInterval(loadData, 30000); // 30s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const getHealthColor = (health: number) => {
    if (health > 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (health > 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'unhealthy': return <AlertOctagon className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading && !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading system monitoring data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <div>
                <h3 className="font-semibold text-rose-900">Load failed</h3>
                <p className="text-sm text-rose-700 mt-1">{error}</p>
              </div>
            </div>
            <Button variant="outline" className="mt-4" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const monitoringData = data!;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Server className="h-8 w-8" />
              System Monitoring Center
            </h1>
            <p className="text-muted-foreground">Real-time system performance monitoring、Component health and alert status</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {showDetails ? 'Simple View' : 'Detailed View'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Health Status Banner */}
        <Card className={`border-2 ${getHealthColor(monitoringData.overallHealth)}`}>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${getHealthColor(monitoringData.overallHealth)}`}>
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      {monitoringData.overallHealth > 80 ? 'System running normally' :
                       monitoringData.overallHealth > 60 ? 'System needs attention' :
                       'System needs urgent maintenance'}
                    </h3>
                    <Badge variant="outline" className={getHealthColor(monitoringData.overallHealth)}>
                      {monitoringData.overallHealth}% Health Score
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    Last Updated: {new Date(monitoringData.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{monitoringData.summary.healthyComponents}</div>
                  <div className="text-xs text-slate-500">Healthy Components</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{monitoringData.summary.degradedComponents}</div>
                  <div className="text-xs text-slate-500">Degraded Components</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-rose-600">{monitoringData.summary.unhealthyComponents}</div>
                  <div className="text-xs text-slate-500">Failed Components</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{monitoringData.summary.activeAlerts}</div>
                  <div className="text-xs text-slate-500">Active Alerts</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CPU */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                CPU
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Usage</span>
                  <span className="font-bold">{monitoringData.metrics.cpu.usage}%</span>
                </div>
                <Progress value={monitoringData.metrics.cpu.usage} className="h-2" />
                <div className="text-xs text-slate-500">
                  Load: {monitoringData.metrics.cpu.load1m.toFixed(2)} | Cores: {monitoringData.metrics.cpu.cores}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Memory */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MemoryStick className="h-4 w-4" />
                Memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Usage</span>
                  <span className="font-bold">{monitoringData.metrics.memory.usage}%</span>
                </div>
                <Progress value={monitoringData.metrics.memory.usage} className="h-2" />
                <div className="text-xs text-slate-500">
                  Used: {formatBytes(monitoringData.metrics.memory.used)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disk */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Disk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Usage</span>
                  <span className="font-bold">{monitoringData.metrics.disk.usage}%</span>
                </div>
                <Progress value={monitoringData.metrics.disk.usage} className="h-2" />
                <div className="text-xs text-slate-500">
                  Path: {monitoringData.metrics.disk.path}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Network className="h-4 w-4" />
                Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Interface</span>
                  <span className="font-bold">{monitoringData.metrics.network.interfaces.length}</span>
                </div>
                {monitoringData.metrics.network.latency && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Latency</span>
                    <span className="font-medium">{monitoringData.metrics.network.latency}ms</span>
                  </div>
                )}
                <div className="text-xs text-slate-500">
                  External Interface: {monitoringData.metrics.network.interfaces.filter(i => !i.internal).length}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Component Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">System Component Status</CardTitle>
            <CardDescription>
              Monitor the health of all system components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {monitoringData.components.map((component) => (
                <div key={component.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${getHealthColor(
                        component.status === 'healthy' ? 90 :
                        component.status === 'degraded' ? 70 : 30
                      )}`}>
                        {getStatusIcon(component.status)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{component.name}</div>
                        <div className="text-xs text-slate-500">{component.type}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {component.responseTime ? `${component.responseTime}ms` : '--'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ExternalAPIMonitoring Summary */}
        {externalApiStats && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                ExternalAPIMonitoring Summary
              </CardTitle>
              <CardDescription>
                Monitor all external API service status and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* APIStats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-xl font-bold">{externalApiStats.totalApis}</div>
                    <div className="text-xs text-slate-500">Total APIs</div>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="text-xl font-bold text-emerald-600">{externalApiStats.activeApis}</div>
                    <div className="text-xs text-emerald-600">ActiveAPI</div>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="text-xl font-bold text-amber-600">{externalApiStats.needsSetupApis}</div>
                    <div className="text-xs text-amber-600">Pending Config</div>
                  </div>
                  <div className="text-center p-3 bg-rose-50 rounded-lg border border-rose-100">
                    <div className="text-xl font-bold text-rose-600">{externalApiStats.errorApis}</div>
                    <div className="text-xs text-rose-600">ErrorAPI</div>
                  </div>
                </div>

                {/* Provider Distribution */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Provider Distribution</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(externalApiStats.byProvider).map(([provider, count]) => (
                      <Badge key={provider} variant="outline" className="flex items-center gap-1">
                        {provider === 'google' && <Globe className="h-3 w-3" />}
                        {provider === 'openai' && <Brain className="h-3 w-3" />}
                        {provider === 'anthropic' && <Brain className="h-3 w-3" />}
                        {provider === 'github' && <Code className="h-3 w-3" />}
                        {provider === 'azure' && <Cloud className="h-3 w-3" />}
                        {provider === 'linkedin' && <MessageSquare className="h-3 w-3" />}
                        {provider === 'brave' && <BarChart3 className="h-3 w-3" />}
                        <span className="capitalize">{provider}</span>
                        <span className="text-slate-500">({count})</span>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Call Stats</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Total</span>
                        <span className="font-medium">{externalApiStats.totalCalls}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-600">Success</span>
                        <span className="font-medium text-emerald-600">{externalApiStats.successfulCalls}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-rose-600">Failed</span>
                        <span className="font-medium text-rose-600">{externalApiStats.failedCalls}</span>
                      </div>
                      {externalApiStats.totalCalls > 0 && (
                        <Progress 
                          value={(externalApiStats.successfulCalls / externalApiStats.totalCalls) * 100} 
                          className="h-1.5" 
                        />
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Response Time</h4>
                    <div className="text-2xl font-bold">
                      {Math.round(externalApiStats.averageResponseTime)}ms
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Avg Response Time</div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Quick Actions</h4>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => window.location.href = '/external-apis'}
                      >
                        <Eye className="h-3 w-3 mr-2" />
                        View Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => window.location.href = '/external-apis'}
                      >
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Check allAPI
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts */}
        {monitoringData.alerts.length > 0 && (
          <Card className="border-rose-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-rose-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                System Alerts ({monitoringData.alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {monitoringData.alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg ${
                      alert.severity === 'critical'
                        ? 'bg-rose-50 border border-rose-200'
                        : 'bg-amber-50 border border-amber-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {alert.severity === 'critical' ? (
                        <AlertOctagon className="h-4 w-4 text-rose-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{alert.message}</div>
                        <div className="text-xs text-slate-600 mt-1">
                          Component: {alert.componentId} | Time: {new Date(alert.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {monitoringData.alerts.length > 5 && (
                  <div className="text-center text-sm text-slate-500 pt-2">
                    and {monitoringData.alerts.length - 5} more alerts
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Info */}
        {showDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Detailed System Info</CardTitle>
              <CardDescription>Detailed system metrics and configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Node.js Info */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Node.js Runtime</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-slate-500">Version</div>
                      <div className="font-medium">{monitoringData.metrics.node.version}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Uptime</div>
                      <div className="font-medium">{formatTime(monitoringData.metrics.node.uptime)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Heap Memory</div>
                      <div className="font-medium">{formatBytes(monitoringData.metrics.node.heapUsed)} / {formatBytes(monitoringData.metrics.node.heapTotal)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">ProcessesID</div>
                      <div className="font-medium">{monitoringData.metrics.node.pid}</div>
                    </div>
                  </div>
                </div>

                {/* Process Info */}
                <div>
                  <h4 className="font-medium text-sm mb-2">ProcessesStats</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-slate-500">Total Processes</div>
                      <div className="font-medium">{monitoringData.metrics.processes.total}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">NodeProcesses</div>
                      <div className="font-medium">{monitoringData.metrics.processes.nodeProcesses}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">CPUModel</div>
                      <div className="font-medium">{monitoringData.metrics.cpu.model}</div>
                    </div>
                  </div>
                </div>

                {/* Network Interface */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Network Interface</h4>
                  <div className="space-y-2">
                    {monitoringData.metrics.network.interfaces.map((iface, index) => (
                      <div key={index} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded">
                        <div>
                          <div className="font-medium">{iface.name}</div>
                          <div className="text-slate-500 text-xs">{iface.address} ({iface.family})</div>
                        </div>
                        <Badge variant={iface.internal ? "outline" : "default"}>
                          {iface.internal ? "Internal" : "External"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 pt-4">
          <p>System monitoring data refreshes every30 seconds • Last Updated: {new Date(monitoringData.timestamp).toLocaleString()}</p>
          <p className="mt-1">Health Score Calculation: Base 100 - CPU/Memory deduction - Component status deduction</p>
        </div>
      </div>
    </div>
  );
}