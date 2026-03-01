'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  TestTube,
  Filter,
  Search,
  Download,
  Upload
} from 'lucide-react';

interface SystemHealth {
  system: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: any[];
  lastCheck: string;
  uptime: number;
  errorRate: number;
  responseTime: number;
}

interface Alert {
  id: string;
  ruleId: string;
  system: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
}

interface MonitoringMetric {
  id: string;
  system: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags: Record<string, string>;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  system: string;
  metric: string;
  condition: string;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
}

export default function UnifiedMonitoringPage() {
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [metrics, setMetrics] = useState<MonitoringMetric[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSystem, setSelectedSystem] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load service status
  const loadServiceStatus = async () => {
    try {
      const response = await fetch('/api/v6/monitoring?action=status');
      const data = await response.json();
      if (data.success) setServiceStatus(data.data);
    } catch (error) {
      console.error('Failed to load service status:', error);
    }
  };

  // Load active alerts
  const loadActiveAlerts = async () => {
    try {
      const response = await fetch('/api/v6/monitoring?action=alerts');
      const data = await response.json();
      if (data.success) setActiveAlerts(data.data.alerts || []);
    } catch (error) {
      console.error('Failed to load active alerts:', error);
    }
  };

  // Load system health
  const loadSystemHealth = async () => {
    try {
      const response = await fetch('/api/v6/monitoring?action=health');
      const data = await response.json();
      if (data.success) setSystemHealth(data.data.health || []);
    } catch (error) {
      console.error('Failed to load system health:', error);
    }
  };

  // Load monitoring metrics
  const loadMetrics = async () => {
    try {
      const url = selectedSystem === 'all' 
        ? '/api/v6/monitoring?action=metrics&limit=50'
        : `/api/v6/monitoring?action=metrics&system=${selectedSystem}&limit=50`;
      
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) setMetrics(data.data.metrics || []);
    } catch (error) {
      console.error('Failed to load monitoring metrics:', error);
    }
  };

  // Load alert rules
  const loadAlertRules = async () => {
    try {
      const url = selectedSystem === 'all'
        ? '/api/v6/monitoring?action=rules'
        : `/api/v6/monitoring?action=rules&system=${selectedSystem}`;
      
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) setAlertRules(data.data.rules || []);
    } catch (error) {
      console.error('Failed to load alert rules:', error);
    }
  };

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadServiceStatus(),
        loadActiveAlerts(),
        loadSystemHealth(),
        loadMetrics(),
        loadAlertRules()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    
    // Auto refresh
    if (autoRefresh) {
      const interval = setInterval(loadAllData, 30000); // refresh every 30s
      return () => clearInterval(interval);
    }
  }, [selectedSystem, autoRefresh]);

  // Acknowledge alert
  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/v6/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'acknowledge-alert',
          alertId,
          acknowledgedBy: 'user'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadActiveAlerts();
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  // Resolve alert
  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/v6/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'resolve-alert',
          alertId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadActiveAlerts();
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  // Start monitoring service
  const startMonitoring = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v6/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadServiceStatus();
      }
    } catch (error) {
      console.error('Failed to start monitoring service:', error);
    } finally {
      setLoading(false);
    }
  };

  // Stop monitoring service
  const stopMonitoring = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v6/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadServiceStatus();
      }
    } catch (error) {
      console.error('Failed to stop monitoring service:', error);
    } finally {
      setLoading(false);
    }
  };

  // Test alert
  const testAlert = async () => {
    try {
      const response = await fetch('/api/v6/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-alert' })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadActiveAlerts();
      }
    } catch (error) {
      console.error('Failed to test alert:', error);
    }
  };

  // Simulate metrics
  const simulateMetrics = async () => {
    try {
      const response = await fetch('/api/v6/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'simulate-metrics',
          system: 'test-system',
          count: 5
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadMetrics();
      }
    } catch (error) {
      console.error('Failed to simulate metrics:', error);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get system icon
  const getSystemIcon = (system: string) => {
    switch (system) {
      case 'knowledge-enhanced-development': return <Brain className="h-5 w-5" />;
      case 'intelligent-task-dispatch': return <Cpu className="h-5 w-5" />;
      case 'context-aware-cache': return <Database className="h-5 w-5" />;
      case 'unified-gateway': return <Globe className="h-5 w-5" />;
      case 'automation-efficiency-optimization': return <Zap className="h-5 w-5" />;
      default: return <Server className="h-5 w-5" />;
    }
  };

  // Get system display name
  const getSystemDisplayName = (system: string) => {
    const names: Record<string, string> = {
      'knowledge-enhanced-development': 'Knowledge-Enhanced Dev',
      'intelligent-task-dispatch': 'Intelligent Task Dispatch',
      'context-aware-cache': 'Context Cache',
      'unified-gateway': 'Unified Gateway',
      'automation-efficiency-optimization': 'Automation Efficiency'
    };
    return names[system] || system;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Title and status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Activity className="h-8 w-8 mr-3 text-blue-600" />
            Unified Monitoring &amp; Alerting
          </h1>
          <p className="text-gray-600">Real-time monitoring of all subsystems with intelligent alerting and performance analysis</p>
        </div>
        <div className="flex items-center space-x-4">
          {serviceStatus && (
            <Badge className={getStatusColor(serviceStatus.overallStatus)}>
              {serviceStatus.overallStatus === 'healthy' ? 'Healthy' : 
               serviceStatus.overallStatus === 'degraded' ? 'Degraded' : 'Unhealthy'}
            </Badge>
          )}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadAllData} 
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {autoRefresh ? 'Stop Auto Refresh' : 'Start Auto Refresh'}
            </Button>
          </div>
        </div>
      </div>

      {/* System filter */}
      <div className="flex items-center space-x-4">
        <div className="text-sm font-medium">Filter by System:</div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedSystem === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSystem('all')}
          >
            All Systems
          </Button>
          {['knowledge-enhanced-development', 'intelligent-task-dispatch', 'context-aware-cache', 'unified-gateway', 'automation-efficiency-optimization'].map(system => (
            <Button
              key={system}
              variant={selectedSystem === system ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSystem(system)}
            >
              {getSystemIcon(system)}
              <span className="ml-2">{getSystemDisplayName(system)}</span>
            </Button>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="dashboard" className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alert Center
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            System Health
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Alert Rules
          </TabsTrigger>
        </TabsList>

        {/* Dashboard tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Key metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Overall status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Overall Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {serviceStatus?.overallStatus === 'healthy' ? 'Healthy' : 
                   serviceStatus?.overallStatus === 'degraded' ? 'Degraded' : 'Unhealthy'}
                </div>
                <div className="text-sm text-gray-500">
                  Monitored Systems: {serviceStatus?.metrics?.totalChannels || 0}
                </div>
                <Progress 
                  value={serviceStatus?.overallStatus === 'healthy' ? 100 : 
                         serviceStatus?.overallStatus === 'degraded' ? 50 : 10}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {/* Active alerts */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {serviceStatus?.metrics?.activeAlerts || 0}
                </div>
                <div className="text-sm text-gray-500">
                  Total Alerts: {serviceStatus?.metrics?.totalAlerts || 0}
                </div>
                <div className="mt-2 text-xs">
                  Critical: {activeAlerts.filter(a => a.severity === 'critical').length}
                  <span className="mx-1">•</span>
                  Warning: {activeAlerts.filter(a => a.severity === 'warning').length}
                  <span className="mx-1">•</span>
                  Info: {activeAlerts.filter(a => a.severity === 'info').length}
                </div>
              </CardContent>
            </Card>

            {/* Monitoring metrics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Monitoring Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {serviceStatus?.metrics?.totalMetrics?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-gray-500">
                  Systems: {serviceStatus?.systemHealth?.length || 0}
                </div>
                <div className="mt-2 text-xs">
                  Last Updated: {metrics[0] ? new Date(metrics[0].timestamp).toLocaleTimeString('en-US') : 'No data'}
                </div>
              </CardContent>
            </Card>


          </div>
        </TabsContent>

        <TabsContent value="alerts"><div className="text-center py-12 text-gray-400">Alert center coming soon...</div></TabsContent>
        <TabsContent value="health"><div className="text-center py-12 text-gray-400">System health coming soon...</div></TabsContent>
        <TabsContent value="metrics"><div className="text-center py-12 text-gray-400">Monitoring metrics coming soon...</div></TabsContent>
        <TabsContent value="rules"><div className="text-center py-12 text-gray-400">Alert rules coming soon...</div></TabsContent>
      </Tabs>
    </div>
  );
}
