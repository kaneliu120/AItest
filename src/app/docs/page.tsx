'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Book, Video, Code, Terminal, Users, Download, Search, BookOpen, HelpCircle } from "lucide-react";

export default function DocsPage() {
  const docCategories = [
    {
      name: '入门指南',
      description: '快速开始使用Mission Control',
      icon: BookOpen,
      docs: 5,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'API文档',
      description: '完整的API接口文档',
      icon: Code,
      docs: 12,
      color: 'from-green-500 to-emerald-500',
    },
    {
      name: '用户手册',
      description: '详细的功能使用说明',
      icon: Book,
      docs: 8,
      color: 'from-purple-500 to-pink-500',
    },
    {
      name: '开发指南',
      description: '系统开发和扩展指南',
      icon: Terminal,
      docs: 6,
      color: 'from-orange-500 to-red-500',
    },
    {
      name: '教程视频',
      description: '视频教程和演示',
      icon: Video,
      docs: 3,
      color: 'from-yellow-500 to-amber-500',
    },
    {
      name: '常见问题',
      description: '常见问题解答',
      icon: HelpCircle,
      docs: 15,
      color: 'from-indigo-500 to-purple-500',
    },
  ];

  const recentDocs = [
    {
      title: 'Mission Control快速入门',
      description: '如何在5分钟内开始使用Mission Control',
      category: '入门指南',
      updated: '2026-02-21',
      views: '1,248',
    },
    {
      title: 'API接口完整参考',
      description: '所有API端点的详细说明和示例',
      category: 'API文档',
      updated: '2026-02-20',
      views: '892',
    },
    {
      title: '自动化工作流配置',
      description: '如何创建和管理自动化工作流',
      category: '用户手册',
      updated: '2026-02-19',
      views: '756',
    },
    {
      title: '系统集成指南',
      description: '如何将Mission Control集成到现有系统',
      category: '开发指南',
      updated: '2026-02-18',
      views: '543',
    },
    {
      title: '故障排除手册',
      description: '常见问题诊断和解决方案',
      category: '常见问题',
      updated: '2026-02-17',
      views: '1,125',
    },
    {
      title: '性能优化指南',
      description: '如何优化系统性能',
      category: '开发指南',
      updated: '2026-02-16',
      views: '432',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">文档中心 📚</h1>
            <p className="text-muted-foreground">系统文档和使用指南</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              搜索文档
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              下载全部
            </Button>
          </div>
        </div>

        {/* 文档分类 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docCategories.map((category, index) => (
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
                  <span className="text-sm text-muted-foreground">{category.docs} 篇文档</span>
                  <Button size="sm" variant="outline">查看全部</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 最近文档 */}
        <Card>
          <CardHeader>
            <CardTitle>最近更新</CardTitle>
            <CardDescription>最新更新的文档和指南</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDocs.map((doc, index) => (
                <div key={index} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{doc.title}</h3>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {doc.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{doc.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">更新: {doc.updated}</span>
                      <span className="text-gray-500">浏览: {doc.views}次</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">预览</Button>
                    <Button size="sm">阅读</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 快速开始 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <BookOpen className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <h3 className="font-bold text-lg">快速开始</h3>
                  <p className="text-sm text-muted-foreground">5分钟上手教程</p>
                </div>
                <Button className="w-full">开始学习</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Code className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <h3 className="font-bold text-lg">API参考</h3>
                  <p className="text-sm text-muted-foreground">完整的API文档</p>
                </div>
                <Button className="w-full">查看API</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Users className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <h3 className="font-bold text-lg">社区支持</h3>
                  <p className="text-sm text-muted-foreground">获取帮助和交流</p>
                </div>
                <Button className="w-full">加入社区</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 文档搜索 */}
        <Card>
          <CardHeader>
            <CardTitle>文档搜索</CardTitle>
            <CardDescription>快速查找需要的文档</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="搜索文档内容..."
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <Button>搜索</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {['安装', '配置', 'API', '故障', '性能', '安全', '集成', '部署'].map((tag, index) => (
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

        {/* 贡献指南 */}
        <Card>
          <CardHeader>
            <CardTitle>贡献文档</CardTitle>
            <CardDescription>如何贡献和改进文档</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">报告问题</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• 文档错误或过时</li>
                    <li>• 缺少重要内容</li>
                    <li>• 翻译问题</li>
                    <li>• 格式问题</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">贡献内容</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• 添加新功能文档</li>
                    <li>• 编写教程和示例</li>
                    <li>• 翻译文档</li>
                    <li>• 改进现有内容</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">提交方式</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• GitHub Pull Request</li>
                    <li>• 邮件提交</li>
                    <li>• 社区论坛</li>
                    <li>• 直接编辑</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">查看贡献指南</Button>
                <Button>开始贡献</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}