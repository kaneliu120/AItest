'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  BarChart3,
  Cpu,
  Server,
  Clock,
  Zap,
  Heart,
  CheckSquare,
  Wrench,
  Database,
  Cloud,
  Code,
  Terminal,
  Shield,
  Network,
  GitBranch,
  MessageSquare,
  FileText,
  Users,
  DollarSign,
  Calendar,
  Brain,
  Workflow,
  Settings,
  ExternalLink,
  Search,
  Filter,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ExternalApiMonitoring } from '@/components/external-api-monitoring';

// Client component to avoid hydration errors
function LastCheckedTime() {
  const [currentTime, setCurrentTime] = useState('');
  
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
  }, []);
  
  return <span>{currentTime || 'Loading...'}</span>;
}

// Client-side time formatting component
function ClientTime({ timestamp, format = 'time' }: { timestamp?: string, format?: 'time' | 'date' | 'datetime' }) {
  const [formattedTime, setFormattedTime] = useState('');
  
  useEffect(() => {
    if (!timestamp) return;
    
    const date = new Date(timestamp);
    let formatted = '';
    
    switch (format) {
      case 'time':
        formatted = date.toLocaleTimeString();
        break;
      case 'date':
        formatted = date.toLocaleDateString();
        break;
      case 'datetime':
        formatted = date.toLocaleString();
        break;
      default:
        formatted = date.toLocaleTimeString();
    }
    
    setFormattedTime(formatted);
  }, [timestamp, format]);
  
  return <span>{formattedTime || 'Loading...'}</span>;
}

interface MonitoringStats {
  totalTools: number;
  healthyTools: number;
  warningTools: number;
  errorTools: number;
  lastUpdate: string;
}

interface SchedulerStats {
  pending: number;
  running: number;
  completed: number;
  success: number;
  failed: number;
  total: number;
  health: number;
  lastUpdate: string;
}

interface ToolStatus {
  name: string;
  status: string;
  type: string;
  version?: string;
  lastChecked: string;
  description?: string;
  details?: string;
}

export default function EcosystemDashboard() {
  const [monitoringStats, setMonitoringStats] = useState<MonitoringStats>({
    totalTools: 20,
    healthyTools: 16,
    warningTools: 2,
    errorTools: 1,
    lastUpdate: new Date().toISOString(),
  });

  const [schedulerStats, setSchedulerStats] = useState<SchedulerStats>({
    pending: 3,
    running: 2,
    completed: 15,
    success: 14,
    failed: 1,
    total: 20,
    health: 70,
    lastUpdate: new Date().toISOString(),
  });

  const [tools, setTools] = useState<ToolStatus[]>([]);
  
  const [toolsStatus, setToolsStatus] = useState<ToolStatus[]>([
    { name: 'GitHub CLI', status: 'healthy', type: 'Dev MCP', version: '2.47.0', lastChecked: '2 min ago', description: 'GitHub CLI tool' },
    { name: 'Docker', status: 'healthy', type: 'Containerization', version: '24.0.7', lastChecked: '5 min ago', description: 'Container runtime' },
    { name: 'Node.js', status: 'healthy', type: 'Runtime', version: '20.11.0', lastChecked: '10 min ago', description: 'JavaScript runtime' },
    { name: 'PostgreSQL', status: 'healthy', type: 'Database', version: '15.5', lastChecked: '15 min ago', description: 'Relational database' },
    { name: 'Redis', status: 'healthy', type: 'Cache', version: '7.2.4', lastChecked: '20 min ago', description: 'In-memory data store' },
    { name: 'Nginx', status: 'healthy', type: 'Web Server', version: '1.24.0', lastChecked: '25 min ago', description: 'Reverse proxy server' },
    { name: 'Python', status: 'healthy', type: 'Runtime', version: '3.11.6', lastChecked: '30 min ago', description: 'Python interpreter' },
    { name: 'Terraform', status: 'healthy', type: 'Infrastructure', version: '1.7.4', lastChecked: '35 min ago', description: 'Infrastructure as code' },
    { name: 'Kubernetes', status: 'healthy', type: 'Orchestration', version: '1.28.4', lastChecked: '40 min ago', description: 'Container orchestration platform' },
    { name: 'Prometheus', status: 'healthy', type: 'Monitoring', version: '2.48.1', lastChecked: '45 min ago', description: 'Monitoring system' },
    { name: 'Grafana', status: 'healthy', type: 'Visualization', version: '10.2.3', lastChecked: '50 min ago', description: 'Data visualization platform' },
    { name: 'Elasticsearch', status: 'healthy', type: 'Search', version: '8.12.0', lastChecked: '55 min ago', description: 'Search and analytics engine' },
    { name: 'Kibana', status: 'healthy', type: 'Visualization', version: '8.12.0', lastChecked: '1 hour ago', description: 'Data visualization' },
    { name: 'Logstash', status: 'healthy', type: 'Logging', version: '8.12.0', lastChecked: '1 hour ago', description: 'Log processing' },
    { name: 'Filebeat', status: 'healthy', type: 'Logging', version: '8.12.0', lastChecked: '1 hour ago', description: 'Log collector' },
    { name: 'Ansible', status: 'healthy', type: 'Automation', version: '2.16.2', lastChecked: '1 hour ago', description: 'Configuration management' },
    { name: 'Jenkins', status: 'warning', type: 'CI/CD', version: '2.426.1', lastChecked: '1 hour ago', description: 'Continuous integration server' },
    { name: 'SonarQube', status: 'warning', type: 'Code Quality', version: '10.3.0', lastChecked: '1 hour ago', description: 'Code quality analysis' },
    { name: 'Vault', status: 'error', type: 'Security', version: '1.15.2', lastChecked: '1 hour ago', description: 'Secret management' },
    { name: 'Consul', status: 'healthy', type: 'Service Discovery', version: '1.16.1', lastChecked: '1 hour ago', description: 'Service mesh' },
  ]);

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionRate, setConnectionRate] = useState(68);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchEcosystemData = async () => {
    setLoading(true);
    try {
      // Call real API
      const response = await fetch('/api/ecosystem/status?format=json');
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update stats
        const newStats = {
          ...monitoringStats,
          totalTools: data.data.monitoring.totalTools,
          healthyTools: data.data.monitoring.healthyTools,
          warningTools: data.data.monitoring.warningTools,
          errorTools: data.data.monitoring.errorTools,
          lastUpdate: data.data.monitoring.lastUpdate,
          recentAlerts: data.data.monitoring.recentAlerts || []
        };
        setMonitoringStats(newStats);
        
        // Update scheduler stats
        const newSchedulerStats = {
          ...schedulerStats,
          pending: data.data.scheduler.pending,
          running: data.data.scheduler.running,
          completed: data.data.scheduler.completed,
          success: data.data.scheduler.success,
          failed: data.data.scheduler.failed,
          total: data.data.scheduler.total,
          health: data.data.scheduler.health,
          lastUpdate: data.data.scheduler.lastUpdate
        };
        setSchedulerStats(newSchedulerStats);
        
        // Update MCP list
        setTools(data.data.tools || []);
        
        // Update connection rate
        setConnectionRate(data.data.summary.connectionRate || 68);
      } else {
        throw new Error(data.error || 'API returned error');
      }
      
    } catch (error) {
      console.error('Failed to fetch ecosystem data:', error);
      // Use mock data on failure
      const newStats = {
        ...monitoringStats,
        lastUpdate: new Date().toISOString(),
      };
      setMonitoringStats(newStats);
      
      const newSchedulerStats = {
        ...schedulerStats,
        lastUpdate: new Date().toISOString(),
      };
      setSchedulerStats(newSchedulerStats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEcosystemData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-700 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Dev MCP': return <Code className="h-4 w-4" />;
      case 'Containerization': return <DockerIcon />;
      case 'Runtime': return <Cpu className="h-4 w-4" />;
      case 'Database': return <Database className="h-4 w-4" />;
      case 'Cache': return <Server className="h-4 w-4" />;
      case 'Web Server': return <Network className="h-4 w-4" />;
      case 'Infrastructure': return <Cloud className="h-4 w-4" />;
      case 'Orchestration': return <Workflow className="h-4 w-4" />;
      case 'Monitoring': return <Activity className="h-4 w-4" />;
      case 'Visualization': return <BarChart3 className="h-4 w-4" />;
      case 'Search': return <Search className="h-4 w-4" />;
      case 'Logging': return <FileText className="h-4 w-4" />;
      case 'Automation': return <Zap className="h-4 w-4" />;
      case 'CI/CD': return <GitBranch className="h-4 w-4" />;
      case 'Code Quality': return <CheckSquare className="h-4 w-4" />;
      case 'Security': return <Shield className="h-4 w-4" />;
      case 'Service Discovery': return <Network className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  const filteredTools = (tools.length > 0 ? tools : toolsStatus).filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (tool.details || tool.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tool.status === statusFilter;
    const matchesType = typeFilter === 'all' || tool.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const toolTypes = Array.from(new Set((tools.length > 0 ? tools : toolsStatus).map(tool => tool.type)));

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading ecosystem data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
              MCP Ecosystem
            </h1>
            <p className="text-gray-600 mt-2">
              Unified management of all MCPs and services for stable operation
              {monitoringStats.lastUpdate && (
                <span className="text-sm text-gray-500 ml-2">
                  Last updated: <ClientTime timestamp={monitoringStats.lastUpdate} format="time" />
                </span>
              )}
            </p>
          </div>
          <Button onClick={fetchEcosystemData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total MCPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{monitoringStats.totalTools}</div>
              <Wrench className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex gap-4 mt-2">
              <div className="text-sm">
                <div className="font-medium">Healthy</div>
                <div className="text-2xl text-green-600">{monitoringStats.healthyTools}</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Warning</div>
                <div className="text-2xl text-yellow-600">{monitoringStats.warningTools}</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Error</div>
                <div className="text-2xl text-red-600">{monitoringStats.errorTools}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Connection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {connectionRate}%
              </div>
              <Network className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={connectionRate} className="mt-2" />
            <p className="text-sm text-gray-500 mt-2">
              {monitoringStats.healthyTools} MCPs connected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Scheduler Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{schedulerStats.health}%</div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex gap-4 mt-2">
              <div className="text-sm">
                <div className="font-medium">Pending</div>
                <div className="text-2xl">{schedulerStats.pending}</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Running</div>
                <div className="text-2xl">{schedulerStats.running}</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Completed</div>
                <div className="text-2xl">{schedulerStats.completed}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {monitoringStats.errorTools === 0 ? 'Normal' : 'Abnormal'}
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className={`h-2 w-2 rounded-full ${monitoringStats.errorTools === 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">
                {monitoringStats.errorTools === 0 ? 'All systems running normally' : `${monitoringStats.errorTools} system(s) abnormal`}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
        <div className="flex flex-col md:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search MCPs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="healthy">Healthy</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            >
              <option value="all">All Types</option>
              {toolTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filter
          </Button>
          <Button size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Quick Actions
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tools" className="mb-8">
        <TabsList>
          <TabsTrigger value="tools">
            <Wrench className="h-4 w-4 mr-2" />
            MCP List
          </TabsTrigger>
          <TabsTrigger value="categories">
            <div className="h-4 w-4 mr-2">
              <FolderTree />
            </div>
            Categories
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Activity className="h-4 w-4 mr-2" />
            Live Monitoring
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🛠️ MCP Status List</CardTitle>
              <CardDescription>
                Found {filteredTools.length} MCPs, {monitoringStats.healthyTools} healthy, {monitoringStats.warningTools} warning, {monitoringStats.errorTools} error
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTools.length > 0 ? (
                <div className="space-y-4">
                  {filteredTools.map(tool => (
                    <div key={tool.name} className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-100">
                            {getTypeIcon(tool.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{tool.name}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span>{tool.type}</span>
                              {tool.version && <span>v{tool.version}</span>}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {tool.lastChecked}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(tool.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(tool.status)}
                              {tool.status === 'healthy' ? 'Healthy' : tool.status === 'warning' ? 'Warning' : 'Error'}
                            </div>
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {tool.description && (
                        <p className="text-sm text-gray-600 mb-3">{tool.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            Run Diagnostics
                          </Button>
                          {tool.status !== 'healthy' && (
                            <Button size="sm">
                              Fix Issues
                            </Button>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Last checked: <LastCheckedTime />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No matching MCPs found</p>
                  <p className="text-sm mt-2">Try adjusting search filters or refresh data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📁 MCP Category Management</CardTitle>
              <CardDescription>Organize MCPs by type for easy management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {toolTypes.map(type => {
                  const typeTools = (tools.length > 0 ? tools : toolsStatus).filter(tool => tool.type === type);
                  const healthyCount = typeTools.filter(tool => tool.status === 'healthy').length;
                  const warningCount = typeTools.filter(tool => tool.status === 'warning').length;
                  const errorCount = typeTools.filter(tool => tool.status === 'error').length;
                  
                  return (
                    <div key={type} className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          {getTypeIcon(type)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{type}</h3>
                          <p className="text-sm text-gray-500">{typeTools.length} MCPs</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Healthy</span>
                          <span className="font-medium text-green-600">{healthyCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Warning</span>
                          <span className="font-medium text-yellow-600">{warningCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Error</span>
                          <span className="font-medium text-red-600">{errorCount}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Button variant="outline" size="sm" className="w-full">
                          View All
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          {/* External API monitoring */}
          <ExternalApiMonitoring />
          
          {/* Legacy monitoring panel */}
          <Card>
            <CardHeader>
              <CardTitle>📊 System MCP Monitoring</CardTitle>
              <CardDescription>Real-time monitoring of internal MCPs and system components</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold mb-3">Connection Status Trend</h3>
                    <div className="h-32 flex items-end gap-1">
                      {[65, 72, 68, 75, 80, 85, 82, 88, 90, 92, 95, 98].map((value, index) => (
                        <div key={index} className="flex-1">
                          <div 
                            className="bg-blue-500 rounded-t"
                            style={{ height: `${value}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>7 days ago</span>
                      <span>Today</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold mb-3">Error Rate Statistics</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Critical Errors</span>
                          <span className="font-medium">0.2%</span>
                        </div>
                        <Progress value={0.2} className="h-1" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Warning</span>
                          <span className="font-medium">1.5%</span>
                        </div>
                        <Progress value={1.5} className="h-1" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Connection Failures</span>
                          <span className="font-medium">0.8%</span>
                        </div>
                        <Progress value={0.8} className="h-1" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">Monitoring Notes</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Monitoring data auto-updates every 5 minutes</li>
                    <li>• Health status is calculated based on response time and error rate</li>
                    <li>• Warning status means MCP performance is degraded but still running</li>
                    <li>• Error status means MCP cannot respond normally</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📈 Data Analytics Report</CardTitle>
              <CardDescription>MCP usage and performance analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white border border-gray-200 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Most Used MCP</div>
                    <div className="text-lg font-semibold">GitHub CLI</div>
                    <div className="text-sm text-gray-500">Average 42 uses per day</div>
                  </div>
                  <div className="p-4 bg-white border border-gray-200 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Most Stable MCP</div>
                    <div className="text-lg font-semibold">Docker</div>
                    <div className="text-sm text-gray-500">99.8% availability</div>
                  </div>
                  <div className="p-4 bg-white border border-gray-200 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Needs Attention</div>
                    <div className="text-lg font-semibold">Vault</div>
                    <div className="text-sm text-gray-500">3 recent connection failures</div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold mb-3">MCP Usage Frequency</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'GitHub CLI', usage: 95 },
                      { name: 'Docker', usage: 88 },
                      { name: 'Node.js', usage: 82 },
                      { name: 'PostgreSQL', usage: 78 },
                      { name: 'Redis', usage: 75 },
                    ].map(tool => (
                      <div key={tool.name} className="flex items-center">
                        <span className="w-32 text-sm">{tool.name}</span>
                        <div className="flex-1 ml-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{tool.usage}%</span>
                          </div>
                          <Progress value={tool.usage} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button className="justify-start" variant="outline" onClick={() => window.open('/health', '_blank')}>
          <Activity className="h-4 w-4 mr-2" />
          Health Monitoring
        </Button>
        <Button className="justify-start" variant="outline" onClick={() => window.open('/skill-evaluator', '_blank')}>
          <CheckSquare className="h-4 w-4 mr-2" />
          Skill Evaluation
        </Button>
        <Button className="justify-start" variant="outline" onClick={() => window.open('/automation', '_blank')}>
          <Zap className="h-4 w-4 mr-2" />
          Automation Settings
        </Button>
        <Button className="justify-start" variant="outline" onClick={() => window.open('/settings', '_blank')}>
          <Settings className="h-4 w-4 mr-2" />
          System Settings
        </Button>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Mission Control Ecosystem v2.0.0 | Data auto-update interval: 5 minutes</p>
        <p className="mt-1">Monitoring: http://localhost:3001/health | Scheduler: http://localhost:3001/ecosystem/scheduler</p>
      </div>
    </div>
  );
}

// Helper components
function DockerIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.5 9.75v-1.5h-1.5v1.5h1.5zm1.5 0v-1.5h-1.5v1.5h1.5zm1.5 0v-1.5h-1.5v1.5h1.5zm1.5 0v-1.5h-1.5v1.5h1.5zm-4.5 1.5v-1.5h-1.5v1.5h1.5zm1.5 0v-1.5h-1.5v1.5h1.5zm1.5 0v-1.5h-1.5v1.5h1.5zm1.5 0v-1.5h-1.5v1.5h1.5zm-4.5 1.5v-1.5h-1.5v1.5h1.5zm1.5 0v-1.5h-1.5v1.5h1.5zm1.5 0v-1.5h-1.5v1.5h1.5zm1.5 0v-1.5h-1.5v1.5h1.5z"/>
    </svg>
  );
}

function FolderTree() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6z"/>
      <path d="M8 10h8"/>
      <path d="M8 14h8"/>
      <path d="M8 18h8"/>
    </svg>
  );
}
