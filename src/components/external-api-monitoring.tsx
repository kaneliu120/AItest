'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Settings, 
  Key,
  Cloud,
  Brain,
  Code,
  MessageSquare,
  BarChart3,
  Server,
  Globe,
  Eye,
  EyeOff,
  Wrench,
  Clock,
  Shield,
  Download,
  Upload,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  TestTube,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ExternalApi {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  last_checked: string;
  last_response_time: number | null;
  last_status_code: number | null;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  average_response_time: number;
  quota_used: number | null;
  quota_limit: number | null;
  tags: string[];
}

interface ApiStats {
  total: number;
  healthy: number;
  warning: number;
  error: number;
  unknown: number;
  average_response_time: number;
  total_calls: number;
  success_rate: number;
}

interface Alert {
  id: string;
  api_id: string;
  api_name: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  created_at: string;
  resolved: boolean;
}

export function ExternalApiMonitoring() {
  const [apis, setApis] = useState<ExternalApi[]>([]);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApi, setSelectedApi] = useState<string | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 获取API列表
      const apisRes = await fetch('/api/external-apis');
      const apisData = await apisRes.json();
      setApis(apisData);

      // 获取统计信息
      const statsRes = await fetch('/api/external-apis?action=stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // 获取告警
      const alertsRes = await fetch('/api/external-apis?action=alerts&resolved=false&limit=5');
      const alertsData = await alertsRes.json();
      setAlerts(alertsData);
    } catch (error) {
      console.error('获取外部API数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckApi = async (apiId: string) => {
    try {
      const res = await fetch('/api/external-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', apiId }),
      });
      if (res.ok) {
        fetchData(); // 刷新数据
      }
    } catch (error) {
      console.error('检查API失败:', error);
    }
  };

  const handleCheckAll = async () => {
    try {
      const res = await fetch('/api/external-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-all' }),
      });
      if (res.ok) {
        fetchData(); // 刷新数据
      }
    } catch (error) {
      console.error('检查所有API失败:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const res = await fetch('/api/external-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve-alert', alertId }),
      });
      if (res.ok) {
        fetchData(); // 刷新数据
      }
    } catch (error) {
      console.error('解决告警失败:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProviderIcon = (provider: string) => {
    if (provider.includes('Google')) return <Cloud className="h-4 w-4" />;
    if (provider.includes('OpenAI')) return <Brain className="h-4 w-4" />;
    if (provider.includes('GitHub')) return <Code className="h-4 w-4" />;
    if (provider.includes('Discord')) return <MessageSquare className="h-4 w-4" />;
    if (provider.includes('LinkedIn')) return <BarChart3 className="h-4 w-4" />;
    if (provider.includes('Azure')) return <Server className="h-4 w-4" />;
    if (provider.includes('Brave')) return <Globe className="h-4 w-4" />;
    return <Server className="h-4 w-4" />;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
    return `${Math.floor(diffMins / 1440)}天前`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3">加载外部API数据...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">总API数量</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Server className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">健康状态</p>
                <p className="text-2xl font-bold">{stats?.healthy || 0}</p>
                <p className="text-xs text-gray-500">
                  {stats ? Math.round((stats.healthy / stats.total) * 100) : 0}% 健康率
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">平均响应时间</p>
                <p className="text-2xl font-bold">{stats?.average_response_time?.toFixed(0) || 0}ms</p>
                <p className="text-xs text-gray-500">所有API平均</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">成功率</p>
                <p className="text-2xl font-bold">{stats?.success_rate?.toFixed(1) || 0}%</p>
                <p className="text-xs text-gray-500">总调用 {stats?.total_calls || 0} 次</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold">外部API监控</h3>
              <p className="text-sm text-gray-500">
                监控所有集成的外部API和CLIMCP的状态
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
              <Button size="sm" onClick={handleCheckAll}>
                <TestTube className="h-4 w-4 mr-2" />
                检查所有API
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                配置
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API列表 */}
      <Card>
        <CardHeader>
          <CardTitle>API列表</CardTitle>
          <CardDescription>所有集成的外部API和CLIMCP</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>状态</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>提供商</TableHead>
                <TableHead>类别</TableHead>
                <TableHead>最后检查</TableHead>
                <TableHead>响应时间</TableHead>
                <TableHead>成功率</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apis.map((api) => (
                <TableRow key={api.id}>
                  <TableCell>
                    <Badge className={getStatusColor(api.status)}>
                      {getStatusIcon(api.status)}
                      <span className="ml-1 capitalize">{api.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getProviderIcon(api.provider)}
                      <span className="ml-2 font-medium">{api.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{api.description}</div>
                  </TableCell>
                  <TableCell>{api.provider}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{api.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatTime(api.last_checked)}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(api.last_checked).toLocaleString('zh-CN')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {api.last_response_time ? `${api.last_response_time}ms` : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      平均: {api.average_response_time}ms
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-16 mr-2">
                        <Progress 
                          value={api.total_calls > 0 ? (api.successful_calls / api.total_calls) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                      <span className="text-sm">
                        {api.total_calls > 0 
                          ? Math.round((api.successful_calls / api.total_calls) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {api.successful_calls}/{api.total_calls} 成功
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCheckApi(api.id)}
                      >
                        <TestTube className="h-3 w-3 mr-1" />
                        检查
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑配置
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Key className="h-4 w-4 mr-2" />
                            更新密钥
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Wrench className="h-4 w-4 mr-2" />
                            手动修复
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除API
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 告警面板 */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              活跃告警
            </CardTitle>
            <CardDescription>需要关注的问题</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-lg border ${
                    alert.severity === 'critical' 
                      ? 'bg-red-50 border-red-200' 
                      : alert.severity === 'warning'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <Badge 
                          variant={alert.severity === 'critical' ? 'destructive' : 'outline'}
                          className="mr-2"
                        >
                          {alert.severity === 'critical' ? '严重' : 
                           alert.severity === 'warning' ? '警告' : '信息'}
                        </Badge>
                        <span className="font-medium">{alert.api_name}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(alert.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        标记为已解决
                      </Button>
                      <Button size="sm">
                        查看详情
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>常用API管理操作</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4">
              <div className="flex flex-col items-center">
                <Key className="h-8 w-8 mb-2 text-blue-600" />
                <span className="font-medium">添加新API</span>
                <span className="text-xs text-gray-500 mt-1">集成新的外部服务</span>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto py-4">
              <div className="flex flex-col items-center">
                <Shield className="h-8 w-8 mb-2 text-green-600" />
                <span className="font-medium">安全审计</span>
                <span className="text-xs text-gray-500 mt-1">检查API密钥安全性</span>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto py-4">
              <div className="flex flex-col items-center">
                <Download className="h-8 w-8 mb-2 text-purple-600" />
                <span className="font-medium">导出报告</span>
                <span className="text-xs text-gray-500 mt-1">生成API状态报告</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}