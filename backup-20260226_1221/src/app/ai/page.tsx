'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, MessageSquare, Code, FileText, Zap, Sparkles, Bot, Cpu, Terminal, Wand2 } from "lucide-react";

export default function AIPage() {
  const aiTools = [
    {
      name: '代码助手',
      description: 'AI辅助代码编写和调试',
      icon: Code,
      status: 'active',
      usage: '高频使用',
    },
    {
      name: '文档生成',
      description: '自动生成技术文档和说明',
      icon: FileText,
      status: 'active',
      usage: '中频使用',
    },
    {
      name: '对话助手',
      description: '智能对话和问题解答',
      icon: MessageSquare,
      status: 'active',
      usage: '高频使用',
    },
    {
      name: '自动化脚本',
      description: '生成自动化工作流脚本',
      icon: Zap,
      status: 'active',
      usage: '中频使用',
    },
    {
      name: '数据分析',
      description: 'AI辅助数据分析和可视化',
      icon: Cpu,
      status: 'beta',
      usage: '低频使用',
    },
    {
      name: '创意生成',
      description: '内容创作和创意构思',
      icon: Sparkles,
      status: 'active',
      usage: '中频使用',
    },
  ];

  const aiModels = [
    {
      name: 'DeepSeek',
      description: '代码和推理专家',
      provider: '深度求索',
      context: '128K',
      status: 'active',
    },
    {
      name: 'Claude 3',
      description: '对话和创意专家',
      provider: 'Anthropic',
      context: '200K',
      status: 'active',
    },
    {
      name: 'GPT-4',
      description: '通用AI助手',
      provider: 'OpenAI',
      context: '128K',
      status: 'available',
    },
    {
      name: 'Gemini Pro',
      description: '多模态AI',
      provider: 'Google',
      context: '1M',
      status: 'available',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <Brain className="h-5 w-5" />
            <span className="font-medium">AI助手中心</span>
          </div>
          <h1 className="text-4xl font-bold">智能AI助手 🤖</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            集成多种AI模型和工具，提升工作效率和创造力
          </p>
        </div>

        {/* AI工具卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiTools.map((tool, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <tool.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{tool.name}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">状态</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      tool.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' :
                      'bg-yellow-50 text-yellow-600 border-yellow-200'
                    }`}>
                      {tool.status === 'active' ? '活跃' : '测试中'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">使用频率</span>
                    <span className="text-sm">{tool.usage}</span>
                  </div>
                  <Button className="w-full" size="sm">
                    <Wand2 className="h-4 w-4 mr-2" />
                    开始使用
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI模型 */}
        <Card>
          <CardHeader>
            <CardTitle>AI模型集成</CardTitle>
            <CardDescription>集成的AI模型和配置</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {aiModels.map((model, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold">{model.name}</h3>
                      <p className="text-xs text-muted-foreground">{model.provider}</p>
                    </div>
                  </div>
                  <p className="text-sm mb-3">{model.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>上下文长度</span>
                      <span className="font-medium">{model.context}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>状态</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        model.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' :
                        'bg-blue-50 text-blue-600 border-blue-200'
                      }`}>
                        {model.status === 'active' ? '已激活' : '可用'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 快速操作 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Terminal className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <h3 className="font-bold text-lg">代码助手</h3>
                  <p className="text-sm text-muted-foreground">AI辅助编程和调试</p>
                </div>
                <Button className="w-full">打开代码编辑器</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <MessageSquare className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <h3 className="font-bold text-lg">智能对话</h3>
                  <p className="text-sm text-muted-foreground">与AI助手对话交流</p>
                </div>
                <Button className="w-full">开始对话</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Zap className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <h3 className="font-bold text-lg">自动化</h3>
                  <p className="text-sm text-muted-foreground">AI生成自动化脚本</p>
                </div>
                <Button className="w-full">创建自动化</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>使用指南</CardTitle>
            <CardDescription>如何有效使用AI助手</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">代码助手</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• 描述功能需求生成代码</li>
                    <li>• 解释复杂代码逻辑</li>
                    <li>• 调试和修复错误</li>
                    <li>• 代码优化建议</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">文档生成</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• 自动生成API文档</li>
                    <li>• 创建使用说明</li>
                    <li>• 生成项目报告</li>
                    <li>• 整理会议记录</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">创意助手</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• 头脑风暴和创意构思</li>
                    <li>• 内容创作和编辑</li>
                    <li>• 方案设计和评估</li>
                    <li>• 问题分析和解决</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}