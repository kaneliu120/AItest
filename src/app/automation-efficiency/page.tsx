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
  integrations: Record<string, any>;
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

  // Load service status
  const loadServiceStatus = async () => {
    try {
      const response = await fetch('/api/v5/automation?action=status');
      const data = await response.json();
      if (data.success) setServiceStatus(data.data);
    } catch (error) {
      console.error('Failed to load service status:', error);
    }
  };

  // Load performance report
  const loadPerformanceReport = async () => {
    try {
      const response = await fetch('/api/v5/automation?action=report');
      const data = await response.json();
      if (data.success) setPerformanceReport(data.data);
    } catch (error) {
      console.error('Failed to load performance report:', error);
    }
  };

  useEffect(() => {
    loadServiceStatus();
    loadPerformanceReport();
  }, []);

  // Initialize service
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
      console.error('Initialization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Run optimization test
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
      console.error('Test run failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Run workload simulation
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
      console.error('Simulation run failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset service
  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset the automation efficiency service? All stats will be cleared.')) {
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
      console.error('Reset failed:', error);
    } finally {
      setLoading(false);
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

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get optimization status
  const getOptimizationStatus = () => {
    if (!serviceStatus) return { color: 'gray', text: 'Unknown' };
    
    const { onTrack } = serviceStatus.optimizationStatus;
    
    if (onTrack) {
      return { color: 'bg-green-100 text-green-800', text: 'Normal' };
    } else {
      return { color: 'bg-yellow-100 text-yellow-800', text: 'Needs Improvement' };
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Title and status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Zap className="h-8 w-8 mr-3 text-yellow-600" />
            Automation Efficiency Optimizer
          </h1>
          <p className="text-gray-600">Reduce Token usage by 70%, improve development efficiency by 50%</p>
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
              Refresh Status
            </Button>
            <Button variant="outline" size="sm" onClick={handleInitialize} disabled={loading}>
              Initialize
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="dashboard" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center">
            <TestTube className="h-4 w-4 mr-2" />
            Optimization Test
          </TabsTrigger>
          <TabsTrigger value="simulation" className="flex items-center">
            <LineChart className="h-4 w-4 mr-2" />
            Workload Simulation
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center">
            <Cpu className="h-4 w-4 mr-2" />
            System Config
          </TabsTrigger>
        </TabsList>

        {/* Dashboard tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Key metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Token reduction */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Token Reduction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {serviceStatus?.optimizationStatus?.currentTokenReduction || '0'}%
                </div>
                <div className="text-sm text-gray-500">
                  Target: {serviceStatus?.config?.tokenOptimization?.targetReduction || 70}%
                </div>
                <Progress 
                  value={parseFloat(serviceStatus?.optimizationStatus?.currentTokenReduction || '0')} 
                  max={serviceStatus?.config?.tokenOptimization?.targetReduction || 70}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {/* Efficiency gain */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Efficiency Gain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {serviceStatus?.optimizationStatus?.currentEfficiencyGain || '0'}%
                </div>
                <div className="text-sm text-gray-500">
                  Target: {serviceStatus?.config?.efficiencyOptimization?.targetGain || 50}%
                </div>
                <Progress 
                  value={parseFloat(serviceStatus?.optimizationStatus?.currentEfficiencyGain || '0')} 
                  max={serviceStatus?.config?.efficiencyOptimization?.targetGain || 50}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {/* Cost savings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Cost Savings
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
                  Time: ${serviceStatus?.metrics?.costSavings?.timeCost?.toFixed(2) || '0.00'}
                </div>
              </CardContent>
            </Card>

            {/* System performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Server className="h-4 w-4 mr-2" />
                  System Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {serviceStatus?.metrics?.systemPerformance?.responseTime?.toFixed(0) || '0'}ms
                </div>
                <div className="text-sm text-gray-500">
                  Success Rate: {serviceStatus?.metrics?.systemPerformance?.successRate?.toFixed(1) || '0'}%
                </div>
                <div className="mt-2 text-xs">
                  Cache Hit: {serviceStatus?.metrics?.systemPerformance?.cacheHitRate?.toFixed(1) || '0'}%
                  <span className="mx-1">•</span>
                  Error Rate: {serviceStatus?.metrics?.systemPerformance?.errorRate?.toFixed(1) || '0'}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Integrated system status */}
          <Card>
            <CardHeader>
              <CardTitle>Integrated System Status</CardTitle>
              <CardDescription>Subsystems integrated with the Automation Efficiency Optimizer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Brain className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <div className="font-medium">Knowledge-Enhanced Dev</div>
                  <div className="text-sm text-gray-600">
                    {serviceStatus?.integrations?.knowledgeEnhanced ? '✅ Integrated' : '❌ Not integrated'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Cpu className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <div className="font-medium">Intelligent Task Dispatch</div>
                  <div className="text-sm text-gray-600">
                    {serviceStatus?.integrations?.intelligentDispatch ? '✅ Integrated' : '❌ Not integrated'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Database className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <div className="font-medium">Context Cache</div>
                  <div className="text-sm text-gray-600">
                    {serviceStatus?.integrations?.contextCache ? '✅ Integrated' : '❌ Not integrated'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Server className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                  <div className="font-medium">Unified Gateway</div>
                  <div className="text-sm text-gray-600">
                    {serviceStatus?.integrations?.unifiedGateway ? '✅ Integrated' : '❌ Not integrated'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Quick actions for the Automation Efficiency Optimizer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={handleRunTest} disabled={loading} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Run Optimization Test
                </Button>
                
                <Button onClick={handleRunSimulation} disabled={loading} variant="outline" className="w-full">
                  <LineChart className="h-4 w-4 mr-2" />
                  Workload Simulation
                </Button>
                
                <Button onClick={handleReset} disabled={loading} variant="destructive" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Service
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Optimization strategies */}
          {serviceStatus?.config?.tokenOptimization?.strategies && (
            <Card>
              <CardHeader>
                <CardTitle>Optimization Strategies</CardTitle>
                <CardDescription>Currently enabled Token optimization strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {serviceStatus.config.tokenOptimization.strategies.map((strategy: string, index: number) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                      <CheckCircle className="h-4 w-4 mr-3 text-green-600" />
                      <div>
                        <div className="font-medium">{strategy}</div>
                        <div className="text-sm text-gray-600">
                          {strategy === 'context-caching' && 'Reduce redundant computation via context caching'}
                          {strategy === 'response-compression' && 'Compress responses to reduce Token usage'}
                          {strategy === 'intelligent-routing' && 'Intelligently route to the optimal processing system'}
                          {strategy === 'knowledge-reuse' && 'Reuse existing knowledge to reduce regeneration'}
                          {strategy === 'batch-processing' && 'Improve efficiency with batch processing'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Metrics tab */}
        <TabsContent value="metrics" className="space-y-6">
          {performanceReport ? (
            <>
              {/* Performance summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                  <CardDescription>Key performance indicators for automation efficiency optimization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {performanceReport.summary.tokenReduction}
                      </div>
                      <div className="text-sm text-gray-600">Token Reduction</div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {performanceReport.summary.efficiencyGain}
                      </div>
                      <div className="text-sm text-gray-600">Efficiency Gain</div>
                    </div>
                    
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {performanceReport.summary.totalSavings}
                      </div>
                      <div className="text-sm text-gray-600">Total Savings</div>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {performanceReport.summary.roi}
                      </div>
                      <div className="text-sm text-gray-600">ROI</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Metrics</CardTitle>
                  <CardDescription>Detailed performance data for automation efficiency optimization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Token usage metrics */}
                    <div>
                      <h3 className="text-lg font-medium mb-3 flex items-center">
                        <Zap className="h-5 w-5 mr-2" />
                        Token Usage Metrics
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">Current Usage</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.tokenUsage.current?.toFixed(0) || '0'}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">Baseline Usage</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.tokenUsage.baseline?.toFixed(0) || '0'}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">Reduction %</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.tokenUsage.reduction?.toFixed(1) || '0'}%
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">Tokens Saved</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.tokenUsage.saved?.toFixed(0) || '0'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dev efficiency metrics */}
                    <div>
                      <h3 className="text-lg font-medium mb-3 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Dev Efficiency Metrics
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">Tasks Completed</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.developmentEfficiency.tasksCompleted || '0'}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">Time Saved</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.developmentEfficiency.timeSaved?.toFixed(1) || '0'}h
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">Efficiency Gain</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.developmentEfficiency.efficiencyGain?.toFixed(1) || '0'}%
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">Automation Rate</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.developmentEfficiency.automationRate?.toFixed(1) || '0'}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* System performance metrics */}
                    <div>
                      <h3 className="text-lg font-medium mb-3 flex items-center">
                        <Server className="h-5 w-5 mr-2" />
                        System Performance Metrics
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">Response Time</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.systemPerformance.responseTime?.toFixed(0) || '0'}ms
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">Cache Hit Rate</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.systemPerformance.cacheHitRate?.toFixed(1) || '0'}%
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">Success Rate</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.systemPerformance.successRate?.toFixed(1) || '0'}%
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">Error Rate</div>
                          <div className="text-xl font-bold">
                            {performanceReport.detailedMetrics.systemPerformance.errorRate?.toFixed(1) || '0'}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent performance trends */}
              {performanceReport.recentPerformance && performanceReport.recentPerformance.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Performance Trends</CardTitle>
                    <CardDescription>Last 10 performance records</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {performanceReport.recentPerformance.map((record: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="text-sm">
                            <div className="font-medium">
                              {new Date(record.timestamp).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            <div className="text-gray-600">
                              {new Date(record.timestamp).toLocaleDateString('en-US')}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Token Usage</div>
                              <div className="font-medium">{record.tokenUsage}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Response Time</div>
                              <div className="font-medium">{record.responseTime}ms</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Cache Hit</div>
                              <div className="font-medium">{record.cacheHitRate}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Optimization suggestions */}
              {performanceReport.recommendations && performanceReport.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Suggestions</CardTitle>
                    <CardDescription>Improvement suggestions based on current performance data</CardDescription>
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
                                  Impact: {rec.impact}
                                </Badge>
                                <Badge variant="outline" className="ml-2">
                                  Effort: {rec.effort}
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
                <div className="text-gray-500">Loading performance report...</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Optimization test tab */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Test</CardTitle>
              <CardDescription>Test the effectiveness of the Automation Efficiency Optimizer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Button onClick={handleRunTest} disabled={loading} className="w-full">
                  {loading ? 'Running test...' : 'Run Optimization Test'}
                  <TestTube className="ml-2 h-4 w-4" />
                </Button>

                {/* Test results */}
                {testResults && (
                  <div className="space-y-6">
                    {/* Test summary */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{testResults.testSummary.totalTasks}</div>
                            <div className="text-sm text-gray-500">Total Tasks</div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {testResults.testSummary.successRate}
                            </div>
                            <div className="text-sm text-gray-500">Success Rate</div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{testResults.testSummary.totalTokenSavings}</div>
                            <div className="text-sm text-gray-500">Tokens Saved</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Optimization progress */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Optimization Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Token Reduction Progress</span>
                              <span>{testResults.optimizationProgress.tokenReduction} / 70% target</span>
                            </div>
                            <Progress 
                              value={parseFloat(testResults.optimizationProgress.tokenReduction)} 
                              max={70}
                            />
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Efficiency Gain Progress</span>
                              <span>{testResults.optimizationProgress.efficiencyGain} / 50% target</span>
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
                                    '✅ Optimization Progress On Track' : 
                                    '⚠️ Optimization Progress Needs Improvement'
                                  }
                                </div>
                                <div className="text-sm">
                                  {testResults.optimizationProgress.onTrack ? 
                                    'Current optimization progress exceeds 70% target' :
                                    'Current optimization progress is below target, adjust optimization strategies'
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cost savings */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Cost Savings Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Token Cost Savings:</span>
                            <span className="font-medium">
                              ${(parseFloat(testResults.testSummary.totalTokenSavings) * 0.002 / 1000).toFixed(4)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-gray-600">Time Cost Savings:</span>
                            <span className="font-medium">
                              ${(parseFloat(testResults.testSummary.totalTimeSavings) * 50).toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between border-t pt-2">
                            <span className="font-medium">Total Cost Savings:</span>
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

        {/* Workload simulation tab */}
        <TabsContent value="simulation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workload Simulation</CardTitle>
              <CardDescription>Simulate real workloads to test system performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Button onClick={handleRunSimulation} disabled={loading} className="w-full">
                  {loading ? 'Running simulation...' : 'Run Workload Simulation (8 tasks)'}
                  <LineChart className="ml-2 h-4 w-4" />
                </Button>

                {/* Simulation results */}
                {simulationResults && (
                  <div className="space-y-6">
                    {/* Simulation summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Simulation Results Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold">{simulationResults.simulation.taskCount}</div>
                            <div className="text-sm text-gray-600">Simulated Tasks</div>
                          </div>
                          
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {simulationResults.simulation.successRate}
                            </div>
                            <div className="text-sm text-gray-600">Success Rate</div>
                          </div>
                          
                          <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold">{simulationResults.simulation.tokenReduction}</div>
                            <div className="text-sm text-gray-600">Token Reduction</div>
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
                                  '✅ Token Reduction Target Achieved' : 
                                  '⚠️ Token Reduction Target Not Met'
                                }
                              </div>
                              <div className="text-sm">
                                {simulationResults.simulation.onTarget ? 
                                  `Token reduction ${simulationResults.simulation.tokenReduction}, exceeds 70% target` :
                                  `Token reduction ${simulationResults.simulation.tokenReduction}, below 70% target`
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Detailed results */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Detailed Simulation Results</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {simulationResults.detailedResults.map((result: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div>
                                <div className="font-medium">{result.id}</div>
                                <div className="text-sm text-gray-600">
                                  Type: {result.type} | Status: 
                                  <span className={`ml-1 ${
                                    result.status === 'completed' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {result.status === 'completed' ? 'Completed' : 'Failed'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm">
                                  <span className="text-gray-600">Tokens Saved: </span>
                                  <span className="font-medium">{result.tokenSavings}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-gray-600">Time Saved: </span>
                                  <span className="font-medium">{result.timeSavings}h</span>
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

        {/* System config tab */}
        <TabsContent value="config" className="space-y-6">
          {serviceStatus && (
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Configuration parameters for the Automation Efficiency Optimizer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Token optimization config */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Token Optimization Config
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">Enable Token Optimization</div>
                          <div className="text-sm text-gray-600">Enable optimization of Token usage</div>
                        </div>
                        <Badge className={serviceStatus.config.tokenOptimization.enabled ? 
                          'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {serviceStatus.config.tokenOptimization.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">Target Reduction %</div>
                          <div className="text-sm text-gray-600">Token usage reduction target</div>
                        </div>
                        <div className="font-bold text-blue-600">
                          {serviceStatus.config.tokenOptimization.targetReduction}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Efficiency optimization config */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Efficiency Optimization Config
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">Enable Efficiency Optimization</div>
                          <div className="text-sm text-gray-600">Enable dev efficiency optimization</div>
                        </div>
                        <Badge className={serviceStatus.config.efficiencyOptimization.enabled ? 
                          'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {serviceStatus.config.efficiencyOptimization.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">Target Efficiency Gain</div>
                          <div className="text-sm text-gray-600">Development efficiency gain target</div>
                        </div>
                        <div className="font-bold text-green-600">
                          {serviceStatus.config.efficiencyOptimization.targetGain}%
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">Automation Level</div>
                          <div className="text-sm text-gray-600">Degree of task automation</div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          {serviceStatus.config.efficiencyOptimization.automationLevel}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Monitoring config */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Monitoring Config
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">Enable Monitoring</div>
                          <div className="text-sm text-gray-600">Enable system performance monitoring</div>
                        </div>
                        <Badge className={serviceStatus.config.monitoring.enabled ? 
                          'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {serviceStatus.config.monitoring.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">Token Usage Threshold</div>
                          <div className="font-medium">
                            {serviceStatus.config.monitoring.alertThresholds.tokenUsage.toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">Response Time Threshold</div>
                          <div className="font-medium">
                            {serviceStatus.config.monitoring.alertThresholds.responseTime}ms
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-600">Error Rate Threshold</div>
                          <div className="font-medium">
                            {serviceStatus.config.monitoring.alertThresholds.errorRate}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Integration config */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <Cpu className="h-5 w-5 mr-2" />
                      Integration Config
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded ${
                        serviceStatus.config.integration.knowledgeEnhanced ? 
                        'bg-green-50' : 'bg-gray-50'
                      }`}>
                        <div className="font-medium">Knowledge-Enhanced Dev</div>
                        <div className="text-sm text-gray-600">
                          {serviceStatus.config.integration.knowledgeEnhanced ? '✅ Integrated' : '❌ Not integrated'}
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded ${
                        serviceStatus.config.integration.intelligentDispatch ? 
                        'bg-green-50' : 'bg-gray-50'
                      }`}>
                        <div className="font-medium">Intelligent Task Dispatch</div>
                        <div className="text-sm text-gray-600">
                          {serviceStatus.config.integration.intelligentDispatch ? '✅ Integrated' : '❌ Not integrated'}
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded ${
                        serviceStatus.config.integration.contextCache ? 
                        'bg-green-50' : 'bg-gray-50'
                      }`}>
                        <div className="font-medium">Context Cache</div>
                        <div className="text-sm text-gray-600">
                          {serviceStatus.config.integration.contextCache ? '✅ Integrated' : '❌ Not integrated'}
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded ${
                        serviceStatus.config.integration.unifiedGateway ? 
                        'bg-green-50' : 'bg-gray-50'
                      }`}>
                        <div className="font-medium">Unified Gateway</div>
                        <div className="text-sm text-gray-600">
                          {serviceStatus.config.integration.unifiedGateway ? '✅ Integrated' : '❌ Not integrated'}
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
