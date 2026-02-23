'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bug, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  RefreshCw,
  Terminal,
  Server,
  Database,
  Network,
  Cpu,
  HardDrive,
  BarChart3,
  Download,
  Play,
  Shield
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function TroubleshootingPage() {
  const [activeTab, setActiveTab] = useState("diagnosis");
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const startSystemScan = () => {
    setScanning(true);
    setScanProgress(0);
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const systemIssues = [
    {
      id: 'issue-001',
      component: '数据库连接',
      severity: 'high',
      description: '数据库连接超时，响应时间超过5秒',
      detectedAt: '2026-02-21 21:30:00',
      status: 'active',
      solution: '检查数据库配置，增加连接池大小',
    },
    {
      id: 'issue-002',
      component: 'API网关',
      severity: 'medium',
      description: 'API响应时间波动较大',
      detectedAt: '2026-02-21 20:15:00',
      status: 'investigating',
      solution: '优化API缓存策略，增加负载均衡',
    },
    {
      id: 'issue-003',
      component: '文件存储',
      severity: 'low',
      description: '存储空间使用率达到85%',
      detectedAt: '2026-02-21 18:45:00',
      status: 'resolved',
      solution: '清理临时文件，增加存储配额',
    },
    {
      id: 'issue-004',
      component: '网络连接',
      severity: 'medium',
      description: '外部API调用失败率增加',
      detectedAt: '2026-02-21 17:20:00',
      status: 'active',
      solution: '检查网络配置，添加重试机制',
    },
  ];

  const diagnosticTools = [
    {
      name: '系统健康检查',
      description: '全面检查系统组件健康状态',
      icon: Server,
      duration: '2分钟',
      status: 'available',
    },
    {
      name: '性能分析器',
      description: '分析系统性能瓶颈',
      icon: Cpu,
      duration: '5分钟',
      status: 'available',
    },
    {
      name: '网络诊断',
      description: '检查网络连接和延迟',
      icon: Network,
      duration: '1分钟',
      status: 'available',
    },
    {
      name: '数据库优化',
      description: '分析数据库性能和查询优化',
      icon: Database,
      duration: '3分钟',
      status: 'available',
    },
    {
      name: '日志分析',
      description: '分析系统日志查找问题',
      icon: Terminal,
      duration: '4分钟',
      status: 'available',
    },
    {
      name: '安全扫描',
      description: '检查系统安全漏洞',
      icon: Server, // 暂时使用Server图标代替Shield
      duration: '10分钟',
      status: 'unavailable',
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-600';
      case 'investigating': return 'text-yellow-600';
      case 'resolved': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertTriangle className="h-4 w-4" />;
      case 'investigating': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      default: return <Bug className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">故障排查中心 🐛</h1>
            <p className="text-muted-foreground">诊断和解决系统问题</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              导出报告
            </Button>
            <Button 
              size="sm" 
              onClick={startSystemScan}
              disabled={scanning}
            >
              {scanning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  扫描中...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  系统扫描
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 扫描进度 */}
        {scanning && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Search className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">系统扫描进行中</p>
                      <p className="text-sm text-muted-foreground">正在检查系统组件...</p>
                    </div>
                  </div>
                  <span className="font-bold">{scanProgress}%</span>
                </div>
                <Progress value={scanProgress} className="h-2" />
                <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                  <span>数据库</span>
                  <span>API服务</span>
                  <span>网络连接</span>
                  <span>文件系统</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="diagnosis">问题诊断</TabsTrigger>
            <TabsTrigger value="tools">诊断工具</TabsTrigger>
            <TabsTrigger value="history">历史记录</TabsTrigger>
          </TabsList>

          {/* 问题诊断 */}
          <TabsContent value="diagnosis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>当前问题</CardTitle>
                <CardDescription>检测到的系统问题和异常</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemIssues.map((issue) => (
                    <div key={issue.id} className="p-4 border rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getSeverityColor(issue.severity)}`}>
                            {getStatusIcon(issue.status)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold">{issue.component}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                                {issue.severity === 'high' ? '高优先级' : 
                                 issue.severity === 'medium' ? '中优先级' : '低优先级'}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">检测时间: {issue.detectedAt}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1 ${getStatusColor(issue.status)}`}>
                            {getStatusIcon(issue.status)}
                            {issue.status === 'active' ? '活跃' : 
                             issue.status === 'investigating' ? '调查中' : '已解决'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-1">问题描述</p>
                          <p className="text-sm">{issue.description}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">解决方案</p>
                          <p className="text-sm">{issue.solution}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline">标记为已解决</Button>
                        <Button size="sm">应用修复</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 系统指标 */}
            <Card>
              <CardHeader>
                <CardTitle>系统指标</CardTitle>
                <CardDescription>关键系统性能指标</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'CPU使用率', value: 65, threshold: 80, icon: Cpu },
                    { name: '内存使用率', value: 72, threshold: 85, icon: Server },
                    { name: '磁盘使用率', value: 45, threshold: 90, icon: HardDrive },
                    { name: '网络延迟', value: 28, threshold: 100, icon: Network },
                  ].map((metric, index) => (
                    <div key={index} className="text-center p-4 border rounded-lg">
                      <metric.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium mb-1">{metric.name}</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className={`text-2xl font-bold ${
                          metric.value > metric.threshold ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {metric.value}%
                        </span>
                        <span className="text-xs text-muted-foreground">阈值: {metric.threshold}%</span>
                      </div>
                      <Progress 
                        value={metric.value} 
                        className={`h-2 mt-2 ${
                          metric.value > metric.threshold ? 'bg-red-100' : 'bg-green-100'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 诊断工具 */}
          <TabsContent value="tools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>诊断工具</CardTitle>
                <CardDescription>可用的系统诊断和故障排除工具</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {diagnosticTools.map((tool, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <tool.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold">{tool.name}</h3>
                          <p className="text-sm text-muted-foreground">{tool.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{tool.duration}</span>
                        <Button 
                          size="sm" 
                          variant={tool.status === 'available' ? 'default' : 'outline'}
                          disabled={tool.status !== 'available'}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          {tool.status === 'available' ? '运行' : '不可用'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 快速诊断 */}
            <Card>
              <CardHeader>
                <CardTitle>快速诊断</CardTitle>
                <CardDescription>一键运行常见问题检查</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: '服务连通性检查', description: '检查所有服务的连接状态' },
                    { name: '数据库健康检查', description: '检查数据库连接和性能' },
                    { name: 'API端点测试', description: '测试所有API端点的可用性' },
                    { name: '文件系统检查', description: '检查文件权限和存储空间' },
                  ].map((check, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{check.name}</p>
                        <p className="text-sm text-muted-foreground">{check.description}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Zap className="h-3 w-3 mr-1" />
                        运行检查
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 历史记录 */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>问题历史记录</CardTitle>
                <CardDescription>过去30天的问题和解决方案</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { date: '2026-02-20', issue: '数据库连接超时', solution: '增加连接池大小', status: 'resolved' },
                    { date: '2026-02-18', issue: 'API响应缓慢', solution: '优化查询缓存', status: 'resolved' },
                    { date: '2026-02-15', issue: '内存泄漏', solution: '修复内存管理代码', status: 'resolved' },
                    { date: '2026-02-12', issue: '网络抖动', solution: '优化网络配置', status: 'resolved' },
                    { date: '2026-02-10', issue: '文件权限错误', solution: '修复文件权限设置', status: 'resolved' },
                  ].map((record, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{record.date}</span>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-600 border border-green-200">
                          已解决
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">问题</p>
                          <p className="text-sm">{record.issue}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">解决方案</p>
                          <p className="text-sm">{record.solution}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 统计信息 */}
            <Card>
              <CardHeader>
                <CardTitle>故障统计</CardTitle>
                <CardDescription>问题类型和解决时间分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">问题类型分布</h4>
                    <div className="space-y-2">
                      {[
                        { type: '数据库问题', count: 8, percentage: 32 },
                        { type: 'API问题', count: 6, percentage: 24 },
                        { type: '网络问题', count: 5, percentage: 20 },
                        { type: '性能问题', count: 4, percentage: 16 },
                        { type: '其他问题', count: 2, percentage: 8 },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm">{item.type}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{item.count}</span>
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
      </div>
    </div>
  );
}