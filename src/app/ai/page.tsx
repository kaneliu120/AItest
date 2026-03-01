'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, MessageSquare, Code, FileText, Zap, Sparkles, Bot, Cpu, Terminal, Wand2 } from "lucide-react";

export default function AIPage() {
  const aiTools = [
    {
      name: 'Code Assistant',
      description: 'AI-assisted code writing and debugging',
      icon: Code,
      status: 'active',
      usage: 'High frequency',
    },
    {
      name: 'Document Generation',
      description: 'Auto-generate technical documentation',
      icon: FileText,
      status: 'active',
      usage: 'Medium frequency',
    },
    {
      name: 'Chat Assistant',
      description: 'Smart conversation and Q&A',
      icon: MessageSquare,
      status: 'active',
      usage: 'High frequency',
    },
    {
      name: 'Automation Scripts',
      description: 'Generate automation workflow scripts',
      icon: Zap,
      status: 'active',
      usage: 'Medium frequency',
    },
    {
      name: 'Data Analytics',
      description: 'AI-assisted data analysis and visualization',
      icon: Cpu,
      status: 'beta',
      usage: 'Low frequency',
    },
    {
      name: 'Creative Generation',
      description: 'Content creation and creative ideation',
      icon: Sparkles,
      status: 'active',
      usage: 'Medium frequency',
    },
  ];

  const aiModels = [
    {
      name: 'DeepSeek',
      description: 'Code and reasoning expert',
      provider: 'DeepSeek',
      context: '128K',
      status: 'active',
    },
    {
      name: 'Claude 3',
      description: 'Conversation and creativity expert',
      provider: 'Anthropic',
      context: '200K',
      status: 'active',
    },
    {
      name: 'GPT-4',
      description: 'General AI assistant',
      provider: 'OpenAI',
      context: '128K',
      status: 'available',
    },
    {
      name: 'Gemini Pro',
      description: 'Multimodal AI',
      provider: 'Google',
      context: '1M',
      status: 'available',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <Brain className="h-5 w-5" />
            <span className="font-medium">AI Assistant Hub</span>
          </div>
          <h1 className="text-4xl font-bold">Smart AI Assistant 🤖</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Integrate multiple AI models and MCPs to boost productivity and creativity
          </p>
        </div>

        {/* AI tool cards */}
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
                    <span className="text-sm font-medium">Status</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      tool.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' :
                      'bg-yellow-50 text-yellow-600 border-yellow-200'
                    }`}>
                      {tool.status === 'active' ? 'Active' : 'Beta'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Usage</span>
                    <span className="text-sm">{tool.usage}</span>
                  </div>
                  <Button className="w-full" size="sm">
                    <Wand2 className="h-4 w-4 mr-2" />
                    Start Using
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI models */}
        <Card>
          <CardHeader>
            <CardTitle>AI Model Integration</CardTitle>
            <CardDescription>Integrated AI models and configuration</CardDescription>
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
                      <span>Context Length</span>
                      <span className="font-medium">{model.context}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Status</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        model.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' :
                        'bg-blue-50 text-blue-600 border-blue-200'
                      }`}>
                        {model.status === 'active' ? 'Active' : 'Available'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Terminal className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <h3 className="font-bold text-lg">Code Assistant</h3>
                  <p className="text-sm text-muted-foreground">AI-assisted programming and debugging</p>
                </div>
                <Button className="w-full">Open Code Editor</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <MessageSquare className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <h3 className="font-bold text-lg">Smart Chat</h3>
                  <p className="text-sm text-muted-foreground">Chat and interact with AI assistant</p>
                </div>
                <Button className="w-full">Start Chat</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Zap className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <h3 className="font-bold text-lg">Automation</h3>
                  <p className="text-sm text-muted-foreground">AI-generated automation scripts</p>
                </div>
                <Button className="w-full">Create Automation</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage guide */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Guide</CardTitle>
            <CardDescription>How to effectively use the AI assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Code Assistant</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Describe requirements to generate code</li>
                    <li>• Explain complex code logic</li>
                    <li>• Debug and fix errors</li>
                    <li>• Code optimization suggestions</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Document Generation</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Auto-generate API documentation</li>
                    <li>• Create usage instructions</li>
                    <li>• Generate project reports</li>
                    <li>• Organize meeting notes</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Creative Assistant</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Brainstorming and creative ideation</li>
                    <li>• Content creation and editing</li>
                    <li>• Solution design and evaluation</li>
                    <li>• Problem analysis and solving</li>
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