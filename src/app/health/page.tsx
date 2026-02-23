'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Activity, 
  Server, 
  Cpu, 
  MemoryStick, 
  HardDrive,
  Network,
  Clock,
  Shield,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  ArrowRight,
  Sparkles,
  Zap,
  Database,
  Cloud,
  Users,
  Settings
} from 'lucide-react';

interface HealthComponent {
  name: string;
  status: string;
  uptime: string;
  version: string;
  lastCheck: string;
  description: string;
}

interface HealthMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  responseTime: number;
}

export default function HealthDashboard() {
  const [healthData, setHealthData] = useState({
    timestamp: new Date().toISOString(),
    overallHealth: 95,
    components: [
      { name: 'API Gateway', status: 'healthy', uptime: '99.8%', version: '2.1.0', lastCheck: '2分钟前', description: 'API网关服务' },
      { name: '数据库集群', status: 'healthy', uptime: '99.9%', version: 'PostgreSQL 15', lastCheck: '5分钟前', description: '主数据库集群' },
      { name: '缓存服务', status: 'healthy', uptime: '99.7%', version: 'Redis 7.2', lastCheck: '10分钟前', description: 'Redis缓存服务' },
      { name: '文件存储', status: 'warning', uptime: '98.5%', version: 'S3兼容', lastCheck: '15分钟前', description: '对象存储服务' },
      { name: '消息队列', status: 'healthy', uptime: '99.6%', version: 'RabbitMQ 3.12', lastCheck: '20分钟前', description: '消息队列服务' },
      { name: '监控系统', status: 'healthy', uptime: '99.8%', version: 'Prometheus 2.48', lastCheck: '25分钟前', description: '监控和告警系统' },
      { name: '日志系统', status: 'healthy', uptime: '99.5%', version: 'ELK Stack 8.12', lastCheck: '30分钟前', description: '日志收集和分析' },
      { name: '身份认证', status: 'healthy', uptime: '99.9%', version: 'Keycloak 22', lastCheck: '35分钟前', description: '身份认证和授权' },
    ],
    metrics: {
      cpuUsage: 42,
      memoryUsage: 68,
      diskUsage: 35,
      networkLatency: 28,
      responseTime: 156,
    },
    alerts: [
      { level: 'warning', message: '文件存储服务响应时间增加', timestamp: '10分钟前' },
      { level: 'info', message: '数据库备份任务完成', timestamp: '25分钟前' },
      { level: 'info', message: '系统安全检查通过', timestamp: '1小时前' },
    ],
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const refreshHealthData = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新数据
      setHealthData(prev => ({
        ...prev,
        timestamp: new Date().toISOString(),
        metrics: {
          cpuUsage: Math.floor(Math.random() * 30) + 30,
          memoryUsage: Math.floor(Math.random() * 20) + 60,
          diskUsage: Math.floor(Math.random() * 10) + 30,
          networkLatency: Math.floor(Math.random() * 20) + 20,
          responseTime: Math.floor(Math.random() * 50) + 120,
        },
      }));
      
    } catch (error) {
      console.error('获取健康数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshHealthData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
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

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">加载健康数据...</p>
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
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <Heart className="h-6 w-6 text-green-500" />
              </div>
              系统健康监控
            </h1>
            <p className="text-gray-600 mt-2">
              实时监控系统组件状态和性能指标
              <span className="text-sm text-gray-500 ml-2">
                最后更新: {new Date(healthData.timestamp).toLocaleTimeString()}
              </span>
            </p>
          </div>
          <Button onClick={refreshHealthData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">整体健康度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{healthData.overallHealth}%</div>
              <Heart className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={healthData.overallHealth} className="mt-2" />
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-500">系统运行正常</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">CPU使用率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{healthData.metrics.cpuUsage}%</div>
              <Cpu className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={healthData.metrics.cpuUsage} className="mt-2" />
            <div className="text-sm text-gray-500 mt-2">
              {healthData.metrics.cpuUsage < 70 ? '正常范围' : '需要关注'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">内存使用率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{healthData.metrics.memoryUsage}%</div>
              <MemoryStick className="h-8 w-8 text-purple-500" />
            </div>
            <Progress value={healthData.metrics.memoryUsage} className="mt-2" />
            <div className="text-sm text-gray-500 mt-2">
              {healthData.metrics.memoryUsage < 80 ? '正常范围' : '需要优化'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">响应时间</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{healthData.metrics.responseTime}ms</div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {healthData.metrics.responseTime < 200 ? '优秀' : '需要优化'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            概览
          </TabsTrigger>
          <TabsTrigger value="components">
            <Server className="h-4 w-4 mr-2" />
            组件状态
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <Activity className="h-4 w-4 mr-2" />
            性能指标
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertCircle className="h-4 w-4 mr-2" />
            告警信息
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Components Status */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>📊 组件状态概览</CardTitle>
                <CardDescription>系统核心组件的运行状态</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthData.components.map(component => (
                    <div key={component.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100">
                          <Server className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-medium">{component.name}</h3>
                          <p className="text-sm text-gray-500">{component.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={getStatusColor(component.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(component.status)}
                            {component.status === 'healthy' ? '健康' : '警告'}
                          </div>
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm font-medium">{component.uptime}</div>
                          <div className="text-xs text-gray-500">{component.lastCheck}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Metrics Summary */}
            <Card>
              <CardHeader>
                <CardTitle>📈 性能指标</CardTitle>
                <CardDescription>关键性能指标实时数据</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">磁盘使用率</span>
                      <span className="font-medium">{healthData.metrics.diskUsage}%</span>
                    </div>
                    <Progress value={healthData.metrics.diskUsage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">网络延迟</span>
                      <span className="font-medium">{healthData.metrics.networkLatency}ms</span>
                    </div>
                    <Progress value={healthData.metrics.networkLatency / 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">API响应时间</span>
                      <span className="font-medium">{healthData.metrics.responseTime}ms</span>
                    </div>
                    <Progress value={healthData.metrics.responseTime / 500} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🔧 组件详细状态</CardTitle>
              <CardDescription>所有系统组件的详细状态信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthData.components.map(component => (
                  <div key={component.name} className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Server className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{component.name}</h3>
                        <p className="text-sm text-gray-500">{component.description}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">状态</span>
                        <Badge className={getStatusColor(component.status)}>
                          {component.status === 'healthy' ? '健康' : '警告'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">运行时间</span>
                        <span className="font-medium">{component.uptime}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">版本</span>
                        <span className="text-sm">{component.version}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">最后检查</span>
                        <span className="text-sm">{component.lastCheck}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button variant="outline" size="sm" className="w-full">
                        查看详情
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📊 详细性能指标</CardTitle>
              <CardDescription>系统性能指标的详细分析和趋势</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold mb-3">CPU使用趋势</h3>
                    <div className="h-32 flex items-end gap-1">
                      {[45, 52, 48, 55, 50, 58, 52, 60, 55, 62, 58, 65].map((value, index) => (
                        <div key={index} className="flex-1">
                          <div 
                            className="bg-blue-500 rounded-t"
                            style={{ height: `${value}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>12小时前</span>
                      <span>现在</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold mb-3">内存使用趋势</h3>
                    <div className="h-32 flex items-end gap-1">
                      {[60, 62, 58, 65, 68, 70, 72, 68, 65, 70, 72, 75].map((value, index) => (
                        <div key={index} className="flex-1">
                          <div 
                            className="bg-purple-500 rounded-t"
                            style={{ height: `${value}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>12小时前</span>
                      <span>现在</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">性能指标说明</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• CPU使用率: 正常范围 20-70%，超过70%需要关注</li>
                    <li>• 内存使用率: 正常范围 40-80%，超过80%需要优化</li>
                    <li>• 磁盘使用率: 正常范围 20-70%，超过70%需要扩容</li>
                    <li>• 网络延迟: 正常范围 10-50ms，超过50ms需要排查</li>
                    <li>• API响应时间: 正常范围 50-200ms，超过200ms需要优化</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🚨 告警信息</CardTitle>
              <CardDescription>系统告警和通知信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthData.alerts.map((alert, index) => (
                  <div key={index} className={`p-4 rounded-xl border ${getAlertColor(alert.level)}`}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`h-5 w-5 ${
                        alert.level === 'critical' ? 'text-red-500' :
                        alert.level === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {alert.level === 'critical' ? '严重告警' :
                           alert.level === 'warning' ? '警告' : '通知'}
                        </h3>
                        <p className="text-sm mt-1">{alert.message}</p>
                        <div className="text-xs text-gray-600 mt-2">{alert.timestamp}</div>
                      </div>
                      <Button variant="ghost" size="sm">
                        处理
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm text-gray-600">暂无严重告警</p>
                  <p className="text-xs text-gray-500 mt-1">系统运行稳定，所有组件状态正常</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button className="justify-start" variant="outline" onClick={() => window.open('/ecosystem', '_blank')}>
          <Activity className="h-4 w-4 mr-2" />
          工具生态系统
        </Button>
        <Button className="justify-start" variant="outline" onClick={() => window.open('/skill-evaluator', '_blank')}>
          <CheckCircle className="h-4 w-4 mr-2" />
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
        <p>健康监控系统版本 1.0.0 | 数据自动更新间隔: 1分钟</p>
        <p className="mt-1">监控端点: http://localhost:3001/api/health | 告警系统: http://localhost:3001/alerts</p>
      </div>
    </div>
  );
}