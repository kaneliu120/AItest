"use client";

import { useState } from "react";
import AutomatedTestingIntegration from "@/components/automated-testing-integration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Settings, 
  Download, 
  Upload, 
  BarChart3, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Terminal,
  Globe,
  Cpu,
  Shield
} from "lucide-react";

export default function TestingCenterPage() {
  const [activeTab, setActiveTab] = useState("automation");
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">测试中心 🧪</h1>
          <p className="text-muted-foreground">
            自动化测试、故障排查和质量保障平台
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            配置
          </Button>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            运行全部测试
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总测试数</p>
                <p className="text-2xl font-bold">156</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-green-600">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              本周 +12%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">成功率</p>
                <p className="text-2xl font-bold">94.2%</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-green-600">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              较上周 +2.5%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">平均耗时</p>
                <p className="text-2xl font-bold">3.2s</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              较上周 +0.4s
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">失败测试</p>
                <p className="text-2xl font-bold">9</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-green-600">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              较上周 -3
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              自动化测试
            </TabsTrigger>
          <TabsTrigger value="troubleshooting" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            故障排查
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            安全测试
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            性能测试
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            测试报告
          </TabsTrigger>
        </TabsList>

        <TabsContent value="automation" className="space-y-4">
          <AutomatedTestingIntegration />
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>故障排查工具</CardTitle>
              <CardDescription>
                AI驱动的运维故障诊断和解决方案
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-100">
                        <Terminal className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">AI Assist</h3>
                        <p className="text-sm text-muted-foreground">AI Shell助手</p>
                      </div>
                    </div>
                    <Button size="sm">启动诊断</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">状态:</span>
                      <span className="ml-2 font-medium text-green-600">已安装</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">版本:</span>
                      <span className="ml-2 font-medium">1.0.0</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">诊断次数:</span>
                      <span className="ml-2 font-medium">23</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">成功率:</span>
                      <span className="ml-2 font-medium">87%</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">快速诊断</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button variant="outline" className="flex flex-col h-auto py-4">
                      <Terminal className="h-5 w-5 mb-2" />
                      <span>系统健康检查</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col h-auto py-4">
                      <Cpu className="h-5 w-5 mb-2" />
                      <span>性能分析</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col h-auto py-4">
                      <AlertTriangle className="h-5 w-5 mb-2" />
                      <span>错误日志分析</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>安全测试工具</CardTitle>
              <CardDescription>
                自动化安全扫描和漏洞检测
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>安全测试模块开发中...</p>
                <p className="text-sm mt-2">即将集成威胁建模和漏洞扫描工具</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>性能测试工具</CardTitle>
              <CardDescription>
                系统性能监控和负载测试
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>性能测试模块开发中...</p>
                <p className="text-sm mt-2">即将集成负载测试和性能监控工具</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>测试报告</CardTitle>
              <CardDescription>
                历史测试结果和趋势分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">最近测试报告</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      导出报告
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      导入配置
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-3 text-left">测试名称</th>
                        <th className="p-3 text-left">时间</th>
                        <th className="p-3 text-left">结果</th>
                        <th className="p-3 text-left">耗时</th>
                        <th className="p-3 text-left">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Web自动化测试', time: '2026-02-21 14:20', result: '通过', duration: '2.3s' },
                        { name: '系统诊断', time: '2026-02-21 13:45', result: '通过', duration: '5.1s' },
                        { name: 'API接口测试', time: '2026-02-21 12:30', result: '失败', duration: '3.8s' },
                        { name: '数据库连接测试', time: '2026-02-21 11:15', result: '通过', duration: '1.2s' },
                        { name: '网络连通性测试', time: '2026-02-21 10:00', result: '通过', duration: '0.8s' },
                      ].map((report, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-3">{report.name}</td>
                          <td className="p-3">{report.time}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              report.result === '通过' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {report.result}
                            </span>
                          </td>
                          <td className="p-3">{report.duration}</td>
                          <td className="p-3">
                            <Button variant="ghost" size="sm">查看详情</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>集成状态</CardTitle>
          <CardDescription>
            自动化测试工具与Mission Control的集成状态
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Terminal className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">AI Assist</h4>
                    <p className="text-sm text-muted-foreground">故障排查</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>集成状态</span>
                    <span className="font-medium text-green-600">✅ 已集成</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>API连接</span>
                    <span className="font-medium text-green-600">正常</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Globe className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">CortexaAI</h4>
                    <p className="text-sm text-muted-foreground">Web测试</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>集成状态</span>
                    <span className="font-medium text-green-600">✅ 已集成</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Selenium版本</span>
                    <span className="font-medium">4.36.0</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Cpu className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Browser Agent</h4>
                    <p className="text-sm text-muted-foreground">视觉测试</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>集成状态</span>
                    <span className="font-medium text-amber-600">🔄 研究中</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>复杂度</span>
                    <span className="font-medium">高</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-red-100">
                    <Shield className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">OpenAgents</h4>
                    <p className="text-sm text-muted-foreground">AI代理</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>集成状态</span>
                    <span className="font-medium text-amber-600">🔄 评估中</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>资源需求</span>
                    <span className="font-medium">中高</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}