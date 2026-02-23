"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, Globe, Cpu, Shield, BarChart3, Play, Settings, Download, AlertCircle, CheckCircle, XCircle, RefreshCw, Wrench, Search, FileText } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// 测试工具接口
interface TestTool {
  id: string;
  name: string;
  description: string;
  status: "installed" | "configured" | "researching" | "evaluating" | "error";
  successRate: number;
  lastRun: string | null;
  icon: any;
  color: string;
  bgColor: string;
  health?: "healthy" | "warning" | "error" | "unknown";
}

// 测试结果接口
interface TestResult {
  id: string;
  tool: string;
  time: string;
  duration: string;
  status: "passed" | "failed" | "running" | "error";
  details: string;
}

// 统计信息接口
interface TestSummary {
  totalTests: number;
  passedTests: number;
  successRate: number;
  averageDuration: string;
}

export default function AutomatedTestingIntegration() {
  const [activeTab, setActiveTab] = useState("automation");
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testTools, setTestTools] = useState<TestTool[]>([]);
  const [summary, setSummary] = useState<TestSummary>({
    totalTests: 0,
    passedTests: 0,
    successRate: 0,
    averageDuration: "0.00"
  });
  const [diagnosticIssue, setDiagnosticIssue] = useState("");
  const [webTestUrl, setWebTestUrl] = useState("https://localhost:3000");
  const [isLoading, setIsLoading] = useState(true);

  // 初始化数据
  useEffect(() => {
    fetchTestData();
    const interval = setInterval(fetchTestData, 30000); // 每30秒更新一次
    return () => clearInterval(interval);
  }, []);

  const fetchTestData = async () => {
    try {
      setIsLoading(true);
      
      // 获取测试结果
      const resultsRes = await fetch('/api/test?action=results&limit=20');
      const resultsData = await resultsRes.json();
      
      if (resultsData.success) {
        setTestResults(resultsData.data.results);
      }
      
      // 获取工具状态
      const statusRes = await fetch('/api/test?action=status');
      const statusData = await statusRes.json();
      
      if (statusData.success) {
        const toolsData = statusData.data;
        const tools: TestTool[] = [
          {
            id: "aiassist",
            name: toolsData.aiassist?.name || "AI Assist",
            description: "AI驱动的运维故障排查和命令指导",
            status: toolsData.aiassist?.status === "installed" ? "installed" : 
                   toolsData.aiassist?.status === "configured" ? "configured" : "evaluating",
            successRate: toolsData.aiassist?.successRate || 0,
            lastRun: toolsData.aiassist?.lastRun || null,
            icon: Terminal,
            color: "text-orange-600",
            bgColor: "bg-orange-100 dark:bg-orange-900/30",
            health: toolsData.aiassist?.health
          },
          {
            id: "cortexaai",
            name: toolsData.cortexaai?.name || "CortexaAI",
            description: "Selenium Web自动化测试框架",
            status: toolsData.cortexaai?.status === "configured" ? "configured" : "evaluating",
            successRate: toolsData.cortexaai?.successRate || 0,
            lastRun: toolsData.cortexaai?.lastRun || null,
            icon: Globe,
            color: "text-green-600",
            bgColor: "bg-green-100 dark:bg-green-900/30",
            health: toolsData.cortexaai?.health
          },
          {
            id: "browser-agent",
            name: "Browser Agent",
            description: "视觉优先的浏览器自动化代理",
            status: "researching",
            successRate: 0,
            lastRun: null,
            icon: Cpu,
            color: "text-purple-600",
            bgColor: "bg-purple-100 dark:bg-purple-900/30",
            health: "unknown"
          },
          {
            id: "openagents",
            name: "OpenAgents Control",
            description: "AI代理框架，计划优先开发",
            status: "evaluating",
            successRate: 0,
            lastRun: null,
            icon: Shield,
            color: "text-red-600",
            bgColor: "bg-red-100 dark:bg-red-900/30",
            health: "unknown"
          }
        ];
        setTestTools(tools);
      }
      
      // 获取统计摘要
      const summaryRes = await fetch('/api/test?action=summary');
      const summaryData = await summaryRes.json();
      
      if (summaryData.success) {
        setSummary(summaryData.data);
      }
      
    } catch (error) {
      console.error('Failed to fetch test data:', error);
      toast({
        title: "数据加载失败",
        description: "无法从服务器获取测试数据",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runTest = async (toolId: string) => {
    setRunningTests(prev => new Set(prev).add(toolId));
    
    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run-test', toolId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "测试已开始",
          description: `${toolId} 测试正在后台执行`
        });
        
        // 等待2秒后刷新数据
        setTimeout(fetchTestData, 2000);
      } else {
        toast({
          title: "测试启动失败",
          description: data.error || "未知错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "请求失败",
        description: "无法连接到测试服务器",
        variant: "destructive"
      });
    } finally {
      setRunningTests(prev => {
        const next = new Set(prev);
        next.delete(toolId);
        return next;
      });
    }
  };

  const runDiagnostic = async () => {
    if (!diagnosticIssue.trim()) {
      toast({
        title: "请输入问题描述",
        description: "请描述您遇到的系统问题",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'diagnose', 
          toolId: 'aiassist',
          issue: diagnosticIssue 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "诊断完成",
          description: data.data.result
        });
        
        // 显示诊断结果
        if (data.data.suggestions) {
          console.log('诊断建议:', data.data.suggestions);
        }
      } else {
        toast({
          title: "诊断失败",
          description: data.error || "未知错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "诊断请求失败",
        description: "无法连接到诊断服务",
        variant: "destructive"
      });
    }
  };

  const runWebTest = async () => {
    try {
      const response = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'run-web-test', 
          toolId: 'cortexaai',
          url: webTestUrl,
          testType: 'basic'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Web测试完成",
          description: data.data.result
        });
        
        // 记录测试结果
        if (data.data.metrics) {
          console.log('测试指标:', data.data.metrics);
        }
        
        // 刷新数据
        fetchTestData();
      } else {
        toast({
          title: "Web测试失败",
          description: data.error || "未知错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "测试请求失败",
        description: "无法连接到测试服务",
        variant: "destructive"
      });
    }
  };

  const exportReport = async () => {
    try {
      const response = await fetch('/api/test?action=export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mission-control-test-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "报告已导出",
        description: "测试报告已下载到您的设备"
      });
    } catch (error) {
      toast({
        title: "导出失败",
        description: "无法导出测试报告",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string, health?: string) => {
    if (health === "error") {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">错误</Badge>;
    }
    
    switch (status) {
      case "installed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">已安装</Badge>;
      case "configured":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">已配置</Badge>;
      case "researching":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">研究中</Badge>;
      case "evaluating":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">评估中</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const getTestStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1"><CheckCircle className="w-3 h-3" />通过</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center gap-1"><XCircle className="w-3 h-3" />失败</Badge>;
      case "running":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" />运行中</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center gap-1"><AlertCircle className="w-3 h-3" />错误</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const getHealthIcon = (health?: string) => {
    switch (health) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">加载测试数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">成功率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.successRate}%</div>
            <p className="text-xs text-muted-foreground">基于 {summary.totalTests} 次测试</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总测试数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTests}</div>
            <p className="text-xs text-muted-foreground">通过 {summary.passedTests}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">平均耗时</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averageDuration}s</div>
            <p className="text-xs text-muted-foreground">每次测试</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">工具状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testTools.filter(t => t.health === "healthy").length}/{testTools.length}</div>
            <p className="text-xs text-muted-foreground">健康工具</p>
          </CardContent>
        </Card>
      </div>

      {/* 工具卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {testTools.map((tool) => {
          const Icon = tool.icon;
          const isRunning = runningTests.has(tool.id);
          
          return (
            <Card key={tool.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tool.bgColor}`}>
                      <Icon className={`w-5 h-5 ${tool.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{tool.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(tool.status, tool.health)}
                        {tool.health && getHealthIcon(tool.health)}
                      </div>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">{tool.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>成功率</span>
                    <span>{tool.successRate}%</span>
                  </div>
                  <Progress value={tool.successRate} className="h-2" />
                </div>
                
                {tool.lastRun && (
                  <div className="text-sm text-muted-foreground">
                    最后运行: {new Date(tool.lastRun).toLocaleString()}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => runTest(tool.id)}
                    disabled={isRunning || tool.status === "researching" || tool.status === "evaluating" || tool.health === "error"}
                  >
                    {isRunning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        运行中
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        运行测试
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="automation" className="gap-2">
            <Terminal className="w-4 h-4" />
            自动化测试
          </TabsTrigger>
          <TabsTrigger value="troubleshooting" className="gap-2">
            <Wrench className="w-4 h-4" />
            故障排查
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            安全测试
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            性能测试
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="w-4 h-4" />
            测试报告
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>测试结果记录</CardTitle>
              <CardDescription>最近的自动化测试执行记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">工具</th>
                      <th className="text-left py-3 px-4 font-medium">时间</th>
                      <th className="text-left py-3 px-4 font-medium">耗时</th>
                      <th className="text-left py-3 px-4 font-medium">状态</th>
                      <th className="text-left py-3 px-4 font-medium">详情</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          暂无测试记录
                        </td>
                      </tr>
                    ) : (
                      testResults.map((result) => (
                        <tr key={result.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {result.tool === "AI Assist" ? (
                                <Terminal className="w-4 h-4 text-orange-600" />
                              ) : result.tool === "CortexaAI" ? (
                                <Globe className="w-4 h-4 text-green-600" />
                              ) : (
                                <Cpu className="w-4 h-4 text-blue-600" />
                              )}
                              <span>{result.tool}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{new Date(result.time).toLocaleString()}</td>
                          <td className="py-3 px-4">{result.duration}</td>
                          <td className="py-3 px-4">{getTestStatusBadge(result.status)}</td>
                          <td className="py-3 px-4">{result.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="troubleshooting">
          <Card>
            <CardHeader>
              <CardTitle>故障排查工具</CardTitle>
              <CardDescription>使用AI Assist进行系统诊断和问题解决</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">系统诊断</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    输入您遇到的问题，AI Assist将提供诊断建议和解决方案。
                  </p>
                  <div className="space-y-3">
                    <textarea 
                      className="w-full p-3 border rounded-lg text-sm min-h-[100px]"
                      placeholder="例如：Docker服务无法启动，端口3000被占用，内存不足..."
                      value={diagnosticIssue}
                      onChange={(e) => setDiagnosticIssue(e.target.value)}
                    />
                    <Button onClick={runDiagnostic} className="w-full gap-2">
                      <Search className="w-4 h-4" />
                      开始诊断
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">常用诊断命令</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start text-left" onClick={() => {
                      setDiagnosticIssue("检查系统资源使用情况");
                      runDiagnostic();
                    }}>
                      <Terminal className="w-4 h-4 mr-2" />
                      检查系统资源使用情况
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-left" onClick={() => {
                      setDiagnosticIssue("检查网络连接和端口占用");
                      runDiagnostic();
                    }}>
                      <Terminal className="w-4 h-4 mr-2" />
                      检查网络连接和端口
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-left" onClick={() => {
                      setDiagnosticIssue("检查服务状态和日志");
                      runDiagnostic();
                    }}>
                      <Terminal className="w-4 h-4 mr-2" />
                      检查服务状态和日志
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>安全测试工具</CardTitle>
              <CardDescription>安全扫描和漏洞检测</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>安全测试功能正在开发中...</p>
                <p className="text-sm mt-2">计划集成OWASP ZAP、Nessus等安全测试工具</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>性能测试工具</CardTitle>
              <CardDescription>负载测试和性能监控</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Web性能测试</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    测试网站加载性能和响应时间
                  </p>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="flex-1 p-2 border rounded text-sm"
                        placeholder="输入要测试的URL"
                        value={webTestUrl}
                        onChange={(e) => setWebTestUrl(e.target.value)}
                      />
                      <Button onClick={runWebTest} className="gap-2">
                        <Play className="w-4 h-4" />
                        测试
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      提示：可以测试本地服务如 http://localhost:3000 或外部网站
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">性能监控</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    系统资源使用情况监控
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start text-left" onClick={() => {
                      setDiagnosticIssue("检查CPU和内存使用情况");
                      runDiagnostic();
                    }}>
                      <Cpu className="w-4 h-4 mr-2" />
                      检查CPU和内存使用
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-left" onClick={() => {
                      setDiagnosticIssue("检查磁盘空间和IO性能");
                      runDiagnostic();
                    }}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      检查磁盘性能
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-left" onClick={() => {
                      setDiagnosticIssue("检查网络带宽和延迟");
                      runDiagnostic();
                    }}>
                      <Globe className="w-4 h-4 mr-2" />
                      检查网络性能
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>测试报告</CardTitle>
              <CardDescription>导出和分析测试结果</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">报告生成</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    生成详细的测试报告，包含统计数据和趋势分析。
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={exportReport} className="gap-2">
                      <Download className="w-4 h-4" />
                      导出JSON报告
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={fetchTestData}>
                      <RefreshCw className="w-4 h-4" />
                      刷新数据
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => {
                      if (confirm('确定要清除所有测试数据吗？此操作不可撤销。')) {
                        fetch('/api/test', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'clear-data' })
                        }).then(() => {
                          toast({
                            title: "数据已清除",
                            description: "所有测试数据已被清除"
                          });
                          fetchTestData();
                        });
                      }
                    }}>
                      <XCircle className="w-4 h-4" />
                      清除数据
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">统计摘要</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">总测试数</div>
                      <div className="text-2xl font-bold">{summary.totalTests}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">成功率</div>
                      <div className="text-2xl font-bold text-green-600">{summary.successRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">平均耗时</div>
                      <div className="text-2xl font-bold">{summary.averageDuration}s</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">通过率</div>
                      <div className="text-2xl font-bold">
                        {summary.totalTests > 0 
                          ? `${Math.round((summary.passedTests / summary.totalTests) * 100)}%`
                          : '0%'
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">工具健康状态</h3>
                  <div className="space-y-3">
                    {testTools.map(tool => (
                      <div key={tool.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded ${tool.bgColor}`}>
                            <tool.icon className={`w-4 h-4 ${tool.color}`} />
                          </div>
                          <span>{tool.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getHealthIcon(tool.health)}
                          <span className="text-sm text-muted-foreground">
                            {tool.health === 'healthy' ? '健康' :
                             tool.health === 'warning' ? '警告' :
                             tool.health === 'error' ? '错误' : '未知'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}