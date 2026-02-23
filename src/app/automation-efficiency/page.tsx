'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap,
  TrendingUp,
  Clock,
  DollarSign,
  Target,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Cpu,
  Brain,
  Server,
  Database,
  Rocket,
  RefreshCw,
  Play,
  TestTube,
  LineChart
} from 'lucide-react';

interface ServiceStatus {
  status: string;
  service: string;
  config: any;
  metrics: any;
  optimizationStatus: any;
  performance: any;
}

interface PerformanceReport {
  summary: any;
  detailedMetrics: any;
  recentPerformance: any[];
  recommendations: any[];
}

export default function AutomationEfficiencyPage() {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [testResults, setTestResults] = useState<any>(null);
  const [simulationResults, setSimulationResults] = useState<any>(null);

  // 加载服务状态
  const loadServiceStatus = async () => {
    try {
      const response = await fetch('/api/v5/automation?action=status');
      const data = await response.json();
      if (data.success) setServiceStatus(data.data);
    } catch (error) {
      console.error('加载服务状态失败:', error);
    }
  };

  // 加载性能报告
  const loadPerformanceReport = async () => {
    try {
      const response = await fetch('/api/v5/automation?action=report');
      const data = await response.json();
      if (data.success) setPerformanceReport(data.data);
    } catch (error) {
      console.error('加载性能报告失败:', error);
    }
  };

  useEffect(() => {
    loadServiceStatus();
    loadPerformanceReport();
  }, []);

  // 初始化服务
  const handleInitialize = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v5/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadServiceStatus();
        await loadPerformanceReport();
      }
    } catch (error) {
      console.error('初始化失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 运行优化测试
  const handleRunTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v5/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-optimization' })
      });
      
      const data = await response.json();
      if (data.success) {
        setTestResults(data.data);
        await loadServiceStatus();
        setActiveTab('testing');
      }
    } catch (error) {
      console.error('测试运行失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 运行工作负载模拟
  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v5/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'simulate-workload',
          taskCount: 8
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSimulationResults(data.data);
        await loadServiceStatus();
        setActiveTab('simulation');
      }
    } catch (error) {
      console.error('模拟运行失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 重置服务
  const handleReset = async () => {
    if (!confirm('确定要重置自动化效率优化服务吗？所有统计数据将被清除。')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/v5/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadServiceStatus();
        await loadPerformanceReport();
      }
    } catch (error) {
      console.error('重置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取优化状态
  const getOptimizationStatus = () => {
    if (!serviceStatus) return { color: 'gray', text: '未知' };
    
    const { onTrack } = serviceStatus.optimizationStatus;
    
    if (onTrack) {
      return { color: 'bg-green-100 text-green-800', text: '正常' };
    } else {
      return { color: 'bg-yellow-100 text-yellow-800', text: '需改进' };
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 标题和状态 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Zap className="h-8 w-8 mr-3 text-yellow-600" />
            自动化效率优化系统
          </h1>
          <p className="text-gray-600">减少70% Token使用，提升50%开发效率</p>
        </div>
        <div className="flex items-center space-x-4">
          {serviceStatus && (
            <>
              <Badge className={getStatusColor(serviceStatus.status)}>
                {serviceStatus.status}
              </Badge>
              <Badge className={getOptimizationStatus().color}>
                {getOptimizationStatus().text}
              </Badge>
            </>
          )}
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={loadServiceStatus} disabled={loading}>
              刷新状态
            </Button>
            <Button variant="outline" size="sm" onClick={handleInitialize} disabled={loading}>
              初始化
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="dashboard" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            仪表板
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            指标分析
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center">
            <TestTube className="h-4 w-4 mr-2" />
            优化测试
          </TabsTrigger>
          <TabsTrigger value="simulation" className="flex items-center">
            <LineChart className="h-4 w-4 mr-2" />
            工作负载模拟
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center">
            <Cpu className="h-4 w-4 mr-2" />
            系统配置
          </TabsTrigger>
        </TabsList>

        {/* 仪表板标签页 */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* 关键指标卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Token减少 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Token减少
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {serviceStatus?.optimizationStatus?.currentTokenReduction || '0'}%
                </div>
                <div className="text-sm text-gray-500">
                  目标: {serviceStatus?.config?.tokenOptimization?.targetReduction || 70}%
                </div>
                <Progress 
                  value={parseFloat(serviceStatus?.optimizationStatus?.currentTokenReduction || '0')} 
                  max={serviceStatus?.config?.tokenOptimization?.targetReduction || 70}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {/* 效率提升 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  效率提升
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {serviceStatus?.optimizationStatus?.currentEfficiencyGain || '0'}%
                </div>
                <div className="text-sm text-gray-500">
                  目标: {serviceStatus?.config?.efficiencyOptimization?.targetGain || 50}%
                </div>
                <Progress 
                  value={parseFloat(serviceStatus?.optimizationStatus?.currentEfficiencyGain || '0')} 
                  max={serviceStatus?.config?.efficiencyOptimization?.targetGain || 50}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {/* 成本节省 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  成本节省
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${serviceStatus?.metrics?.costSavings?.totalSavings?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-gray-500">
                  ROI: {serviceStatus?.metrics?.costSavings?.roi?.toFixed(1) || '0'}%
                </div>
                <div className="mt-2 text-xs">
                  Token: ${serviceStatus?.metrics?.costSavings?.tokenCost?.toFixed(2) || '0.00'}
                  <span className="mx-1">•</span>
                  时间: ${serviceStatus?.metrics?.costSavings?.timeCost?.toFixed(2) || '0.00'}
                </div>
              </CardContent>
            </Card>

            {/* 系统性能 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Server className="h-4 w-4 mr-2" />
                  系统性能
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {serviceStatus?.metrics?.systemPerformance?.responseTime?.toFixed(0) || '0'}ms
                </div>
                <div className="text-sm text-gray-500">
                  成功率: {serviceStatus?.metrics?.systemPerformance?.successRate?.toFixed(1) || '0'}%
                </div>
                <div className="mt-2 text-xs">
                  缓存命中: {serviceStatus?.metrics?.systemPerformance?.cacheHitRate?.toFixed(1) || '0'}%
                  <span className="mx-1">•</span>
                  错误率: {serviceStatus?.metrics?.systemPerformance?.errorRate?.toFixed(1) || '0'}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 集成系统状态 */}
          <Card>
            <CardHeader>
              <CardTitle>集成系统状态</CardTitle>
              <CardDescription>自动化效率优化系统集成的子系统</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Brain className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <div className="font-medium">知识增强开发</div>
                  <div className="text-sm text-gray-600">
                    {serviceStatus?.integrations?.knowledgeEnhanced ? '✅ 已集成' : '❌ 未集成'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Cpu className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <div className="font-medium">智能任务分发</div>
                  <div className="text-sm text-gray-600">
                    {serviceStatus?.integrations?.intelligentDispatch ? '✅ 已集成' : '❌ 未集成'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Database className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <div className="font-medium">上下文缓存</div>
                  <div className="text-sm text-gray-600">
                    {serviceStatus?.integrations?.contextCache ? '✅ 已集成' : '❌ 未集成'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Server className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                  <div className="font-medium">统一网关</div>
                  <div className="text-sm text-gray-600">
                    {serviceStatus?.integrations?.unifiedGateway ? '✅ 已集成' : '❌ 未集成'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 快速操作 */}
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
              <CardDescription>自动化效率优化系统的快速操作</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={handleRunTest} disabled={loading} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  运行优化测试
                </Button>
                
                <Button onClick={handleRunSimulation} disabled={loading} variant="outline" className="w-full">
                  <LineChart className="h-4 w-4 mr-2" />
                  工作负载模拟
                </Button>
                
                <Button onClick={handleReset} disabled={loading} variant="destructive" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重置服务
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 优化策略 */}
          {serviceStatus?.config?.tokenOptimization?.strategies && (
            <Card>
              <CardHeader>
                <CardTitle>优化策略</CardTitle>
                <CardDescription>当前启用的Token优化策略</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {serviceStatus.config.tokenOptimization.strategies.map((strategy: string, index: number) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                      <CheckCircle className="h-4 w-4 mr-3 text-green-600" />
                      <div>
                        <div className="font-medium">{strategy}</div>
                        <div className="text-sm text-gray-600">
                          {strategy === 'context-caching' && '通过上下文缓存减少重复计算'}
                          {strategy === 'response-compression' && '压缩响应内容减少Token使用'}
                          {strategy === 'intelligent-routing' && '智能路由选择最优处理系统'}
                          {strategy === 'knowledge-reuse' && '重用已有知识减少重复生成'}
                          {strategy === 'batch-processing' && '批量处理提高效率'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 指标分析标签页 */}
        <TabsContent value="metrics" className="space-y-6">
          {performanceReport ? (
            <>
              {/* 性能摘要 */}
              <Card>
                <CardHeader>
                  <CardTitle>性能摘要</CardTitle>
                  <CardDescription>自动化效率优化的关键性能指标</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {performanceReport.summary.tokenReduction}
                      </div>
                      <div className="text-sm text-gray-600">Token减少</div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {performanceReport.summary.efficiencyGain}
                      </div>
                      <div className="text-sm text-gray-600">效率提升</div>
                    </div>
                    
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {performanceReport.summary.totalSavings}
                      </div>
                      <div className="text-sm text-gray-600">总节省</div>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {performanceReport.summary.roi}
                      </div>
                      <div className="text-sm text-gray-600">投资回报率</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 详细指标 */}
              <Card>
                <CardHeader>
                  <CardTitle>详细指标</CardTitle>
                  <CardDescription>自动化效率优化的详细性能数据</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Token使用指标 */}
                    <div>
                      <h3 className="text-lg font-medium mb-3 flex items-center">
                        <Zap className="h-5 w-5 mr-2" />
                        Token使用指标
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">当前使用</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.tokenUsage.current?.toFixed(0) || '0'}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">基线使用</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.tokenUsage.baseline?.toFixed(0) || '0'}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">减少百分比</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.tokenUsage.reduction?.toFixed(1) || '0'}%
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">节省Token</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.tokenUsage.saved?.toFixed(0) || '0'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 开发效率指标 */}
                    <div>
                      <h3 className="text-lg font-medium mb-3 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        开发效率指标
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">完成任务</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.developmentEfficiency.tasksCompleted || '0'}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">节省时间</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.developmentEfficiency.timeSaved?.toFixed(1) || '0'}小时
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">效率提升</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.developmentEfficiency.efficiencyGain?.toFixed(1) || '0'}%
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">自动化率</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.developmentEfficiency.automationRate?.toFixed(1) || '0'}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 系统性能指标 */}
                    <div>
                      <h3 className="text-lg font-medium mb-3 flex items-center">
                        <Server className="h-5 w-5 mr-2" />
                        系统性能指标
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">响应时间</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.systemPerformance.responseTime?.toFixed(0) || '0'}ms
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">缓存命中率</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.systemPerformance.cacheHitRate?.toFixed(1) || '0'}%
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">成功率</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.systemPerformance.successRate?.toFixed(1) || '0'}%
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">错误率</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.systemPerformance.errorRate?.toFixed(1) || '0'}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 近期性能趋势 */}
              {performanceReport.recentPerformance && performanceReport.recentPerformance.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>近期性能趋势</CardTitle>
                    <CardDescription>最近10次性能记录</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {performanceReport.recentPerformance.map((record: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="text-sm">
                            <div className="font-medium">
                              {new Date(record.timestamp).toLocaleTimeString('zh-CN', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            <div className="text-gray-600">
                              {new Date(record.timestamp).toLocaleDateString('zh-CN')}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Token使用</div>
                              <div className="font-medium">{record.tokenUsage}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">响应时间</div>
                              <div className="font-medium">{record.responseTime}ms</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">缓存命中</div>
                              <div className="font-medium">{record.cacheHitRate}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 优化建议 */}
              {performanceReport.recommendations && performanceReport.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>优化建议</CardTitle>
                    <CardDescription>基于当前性能数据的改进建议</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {performanceReport.recommendations.map((rec: any, index: number) => (
                        <div key={index} className={`p-4 rounded-lg ${
                          rec.impact === 'high' ? 'bg-red-50 border border-red-200' :
                          rec.impact === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                          'bg-blue-50 border border-blue-200'
                        }`}>
                          <div className="flex items-start">
                            <div className={`p-2 rounded mr-3 ${
                              rec.impact === 'high' ? 'bg-red-100 text-red-800' :
                              rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {rec.impact === 'high' ? <AlertTriangle className="h-5 w-5" /> :
                               rec.impact === 'medium' ? <Target className="h-5 w-5" /> :
                               <CheckCircle className="h-5 w-5" />}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{rec.area}</div>
                              <div className="text-gray-700 mt-1">{rec.suggestion}</div>
                              <div className="flex items-center mt-2">
                                <Badge className={getPriorityColor(rec.impact)}>
                                  影响: {rec.impact}
                                </Badge>
                                <Badge variant="outline" className="ml-2">
                                  工作量: {rec.effort}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="text-gray-500">加载性能报告中...</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 优化测试标签页 */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>优化测试</CardTitle>
              <CardDescription>测试自动化效率优化系统的效果</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Button onClick={handleRunTest} disabled={loading} className="w-full">
                  {loading ? '测试运行中...' : '运行优化测试'}
                  <TestTube className="ml-2 h-4 w-4" />
                </Button>

                {/* 测试结果 */}
                {testResults && (
                  <div className="space-y-6">
                    {/* 测试摘要 */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{testResults.testSummary.totalTasks}</div>
                            <div className="text-sm text-gray-500">总任务数</div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {testResults.testSummary.successRate}
                            </div>
                            <div className="text-sm text-gray-500">成功率</div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{testResults.testSummary.totalTokenSavings}</div>
                            <div className="text-sm text-gray-500">节省Token</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* 优化进度 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">优化进度</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Token减少进度</span>
                              <span>{testResults.optimizationProgress.tokenReduction} / 70% 目标</span>
                            </div>
                            <Progress 
                              value={parseFloat(testResults.optimizationProgress.tokenReduction)} 
                              max={70}
                            />
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>效率提升进度</span>
                              <span>{testResults.optimizationProgress.efficiencyGain} / 50% 目标</span>
                            </div>
                            <Progress 
                              value={parseFloat(testResults.optimizationProgress.efficiencyGain)} 
                              max={50}
                            />
                          </div>
                          
                          <div className={`p-3 rounded-lg ${
                            testResults.optimizationProgress.onTrack ? 
                            'bg-green-50 text-green-800' : 
                            'bg-yellow-50 text-yellow-800'
                          }`}>
                            <div className="flex items-center">
                              {testResults.optimizationProgress.onTrack ? 
                                <CheckCircle className="h-5 w-5 mr-2" /> :
                                <AlertTriangle className="h-5 w-5 mr-2" />
                              }
                              <div>
                                <div className="font-medium">
                                  {testResults.optimizationProgress.onTrack ? 
                                    '✅ 优化进度正常' : 
                                    '⚠️ 优化进度需改进'
                                  }
                                </div>
                                <div className="text-sm">
                                  {testResults.optimizationProgress.onTrack ? 
                                    '当前优化进度达到目标70%以上' :
                                    '当前优化进度未达到目标，需要调整优化策略'
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 成本节省 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">成本节省分析</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Token成本节省:</span>
                            <span className="font-medium">
                              ${(parseFloat(testResults.testSummary.totalTokenSavings) * 0.002 / 1000).toFixed(4)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-gray-600">时间成本节省:</span>
                            <span className="font-medium">
                              ${(parseFloat(testResults.testSummary.totalTimeSavings) * 50).toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between border-t pt-2">
                            <span className="font-medium">总成本节省:</span>
                            <span className="font-bold text-green-600">
                              {testResults.testSummary.estimatedCostSavings}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 工作负载模拟标签页 */}
        <TabsContent value="simulation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>工作负载模拟</CardTitle>
              <CardDescription>模拟真实工作负载测试系统性能</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Button onClick={handleRunSimulation} disabled={loading} className="w-full">
                  {loading ? '模拟运行中...' : '运行工作负载模拟 (8个任务)'}
                  <LineChart className="ml-2 h-4 w-4" />
                </Button>

                {/* 模拟结果 */}
                {simulationResults && (
                  <div className="space-y-6">
                    {/* 模拟摘要 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">模拟结果摘要</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold">{simulationResults.simulation.taskCount}</div>
                            <div className="text-sm text-gray-600">模拟任务数</div>
                          </div>
                          
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {simulationResults.simulation.successRate}
                            </div>
                            <div className="text-sm text-gray-600">成功率</div>
                          </div>
                          
                          <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold">{simulationResults.simulation.tokenReduction}</div>
                            <div className="text-sm text-gray-600">Token减少</div>
                          </div>
                        </div>
                        
                        <div className={`mt-4 p-3 rounded-lg ${
                          simulationResults.simulation.onTarget ? 
                          'bg-green-50 text-green-800' : 
                          'bg-yellow-50 text-yellow-800'
                        }`}>
                          <div className="flex items-center">
                            {simulationResults.simulation.onTarget ? 
                              <CheckCircle className="h-5 w-5 mr-2" /> :
                              <AlertTriangle className="h-5 w-5 mr-2" />
                            }
                            <div>
                              <div className="font-medium">
                                {simulationResults.simulation.onTarget ? 
                                  '✅ 达到Token减少目标' : 
                                  '⚠️ 未达到Token减少目标'
                                }
                              </div>
                              <div className="text-sm">
                                {simulationResults.simulation.onTarget ? 
                                  `Token减少 ${simulationResults.simulation.tokenReduction}，超过70%目标` :
                                  `Token减少 ${simulationResults.simulation.tokenReduction}，未达到70%目标`
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 详细结果 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">详细模拟结果</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {simulationResults.detailedResults.map((result: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div>
                                <div className="font-medium">{result.id}</div>
                                <div className="text-sm text-gray-600">
                                  类型: {result.type} | 状态: 
                                  <span className={`ml-1 ${
                                    result.status === 'completed' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {result.status === 'completed' ? '完成' : '失败'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm">
                                  <span className="text-gray-600">节省Token: </span>
                                  <span className="font-medium">{result.tokenSavings}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-gray-600">节省时间: </span>
                                  <span className="font-medium">{result.timeSavings}小时</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统配置标签页 */}
        <TabsContent value="config" className="space-y-6">
          {serviceStatus && (
            <Card>
              <CardHeader>
                <CardTitle>系统配置</CardTitle>
                <CardDescription>自动化效率优化系统的配置参数</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Token优化配置 */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Token优化配置
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">启用Token优化</div>
                          <div className="text-sm text-gray-600">是否启用Token使用优化</div>
                        </div>
                        <Badge className={serviceStatus.config.tokenOptimization.enabled ? 
                          'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {serviceStatus.config.tokenOptimization.enabled ? '已启用' : '已禁用'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">目标减少百分比</div>
                          <div className="text-sm text-gray-600">Token使用减少目标</div>
                        </div>
                        <div className="font-bold text-blue-600">
                          {serviceStatus.config.tokenOptimization.targetReduction}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 效率优化配置 */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      效率优化配置
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">启用效率优化</div>
                          <div className="text-sm text-gray-600">是否启用开发效率优化</div>
                        </div>
                        <Badge className={serviceStatus.config.efficiencyOptimization.enabled ? 
                          'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {serviceStatus.config.efficiencyOptimization.enabled ? '已启用' : '已禁用'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">目标效率提升</div>
                          <div className="text-sm text-gray-600">开发效率提升目标</div>
                        </div>
                        <div className="font-bold text-green-600">
                          {serviceStatus.config.efficiencyOptimization.targetGain}%
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">自动化级别</div>
                          <div className="text-sm text-gray-600">任务自动化程度</div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          {serviceStatus.config.efficiencyOptimization.automationLevel}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* 监控配置 */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      监控配置
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">启用监控</div>
                          <div className="text-sm text-gray-600">是否启用系统性能监控</div>
                        </div>
                        <Badge className={serviceStatus.config.monitoring.enabled ? 
                          'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {serviceStatus.config.monitoring.enabled ? '已启用' : '已禁用'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">Token使用阈值</div>
                          <div className="font-medium">
                            {serviceStatus.config.monitoring.alertThresholds.tokenUsage.toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">响应时间阈值</div>
                          <div className="font-medium">
                            {serviceStatus.config.monitoring.alertThresholds.responseTime}ms
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">错误率阈值</div>
                          <div className="font-medium">
                            {serviceStatus.config.monitoring.alertThresholds.errorRate}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 集成配置 */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <Cpu className="h-5 w-5 mr-2" />
                      集成配置
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded ${
                        serviceStatus.config.integration.knowledgeEnhanced ? 
                        'bg-green-50' : 'bg-gray-50'
                      }`}>
                        <div className="font-medium">知识增强开发</div>
                        <div className="text-sm text-gray-600">
                          {serviceStatus.config.integration.knowledgeEnhanced ? '✅ 已集成' : '❌ 未集成'}
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded ${
                        serviceStatus.config.integration.intelligentDispatch ? 
                        'bg-green-50' : 'bg-gray-50'
                      }`}>
                        <div className="font-medium">智能任务分发</div>
                        <div className="text-sm text-gray-600">
                          {serviceStatus.config.integration.intelligentDispatch ? '✅ 已集成' : '❌ 未集成'}
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded ${
                        serviceStatus.config.integration.contextCache ? 
                        'bg-green-50' : 'bg-gray-50'
                      }`}>
                        <div className="font-medium">上下文缓存</div>
                        <div className="text-sm text-gray-600">
                          {serviceStatus.config.integration.contextCache ? '✅ 已集成' : '❌ 未集成'}
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded ${
                        serviceStatus.config.integration.unifiedGateway ? 
                        'bg-green-50' : 'bg-gray-50'
                      }`}>
                        <div className="font-medium">统一网关</div>
                        <div className="text-sm text-gray-600">
                          {serviceStatus.config.integration.unifiedGateway ? '✅ 已集成' : '❌ 未集成'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
