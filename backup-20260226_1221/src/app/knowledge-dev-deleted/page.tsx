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
  Search, 
  Database, 
  FileText,
  BookOpen,
  Folder,
  Tag,
  Calendar,
  User,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  Filter,
  SortAsc,
  BarChart3,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: string;
  source: string;
  relevance: number;
  size: number;
  status: 'active' | 'archived' | 'draft';
}

interface Category {
  id: string;
  name: string;
  count: number;
  color: string;
}

interface SearchResult {
  items: KnowledgeItem[];
  total: number;
  time: number;
  query: string;
}

export default function KnowledgeManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: 'all', name: '全部', count: 0, color: 'gray' },
    { id: 'technical', name: '技术文档', count: 0, color: 'blue' },
    { id: 'business', name: '业务知识', count: 0, color: 'green' },
    { id: 'process', name: '流程规范', count: 0, color: 'purple' },
    { id: 'meeting', name: '会议记录', count: 0, color: 'orange' },
    { id: 'code', name: '代码片段', count: 0, color: 'red' },
    { id: 'api', name: 'API文档', count: 0, color: 'indigo' },
  ]);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);

  // 模拟知识数据
  const mockKnowledgeItems: KnowledgeItem[] = [
    {
      id: '1',
      title: 'Next.js 15 最佳实践',
      content: 'Next.js 15引入了许多新特性，包括App Router的改进、Server Actions的优化等。本文总结了在实际项目中的最佳实践。',
      category: 'technical',
      tags: ['Next.js', 'React', '前端', '最佳实践'],
      createdAt: '2026-02-20',
      updatedAt: '2026-02-22',
      author: '开发团队',
      source: '内部文档',
      relevance: 0.95,
      size: 2456,
      status: 'active'
    },
    {
      id: '2',
      title: '项目开发流程规范',
      content: '详细的项目开发流程，包括需求分析、设计、开发、测试、部署等各个环节的规范和要求。',
      category: 'process',
      tags: ['流程', '规范', '项目管理'],
      createdAt: '2026-02-15',
      updatedAt: '2026-02-18',
      author: '项目经理',
      source: '流程文档',
      relevance: 0.88,
      size: 1890,
      status: 'active'
    },
    {
      id: '3',
      title: 'API 设计指南',
      content: 'RESTful API设计的最佳实践，包括端点命名、状态码使用、版本控制、错误处理等。',
      category: 'api',
      tags: ['API', '设计', 'REST', '最佳实践'],
      createdAt: '2026-02-10',
      updatedAt: '2026-02-12',
      author: '后端团队',
      source: '技术文档',
      relevance: 0.92,
      size: 3120,
      status: 'active'
    },
    {
      id: '4',
      title: 'React Hooks 使用技巧',
      content: 'React Hooks的高级用法和常见陷阱，包括自定义Hooks、性能优化、状态管理等。',
      category: 'code',
      tags: ['React', 'Hooks', '前端', '技巧'],
      createdAt: '2026-02-05',
      updatedAt: '2026-02-08',
      author: '前端团队',
      source: '代码库',
      relevance: 0.85,
      size: 1780,
      status: 'active'
    },
    {
      id: '5',
      title: '业务需求分析会议记录',
      content: '2026年2月产品需求分析会议记录，包括功能需求、优先级排序、时间规划等。',
      category: 'meeting',
      tags: ['会议', '需求', '业务', '规划'],
      createdAt: '2026-02-01',
      updatedAt: '2026-02-01',
      author: '产品团队',
      source: '会议记录',
      relevance: 0.78,
      size: 1560,
      status: 'active'
    },
    {
      id: '6',
      title: '数据库优化策略',
      content: 'PostgreSQL数据库性能优化策略，包括索引优化、查询优化、分区表等。',
      category: 'technical',
      tags: ['数据库', 'PostgreSQL', '优化', '性能'],
      createdAt: '2026-01-28',
      updatedAt: '2026-01-30',
      author: 'DBA团队',
      source: '技术分享',
      relevance: 0.90,
      size: 2890,
      status: 'active'
    },
    {
      id: '7',
      title: '市场营销策略',
      content: '2026年第一季度市场营销策略和计划，包括渠道选择、预算分配、KPI设定等。',
      category: 'business',
      tags: ['市场', '营销', '策略', '业务'],
      createdAt: '2026-01-25',
      updatedAt: '2026-01-27',
      author: '市场团队',
      source: '业务文档',
      relevance: 0.82,
      size: 2100,
      status: 'active'
    },
    {
      id: '8',
      title: '系统架构设计',
      content: '微服务架构设计文档，包括服务划分、通信机制、数据一致性、监控等。',
      category: 'technical',
      tags: ['架构', '微服务', '设计', '系统'],
      createdAt: '2026-01-20',
      updatedAt: '2026-01-22',
      author: '架构团队',
      source: '设计文档',
      relevance: 0.93,
      size: 3560,
      status: 'active'
    }
  ];

  // 初始化数据
  useEffect(() => {
    setKnowledgeItems(mockKnowledgeItems);
    updateCategoryCounts(mockKnowledgeItems);
  }, []);

  // 更新分类计数
  const updateCategoryCounts = (items: KnowledgeItem[]) => {
    const updatedCategories = categories.map(cat => {
      if (cat.id === 'all') {
        return { ...cat, count: items.length };
      }
      const count = items.filter(item => item.category === cat.id).length;
      return { ...cat, count };
    });
    setCategories(updatedCategories);
  };

  // 处理搜索
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setLoading(true);
    
    // 模拟搜索延迟
    setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const filtered = mockKnowledgeItems.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );

      // 按相关性排序
      const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'relevance') return b.relevance - a.relevance;
        if (sortBy === 'date') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return 0;
      });

      setSearchResults({
        items: sorted,
        total: sorted.length,
        time: 150,
        query: searchQuery
      });
      setLoading(false);
    }, 500);
  };

  // 处理分类筛选
  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      setSearchResults(null);
    } else {
      const filtered = mockKnowledgeItems.filter(item => item.category === categoryId);
      setSearchResults({
        items: filtered,
        total: filtered.length,
        time: 50,
        query: ''
      });
    }
  };

  // 获取分类颜色
  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || 'gray';
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 处理查看详情
  const handleViewDetail = (item: KnowledgeItem) => {
    setSelectedItem(item);
    setActiveTab('detail');
  };

  // 处理添加新知识
  const handleAddNew = () => {
    const newItem: KnowledgeItem = {
      id: `new_${Date.now()}`,
      title: '新知识条目',
      content: '请输入内容...',
      category: 'technical',
      tags: ['新'],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      author: '当前用户',
      source: '手动添加',
      relevance: 0.5,
      size: 0,
      status: 'draft'
    };
    setSelectedItem(newItem);
    setActiveTab('edit');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 标题和状态 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <BookOpen className="h-8 w-8 mr-3 text-indigo-600" />
            知识管理系统
          </h1>
          <p className="text-gray-600">集中管理、检索和分享组织知识资产</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="default" className="text-sm">
            <Database className="h-3 w-3 mr-1" />
            {knowledgeItems.length} 个知识条目
          </Badge>
          <Button 
            variant="default" 
            size="sm"
            onClick={handleAddNew}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加新知识
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="browse" className="flex items-center">
            <Eye className="h-4 w-4 mr-2" />
            浏览知识
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center">
            <Search className="h-4 w-4 mr-2" />
            搜索检索
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center">
            <Folder className="h-4 w-4 mr-2" />
            分类管理
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            统计分析
          </TabsTrigger>
        </TabsList>

        {/* 浏览知识标签页 */}
        <TabsContent value="browse" className="space-y-6">
          {/* 搜索栏 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="搜索知识库..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SortAsc className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="排序方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">按相关性</SelectItem>
                    <SelectItem value="date">按更新时间</SelectItem>
                    <SelectItem value="title">按标题</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? '搜索中...' : '搜索'}
                  <Search className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 分类筛选 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">知识分类</h3>
              <Badge variant="outline">
                <Filter className="h-3 w-3 mr-1" />
                筛选
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryFilter(category.id)}
                  className={selectedCategory === category.id ? 
                    `bg-${category.color}-100 text-${category.color}-800 border-${category.color}-200` : 
                    ''
                  }
                >
                  {category.name}
                  <Badge variant="secondary" className="ml-2">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* 知识列表 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {searchResults ? `搜索结果 (${searchResults.total} 条)` : '最新知识'}
              </h3>
              {searchResults && (
                <div className="text-sm text-gray-500">
                  搜索耗时: {searchResults.time}ms
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(searchResults?.items || knowledgeItems.slice(0, 6)).map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status === 'active' ? '活跃' : 
                         item.status === 'archived' ? '已归档' : '草稿'}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-${getCategoryColor(item.category)}-700 border-${getCategoryColor(item.category)}-200`}
                      >
                        {categories.find(c => c.id === item.category)?.name}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {item.updatedAt}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {item.content}
                    </p>
                    
                    <div className="space-y-3">
                      {/* 标签 */}
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      {/* 元信息 */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {item.author}
                          </span>
                          <span className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {formatFileSize(item.size)}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="mr-2">相关性:</div>
                          <Progress value={item.relevance * 100} className="w-16" />
                          <span className="ml-2 text-xs">{(item.relevance * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <div className="px-6 pb-4 pt-2 border-t">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetail(item)}>
                        <Eye className="h-4 w-4 mr-2" />
                        查看详情
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        导出
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {(!searchResults || searchResults.items.length === 0) && (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery ? '未找到相关结果' : '知识库为空'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery ? 
                      `没有找到包含"${searchQuery}"的知识条目` :
                      '还没有添加任何知识条目，点击"添加新知识"开始创建'
                    }
                  </p>
                  <Button onClick={handleAddNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加新知识
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 搜索检索标签页 */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>高级搜索</CardTitle>
              <CardDescription>使用高级筛选条件精确查找知识</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="search-title">标题关键词</Label>
                    <Input id="search-title" placeholder="输入标题关键词..." />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="search-content">内容关键词</Label>
                    <Input id="search-content" placeholder="输入内容关键词..." />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="search-category">分类</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="search-tags">标签</Label>
                    <Input id="search-tags" placeholder="输入标签，用逗号分隔" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="search-date">更新时间</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择时间范围" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部时间</SelectItem>
                        <SelectItem value="week">最近一周</SelectItem>
                        <SelectItem value="month">最近一个月</SelectItem>
                        <SelectItem value="quarter">最近三个月</SelectItem>
                        <SelectItem value="year">最近一年</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    重置条件
                  </Button>
                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    开始搜索
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 搜索历史 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">搜索历史</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { query: 'Next.js 最佳实践', count: 8, time: '2小时前' },
                  { query: 'API 设计', count: 12, time: '昨天' },
                  { query: 'React Hooks', count: 5, time: '3天前' },
                  { query: '数据库优化', count: 3, time: '1周前' }
                ].map((history, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Search className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium">{history.query}</div>
                        <div className="text-sm text-gray-500">{history.time}</div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {history.count} 个结果
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 分类管理标签页 */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>知识分类管理</CardTitle>
              <CardDescription>管理知识分类体系，优化知识组织</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categories.map((category) => (
                    <Card key={category.id} className={`border-${category.color}-200`}>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-${category.color}-100 mb-3`}>
                            <Folder className={`h-6 w-6 text-${category.color}-600`} />
                          </div>
                          <div className="text-lg font-bold">{category.name}</div>
                          <div className="text-3xl font-bold my-2">{category.count}</div>
                          <div className="text-sm text-gray-500">个知识条目</div>
                          <div className="mt-4">
                            <Button variant="outline" size="sm" className="w-full">
                              管理分类
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">分类统计</h3>
                  <div className="space-y-4">
                    {categories.slice(1).map((category) => (
                      <div key={category.id} className="flex items-center">
                        <div className="w-32 text-sm font-medium">{category.name}</div>
                        <div className="flex-1">
                          <Progress 
                            value={(category.count / knowledgeItems.length) * 100} 
                            className={`h-2 bg-${category.color}-100`}
                          />
                        </div>
                        <div className="w-16 text-right text-sm">
                          {((category.count / knowledgeItems.length) * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 统计分析标签页 */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{knowledgeItems.length}</div>
                  <div className="text-sm text-gray-500">总知识条目</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {knowledgeItems.filter(item => item.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-500">活跃条目</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {knowledgeItems.reduce((sum, item) => sum + item.size, 0) / 1024}
                  </div>
                  <div className="text-sm text-gray-500">总大小 (KB)</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {new Set(knowledgeItems.flatMap(item => item.tags)).size}
                  </div>
                  <div className="text-sm text-gray-500">唯一标签数</div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>知识增长趋势</CardTitle>
              <CardDescription>最近30天知识条目增长情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">知识增长图表将在这里显示</p>
                  <p className="text-sm text-gray-400">需要集成图表库</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>热门标签</CardTitle>
              <CardDescription>最常用的知识标签</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from(
                  knowledgeItems
                    .flatMap(item => item.tags)
                    .reduce((counts, tag) => {
                      counts.set(tag, (counts.get(tag) || 0) + 1);
                      return counts;
                    }, new Map())
                    .entries()
                )
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([tag, count], index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium">{tag}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-32 mr-4">
                          <Progress value={(count / knowledgeItems.length) * 100} />
                        </div>
                        <span className="w-12 text-right">{count} 次</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}