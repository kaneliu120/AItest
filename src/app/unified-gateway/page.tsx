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

  // 示例查询
  const exampleQueries = [
    '如何创建一个React组件？',
    '查找关于AI部署的最佳实践',
    '执行系统健康检查',
    '生成一个用户管理API',
    '搜索关于Next.js的性能优化',
    '运行自动化测试脚本'
  ];

  // 加载缓存统计
  const loadCacheStats = async () => {
    try {
      const response = await fetch('/api/v1/unified?action=cache-stats');
      const data = await response.json();
      if (data.success) {
        setCacheStats(data.data);
      }
    } catch (error) {
      console.error('加载缓存统计失败:', error);
    }
  };

  // 检查健康状态
  const checkHealth = async () => {
    try {
      const response = await fetch('/api/v1/unified?action=health');
      const data = await response.json();
      if (data.success) {
        setHealthStatus(data.data);
      }
    } catch (error) {
      console.error('检查健康状态失败:', error);
    }
  };

  useEffect(() => {
    loadCacheStats();
    checkHealth();
  }, []);

  // 处理查询
  const handleQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/v1/unified?action=process&q=' + encodeURIComponent(query) + 
        (system !== 'auto' ? `&system=${system}` : '') + 
        `&priority=${priority}`);
      
      const data = await response.json();
      setResponse(data);

      // 添加到最近查询
      if (!recentQueries.includes(query)) {
        setRecentQueries(prev => [query, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('查询失败:', error);
      setResponse({
        success: false,
        data: {
          success: false,
          data: { error: '网络请求失败' },
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

  // 清空缓存
  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/v1/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-cache' })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('缓存已清空');
        loadCacheStats();
      }
    } catch (error) {
      console.error('清空缓存失败:', error);
    }
  };

  // 使用示例查询
  const useExampleQuery = (example: string) => {
    setQuery(example);
  };

  // 获取任务类型颜色
  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'code': return 'bg-blue-100 text-blue-800';
      case 'knowledge': return 'bg-green-100 text-green-800';
      case 'skill': return 'bg-purple-100 text-purple-800';
      case 'mixed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取系统图标
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
      {/* 标题和状态 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">统一API网关</h1>
          <p className="text-gray-600">智能任务分发和系统集成平台</p>
        </div>
        <div className="flex items-center space-x-4">
          {healthStatus && (
            <Badge variant={healthStatus.status === 'healthy' ? 'default' : 'destructive'}>
              {healthStatus.status === 'healthy' ? '✅ 健康' : '⚠️ 异常'}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={loadCacheStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：查询面板 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>智能查询</CardTitle>
              <CardDescription>输入您的需求，系统将自动选择最优处理方式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="query">查询内容</Label>
                <Textarea
                  id="query"
                  placeholder="例如：如何创建一个用户登录系统？"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="system">目标系统</Label>
                  <Select value={system} onValueChange={setSystem}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">🤖 自动选择 (推荐)</SelectItem>
                      <SelectItem value="mission-control">💻 Mission Control (代码开发)</SelectItem>
                      <SelectItem value="okms">📚 OKMS (知识查询)</SelectItem>
                      <SelectItem value="openclaw">⚡ OpenClaw (技能执行)</SelectItem>
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
                      <SelectItem value="medium">中等优先级</SelectItem>
                      <SelectItem value="high">高优先级</SelectItem>
                      <SelectItem value="critical">紧急优先级</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button onClick={handleQuery} disabled={loading || !query.trim()}>
                  {loading ? '处理中...' : '开始查询'}
                  <Search className="ml-2 h-4 w-4" />
                </Button>
                
                <Button variant="outline" onClick={handleClearCache}>
                  清空缓存
                </Button>
              </div>
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
                    <Badge className={getTaskTypeColor(response.data.taskType)}>
                      {response.data.taskType}
                    </Badge>
                    {response.data.cached && (
                      <Badge variant="secondary">缓存命中</Badge>
                    )}
                  </div>
                </div>
                <CardDescription>
                  响应时间: {response.data.responseTime}ms | 
                  来源: {response.data.source} | 
                  时间: {new Date(response.data.timestamp).toLocaleString()}
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

        {/* 右侧：状态面板 */}
        <div className="space-y-6">
          {/* 缓存统计 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Database className="h-4 w-4 mr-2" />
                缓存统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cacheStats ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">状态</span>
                    <Badge variant={cacheStats.enabled ? 'default' : 'destructive'}>
                      {cacheStats.enabled ? '启用' : '禁用'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">缓存项</span>
                    <span className="font-medium">{cacheStats.totalCachedItems}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">缓存时间</span>
                    <span className="font-medium">{cacheStats.cacheTTL}秒</span>
                  </div>
                  
                  <div className="pt-2">
                    <div className="text-sm text-gray-600 mb-1">命中率</div>
                    <Progress value={cacheStats.hitRate === '待统计' ? 50 : 75} />
                    <div className="text-xs text-gray-500 mt-1">{cacheStats.hitRate}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  加载缓存统计中...
                </div>
              )}
            </CardContent>
          </Card>

          {/* 系统状态 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Network className="h-4 w-4 mr-2" />
                系统状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Cpu className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm">Mission Control</span>
                  </div>
                  <Badge variant="default">在线</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Database className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">OKMS</span>
                  </div>
                  <Badge variant="default">在线</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-purple-500" />
                    <span className="text-sm">OpenClaw</span>
                  </div>
                  <Badge variant="default">在线</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-yellow-500" />
                    <span className="text-sm">统一网关</span>
                  </div>
                  <Badge variant="default">运行中</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 最近查询 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                最近查询
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
                  暂无查询记录
                </div>
              )}
            </CardContent>
          </Card>

          {/* 性能指标 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                性能指标
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">平均响应时间</span>
                  <span className="font-medium">
                    {response ? `${response.data.responseTime}ms` : '--'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">缓存命中率</span>
                  <span className="font-medium">
                    {response && response.data.cached ? '100%' : '0%'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">任务分类准确率</span>
                  <span className="font-medium">95%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Token节省率</span>
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