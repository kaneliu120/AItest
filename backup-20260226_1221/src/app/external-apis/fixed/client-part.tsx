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

interface ClientInteractivePartProps {
  initialApis: Api[];
}

export default function ClientInteractivePart({ initialApis }: ClientInteractivePartProps) {
  const [apis] = useState<Api[]>(initialApis);
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
  
  // 提供商选项
  const providerOptions = [
    { value: 'all', label: '所有提供商' },
    { value: 'google', label: 'Google' },
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'deepseek', label: 'DeepSeek' },
    { value: 'github', label: 'GitHub' },
    { value: 'azure', label: 'Azure' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'brave', label: 'Brave' }
  ];
  
  // 类别选项
  const categoryOptions = [
    { value: 'all', label: '所有类别' },
    { value: 'ai', label: '人工智能' },
    { value: 'cloud', label: '云服务' },
    { value: 'dev', label: '开发工具' },
    { value: 'analytics', label: '数据分析' },
    { value: 'ads', label: '广告营销' },
    { value: 'social', label: '社交媒体' },
    { value: 'search', label: '搜索服务' }
  ];
  
  // 状态选项
  const statusOptions = [
    { value: 'all', label: '所有状态' },
    { value: 'active', label: '活跃' },
    { value: 'inactive', label: '未激活' },
    { value: 'pending', label: '待配置' },
    { value: 'error', label: '错误' }
  ];
  
  // 获取提供商图标
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google': return <Cloud className="h-4 w-4" />;
      case 'openai': return <Brain className="h-4 w-4" />;
      case 'anthropic': return <Brain className="h-4 w-4" />;
      case 'deepseek': return <Brain className="h-4 w-4" />;
      case 'github': return <Code className="h-4 w-4" />;
      case 'azure': return <Server className="h-4 w-4" />;
      case 'linkedin': return <MessageSquare className="h-4 w-4" />;
      case 'brave': return <Globe className="h-4 w-4" />;
      default: return <Cloud className="h-4 w-4" />;
    }
  };
  
  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />活跃</Badge>;
      case 'inactive':
        return <Badge variant="outline">未激活</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><AlertTriangle className="h-3 w-3 mr-1" />待配置</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />错误</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };
  
  return (
    <>
      {/* 搜索和过滤 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="搜索API名称或描述..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select 
                className="w-[140px] px-3 py-2 border rounded-md text-sm"
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
              >
                {providerOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <select 
                className="w-[140px] px-3 py-2 border rounded-md text-sm"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <select 
                className="w-[140px] px-3 py-2 border rounded-md text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* API列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">外部API列表</CardTitle>
          <p className="text-sm text-slate-500">
            共 {filteredApis.length} 个API，显示第 1 - {Math.min(filteredApis.length, 10)} 个
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 font-medium text-slate-500 w-[200px] lg:w-[250px]">API名称</th>
                  <th className="text-left py-3 font-medium text-slate-500 hidden sm:table-cell">提供商</th>
                  <th className="text-left py-3 font-medium text-slate-500 hidden md:table-cell">类别</th>
                  <th className="text-left py-3 font-medium text-slate-500">状态</th>
                  <th className="text-left py-3 font-medium text-slate-500 hidden lg:table-cell">响应时间</th>
                  <th className="text-left py-3 font-medium text-slate-500 hidden lg:table-cell">调用统计</th>
                  <th className="text-right py-3 font-medium text-slate-500 w-[140px]">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredApis.slice(0, 10).map(api => (
                  <tr key={api.id} className="border-b hover:bg-slate-50">
                    <td className="py-3">
                      <div className="font-medium">{api.name}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[200px]">{api.description}</div>
                    </td>
                    <td className="py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        {getProviderIcon(api.provider)}
                        <span className="capitalize">{api.provider}</span>
                      </div>
                    </td>
                    <td className="py-3 hidden md:table-cell">
                      <Badge variant="outline" className="capitalize">
                        {api.category}
                      </Badge>
                    </td>
                    <td className="py-3">
                      {getStatusBadge(api.status)}
                    </td>
                    <td className="py-3 hidden lg:table-cell">
                      <div className="text-sm">
                        {api.lastResponseTime > 0 ? `${api.lastResponseTime}ms` : 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 hidden lg:table-cell">
                      <div className="text-sm">
                        {api.totalCalls} 次调用
                        <div className="text-xs text-slate-500">
                          ✅ {api.successfulCalls} / ❌ {api.failedCalls}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                
                {filteredApis.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      没有找到匹配的API
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}