'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Cloud,
  Brain,
  Code,
  Server,
  Globe,
  MessageSquare
} from 'lucide-react';

interface Api {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  status: string;
  lastResponseTime: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
}

interface Stats {
  totalApis: number;
  activeApis: number;
  inactiveApis: number;
  pendingApis: number;
  errorApis: number;
  avgResponseTime: number;
  totalCalls: number;
  successRate: number;
}

interface Alert {
  id: string;
  apiId: string;
  apiName: string;
  type: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface ClientInteractivePartProps {
  initialApis: Api[];
  initialStats: Stats | null;
  initialAlerts: Alert[];
}

export default function ClientInteractivePart({ 
  initialApis, 
  initialStats, 
  initialAlerts 
}: ClientInteractivePartProps) {
  const [apis] = useState<Api[]>(initialApis);
  const [stats] = useState<Stats | null>(initialStats);
  const [alerts] = useState<Alert[]>(initialAlerts);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // 过滤逻辑
  const filteredApis = apis.filter(api => {
    // 搜索过滤
    if (searchQuery && !api.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !api.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // 提供商过滤
    if (filterProvider !== 'all' && api.provider !== filterProvider) {
      return false;
    }
    
    // 类别过滤
    if (filterCategory !== 'all' && api.category !== filterCategory) {
      return false;
    }
    
    // 状态过滤
    if (filterStatus !== 'all' && api.status !== filterStatus) {
      return false;
    }
    
    return true;
  });

  // 获取提供商列表
  const providers = Array.from(new Set(apis.map(api => api.provider)));
  
  // 获取类别列表
  const categories = Array.from(new Set(apis.map(api => api.category)));

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // 获取提供商图标
  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google': return <Cloud className="h-4 w-4" />;
      case 'openai': return <Brain className="h-4 w-4" />;
      case 'anthropic': return <Brain className="h-4 w-4" />;
      case 'deepseek': return <Brain className="h-4 w-4" />;
      case 'github': return <Code className="h-4 w-4" />;
      case 'azure': return <Server className="h-4 w-4" />;
      case 'aws': return <Cloud className="h-4 w-4" />;
      case 'linkedin': return <MessageSquare className="h-4 w-4" />;
      case 'brave': return <Globe className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  return (
    <>
      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">API总数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApis}</div>
              <div className="text-xs text-muted-foreground">
                活跃: {stats.activeApis} | 未激活: {stats.inactiveApis}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">平均响应时间</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResponseTime}ms</div>
              <div className="text-xs text-muted-foreground">
                总调用: {stats.totalCalls}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">成功率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <Progress value={stats.successRate} className="h-2 mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">告警</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
              <div className="text-xs text-muted-foreground">
                未解决: {alerts.filter(a => !a.resolved).length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 搜索和过滤 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="搜索API名称或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">所有提供商</option>
                {providers.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">所有类别</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">所有状态</option>
                <option value="active">活跃</option>
                <option value="inactive">未激活</option>
                <option value="pending">待配置</option>
                <option value="error">错误</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">外部API列表</CardTitle>
          <CardDescription>
            共 {filteredApis.length} 个API，显示第 1 - {Math.min(filteredApis.length, 10)} 个
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 w-[200px] lg:w-[250px]">API名称</th>
                  <th className="text-left p-4 hidden sm:table-cell">提供商</th>
                  <th className="text-left p-4 hidden md:table-cell">类别</th>
                  <th className="text-left p-4">状态</th>
                  <th className="text-left p-4 hidden lg:table-cell">响应时间</th>
                  <th className="text-left p-4 hidden lg:table-cell">调用统计</th>
                </tr>
              </thead>
              <tbody>
                {filteredApis.slice(0, 10).map((api) => (
                  <tr key={api.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="font-medium">{api.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {api.description}
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        {getProviderIcon(api.provider)}
                        <span>{api.provider}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <Badge variant="outline">{api.category}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(api.status)}
                        <span className="capitalize">{api.status}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {api.lastResponseTime}ms
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="text-xs">
                        {api.successfulCalls}/{api.totalCalls} ({api.totalCalls > 0 ? Math.round((api.successfulCalls / api.totalCalls) * 100) : 0}%)
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredApis.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                没有找到匹配的API
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 操作指南 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">操作指南</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Brain className="h-4 w-4" />
                添加新API
              </h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>1. 点击"添加API"按钮</li>
                <li>2. 填写API基本信息</li>
                <li>3. 配置认证信息</li>
                <li>4. 保存并测试连接</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                故障排除
              </h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• 检查API密钥是否过期</li>
                <li>• 验证网络连接</li>
                <li>• 检查API配额限制</li>
                <li>• 查看错误日志详情</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                安全建议
              </h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• 定期轮换API密钥</li>
                <li>• 使用最小必要权限</li>
                <li>• 监控异常调用模式</li>
                <li>• 启用API使用审计</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-slate-500 pt-4">
        <p>外部API监控数据每60秒自动刷新 • 最后更新: {new Date().toLocaleString()}</p>
        <p className="mt-1">支持: Google APIs • OpenAI • Anthropic • GitHub • Azure • LinkedIn • Brave Search</p>
      </div>
    </>
  );
}