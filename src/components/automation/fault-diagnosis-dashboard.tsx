'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, RefreshCw, Bell, Search, Filter } from 'lucide-react';

interface FaultStatus {
  status: string;
  stats: {
    totalFaults: number;
    resolvedFaults: number;
    pendingFaults: number;
    criticalFaults: number;
  };
  lastCheck: string;
}

interface FaultItem {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved';
  createdAt: string;
  updatedAt: string;
  affectedServices: string[];
}

export default function FaultDiagnosisDashboard() {
  const [status, setStatus] = useState<FaultStatus>({
    status: 'healthy',
    stats: {
      totalFaults: 12,
      resolvedFaults: 8,
      pendingFaults: 3,
      criticalFaults: 1,
    },
    lastCheck: new Date().toISOString(),
  });

  const [faults, setFaults] = useState<FaultItem[]>([
    {
      id: 'fault-001',
      title: '数据库连接超时',
      description: 'PostgreSQL连接池耗尽，导致API响应延迟',
      severity: 'critical',
      status: 'investigating',
      createdAt: '2026-02-22T14:30:00Z',
      updatedAt: '2026-02-22T15:45:00Z',
      affectedServices: ['API Gateway', 'User Service', 'Payment Service'],
    },
    {
      id: 'fault-002',
      title: '内存泄漏检测',
      description: 'Node.js服务内存使用持续增长',
      severity: 'high',
      status: 'open',
      createdAt: '2026-02-21T09:15:00Z',
      updatedAt: '2026-02-21T09:15:00Z',
      affectedServices: ['Notification Service', 'Background Jobs'],
    },
    {
      id: 'fault-003',
      title: '第三方API限流',
      description: 'Stripe API调用频率超过限制',
      severity: 'medium',
      status: 'resolved',
      createdAt: '2026-02-20T16:20:00Z',
      updatedAt: '2026-02-20T17:30:00Z',
      affectedServices: ['Payment Service'],
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-red-100';
      case 'high': return 'bg-orange-500 text-orange-100';
      case 'medium': return 'bg-yellow-500 text-yellow-100';
      case 'low': return 'bg-blue-500 text-blue-100';
      default: return 'bg-gray-500 text-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const refreshData = async () => {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setStatus(prev => ({
      ...prev,
      lastCheck: new Date().toISOString(),
    }));
  };

  const filteredFaults = faults.filter(fault => {
    const matchesSearch = fault.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fault.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || fault.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || fault.status === statusFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 状态概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总故障数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.stats.totalFaults}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <AlertTriangle className="h-4 w-4" />
              <span>{status.stats.criticalFaults} 个严重</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">已解决</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{status.stats.resolvedFaults}</div>
            <div className="text-sm text-muted-foreground mt-1">
              解决率: {Math.round((status.stats.resolvedFaults / status.stats.totalFaults) * 100)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">待处理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{status.stats.pendingFaults}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Clock className="h-4 w-4" />
              <span>需要关注</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">系统状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`} />
              <span className="text-lg font-bold capitalize">{status.status}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              最后检查: {new Date(status.lastCheck).toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索故障..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-lg"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">所有严重级别</option>
              <option value="critical">严重</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">所有状态</option>
              <option value="open">未处理</option>
              <option value="investigating">调查中</option>
              <option value="resolved">已解决</option>
            </select>
          </div>
        </div>
        
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新数据
        </Button>
      </div>

      {/* 故障列表 */}
      <Card>
        <CardHeader>
          <CardTitle>故障列表</CardTitle>
          <CardDescription>
            发现 {filteredFaults.length} 个故障，{status.stats.pendingFaults} 个待处理
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFaults.length > 0 ? (
            <div className="space-y-4">
              {filteredFaults.map(fault => (
                <div key={fault.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{fault.title}</h3>
                        <Badge className={getSeverityColor(fault.severity)}>
                          {fault.severity.toUpperCase()}
                        </Badge>
                        <Badge variant={fault.status === 'resolved' ? 'outline' : 'default'}>
                          {fault.status === 'open' ? '未处理' : 
                           fault.status === 'investigating' ? '调查中' : '已解决'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{fault.description}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>创建: {new Date(fault.createdAt).toLocaleDateString()}</div>
                      <div>更新: {new Date(fault.updatedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {fault.affectedServices.map(service => (
                        <span key={service} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {service}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        查看详情
                      </Button>
                      {fault.status !== 'resolved' && (
                        <Button size="sm">
                          开始处理
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>未找到匹配的故障</p>
              <p className="text-sm mt-2">尝试调整搜索条件或刷新数据</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status.status)}`} />
            <span>服务状态: {status.status}</span>
          </div>
          <div>版本: 1.0.0</div>
          <div>最后更新: {new Date().toLocaleTimeString()}</div>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span>{status.stats.pendingFaults} 个待处理故障</span>
        </div>
      </div>
    </div>
  );
}