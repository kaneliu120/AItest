'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  Edit,
  Trash2,
  TestTube,
  Key,
  Settings,
  Eye,
  EyeOff,
  Download,
  Upload,
  Shield,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Server,
  Cloud,
  Brain,
  Code,
  MessageSquare,
  Globe,
  Wrench,
  Plus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExternalApi {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  authType: string;
  status: 'active' | 'inactive' | 'needs_setup' | 'error';
  lastChecked: string;
  lastResponseTime: number | null;
  lastStatusCode: number | null;
  lastError: string | null;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  rateLimit: number | null;
  rateLimitPeriod: string | null;
  quotaUsed: number | null;
  quotaLimit: number | null;
  quotaResetAt: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function DetailedExternalApisPage() {
  const [apis, setApis] = useState<ExternalApi[]>([]);
  const [filteredApis, setFilteredApis] = useState<ExternalApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // 显示/隐藏敏感信息
  const [showSensitiveInfo, setShowSensitiveInfo] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchApis();
  }, []);

  useEffect(() => {
    filterAndPaginateApis();
  }, [apis, searchQuery, categoryFilter, statusFilter, providerFilter, currentPage, pageSize]);

  const fetchApis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/external-apis');
      const data = await res.json();
      if (data.success) {
        setApis(data.data.apis || []);
      }
    } catch (error) {
      console.error('获取API列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndPaginateApis = () => {
    let filtered = [...apis];
    
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(api => 
        api.name.toLowerCase().includes(query) ||
        api.description.toLowerCase().includes(query) ||
        api.provider.toLowerCase().includes(query) ||
        api.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // 类别过滤
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(api => api.category === categoryFilter);
    }
    
    // 状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter(api => api.status === statusFilter);
    }
    
    // 提供商过滤
    if (providerFilter !== 'all') {
      filtered = filtered.filter(api => api.provider === providerFilter);
    }
    
    // 计算分页
    const total = filtered.length;
    const pages = Math.ceil(total / pageSize);
    setTotalPages(pages);
    
    // 确保当前页有效
    if (currentPage > pages && pages > 0) {
      setCurrentPage(1);
    }
    
    // 获取当前页数据
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filtered.slice(startIndex, endIndex);
    
    setFilteredApis(paginated);
  };

  const handleCheckApi = async (apiId: string) => {
    try {
      const res = await fetch('/api/external-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', apiId }),
      });
      if (res.ok) {
        fetchApis(); // 刷新数据
      }
    } catch (error) {
      console.error('检查API失败:', error);
    }
  };

  const handleCheckAll = async () => {
    try {
      const res = await fetch('/api/external-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-all' }),
      });
      if (res.ok) {
        fetchApis(); // 刷新数据
      }
    } catch (error) {
      console.error('检查所有API失败:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'needs_setup': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'inactive': return <Clock className="h-4 w-4 text-gray-400" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'needs_setup': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活跃';
      case 'needs_setup': return '需配置';
      case 'error': return '错误';
      case 'inactive': return '未激活';
      default: return '未知';
    }
  };

  const getProviderIcon = (provider: string) => {
    if (provider.includes('google')) return <Cloud className="h-4 w-4" />;
    if (provider.includes('openai')) return <Brain className="h-4 w-4" />;
    if (provider.includes('anthropic')) return <Brain className="h-4 w-4" />;
    if (provider.includes('deepseek')) return <Brain className="h-4 w-4" />;
    if (provider.includes('github')) return <Code className="h-4 w-4" />;
    if (provider.includes('azure')) return <Server className="h-4 w-4" />;
    if (provider.includes('linkedin')) return <MessageSquare className="h-4 w-4" />;
    if (provider.includes('brave')) return <Globe className="h-4 w-4" />;
    if (provider.includes('transcript')) return <MessageSquare className="h-4 w-4" />;
    return <Server className="h-4 w-4" />;
  };

  // 客户端时间格式化组件
  const ClientFormattedTime = ({ timestamp }: { timestamp: string }) => {
    const [formattedTime, setFormattedTime] = useState('');
    
    useEffect(() => {
      const date = new Date(timestamp);
      setFormattedTime(date.toLocaleString('zh-CN'));
    }, [timestamp]);
    
    return <span>{formattedTime || '加载中...'}</span>;
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
    return `${Math.floor(diffMins / 1440)}天前`;
  };

  const getCategories = () => {
    const categories = new Set(apis.map(api => api.category));
    return Array.from(categories);
  };

  const getProviders = () => {
    const providers = new Set(apis.map(api => api.provider));
    return Array.from(providers);
  };

  const getStatuses = () => {
    const statuses = new Set(apis.map(api => api.status));
    return Array.from(statuses);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (size: string) => {
    setPageSize(parseInt(size));
    setCurrentPage(1); // 重置到第一页
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-3">加载外部API数据...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* 页面标题和操作 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">外部API详细列表</h1>
          <p className="text-gray-500 mt-2">
            所有集成的外部API和CLI工具的详细信息和配置
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchApis}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button onClick={handleCheckAll}>
            <TestTube className="h-4 w-4 mr-2" />
            检查所有API
          </Button>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            添加API
          </Button>
        </div>
      </div>

      {/* 过滤和搜索栏 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">搜索</label>
              <Input
                placeholder="搜索API名称、描述、标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">类别</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="所有类别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有类别</SelectItem>
                  {getCategories().map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">状态</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="所有状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有状态</SelectItem>
                  {getStatuses().map(status => (
                    <SelectItem key={status} value={status}>
                      {getStatusText(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">提供商</label>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="所有提供商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有提供商</SelectItem>
                  {getProviders().map(provider => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API列表表格 */}
      <Card>
        <CardHeader>
          <CardTitle>API列表</CardTitle>
          <CardDescription>
            共 {apis.length} 个API，当前显示 {filteredApis.length} 个
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>状态</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>提供商</TableHead>
                <TableHead>类别</TableHead>
                <TableHead>认证类型</TableHead>
                <TableHead>最后检查</TableHead>
                <TableHead>调用统计</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApis.map((api) => (
                <TableRow key={api.id}>
                  <TableCell>
                    <Badge className={getStatusColor(api.status)}>
                      {getStatusIcon(api.status)}
                      <span className="ml-1">{getStatusText(api.status)}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getProviderIcon(api.provider)}
                      <div className="ml-2">
                        <div className="font-medium">{api.name}</div>
                        <div className="text-xs text-gray-500">{api.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{api.provider}</div>
                    <div className="text-xs text-gray-500">
                      {api.tags.slice(0, 2).join(', ')}
                      {api.tags.length > 2 && '...'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{api.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{api.authType}</div>
                    <div className="text-xs text-gray-500">
                      {api.status === 'needs_setup' ? '需要配置' : '已配置'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatRelativeTime(api.lastChecked)}</div>
                    <div className="text-xs text-gray-500">
                      {api.lastResponseTime ? `${api.lastResponseTime}ms` : '未检查'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      成功: {api.successfulCalls}/{api.totalCalls}
                    </div>
                    <div className="text-xs text-gray-500">
                      平均: {api.averageResponseTime}ms
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCheckApi(api.id)}
                      >
                        <TestTube className="h-3 w-3 mr-1" />
                        检查
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑配置
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Key className="h-4 w-4 mr-2" />
                            {showSensitiveInfo[api.id] ? '隐藏密钥' : '显示密钥'}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            重新认证
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Wrench className="h-4 w-4 mr-2" />
                            手动修复
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            查看统计
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除API
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* 分页控件 */}
          {apis.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t">
              <div className="text-sm text-gray-500">
                显示第 {(currentPage - 1) * pageSize + 1} 到{' '}
                {Math.min(currentPage * pageSize, apis.length)} 条，共 {apis.length} 条
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="每页10条" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10条/页</SelectItem>
                    <SelectItem value="20">20条/页</SelectItem>
                    <SelectItem value="50">50条/页</SelectItem>
                    <SelectItem value="100">100条/页</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 快速操作卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2 text-blue-600" />
              密钥管理
            </CardTitle>
            <CardDescription>API密钥和安全配置</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Eye className="h-4 w-4 mr-2" />
                显示/隐藏所有密钥
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                安全审计
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                导出密钥备份
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2 text-green-600" />
              批量操作
            </CardTitle>
            <CardDescription>批量管理和配置</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={handleCheckAll}>
                <TestTube className="h-4 w-4 mr-2" />
                批量检查所有API
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <RefreshCw className="h-4 w-4 mr-2" />
                批量刷新令牌
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Upload className="h-4 w-4 mr-2" />
                批量导入配置
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
              报告和分析
            </CardTitle>
            <CardDescription>性能报告和数据分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                下载详细报告
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                查看历史数据
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Server className="h-4 w-4 mr-2" />
                性能分析
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
