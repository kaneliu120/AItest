'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle,
  CheckCircle,
  Activity,
  Bell,
  Settings,
  BarChart3,
  Server,
  Zap,
  Brain,
  Cpu,
  Database,
  Globe,
  Eye,
  EyeOff,
  RefreshCw,
  Play,
  StopCircle,
  Filter,
  Search,
  Download,
  Upload,
  HardDrive,
  Network,
  Terminal,
  Clock,
  AlertCircle,
  Shield,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Thermometer,
  Gauge,
  MemoryStick,
  Disc,
  Router,
  Cloud,
  Database as DatabaseIcon,
  Code,
  FileText,
  Package,
  Layers,
  Cpu as CpuIcon,
  HardDrive as HardDriveIcon,
  Network as NetworkIcon,
  Users,
  BarChart,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  Info,
  HelpCircle,
  ExternalLink,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  X,
  Check,
  AlertOctagon as AlertOctagonIcon,
} from 'lucide-react';

// 类型定义
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
    swapTotal: number;
    swapUsed: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
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
    connections: number;
    latency?: number;
  };
  processes: {
    total: number;
    running: number;
    sleeping: number;
    zombie: number;
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
  uptime?: number;
  responseTime?: number;
  lastCheck: string;
  metrics?: Record<string, any>;
  issues?: Array<{
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
  }>;
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
  acknowledged: boolean;
  resolved: boolean;
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
  config: {
    collectionInterval: number;
    thresholds: any;
  };
}

export default function SystemMonitoringPage() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // 秒
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedComponents, setExpandedComponents] = useState<string[]>([]);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<string[]>([]);

  // 加载监控数据
  const loadMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/system-monitoring');
      if (!response.ok) {
        throw new Error(`API响应错误: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '获取监控数据失败');
      }
      
      setMonitoringData(data.data);
    } catch (err: any) {
      console.error('加载监控数据失败:', err);
      setError(err.message || '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载和自动刷新
  useEffect(() => {
    loadMonitoringData();
    
    if (autoRefresh) {
      const intervalId = setInterval(loadMonitoringData, refreshInterval * 1000);
      return () => clearInterval(intervalId);
    }
  }, [autoRefresh, refreshInterval]);

  // 切换组件展开状态
  const toggleComponentExpansion = (componentId: string) => {
    setExpandedComponents(prev => 
      prev.includes(componentId) 
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    );
  };

  // 确认告警
  const acknowledgeAlert = (alertId: string) => {
    setAcknowledgedAlerts(prev => [...prev, alertId]);
    // TODO: 发送到API确认告警
  };

  // 格式化字节大小
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // 格式化时间
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`;
    return `${Math.floor(seconds / 86400)}天`;
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'degraded': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'unhealthy': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'unhealthy': return <AlertOctagon className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  // 获取严重性颜色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'warning': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading && !monitoringData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载系统监控数据...</p>
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
                <h3 className="font-semibold text-rose-900">加载监控数据失败</h3>
                <p className="text-sm text-rose-700 mt-1">{error}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={loadMonitoringData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = monitoringData!;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 页面标题和控制栏 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">系统监控中心</h1>
            <p className="text-muted-foreground">实时监控系统性能、组件健康和告警状态</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  id="auto-refresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="auto-refresh" className="text-sm text-slate-600">
                  自动刷新
                </label>
              </div>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="text-sm border border-slate-300 rounded px-2 py-1"
              >
                <option value={10}>10秒</option>
                <option value={30}>30秒</option>
                <option value={60}>60秒</option>
                <option value={300}>5分钟</option>
              </select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMonitoringData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
            <Button size="sm">
              <Settings className="h-4 w-4 mr-2" />
              设置
            </Button>
          </div>
        </div>

        {/* 健康状态横幅 */}
        <Card className={`border-2 ${
          data.overallHealth > 80 ? 'border-emerald-200' :
          data.overallHealth > 60 ? 'border-amber-200' :
          'border-rose-200'
        }`}>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  data.overallHealth > 80 ? 'bg-emerald-100 text-emerald-600' :
                  data.overallHealth > 60 ? 'bg-amber-100 text-amber-600' :
                  'bg-rose-100 text-rose-600'
                }`}>
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      {data.overallHealth > 80 ? '系统运行正常' :
                       data.overallHealth > 60 ? '系统需要关注' :
                       '系统需要紧急维护'}
                    </h3>
                    <Badge variant="outline" className={
                      data.overallHealth > 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                      data.overallHealth > 60 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-rose-100 text-rose-700 border-rose-200'
                    }>
                      {data.overallHealth}% 健康分
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    最后更新: {new Date(data.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{data.summary.healthyComponents}</div>
                  <div className="text-xs text-slate-500">健康组件</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{data.summary.degradedComponents}</div>
                  <div className="text-xs text-slate-500">降级组件</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-rose-600">{data.summary.unhealthyComponents}</div>
                  <div className="text-xs text-slate-500">故障组件</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{data.summary.activeAlerts}</div>
                  <div className="text-xs text-slate-500">活跃告警</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 主标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="components">组件</TabsTrigger>
            <TabsTrigger value="metrics">指标</TabsTrigger>
            <TabsTrigger value="alerts">告警</TabsTrigger>
          </TabsList>

          {/* 概览标签页 */}
          <TabsContent value="overview" className="space-y-6">
            {/* 系统资源卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CPU 卡片 */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CpuIcon className="h-4 w-4" />
                      CPU
                    </CardTitle>
                    <Badge variant="outline" className={
                      data.metrics.cpu.usage > 90 ? 'bg-rose-100 text-rose-700 border-rose-200' :
                      data.metrics.cpu.usage > 70 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-emerald-100 text-emerald-700 border-emerald-200'
                    }>
                      {data.metrics.cpu.usage}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>使用率</span>
                      <span>{data.metrics.cpu.usage}%</span>
                    </div>
                    <Progress value={data.metrics.cpu.usage} className="h-2" />
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-slate-400">负载</div>
                        <div className="font-medium">{data.metrics.cpu.load1m.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">核心</div>
                        <div className="font-medium">{data.metrics.cpu.cores}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">型号</div>
                        <div className="font-medium truncate" title={data.metrics.cpu.model}>
                          {data.metrics.cpu.model.split(' ')[0]}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 内存卡片 */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MemoryStick className="h-4 w-4" />
                      内存
                    </CardTitle>
                    <Badge variant="