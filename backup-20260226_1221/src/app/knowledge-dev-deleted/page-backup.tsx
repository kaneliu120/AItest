'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Code, 
  Database, 
  Cpu,
  Zap,
  BookOpen,
  Lightbulb,
  TrendingUp,
  Target,
  Layers,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  TestTube,
  Rocket,
  Sparkles,
  Shield,
  Wrench,
  FileCode,
  Server
} from 'lucide-react';

interface ServiceStatus {
  status: string;
  service: string;
  features: string[];
  capabilities: string[];
  endpoints: any;
}

interface TaskAnalysis {
  taskType: string;
  complexity: string;
  knowledgeRequirements: string[];
  estimatedEffort: number;
  priority: string;
  relatedPatterns: string[];
  bestPractices: string[];
  commonPitfalls: string[];
}

interface Enhancement {
  type: string;
  description: string;
  impact: string;
  implementation: string;
}

interface QualityMetrics {
  completeness: number;
  accuracy: number;
  relevance: number;
  practicality: number;
}

interface KnowledgeSource {
  source: string;
  relevance: number;
  content: string;
  confidence: number;
}

export default function KnowledgeDevPage() {
  const [query, setQuery] = useState('');
  const [enhancementLevel, setEnhancementLevel] = useState('enhanced');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [activeTab, setActiveTab] = useState('enhance');
  const [testResults, setTestResults] = useState<any>(null);

  // 示例开发任务
  const exampleTasks = [
    {
      name: 'React组件',
      query: '创建一个可复用的数据表格组件，支持排序、筛选和分页',
      type: 'code-generation',
      icon: <Code className="h-4 w-4" />
    },
    {
      name: 'API设计',
      query: '设计一个电商系统的商品管理REST API',
      type: 'api-design',
      icon: <Server className="h-4 w-4" />
    },
    {
      name: '数据库',
      query: '设计一个社交媒体的用户关系数据库模型',
      type: 'database-design',
      icon: <Database className="h-4 w-4" />
    },
    {
      name: '测试策略',
      query: '为微服务应用设计端到端测试策略',
      type: 'testing-strategy',
      icon: <TestTube className="h-4 w-4" />
    }
  ];

  // 加载服务状态
  const loadServiceStatus = async () => {
    try {
      const response = await fetch('/api/v4/knowledge-dev?action=status');
      const data = await response.json();
      if (data.success) setServiceStatus(data.data);
    } catch (error) {
      console.error('加载服务状态失败:', error);
    }
  };

  // 存档当前会话
  const archiveSession = async () => {
    try {
      const response = await fetch('/api/v4/knowledge-dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive',
          sessionData: {
            query,
            result,
            serviceStatus,
            timestamp: new Date().toISOString(),
            tab: activeTab
          }
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('✅ 会话已成功存档到知识管理系统！');
        // 更新存档记录
        updateArchiveRecords();
      } else {
        alert('❌ 存档失败: ' + data.error);
      }
    } catch (error) {
      console.error('存档失败:', error);
      alert('❌ 存档失败，请检查网络连接');
    }
  };

  // 更新所有存档记录
  const updateArchiveRecords = async () => {
    try {
      const response = await fetch('/api/v4/knowledge-dev?action=update-archives');
      const data = await response.json();
      if (data.success) {
        console.log('✅ 存档记录已更新:', data.message);
      }
    } catch (error) {
      console.error('更新存档记录失败:', error);
    }
  };

  // 自动存档 - 当页面加载时自动存档访问记录
  const autoArchiveVisit = async () => {
    try {
      const response = await fetch('/api/v4/knowledge-dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive-visit',
          visitData: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            path: window.location.pathname
          }
        })
      });
    } catch (error) {
      console.error('自动存档失败:', error);
    }
  };

  useEffect(() => {
    loadServiceStatus();
    // 页面加载时自动存档访问记录
    autoArchiveVisit();
  }, []);

  // 处理知识增强
  const handleEnhance = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/v4/knowledge-dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enhance',
          query,
          priority,
          enhancementLevel,
          context: { source: 'web-ui' }
        })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('知识增强失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 运行测试场景
  const handleRunTests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v4/knowledge-dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-scenarios'
        })
      });
      
      const data = await response.json();
      setTestResults(data.data);
      setActiveTab('testing');
    } catch (error) {
      console.error('测试运行失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 使用示例任务
  const useExampleTask = (task: any) => {
    setQuery(task.query);
    setPriority('medium');
  };

  // 获取影响颜色
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取任务类型图标
  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'code-generation': return <Code className="h-4 w-4" />;
      case 'api-design': return <Server className="h-4 w-4" />;
      case 'database-design': return <Database className="h-4 w-4" />;
      case 'architecture-design': return <Layers className="h-4 w-4" />;
      case 'testing-strategy': return <TestTube className="h-4 w-4" />;
      case 'deployment-plan': return <Rocket className="h-4 w-4" />;
      case 'security-audit': return <Shield className="h-4 w-4" />;
      default: return <FileCode className="h-4 w-4" />;
    }
  };

  // 获取任务类型颜色
  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'code-generation': return 'bg-blue-100 text-blue-800';
      case 'api-design': return 'bg-green-100 text-green-800';
      case 'database-design': return 'bg-purple-100 text-purple-800';
      case 'architecture-design': return 'bg-indigo-100 text-indigo-800';
      case 'testing-strategy': return 'bg-pink-100 text-pink-800';
      case 'deployment-plan': return 'bg-orange-100 text-orange-800';
      case 'security-audit': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 标题和状态 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Brain className="h-8 w-8 mr-3 text-indigo-600" />
            知识增强开发流程
          </h1>
          <p className="text-gray-600">基于知识库的智能开发支持和优化</p>
        </div>
        <div className="flex items-center space-x-4">
          {serviceStatus && (
            <Badge variant="default" className="text-sm">
              🧠 {serviceStatus.capabilities.length} 种开发能力
            </Badge>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={archiveSession}
            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
          >
            💾 存档会话
          </Button>
          <Button variant="outline" size="sm" onClick={loadServiceStatus}>
            刷新状态
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="enhance" className="flex items-center">
            <Sparkles className="h-4 w-4 mr-2" />
            知识增强
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center">
            <Target className="h-4 w-4 mr-2" />
            任务分析
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center">
            <TestTube className="h-4 w-4 mr-2" />
            场景测试
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            系统状态
          </TabsTrigger>
        </TabsList>

        {/* 知识增强标签页 */}
        <TabsContent value="enhance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：输入面板 */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>知识增强开发</CardTitle>
                  <CardDescription>输入开发任务，系统将基于知识库提供增强的解决方案</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="query">开发任务描述</Label>
                    <Textarea
                      id="query"
                      placeholder="例如：创建一个用户登录表单组件，包含邮箱、密码输入框和提交按钮，使用React Hooks和TypeScript"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="enhancementLevel">增强级别</Label>
                      <Select value={enhancementLevel} onValueChange={setEnhancementLevel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">基础 (通用知识)</SelectItem>
                          <SelectItem value="enhanced">增强 (领域知识)</SelectItem>
                          <SelectItem value="expert">专家 (深度知识)</SelectItem>
                          <SelectItem value="contextual">上下文 (项目知识)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="priority">优先级</Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">低优先级</SelectItem>
                          <SelectItem value="medium">中优先级</SelectItem>
                          <SelectItem value="high">高优先级</SelectItem>
                          <SelectItem value="critical">关键优先级</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleEnhance} disabled={loading || !query.trim()} className="w-full">
                    {loading ? '知识增强处理中...' : '开始知识增强开发'}
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* 示例任务 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">示例开发任务</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {exampleTasks.map((task, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto py-3 justify-start text-left"
                        onClick={() => useExampleTask(task)}
                      >
                        <div className="flex items-start">
                          <div className="mr-3 mt-1">{task.icon}</div>
                          <div>
                            <div className="font-medium">{task.name}</div>
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {task.query.substring(0, 50)}...
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 结果显示 */}
              {result && result.data?.enhanced && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>知识增强结果</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={getTaskTypeColor(result.data.enhanced.enhancedResponse.data?.taskAnalysis?.type || 'unknown')}>
                          {result.data.enhanced.enhancedResponse.data?.taskAnalysis?.type || 'unknown'}
                        </Badge>
                        <Badge variant="outline">
                          {enhancementLevel} 增强
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      请求ID: {result.data.requestId} | 处理时间: {result.data.processingTime}ms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* 任务分析 */}
                      {result.data.enhanced.enhancedResponse.data?.taskAnalysis && (
                        <div>
                          <div className="font-medium mb-3 flex items-center">
                            <Target className="h-4 w-4 mr-2" />
                            任务分析
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card>
                              <CardContent className="pt-6">
                                <div className="text-center">
                                  <div className="text-2xl font-bold">
                                    {result.data.enhanced.enhancedResponse.data.taskAnalysis.type}
                                  </div>
                                  <div className="text-sm text-gray-500">任务类型</div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardContent className="pt-6">
                                <div className="text-center">
                                  <div className="text-2xl font-bold">
                                    {result.data.enhanced.enhancedResponse.data.taskAnalysis.complexity}
                                  </div>
                                  <div className="text-sm text-gray-500">复杂度</div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardContent className="pt-6">
                                <div className="text-center">
                                  <div className="text-2xl font-bold">
                                    {result.data.enhanced.enhancedResponse.data.taskAnalysis.estimatedEffort}h
                                  </div>
                                  <div className="text-sm text-gray-500">预估工时</div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardContent className="pt-6">
                                <div className="text-center">
                                  <div className="text-2xl font-bold">
                                    {result.data.enhanced.enhancedResponse.data.taskAnalysis.priority}
                                  </div>
                                  <div className="text-sm text-gray-500">优先级</div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      )}

                      {/* 质量指标 */}
                      {result.data.enhanced.qualityMetrics && (
                        <div>
                          <div className="font-medium mb-3 flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            质量指标
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>完整性</span>
                                <span>{(result.data.enhanced.qualityMetrics.completeness * 100).toFixed(1)}%</span>
                              </div>
                              <Progress value={result.data.enhanced.qualityMetrics.completeness * 100} />
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>准确性</span>
                                <span>{(result.data.enhanced.qualityMetrics.accuracy * 100).toFixed(1)}%</span>
                              </div>
                              <Progress value={result.data.enhanced.qualityMetrics.accuracy * 100} />
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>相关性</span>
                                <span>{(result.data.enhanced.qualityMetrics.relevance * 100).toFixed(1)}%</span>
                              </div>
                              <Progress value={result.data.enhanced.qualityMetrics.relevance * 100} />
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>实用性</span>
                                <span>{(result.data.enhanced.qualityMetrics.practicality * 100).toFixed(1)}%</span>
                              </div>
                              <Progress value={result.data.enhanced.qualityMetrics.practicality * 100} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 增强内容 */}
                      {result.data.enhanced.enhancements && result.data.enhanced.enhancements.length > 0 && (
                        <div>
                          <div className="font-medium mb-3 flex items-center">
                            <Sparkles className="h-4 w-4 mr-2" />
                            增强内容 ({result.data.enhanced.enhancements.length} 项)
                          </div>
                          <div className="space-y-3">
                            {result.data.enhanced.enhancements.map((enh: any, index: number) => (
                              <Card key={index}>
                                <CardContent className="pt-6">
                                  <div className="flex items-start">
                                    <div className={`p-2 rounded-lg mr-3 ${getImpactColor(enh.impact)}`}>
                                      {enh.type === 'best-practice' && <CheckCircle className="h-5 w-5" />}
                                      {enh.type === 'pattern' && <Layers className="h-5 w-5" />}
                                      {enh.type === 'warning' && <AlertTriangle className="h-5 w-5" />}
                                      {enh.type === 'optimization' && <Zap className="h-5 w-5" />}
                                      {enh.type === 'code-example' && <Code className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium">{enh.description}</div>
                                      <div className="text-sm text-gray-600 mt-1">{enh.implementation}</div>
                                      <div className="flex items-center mt-2">
                                        <Badge className={getImpactColor(enh.impact)}>
                                          影响: {enh.impact}
                                        </Badge>
                                        <Badge variant="outline" className="ml-2">
                                          {enh.type}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 知识来源 */}
                      {result.data.enhanced.knowledgeSources && result.data.enhanced.knowledgeSources.length > 0 && (
                        <div>
                          <div className="font-medium mb-3 flex items-center">
                            <BookOpen className="h-4 w-4 mr-2" />
                            知识来源 ({result.data.enhanced.knowledgeSources.length} 个)
                          </div>
                          <div className="space-y-2">
                            {result.data.enhanced.knowledgeSources.map((source: any, index: number) => (
                              <div key={index} className="text-sm p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <div className="font-medium">{source.source}</div>
                                  <div className="flex items-center">
                                    <span className="mr-2">相关性: {(source.relevance * 100).toFixed(1)}%</span>
                                    <Progress value={source.relevance * 100} className="w-16" />
                                  </div>
                                </div>
                                <div className="text-gray-600 mt-1">{source.content}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  置信度: {(source.confidence * 100).toFixed(1)}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 改进建议 */}
                      {result.data.enhanced.recommendations && result.data.enhanced.recommendations.length > 0 && (
                        <div>
                          <div className="font-medium mb-3 flex items-center">
                            <Lightbulb className="h-4 w-4 mr-2" />
                            改进建议
                          </div>
                          <div className="space-y-2">
                            {result.data.enhanced.recommendations.map((rec: any, index: number) => (
                              <div key={index} className="text-sm p-3 bg-blue-50 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <div className="font-medium">{rec.area}</div>
                                  <Badge className={getImpactColor(rec.priority)}>
                                    {rec.priority} 优先级
                                  </Badge>
                                </div>
                                <div className="text-gray-700 mt-1">{rec.suggestion}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 右侧：状态面板 */}
            <div className="space-y-6">
              {/* 服务状态 */}
              {serviceStatus && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Cpu className="h-4 w-4 mr-2" />
                      服务状态
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">状态</span>
                        <Badge className="bg-green-100 text-green-800">
                          {serviceStatus.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">服务</span>
                        <span className="font-medium">{serviceStatus.service}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">功能特性</span>
                        <span className="font-medium">{serviceStatus.features.length}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">开发能力</span>
                        <span className="font-medium">{serviceStatus.capabilities.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 能力列表 */}
              {serviceStatus && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">开发能力</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {serviceStatus.capabilities.slice(0, 8).map((capability, index) => (
                        <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            {getTaskTypeIcon(capability)}
                            <span className="ml-2">{capability}</span>
                          </div>
                        </div>
                      ))}
                      {serviceStatus.capabilities.length > 8 && (
                        <div className="text-center text-sm text-gray-500">
                          还有 {serviceStatus.capabilities.length - 8} 种能力...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 快速操作 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">快速操作</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={handleRunTests}>
                      运行场景测试
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab('analysis')}>
                      任务分析工具
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab('status')}>
                      系统状态详情
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 任务分析标签页 */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>开发任务分析工具</CardTitle>
              <CardDescription>分析开发任务的需求、复杂度和知识要求</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="analysisQuery">分析任务描述</Label>
                  <Textarea
                    id="analysisQuery"
                    placeholder="输入需要分析的开发任务..."
                    className="min-h-[100px]"
                    onChange={(e) => setQuery(e.target.value)}
                    value={query}
                  />
                </div>

                <Button onClick={handleEnhance} disabled={loading || !query.trim()}>
                  {loading ? '分析中...' : '分析开发任务'}
                  <Target className="ml-2 h-4 w-4" />
                </Button>

                {/* 分析结果 */}
                {result && result.data?.enhanced?.enhancedResponse?.data?.taskAnalysis && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 知识需求 */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">知识需求</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {result.data.enhanced.enhancedResponse.data.taskAnalysis.knowledgeRequirements.map((req: string, index: number) => (
                              <Badge key={index} variant="outline" className="mr-2 mb-2">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* 相关模式 */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">相关模式</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {result.data.enhanced.enhancedResponse.data.taskAnalysis.relatedPatterns.map((pattern: string, index: number) => (
                              <Badge key={index} variant="secondary" className="mr-2 mb-2">
                                {pattern}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 最佳实践 */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">最佳实践</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {result.data.enhanced.enhancedResponse.data.taskAnalysis.bestPractices.map((practice: string, index: number) => (
                              <div key={index} className="text-sm p-2 bg-green-50 rounded">
                                <CheckCircle className="h-4 w-4 inline mr-2 text-green-600" />
                                {practice}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* 常见陷阱 */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">常见陷阱</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {result.data.enhanced.enhancedResponse.data.taskAnalysis.commonPitfalls.map((pitfall: string, index: number) => (
                              <div key={index} className="text-sm p-2 bg-red-50 rounded">
                                <AlertTriangle className="h-4 w-4 inline mr-2 text-red-600" />
                                {pitfall}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 场景测试标签页 */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>开发场景测试</CardTitle>
              <CardDescription>测试不同开发场景的知识增强效果</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Button onClick={handleRunTests} disabled={loading}>
                  {loading ? '测试运行中...' : '运行场景测试'}
                  <TestTube className="ml-2 h-4 w-4" />
                </Button>

                {/* 测试结果 */}
                {testResults && (
                  <div className="space-y-6">
                    {/* 测试摘要 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{testResults.totalScenarios}</div>
                            <div className="text-sm text-gray-500">总场景数</div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {testResults.successRate}
                            </div>
                            <div className="text-sm text-gray-500">成功率</div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{testResults.averageQualityScore}</div>
                            <div className="text-sm text-gray-500">平均质量分</div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{testResults.averageResponseTime}ms</div>
                            <div className="text-sm text-gray-500">平均响应时间</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* 详细结果 */}
                    <div>
                      <div className="font-medium mb-3">测试场景详情</div>
                      <div className="space-y-3">
                        {testResults.results.map((scenario: any, index: number) => (
                          <Card key={index}>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{scenario.scenario}</div>
                                  <div className="text-sm text-gray-500">
                                    任务类型: {scenario.taskType || '未知'}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {scenario.success ? (
                                    <>
                                      <Badge variant="outline">
                                        {scenario.enhancements} 增强
                                      </Badge>
                                      <Badge className="bg-green-100 text-green-800">
                                        质量: {(scenario.qualityScore * 100).toFixed(1)}%
                                      </Badge>
                                    </>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-800">
                                      失败
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {scenario.success && (
                                <div className="mt-3 text-sm">
                                  <div className="flex justify-between">
                                    <span>响应时间:</span>
                                    <span className="font-medium">{scenario.responseTime}ms</span>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统状态标签页 */}
        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>系统状态详情</CardTitle>
              <CardDescription>知识增强开发系统的详细状态和配置</CardDescription>
            </CardHeader>
            <CardContent>
              {serviceStatus ? (
                <div className="space-y-6">
                  {/* 基本信息 */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">基本信息</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">{serviceStatus.status}</div>
                        <div className="text-sm text-gray-600">系统状态</div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">{serviceStatus.features.length}</div>
                        <div className="text-sm text-gray-600">功能特性</div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">{serviceStatus.capabilities.length}</div>
                        <div className="text-sm text-gray-600">开发能力</div>
                      </div>
                    </div>
                  </div>

                  {/* 功能特性 */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">功能特性</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {serviceStatus.features.map((feature, index) => (
                        <div key={index} className="text-sm p-3 bg-blue-50 rounded">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                            {feature}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 端点信息 */}
                  {serviceStatus.endpoints && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">集成端点</h3>
                      <div className="space-y-3">
                        {Object.entries(serviceStatus.endpoints).map(([key, value]) => (
                          <div key={key} className="text-sm p-3 bg-gray-50 rounded">
                            <div className="font-medium">{key}</div>
                            <div className="text-gray-600">{value as string}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 使用说明 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">使用说明</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">API端点:</span>
                          <span className="font-medium">/api/v4/knowledge-dev</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">增强级别:</span>
                          <span className="font-medium">basic/enhanced/expert/contextual</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">支持任务:</span>
                          <span className="font-medium">10种开发任务类型</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">集成系统:</span>
                          <span className="font-medium">OKMS + 缓存 + 分发 + 网关</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}