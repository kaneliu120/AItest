'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Zap, Code, Database, Server, Terminal, Cpu, Network, Shield, Download, Star, Filter } from "lucide-react";

export default function ToolsPage() {
  const toolCategories = [
    {
      name: '开发工具',
      description: '代码编写、调试和测试工具',
      icon: Code,
      tools: 12,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      name: '运维工具',
      description: '服务器管理和监控工具',
      icon: Server,
      tools: 8,
      color: 'from-green-500 to-emerald-500',
    },
    {
      name: '数据库工具',
      description: '数据库管理和优化工具',
      icon: Database,
      tools: 6,
      color: 'from-purple-500 to-pink-500',
    },
    {
      name: '网络工具',
      description: '网络诊断和监控工具',
      icon: Network,
      tools: 5,
      color: 'from-orange-500 to-red-500',
    },
    {
      name: '安全工具',
      description: '安全扫描和防护工具',
      icon: Shield,
      tools: 4,
      color: 'from-yellow-500 to-amber-500',
    },
    {
      name: '自动化工具',
      description: '工作流自动化和脚本工具',
      icon: Zap,
      tools: 7,
      color: 'from-indigo-500 to-purple-500',
    },
  ];

  const popularTools = [
    {
      name: 'CodeGPT',
      description: 'AI代码助手，支持多种编程语言',
      category: '开发工具',
      rating: 4.9,
      downloads: '12.5K',
      status: 'installed',
    },
    {
      name: 'ServerMonitor',
      description: '实时服务器监控和警报系统',
      category: '运维工具',
      rating: 4.7,
      downloads: '8.3K',
      status: 'available',
    },
    {
      name: 'DBOptimizer',
      description: '数据库性能分析和优化工具',
      category: '数据库工具',
      rating: 4.8,
      downloads: '6.7K',
      status: 'installed',
    },
    {
      name: 'NetworkAnalyzer',
      description: '网络流量分析和诊断工具',
      category: '网络工具',
      rating: 4.6,
      downloads: '5.2K',
      status: 'available',
    },
    {
      name: 'SecurityScanner',
      description: '自动化安全漏洞扫描工具',
      category: '安全工具',
      rating: 4.9,
      downloads: '9.1K',
      status: 'available',
    },
    {
      name: 'WorkflowAutomator',
      description: '可视化工作流自动化工具',
      category: '自动化工具',
      rating: 4.8,
      downloads: '7.8K',
      status: 'installed',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">工具市场 🛠️</h1>
            <p className="text-muted-foreground">发现和安装生产力工具</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
            <Button size="sm">
              <Wrench className="h-4 w-4 mr-2" />
              管理已安装
            </Button>
          </div>
        </div>

        {/* 工具分类 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {toolCategories.map((category, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${category.color}`}>
                    <category.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{category.tools} 个工具</span>
                  <Button size="sm" variant="outline">浏览</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 热门工具 */}
        <Card>
          <CardHeader>
            <CardTitle>热门工具</CardTitle>
            <CardDescription>最受欢迎的生产力工具</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularTools.map((tool, index) => (
                <div key={index} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{tool.name}</h3>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{tool.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {tool.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3 text-blue-500" />
                        {tool.downloads}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      tool.status === 'installed' ? 'bg-green-50 text-green-600 border-green-200' :
                      'bg-blue-50 text-blue-600 border-blue-200'
                    }`}>
                      {tool.status === 'installed' ? '已安装' : '可用'}
                    </span>
                    <Button size="sm" variant={tool.status === 'installed' ? 'outline' : 'default'}>
                      {tool.status === 'installed' ? '管理' : '安装'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 已安装工具 */}
        <Card>
          <CardHeader>
            <CardTitle>已安装工具</CardTitle>
            <CardDescription>当前系统中已安装的工具</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Git Integration', version: '2.1.0', status: 'up-to-date', icon: Code },
                { name: 'Docker Manager', version: '1.8.3', status: 'update-available', icon: Server },
                { name: 'PostgreSQL Admin', version: '3.2.1', status: 'up-to-date', icon: Database },
                { name: 'API Tester', version: '1.5.2', status: 'up-to-date', icon: Terminal },
                { name: 'Performance Monitor', version: '2.0.4', status: 'update-available', icon: Cpu },
                { name: 'SSL Checker', version: '1.2.0', status: 'up-to-date', icon: Shield },
              ].map((tool, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <tool.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold">{tool.name}</h3>
                      <p className="text-sm text-muted-foreground">版本 {tool.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      tool.status === 'up-to-date' ? 'bg-green-50 text-green-600 border-green-200' :
                      'bg-yellow-50 text-yellow-600 border-yellow-200'
                    }`}>
                      {tool.status === 'up-to-date' ? '最新版本' : '有更新'}
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">设置</Button>
                      <Button size="sm" variant="ghost">运行</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 工具搜索 */}
        <Card>
          <CardHeader>
            <CardTitle>搜索工具</CardTitle>
            <CardDescription>根据需求查找合适的工具</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="搜索工具名称或功能..."
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <Button>搜索</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {['代码生成', '性能优化', '安全扫描', '自动化', '监控', '数据库', '网络', '测试'].map((tag, index) => (
                  <button
                    key={index}
                    className="px-3 py-1 text-sm border rounded-full hover:bg-gray-50"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}