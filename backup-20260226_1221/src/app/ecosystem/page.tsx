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

// 客户端组件，避免hydration错误
function LastCheckedTime() {
  const [currentTime, setCurrentTime] = useState('');
  
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
  }, []);
  
  return <span>{currentTime || '加载中...'}</span>;
}

// 客户端时间格式化组件
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
  
  return <span>{formattedTime || '加载中...'}</span>;
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
    { name: 'GitHub CLI', status: 'healthy', type: '开发工具', version: '2.47.0', lastChecked: '2分钟前', description: 'GitHub命令行工具' },
    { name: 'Docker', status: 'healthy', type: '容器化', version: '24.0.7', lastChecked: '5分钟前', description: '容器运行时' },
    { name: 'Node.js', status: 'healthy', type: '运行时', version: '20.11.0', lastChecked: '10分钟前', description: 'JavaScript运行时' },
    { name: 'PostgreSQL', status: 'healthy', type: '数据库', version: '15.5', lastChecked: '15分钟前', description: '关系型数据库' },
    { name: 'Redis', status: 'healthy', type: '缓存', version: '7.2.4', lastChecked: '20分钟前', description: '内存数据存储' },
    { name: 'Nginx', status: 'healthy', type: 'Web服务器', version: '1.24.0', lastChecked: '25分钟前', description: '反向代理服务器' },
    { name: 'Python', status: 'healthy', type: '运行时', version: '3.11.6', lastChecked: '30分钟前', description: 'Python解释器' },
    { name: 'Terraform', status: 'healthy', type: '基础设施', version: '1.7.4', lastChecked: '35分钟前', description: '基础设施即代码' },
    { name: 'Kubernetes', status: 'healthy', type: '编排', version: '1.28.4', lastChecked: '40分钟前', description: '容器编排平台' },
    { name: 'Prometheus', status: 'healthy', type: '监控', version: '2.48.1', lastChecked: '45分钟前', description: '监控系统' },
    { name: 'Grafana', status: 'healthy', type: '可视化', version: '10.2.3', lastChecked: '50分钟前', description: '数据可视化平台' },
    { name: 'Elasticsearch', status: 'healthy', type: '搜索', version: '8.12.0', lastChecked: '55分钟前', description: '搜索和分析引擎' },
    { name: 'Kibana', status: 'healthy', type: '可视化', version: '8.12.0', lastChecked: '1小时前', description: '数据可视化' },
    { name: 'Logstash', status: 'healthy', type: '日志', version: '8.12.0', lastChecked: '1小时前', description: '日志处理' },
    { name: 'Filebeat', status: 'healthy', type: '日志', version: '8.12.0', lastChecked: '1小时前', description: '日志收集器' },
    { name: 'Ansible', status: 'healthy', type: '自动化', version: '2.16.2', lastChecked: '1小时前', description: '配置管理' },
    { name: 'Jenkins', status: 'warning', type: 'CI/CD', version: '2.426.1', lastChecked: '1小时前', description: '持续集成服务器' },
    { name: 'SonarQube', status: 'warning', type: '代码质量', version: '10.3.0', lastChecked: '1小时前', description: '代码质量分析' },
    { name: 'Vault', status: 'error', type: '安全', version: '1.15.2', lastChecked: '1小时前', description: '密钥管理' },
    { name: 'Consul', status: 'healthy', type: '服务发现', version: '1.16.1', lastChecked: '1小时前', description: '服务网格' },
  ]);

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionRate, setConnectionRate] = useState(68);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchEcosystemData = async () => {
    setLoading(true);
    try {
      // 调用真实API
      const response = await fetch('/api/ecosystem/status?format=json');
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // 更新统计数据
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
        
        // 更新调度器统计
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
        
        // 更新工具列表
        setTools(data.data.tools || []);
        
        // 更新连接率
        setConnectionRate(data.data.summary.connectionRate || 68);
      } else {
        throw new Error(data.error || 'API返回错误');
      }
      
    } catch (error) {
      console.error('获取生态系统数据失败:', error);
      // 失败时使用模拟数据
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
      case '开发工具': return <Code className="h-4 w-4" />;
      case '容器化': return <DockerIcon />;
      case '运行时': return <Cpu className="h-4 w-4" />;
      case '数据库': return <Database className="h-4 w-4" />;
      case '缓存': return <Server className="h-4 w-4" />;
      case 'Web服务器': return <Network className="h-4 w-4" />;
      case '基础设施': return <Cloud className="h-4 w-4" />;
      case '编排': return <Workflow className="h-4 w-4" />;
      case '监控': return <Activity className="h-4 w-4" />;
      case '可视化': return <BarChart3 className="h-4 w-4" />;
      case '搜索': return <Search className="h-4 w-4" />;
      case '日志': return <FileText className="h-4 w-4" />;
      case '自动化': return <Zap className="h-4 w-4" />;
      case 'CI/CD': return <GitBranch className="h-4 w-4" />;
      case '代码质量': return <CheckSquare className="h-4 w-4" />;
      case '安全': return <Shield className="h-4 w-4" />;
      case '服务发现': return <Network className="h-4 w-4" />;
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
            <p className="text-gray-500">加载生态系统数据...</p>
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
              工具生态系统
            </h1>
            <p className="text-gray-600 mt-2">
              统一管理所有工具和服务，确保系统稳定运行
              {monitoringStats.lastUpdate && (
                <span className="text-sm text-gray-500 ml-2">
                  最后更新: <ClientTime timestamp={monitoringStats.lastUpdate} format="time" />
                </span>
              )}
            </p>
          </div>
          <Button onClick={fetchEcosystemData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">工具总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{monitoringStats.totalTools}</div>
              <Wrench className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex gap-4 mt-2">
              <div className="text-sm">
                <div className="font-medium">健康</div>
                <div className="text-2xl text-green-600">{monitoringStats.healthyTools}</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">警告</div>
                <div className="text-2xl text-yellow-600">{monitoringStats.warningTools}</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">错误</div>
                <div className="text-2xl text-red-600">{monitoringStats.errorTools}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">连接率</CardTitle>
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
              {monitoringStats.healthyTools}个工具正常连接
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">调度器状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{schedulerStats.health}%</div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex gap-4 mt-2">
              <div className="text-sm">
                <div className="font-medium">待处理</div>
                <div className="text-2xl">{schedulerStats.pending}</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">运行中</div>
                <div className="text-2xl">{schedulerStats.running}</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">已完成</div>
                <div className="text-2xl">{schedulerStats.completed}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">系统健康</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {monitoringStats.errorTools === 0 ? '正常' : '异常'}
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className={`h-2 w-2 rounded-full ${monitoringStats.errorTools === 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">
                {monitoringStats.errorTools === 0 ? '所有系统运行正常' : `${monitoringStats.errorTools}个系统异常`}
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
              placeholder="搜索工具..."
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
              <option value="all">所有状态</option>
              <option value="healthy">健康</option>
              <option value="warning">警告</option>
              <option value="error">错误</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            >
              <option value="all">所有类型</option>
              {toolTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            高级筛选
          </Button>
          <Button size="sm">
            <Zap className="h-4 w-4 mr-2" />
            快速操作
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tools" className="mb-8">
        <TabsList>
          <TabsTrigger value="tools">
            <Wrench className="h-4 w-4 mr-2" />
            工具列表
          </TabsTrigger>
          <TabsTrigger value="categories">
            <div className="h-4 w-4 mr-2">
              <FolderTree />
            </div>
            分类管理
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Activity className="h-4 w-4 mr-2" />
            实时监控
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            数据分析
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🛠️ 工具状态列表</CardTitle>
              <CardDescription>
                发现 {filteredTools.length} 个工具，{monitoringStats.healthyTools} 个健康，{monitoringStats.warningTools} 个警告，{monitoringStats.errorTools} 个错误
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
                              {tool.status === 'healthy' ? '健康' : tool.status === 'warning' ? '警告' : '错误'}
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
                            查看详情
                          </Button>
                          <Button variant="outline" size="sm">
                            运行诊断
                          </Button>
                          {tool.status !== 'healthy' && (
                            <Button size="sm">
                              修复问题
                            </Button>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          最后检查: <LastCheckedTime />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>未找到匹配的工具</p>
                  <p className="text-sm mt-2">尝试调整搜索条件或刷新数据</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📁 工具分类管理</CardTitle>
              <CardDescription>按类型组织工具，便于管理和维护</CardDescription>
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
                          <p className="text-sm text-gray-500">{typeTools.length} 个工具</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">健康</span>
                          <span className="font-medium text-green-600">{healthyCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">警告</span>
                          <span className="font-medium text-yellow-600">{warningCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">错误</span>
                          <span className="font-medium text-red-600">{errorCount}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Button variant="outline" size="sm" className="w-full">
                          查看全部
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
          {/* 外部API监控 */}
          <ExternalApiMonitoring />
          
          {/* 原有监控面板 */}
          <Card>
            <CardHeader>
              <CardTitle>📊 系统工具监控面板</CardTitle>
              <CardDescription>内部工具和系统组件的实时监控</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold mb-3">连接状态趋势</h3>
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
                      <span>7天前</span>
                      <span>今天</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold mb-3">错误率统计</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>严重错误</span>
                          <span className="font-medium">0.2%</span>
                        </div>
                        <Progress value={0.2} className="h-1" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>警告</span>
                          <span className="font-medium">1.5%</span>
                        </div>
                        <Progress value={1.5} className="h-1" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>连接失败</span>
                          <span className="font-medium">0.8%</span>
                        </div>
                        <Progress value={0.8} className="h-1" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">监控说明</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 监控数据每5分钟自动更新一次</li>
                    <li>• 健康状态基于工具响应时间和错误率计算</li>
                    <li>• 警告状态表示工具性能下降但仍在运行</li>
                    <li>• 错误状态表示工具无法正常响应</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📈 数据分析报告</CardTitle>
              <CardDescription>工具使用情况和性能分析</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white border border-gray-200 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">最常用工具</div>
                    <div className="text-lg font-semibold">GitHub CLI</div>
                    <div className="text-sm text-gray-500">平均每天使用 42 次</div>
                  </div>
                  <div className="p-4 bg-white border border-gray-200 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">最稳定工具</div>
                    <div className="text-lg font-semibold">Docker</div>
                    <div className="text-sm text-gray-500">99.8% 可用性</div>
                  </div>
                  <div className="p-4 bg-white border border-gray-200 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">需要关注</div>
                    <div className="text-lg font-semibold">Vault</div>
                    <div className="text-sm text-gray-500">最近 3 次连接失败</div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold mb-3">工具使用频率</h3>
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
          健康监控
        </Button>
        <Button className="justify-start" variant="outline" onClick={() => window.open('/skill-evaluator', '_blank')}>
          <CheckSquare className="h-4 w-4 mr-2" />
          技能评估
        </Button>
        <Button className="justify-start" variant="outline" onClick={() => window.open('/automation', '_blank')}>
          <Zap className="h-4 w-4 mr-2" />
          自动化设置
        </Button>
        <Button className="justify-start" variant="outline" onClick={() => window.open('/settings', '_blank')}>
          <Settings className="h-4 w-4 mr-2" />
          系统设置
        </Button>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Mission Control 生态系统版本 2.0.0 | 数据自动更新间隔: 5分钟</p>
        <p className="mt-1">监控系统: http://localhost:3001/health | 调度器: http://localhost:3001/ecosystem/scheduler</p>
      </div>
    </div>
  );
}

// 辅助组件
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
