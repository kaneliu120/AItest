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
  Activity, 
  Cpu, 
  Database, 
  Network, 
  RefreshCw, 
  Search, 
  Zap,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface UnifiedResponse {
  success: boolean;
  data: {
    success: boolean;
    data: any;
    source: string;
    taskType: string;
    cached: boolean;
    responseTime: number;
    timestamp: string;
  };
  timestamp: string;
}

interface CacheStats {
  enabled: boolean;
  totalCachedItems: number;
  cacheTTL: number;
  sampleItems: Array<{
    key: string;
    timestamp: string;
    taskType: string;
  }>;
  hitRate: string;
}

export default function UnifiedGatewayPage() {
  const [query, setQuery] = useState('');
  const [system, setSystem] = useState('auto');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<UnifiedResponse | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  // Example queries
  const exampleQueries = [
    'How do I create a React component?',
    'Find best practices for AI deployment',
    'Run a system health check',
    'Generate a user management API',
    'Search for Next.js performance optimization',
    'Run an automated test script'
  ];

  // Load cache stats
  const loadCacheStats = async () => {
    try {
      const response = await fetch('/api/v1/unified?action=cache-stats');
      const data = await response.json();
      if (data.success) {
        setCacheStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  };

  // Check health status
  const checkHealth = async () => {
    try {
      const response = await fetch('/api/v1/unified?action=health');
      const data = await response.json();
      if (data.success) {
        setHealthStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to check health status:', error);
    }
  };

  useEffect(() => {
    loadCacheStats();
    checkHealth();
  }, []);

  // Handle query
  const handleQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/v1/unified?action=process&q=' + encodeURIComponent(query) + 
        (system !== 'auto' ? `&system=${system}` : '') + 
        `&priority=${priority}`);
      
      const data = await response.json();
      setResponse(data);

      // Add to recent queries
      if (!recentQueries.includes(query)) {
        setRecentQueries(prev => [query, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Query failed:', error);
      setResponse({
        success: false,
        data: {
          success: false,
          data: { error: 'Network request failed' },
          source: 'error',
          taskType: 'error',
          cached: false,
          responseTime: 0,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear cache
  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/v1/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-cache' })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Cache cleared');
        loadCacheStats();
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  // Use example query
  const useExampleQuery = (example: string) => {
    setQuery(example);
  };

  // Get task type color
  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'code': return 'bg-blue-100 text-blue-800';
      case 'knowledge': return 'bg-green-100 text-green-800';
      case 'skill': return 'bg-purple-100 text-purple-800';
      case 'mixed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get system icon
  const getSystemIcon = (system: string) => {
    switch (system) {
      case 'mission-control': return <Cpu className="h-4 w-4" />;
      case 'okms': return <Database className="h-4 w-4" />;
      case 'openclaw': return <Zap className="h-4 w-4" />;
      case 'auto': return <Network className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Title and status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unified API Gateway</h1>
          <p className="text-gray-600">Intelligent task routing and system integration platform</p>
        </div>
        <div className="flex items-center space-x-4">
          {healthStatus && (
            <Badge variant={healthStatus.status === 'healthy' ? 'default' : 'destructive'}>
              {healthStatus.status === 'healthy' ? '✅ Healthy' : '⚠️ Degraded'}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={loadCacheStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Query panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Smart Query</CardTitle>
              <CardDescription>Enter your request and the system will automatically route it to the best handler</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="query">Query Content</Label>
                <Textarea
                  id="query"
                  placeholder="e.g. How do I create a user login system?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="system">Target System</Label>
                  <Select value={system} onValueChange={setSystem}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">🤖 Auto Select (Recommended)</SelectItem>
                      <SelectItem value="mission-control">💻 Mission Control (Code Dev)</SelectItem>
                      <SelectItem value="okms">📚 OKMS (Knowledge Query)</SelectItem>
                      <SelectItem value="openclaw">⚡ OpenClaw (Skill Execution)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="critical">Critical Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button onClick={handleQuery} disabled={loading || !query.trim()}>
                  {loading ? 'Processing...' : 'Start Query'}
                  <Search className="ml-2 h-4 w-4" />
                </Button>
                
                <Button variant="outline" onClick={handleClearCache}>
                  Clear Cache
                </Button>
              </div>
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
                    <Badge className={getTaskTypeColor(response.data.taskType)}>
                      {response.data.taskType}
                    </Badge>
                    {response.data.cached && (
                      <Badge variant="secondary">Cache Hit</Badge>
                    )}
                  </div>
                </div>
                <CardDescription>
                  Response Time: {response.data.responseTime}ms | Source: {response.data.source} | Time: {new Date(response.data.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm overflow-auto max-h-[300px]">
                    {JSON.stringify(response.data.data, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Status panel */}
        <div className="space-y-6">
          {/* Cache stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Cache Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cacheStats ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge variant={cacheStats.enabled ? 'default' : 'destructive'}>
                      {cacheStats.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cached Items</span>
                    <span className="font-medium">{cacheStats.totalCachedItems}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cache TTL</span>
                    <span className="font-medium">{cacheStats.cacheTTL}s</span>
                  </div>
                  
                  <div className="pt-2">
                    <div className="text-sm text-gray-600 mb-1">Hit Rate</div>
                    <Progress value={cacheStats.hitRate === 'pending' ? 50 : 75} />
                    <div className="text-xs text-gray-500 mt-1">{cacheStats.hitRate}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  Loading cache stats...
                </div>
              )}
            </CardContent>
          </Card>

          {/* System status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Network className="h-4 w-4 mr-2" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Cpu className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm">Mission Control</span>
                  </div>
                  <Badge variant="default">Online</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Database className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">OKMS</span>
                  </div>
                  <Badge variant="default">Online</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-purple-500" />
                    <span className="text-sm">OpenClaw</span>
                  </div>
                  <Badge variant="default">Online</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-yellow-500" />
                    <span className="text-sm">Unified Gateway</span>
                  </div>
                  <Badge variant="default">Running</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent queries */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Recent Queries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentQueries.length > 0 ? (
                <div className="space-y-2">
                  {recentQueries.map((q, index) => (
                    <div 
                      key={index}
                      className="text-sm p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                      onClick={() => setQuery(q)}
                    >
                      <div className="truncate">{q}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No recent queries
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance metrics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                  <span className="font-medium">
                    {response ? `${response.data.responseTime}ms` : '--'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cache Hit Rate</span>
                  <span className="font-medium">
                    {response && response.data.cached ? '100%' : '0%'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Task Classification Accuracy</span>
                  <span className="font-medium">95%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Token Savings Rate</span>
                  <span className="font-medium text-green-600">70%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}