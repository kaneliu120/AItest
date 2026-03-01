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

  // Example queries
  const exampleQueries = [
    'How to optimize React app performance',
    'Best practices for microservice architecture design',
    'Configure Docker container networking',
    'Implement JWT authentication in a Node.js API',
    'PostgreSQL database index optimization',
    'Cache session data with Redis'
  ];

  // Load data
  const loadData = async () => {
    try {
      // Load cache stats
      const statsRes = await fetch('/api/v3/cache?action=stats');
      const statsData = await statsRes.json();
      if (statsData.success) setCacheStats(statsData.data);

      // Load cache items
      const itemsRes = await fetch('/api/v3/cache?action=items&limit=20');
      const itemsData = await itemsRes.json();
      if (itemsData.success) setCacheItems(itemsData.data);

      // Load strategies
      const strategiesRes = await fetch('/api/v3/cache?action=strategies');
      const strategiesData = await strategiesRes.json();
      if (strategiesData.success) setStrategies(strategiesData.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle query
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
      
      // Reload data
      setTimeout(loadData, 500);
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Test similarity
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
      console.error('Similarity test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear cache
  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear the context cache?')) return;

    try {
      const response = await fetch('/api/v3/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Context cache cleared');
        loadData();
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  // Add strategy
  const handleAddStrategy = async () => {
    const strategyName = prompt('Enter strategy name:');
    if (!strategyName) return;

    const ttl = prompt('Enter TTL (minutes):', '10');
    const maxSize = prompt('Enter max cache items:', '1000');
    const similarityThreshold = prompt('Enter similarity threshold (0-1):', '0.8');

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
        alert('Strategy added successfully');
        loadData();
      }
    } catch (error) {
      console.error('Failed to add strategy:', error);
    }
  };

  // Use example query
  const useExampleQuery = (example: string) => {
    setQuery(example);
  };

  // Format time
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  // Get cache item color
  const getCacheItemColor = (item: CacheItem) => {
    if (item.expired) return 'bg-gray-100 text-gray-800';
    if (item.accessCount > 10) return 'bg-green-100 text-green-800';
    if (item.accessCount > 5) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-50 text-gray-700';
  };

  // Get strategy color
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
      {/* Title and status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Brain className="h-8 w-8 mr-3 text-purple-600" />
            Context-Aware Intelligent Cache
          </h1>
          <p className="text-gray-600">Semantic-based intelligent cache matching and optimization</p>
        </div>
        <div className="flex items-center space-x-4">
          {cacheStats && (
            <Badge variant="default" className="text-sm">
              🎯 Hit Rate: {cacheStats.hitRate}%
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="query" className="flex items-center">
            <Search className="h-4 w-4 mr-2" />
            Smart Query
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Cache Analytics
          </TabsTrigger>
          <TabsTrigger value="similarity" className="flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Similarity Test
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            System Management
          </TabsTrigger>
        </TabsList>

        {/* Smart query tab */}
        <TabsContent value="query" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Query panel */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Context-Aware Query</CardTitle>
                  <CardDescription>Enter your query; the system will perform intelligent cache matching based on semantic context</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="query">Query Content</Label>
                    <Textarea
                      id="query"
                      placeholder="e.g. How to optimize React app performance to reduce initial load time"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="strategy">Cache Strategy</Label>
                    <Select value={strategy} onValueChange={setStrategy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Strategy (10 min)</SelectItem>
                        <SelectItem value="short-term">Short-term Strategy (2 min)</SelectItem>
                        <SelectItem value="long-term">Long-term Strategy (1 hour)</SelectItem>
                        <SelectItem value="critical">Critical Strategy (24 hours)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleQuery} disabled={loading || !query.trim()} className="w-full">
                    {loading ? 'Querying...' : 'Start Context-Aware Query'}
                    <Brain className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Example queries */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Example Queries</CardTitle>
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

              {/* Response display */}
              {response && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Query Results</CardTitle>
                      <div className="flex items-center space-x-2">
                        {response.cacheInfo?.hit ? (
                          <Badge className="bg-green-100 text-green-800">
                            🎯 Cache Hit
                          </Badge>
                        ) : (
                          <Badge variant="outline">🔄 Live Processing</Badge>
                        )}
                        {response.cacheInfo?.matchType && (
                          <Badge variant="secondary">
                            {response.cacheInfo.matchType}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      Request ID: {response.requestId} | Response Time: {response.data?.responseTime}ms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Cache info */}
                      {response.cacheInfo && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="font-medium mb-2">Cache Info</div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Hit Status:</span>
                              <span className="ml-2 font-medium">
                                {response.cacheInfo.hit ? '✅ Hit' : '❌ Miss'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Match Type:</span>
                              <span className="ml-2 font-medium">{response.cacheInfo.matchType}</span>
                            </div>
                            {response.cacheInfo.similarity && (
                              <div>
                                <span className="text-gray-600">Similarity:</span>
                                <span className="ml-2 font-medium">
                                  {(response.cacheInfo.similarity * 100).toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Alternatives */}
                          {response.cacheInfo.alternatives && response.cacheInfo.alternatives.length > 0 && (
                            <div className="mt-4">
                              <div className="font-medium mb-2">Alternative Cache Items</div>
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
                                      Task Type: {alt.taskType}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Response data */}
                      {response.data && (
                        <div>
                          <div className="font-medium mb-2">Response Data</div>
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

            {/* Right: Stats panel */}
            <div className="space-y-6">
              {/* Cache stats */}
              {cacheStats && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Database className="h-4 w-4 mr-2" />
                      Cache Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Hit Rate</span>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{cacheStats.hitRate}%</span>
                          <Progress value={parseFloat(cacheStats.hitRate)} className="w-20" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Semantic Hit Rate</span>
                        <span className="font-medium">{cacheStats.semanticHitRate}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Partial Hit Rate</span>
                        <span className="font-medium">{cacheStats.partialHitRate}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Cache Size</span>
                        <span className="font-medium">{cacheStats.cacheSize} items</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Requests</span>
                        <span className="font-medium">{cacheStats.totalRequests}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avg Response Time</span>
                        <span className="font-medium">{cacheStats.averageResponseTime}ms</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cache strategies */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Layers className="h-4 w-4 mr-2" />
                    Cache Strategies
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
                            Max: {strategy.maxSize} items | 
                            Threshold: {(strategy.similarityThreshold * 100).toFixed(0)}% |
                            Policy: {strategy.evictionPolicy}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No cache strategies
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={handleClearCache}>
                      Clear Cache
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" onClick={handleAddStrategy}>
                      Add Strategy
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab('management')}>
                      System Management
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Cache analytics tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cache Item Analysis</CardTitle>
              <CardDescription>Detailed cache item statistics and analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {cacheItems.length > 0 ? (
                <div className="space-y-6">
                  {/* Cache items table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Query</th>
                          <th className="text-left py-2">Task Type</th>
                          <th className="text-left py-2">System</th>
                          <th className="text-left py-2">Access Count</th>
                          <th className="text-left py-2">Similarity</th>
                          <th className="text-left py-2">Relevance</th>
                          <th className="text-left py-2">Status</th>
                          <th className="text-left py-2">Time</th>
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
                                <Badge variant="outline" className="bg-gray-100">Expired</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-100">Valid</Badge>
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

                  {/* Stats summary */}
                  {cacheStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{cacheStats.cacheSize}</div>
                            <div className="text-sm text-gray-500">Cache Items</div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {cacheStats.hitRate}%
                            </div>
                            <div className="text-sm text-gray-500">Total Hit Rate</div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {cacheStats.semanticHitRate}%
                            </div>
                            <div className="text-sm text-gray-500">Semantic Hit Rate</div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{cacheStats.averageResponseTime}ms</div>
                            <div className="text-sm text-gray-500">Avg Response Time</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Database className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="mt-4">No cache data</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab('query')}>
                    Start querying to generate cache
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Similarity test tab */}
        <TabsContent value="similarity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Semantic Similarity Test</CardTitle>
              <CardDescription>Test the semantic similarity between two queries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Test inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="testQuery1">Query 1</Label>
                    <Textarea
                      id="testQuery1"
                      placeholder="e.g. How to optimize React app performance"
                      value={testQuery1}
                      onChange={(e) => setTestQuery1(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="testQuery2">Query 2</Label>
                    <Textarea
                      id="testQuery2"
                      placeholder="e.g. React app performance optimization methods"
                      value={testQuery2}
                      onChange={(e) => setTestQuery2(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                <Button onClick={handleTestSimilarity} disabled={loading || !testQuery1.trim() || !testQuery2.trim()}>
                  {loading ? 'Calculating...' : 'Test Semantic Similarity'}
                  <Target className="ml-2 h-4 w-4" />
                </Button>

                {/* Test results */}
                {similarityResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Similarity Test Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-600">Query 1 Keywords</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {similarityResult.keywords1.map((kw: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-gray-600">Query 2 Keywords</div>
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
                            <div className="text-sm text-gray-600 mt-1">Jaccard Similarity</div>
                          </div>
                          
                          <div className="mt-4 text-sm">
                            <div className="flex justify-between">
                              <span>Intersection keywords:</span>
                              <span className="font-medium">{similarityResult.intersection.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Union keywords:</span>
                              <span className="font-medium">{similarityResult.unionSize}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Intersecting keywords:</span>
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

                {/* Example test pairs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Example Test Pairs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { q1: 'How to optimize React app performance', q2: 'React performance optimization best practices' },
                        { q1: 'Configure Docker container networking', q2: 'Docker networking configuration guide' },
                        { q1: 'Implement JWT authentication in an API', q2: 'JWT authentication implementation in Node.js' }
                      ].map((pair, index) => (
                        <div key={index} className="text-sm p-3 bg-gray-50 rounded">
                          <div className="flex justify-between items-start">
                            <div>
                              <div>Query 1: {pair.q1}</div>
                              <div>Query 2: {pair.q2}</div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTestQuery1(pair.q1);
                                setTestQuery2(pair.q2);
                              }}
                            >
                              Use
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

        {/* System management tab */}
        <TabsContent value="management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration Management</CardTitle>
              <CardDescription>Configuration and optimization of the context cache system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* System status */}
                <div>
                  <h3 className="text-lg font-medium mb-4">System Status</h3>
                  {cacheStats ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">{cacheStats.cacheSize}</div>
                        <div className="text-sm text-gray-600">Cache Items</div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">{cacheStats.totalRequests}</div>
                        <div className="text-sm text-gray-600">Total Requests</div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">{cacheStats.evictions}</div>
                        <div className="text-sm text-gray-600">Evictions</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      Loading system status...
                    </div>
                  )}
                </div>

                {/* Management actions */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Management Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Database className="h-8 w-8 mx-auto text-gray-400" />
                          <div className="mt-2 font-medium">Cache Management</div>
                          <div className="text-sm text-gray-600 mt-1">Clear and optimize cache</div>
                          <Button variant="outline" className="mt-4 w-full" onClick={handleClearCache}>
                            Clear Cache
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Layers className="h-8 w-8 mx-auto text-gray-400" />
                          <div className="mt-2 font-medium">Strategy Management</div>
                          <div className="text-sm text-gray-600 mt-1">Add and configure strategies</div>
                          <Button variant="outline" className="mt-4 w-full" onClick={handleAddStrategy}>
                            Add Strategy
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* System info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">System Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service Name:</span>
                        <span className="font-medium">Context-Aware Intelligent Cache</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">API Version:</span>
                        <span className="font-medium">v3</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Features:</span>
                        <span className="font-medium">Semantic matching, context-aware, multi-strategy</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Integrated Systems:</span>
                        <span className="font-medium">Unified Gateway, Intelligent Dispatcher</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="context-manager"><div className="text-center py-12 text-gray-400">Context manager coming soon...</div></TabsContent>
        <TabsContent value="performance"><div className="text-center py-12 text-gray-400">Performance analysis coming soon...</div></TabsContent>
        <TabsContent value="config"><div className="text-center py-12 text-gray-400">Configuration management coming soon...</div></TabsContent>
      </Tabs>
    </div>
  );
}
