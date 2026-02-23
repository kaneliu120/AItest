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
  Database, 
  Search, 
  RefreshCw, 
  Zap,
  BarChart3,
  Settings,
  Play,
  TrendingUp,
  Cpu,
  Target,
  Layers,
  Filter,
  Hash,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface CacheStats {
  hits: number;
  misses: number;
  semanticHits: number;
  partialHits: number;
  evictions: number;
  totalSize: number;
  averageResponseTime: number;
  totalRequests: number;
  hitRate: string;
  semanticHitRate: string;
  partialHitRate: string;
  cacheSize: number;
  strategies: string[];
}

interface CacheItem {
  key: string;
  query: string;
  taskType: string;
  system: string;
  timestamp: string;
  accessCount: number;
  similarityScore?: number;
  relevanceScore?: number;
  ttl: number;
  expired: boolean;
}

interface CacheStrategy {
  name: string;
  ttl: number;
  maxSize: number;
  evictionPolicy: string;
  similarityThreshold: number;
  enablePartialMatch: boolean;
  enableContextAware: boolean;
}

interface SimilarityConfig {
  semanticWeight: number;
  keywordWeight: number;
  contextWeight: number;
  taskTypeWeight: number;
  minSimilarity: number;
  maxAlternatives: number;
}

export default function ContextCachePage() {
  const [query, setQuery] = useState('');
  const [strategy, setStrategy] = useState('default');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [cacheItems, setCacheItems] = useState<CacheItem[]>([]);
  const [strategies, setStrategies] = useState<CacheStrategy[]>([]);
  const [similarityConfig, setSimilarityConfig] = useState<SimilarityConfig | null>(null);
  const [activeTab, setActiveTab] = useState('query');
  const [testQuery1, setTestQuery1] = useState('');
  const [testQuery2, setTestQuery2] = useState('');
  const [similarityResult, setSimilarityResult] = useState<any>(null);

  // 示例查询
  const exampleQueries = [
    '如何优化React应用性能',
    '设计微服务架构的最佳实践',
    '配置Docker容器网络',
    '实现JWT认证的Node.js API',
    'PostgreSQL数据库索引优化',
    '使用Redis缓存会话数据'
  ];

  // 加载数据
  const loadData = async () => {
    try {
      // 加载缓存统计
      const statsRes = await fetch('/api/v3/cache?action=stats');
      const statsData = await statsRes.json();
      if (statsData.success) setCacheStats(statsData.data);

      // 加载缓存项
      const itemsRes = await fetch('/api/v3/cache?action=items&limit=20');
      const itemsData = await itemsRes.json();
      if (itemsData.success) setCacheItems(itemsData.data);

      // 加载策略
      const strategiesRes = await fetch('/api/v3/cache?action=strategies');
      const strategiesData = await strategiesRes.json();
      if (strategiesData.success) setStrategies(strategiesData.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 处理查询
  const handleQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/v3/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'query',
          query,
          strategy
        })
      });
      
      const data = await response.json();
      setResponse(data);
      
      // 重新加载数据
      setTimeout(loadData, 500);
    } catch (error) {
      console.error('查询失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 测试相似度
  const handleTestSimilarity = async () => {
    if (!testQuery1.trim() || !testQuery2.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/v3/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-similarity',
          query1: testQuery1,
          query2: testQuery2
        })
      });
      
      const data = await response.json();
      setSimilarityResult(data.data);
    } catch (error) {
      console.error('相似度测试失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 清空缓存
  const handleClearCache = async () => {
    if (!confirm('确定要清空上下文缓存吗？')) return;

    try {
      const response = await fetch('/api/v3/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('上下文缓存已清空');
        loadData();
      }
    } catch (error) {
      console.error('清空缓存失败:', error);
    }
  };

  // 添加策略
  const handleAddStrategy = async () => {
    const strategyName = prompt('请输入策略名称:');
    if (!strategyName) return;

    const ttl = prompt('请输入TTL（分钟）:', '10');
    const maxSize = prompt('请输入最大缓存项数:', '1000');
    const similarityThreshold = prompt('请输入相似度阈值（0-1）:', '0.8');

    const strategyConfig = {
      name: strategyName,
      ttl: parseInt(ttl || '10') * 60 * 1000,
      maxSize: parseInt(maxSize || '1000'),
      evictionPolicy: 'lru',
      similarityThreshold: parseFloat(similarityThreshold || '0.8'),
      enablePartialMatch: true,
      enableContextAware: true
    };

    try {
      const response = await fetch('/api/v3/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-strategy',
          strategyName,
          strategyConfig
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('策略添加成功');
        loadData();
      }
    } catch (error) {
      console.error('添加策略失败:', error);
    }
  };

  // 使用示例查询
  const useExampleQuery = (example: string) => {
    setQuery(example);
  };

  // 格式化时间
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  // 获取缓存项颜色
  const getCacheItemColor = (item: CacheItem) => {
    if (item.expired) return 'bg-gray-100 text-gray-800';
    if (item.accessCount > 10) return 'bg-green-100 text-green-800';
    if (item.accessCount > 5) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-50 text-gray-700';
  };

  // 获取策略颜色
  const getStrategyColor = (strategy: CacheStrategy) => {
    switch (strategy.name) {
      case 'default': return 'bg-blue-100 text-blue-800';
      case 'short-term': return 'bg-green-100 text-green-800';
      case 'long-term': return 'bg-purple-100 text-purple-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 标题和状态 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Brain className="h-8 w-8 mr-3 text-purple-600" />
            上下文智能缓存系统
          </h1>
          <p className="text-gray-600">基于语义理解的智能缓存匹配和优化</p>
        </div>
        <div className="flex items-center space-x-4">
          {cacheStats && (
            <Badge variant="default" className="text-sm">
              🎯 命中率: {cacheStats.hitRate}%
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="query" className="flex items-center">
            <Search className="h-4 w-4 mr-2" />
            智能查询
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            缓存分析
          </TabsTrigger>
          <TabsTrigger value="similarity" className="flex items-center">
            <Target className="h-4 w-4 mr-2" />
            相似度测试
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            系统管理
          </TabsTrigger>
        </TabsList>

        {/* 智能查询标签页 */}
        <TabsContent value="query" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：查询面板 */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>上下文感知查询</CardTitle>
                  <CardDescription>输入查询，系统将基于语义上下文进行智能缓存匹配</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="query">查询内容</Label>
                    <Textarea
                      id="query"
                      placeholder="例如：如何优化React应用性能，减少首次加载时间"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="strategy">缓存策略</Label>
                    <Select value={strategy} onValueChange={setStrategy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">默认策略 (10分钟)</SelectItem>
                        <SelectItem value="short-term">短期策略 (2分钟)</SelectItem>
                        <SelectItem value="long-term">长期策略 (1小时)</SelectItem>
                        <SelectItem value="critical">关键策略 (24小时)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleQuery} disabled={loading || !query.trim()} className="w-full">
                    {loading ? '智能查询中...' : '开始上下文感知查询'}
                    <Brain className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* 示例查询 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">示例查询</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {exampleQueries.map((example, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => useExampleQuery(example)}
                        className="text-xs"
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 响应显示 */}
              {response && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>查询结果</CardTitle>
                      <div className="flex items-center space-x-2">
                        {response.cacheInfo?.hit ? (
                          <Badge className="bg-green-100 text-green-800">
                            🎯 缓存命中
                          </Badge>
                        ) : (
                          <Badge variant="outline">🔄 实时处理</Badge>
                        )}
                        {response.cacheInfo?.matchType && (
                          <Badge variant="secondary">
                            {response.cacheInfo.matchType}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      请求ID: {response.requestId} | 
                      响应时间: {response.data?.responseTime}ms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* 缓存信息 */}
                      {response.cacheInfo && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="font-medium mb-2">缓存信息</div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">命中状态:</span>
                              <span className="ml-2 font-medium">
                                {response.cacheInfo.hit ? '✅ 命中' : '❌ 未命中'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">匹配类型:</span>
                              <span className="ml-2 font-medium">{response.cacheInfo.matchType}</span>
                            </div>
                            {response.cacheInfo.similarity && (
                              <div>
                                <span className="text-gray-600">相似度:</span>
                                <span className="ml-2 font-medium">
                                  {(response.cacheInfo.similarity * 100).toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* 备选方案 */}
                          {response.cacheInfo.alternatives && response.cacheInfo.alternatives.length > 0 && (
                            <div className="mt-4">
                              <div className="font-medium mb-2">备选缓存项</div>
                              <div className="space-y-2">
                                {response.cacheInfo.alternatives.map((alt: any, index: number) => (
                                  <div key={index} className="text-sm p-2 bg-white rounded border">
                                    <div className="flex justify-between">
                                      <span className="truncate">{alt.query}</span>
                                      <Badge variant="outline">
                                        {(alt.similarity * 100).toFixed(1)}%
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      任务类型: {alt.taskType}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* 响应数据 */}
                      {response.data && (
                        <div>
                          <div className="font-medium mb-2">响应数据</div>
                          <div className="bg-white rounded-lg p-4 border">
                            <pre className="text-sm overflow-auto max-h-[200px]">
                              {JSON.stringify(response.data.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 右侧：统计面板 */}
            <div className="space-y-6">
              {/* 缓存统计 */}
              {cacheStats && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Database className="h-4 w-4 mr-2" />
                      缓存统计
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">命中率</span>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{cacheStats.hitRate}%</span>
                          <Progress value={parseFloat(cacheStats.hitRate)} className="w-20" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">语义命中率</span>
                        <span className="font-medium">{cacheStats.semanticHitRate}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">部分命中率</span>
                        <span className="font-medium">{cacheStats.partialHitRate}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">缓存大小</span>
                        <span className="font-medium">{cacheStats.cacheSize} 项</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">总请求数</span>
                        <span className="font-medium">{cacheStats.totalRequests}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">平均响应时间</span>
                        <span className="font-medium">{cacheStats.averageResponseTime}ms</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 缓存策略 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Layers className="h-4 w-4 mr-2" />
                    缓存策略
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {strategies.length > 0 ? (
                    <div className="space-y-2">
                      {strategies.map((strategy) => (
                        <div key={strategy.name} className="text-sm p-2 rounded border">
                          <div className="flex justify-between items-center">
                            <Badge className={getStrategyColor(strategy)}>
                              {strategy.name}
                            </Badge>
                            <span className="text-xs">
                              TTL: {formatTime(strategy.ttl)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            最大: {strategy.maxSize}项 | 
                            阈值: {(strategy.similarityThreshold * 100).toFixed(0)}% |
                            策略: {strategy.evictionPolicy}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      暂无缓存策略
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 快速操作 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">快速操作</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={handleClearCache}>
                      清空缓存
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" onClick={handleAddStrategy}>
                      添加策略
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab('management')}>
                      系统管理
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 缓存分析标签页 */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>缓存项分析</CardTitle>
              <CardDescription>详细的缓存项统计和分析</CardDescription>
            </CardHeader>
            <CardContent>
              {cacheItems.length > 0 ? (
                <div className="space-y-6">
                  {/* 缓存项表格 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">查询</th>
                          <th className="text-left py-2">任务类型</th>
                          <th className="text-left py-2">系统</th>
                          <th className="text-left py-2">访问次数</th>
                          <th className="text-left py-2">相似度</th>
                          <th className="text-left py-2">相关性</th>
                          <th className="text-left py-2">状态</th>
                          <th className="text-left py-2">时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cacheItems.map((item) => (
                          <tr key={item.key} className="border-b hover:bg-gray-50">
                            <td className="py-2">
                              <div className="max-w-xs truncate" title={item.query}>
                                {item.query}
                              </div>
                            </td>
                            <td className="py-2">
                              <Badge variant="outline">{item.taskType}</Badge>
                            </td>
                            <td className="py-2">
                              <Badge variant="outline">{item.system}</Badge>
                            </td>
                            <td className="py-2">{item.accessCount}</td>
                            <td className="py-2">
                              {item.similarityScore ? (
                                <div className="flex items-center">
                                  <span className="mr-2">{(item.similarityScore * 100).toFixed(0)}%</span>
                                  <Progress value={item.similarityScore * 100} className="w-16" />
                                </div>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td className="py-2">
                              {item.relevanceScore ? (
                                <div className="flex items-center">
                                  <span className="mr-2">{(item.relevanceScore * 100).toFixed(0)}%</span>
                                  <Progress value={item.relevanceScore * 100} className="w-16" />
                                </div>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td className="py-2">
                              {item.expired ? (
                                <Badge variant="outline" className="bg-gray-100">已过期</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-100">有效</Badge>
                              )}
                            </td>
                            <td className="py-2 text-xs text-gray-500">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 统计摘要 */}
                  {cacheStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{cacheStats.cacheSize}</div>
                            <div className="text-sm text-gray-500">缓存项数</div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {cacheStats.hitRate}%
                            </div>
                            <div className="text-sm text-gray-500">总命中率</div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {cacheStats.semanticHitRate}%
                            </div>
                            <div className="text-sm text-gray-500">语义命中率</div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{cacheStats.averageResponseTime}ms</div>
                            <div className="text-sm text-gray-500">平均响应时间</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Database className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="mt-4">暂无缓存数据</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab('query')}>
                    开始查询以生成缓存
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 相似度测试标签页 */}
        <TabsContent value="similarity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>语义相似度测试</CardTitle>
              <CardDescription>测试两个查询之间的语义相似度</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 测试输入 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="testQuery1">查询1</Label>
                    <Textarea
                      id="testQuery1"
                      placeholder="例如：如何优化React应用性能"
                      value={testQuery1}
                      onChange={(e) => setTestQuery1(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="testQuery2">查询2</Label>
                    <Textarea
                      id="testQuery2"
                      placeholder="例如：React应用性能优化方法"
                      value={testQuery2}
                      onChange={(e) => setTestQuery2(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                <Button onClick={handleTestSimilarity} disabled={loading || !testQuery1.trim() || !testQuery2.trim()}>
                  {loading ? '计算相似度中...' : '测试语义相似度'}
                  <Target className="ml-2 h-4 w-4" />
                </Button>

                {/* 测试结果 */}
                {similarityResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">相似度测试结果</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-600">查询1关键词</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {similarityResult.keywords1.map((kw: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-gray-600">查询2关键词</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {similarityResult.keywords2.map((kw: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">
                              {(similarityResult.jaccardSimilarity * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Jaccard相似度</div>
                          </div>
                          
                          <div className="mt-4 text-sm">
                            <div className="flex justify-between">
                              <span>交集关键词数:</span>
                              <span className="font-medium">{similarityResult.intersection.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>并集关键词数:</span>
                              <span className="font-medium">{similarityResult.unionSize}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>交集关键词:</span>
                              <span className="font-medium">
                                {similarityResult.intersection.slice(0, 3).join(', ')}
                                {similarityResult.intersection.length > 3 ? '...' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {similarityResult.analysis}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 示例测试对 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">示例测试对</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { q1: '如何优化React应用性能', q2: 'React性能优化最佳实践' },
                        { q1: '配置Docker容器网络', q2: 'Docker网络配置指南' },
                        { q1: '实现JWT认证的API', q2: 'JWT认证在Node.js中的实现' }
                      ].map((pair, index) => (
                        <div key={index} className="text-sm p-3 bg-gray-50 rounded">
                          <div className="flex justify-between items-start">
                            <div>
                              <div>查询1: {pair.q1}</div>
                              <div>查询2: {pair.q2}</div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTestQuery1(pair.q1);
                                setTestQuery2(pair.q2);
                              }}
                            >
                              使用
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统管理标签页 */}
        <TabsContent value="management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>系统配置管理</CardTitle>
              <CardDescription>上下文缓存系统的配置和优化</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 系统状态 */}
                <div>
                  <h3 className="text-lg font-medium mb-4">系统状态</h3>
                  {cacheStats ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">{cacheStats.cacheSize}</div>
                        <div className="text-sm text-gray-600">缓存项数</div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">{cacheStats.totalRequests}</div>
                        <div className="text-sm text-gray-600">总请求数</div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">{cacheStats.evictions}</div>
                        <div className="text-sm text-gray-600">清理次数</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      加载系统状态中...
                    </div>
                  )}
                </div>

                {/* 管理操作 */}
                <div>
                  <h3 className="text-lg font-medium mb-4">管理操作</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Database className="h-8 w-8 mx-auto text-gray-400" />
                          <div className="mt-2 font-medium">缓存管理</div>
                          <div className="text-sm text-gray-600 mt-1">清空和优化缓存</div>
                          <Button variant="outline" className="mt-4 w-full" onClick={handleClearCache}>
                            清空缓存
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Layers className="h-8 w-8 mx-auto text-gray-400" />
                          <div className="mt-2 font-medium">策略管理</div>
                          <div className="text-sm text-gray-600 mt-1">添加和配置策略</div>
                          <Button variant="outline" className="mt-4 w-full" onClick={handleAddStrategy}>
                            添加策略
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* 系统信息 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">系统信息</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">服务名称:</span>
                        <span className="font-medium">上下文智能缓存系统</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">API版本:</span>
                        <span className="font-medium">v3</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">功能特性:</span>
                        <span className="font-medium">语义匹配、上下文感知、多策略</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">集成系统:</span>
                        <span className="font-medium">统一网关、智能分发器</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="context-manager"><div className="text-center py-12 text-gray-400">上下文管理器开发中...</div></TabsContent>
        <TabsContent value="performance"><div className="text-center py-12 text-gray-400">性能分析开发中...</div></TabsContent>
        <TabsContent value="config"><div className="text-center py-12 text-gray-400">配置管理开发中...</div></TabsContent>
      </Tabs>
    </div>
  );
}
