"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, Globe, Cpu, Shield, BarChart3, Play, Settings, Download, AlertCircle, CheckCircle, XCircle, RefreshCw, Wrench, Search, FileText, Zap } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Test tool interface
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

// Test result interface
interface TestResult {
  id: string;
  tool: string;
  time: string;
  duration: string;
  status: "passed" | "failed" | "running" | "error";
  details: string;
}

// Test summary interface
interface TestSummary {
  totalTests: number;
  passedTests: number;
  successRate: number;
  averageDuration: string;
}

interface AutoModule {
  id: string; name: string; status: 'running' | 'idle' | 'error';
  description: string; lastRun: string; runCount: number; successRate: number;
}

export default function AutomatedTestingIntegration() {
  const [activeTab, setActiveTab] = useState("automation");
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testTools, setTestTools] = useState<TestTool[]>([]);
  const [autoModules, setAutoModules] = useState<AutoModule[]>([]);
  const [summary, setSummary] = useState<TestSummary>({
    totalTests: 0,
    passedTests: 0,
    successRate: 0,
    averageDuration: "0.00"
  });
  const [diagnosticIssue, setDiagnosticIssue] = useState("");
  const [webTestUrl, setWebTestUrl] = useState("http://localhost:3001/api/health");
  const [isLoading, setIsLoading] = useState(true);

  // Initialize data
  useEffect(() => {
    fetchTestData();
    const interval = setInterval(fetchTestData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchTestData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch test results
      const resultsRes = await fetch('/api/test?action=results&limit=20');
      const resultsData = await resultsRes.json();
      
      if (resultsData.success) {
        setTestResults(resultsData.data.results);
      }
      
      // Fetch MCP status
      const statusRes = await fetch('/api/test?action=status');
      const statusData = await statusRes.json();
      
      if (statusData.success) {
        const toolsData = statusData.data;
        const tools: TestTool[] = [
          {
            id: "aiassist",
            name: toolsData.aiassist?.name || "AI Assist",
            description: "AI-driven ops troubleshooting and command guidance",
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
            description: "Selenium Web automation testing framework",
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
            description: "Vision-first browser automation agent",
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
            description: "AI agent framework, planned for priority development",
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
      
      // Fetch summary (including automation data)
      const summaryRes = await fetch('/api/test?action=summary');
      const summaryData = await summaryRes.json();
      
      if (summaryData.success) {
        setSummary(summaryData.data);
      }

      // ── Automation module data ──
      try {
        const autoModRes  = await fetch('/api/automation?action=modules');
        const autoModData = await autoModRes.json();
        if (autoModData.success) setAutoModules(autoModData.data.modules ?? []);
      } catch { /* fallback, does not affect main flow */ }
      
    } catch (error) {
      console.error('Failed to fetch test data:', error);
      toast({
        title: "Data Load Failed",
        description: "Unable to fetch test data from server",
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
          title: "Test Started",
          description: `${toolId} test is running in the background`
        });
        
        // Wait 2 seconds then refresh data
        setTimeout(fetchTestData, 2000);
      } else {
        toast({
          title: "Test Launch Failed",
          description: data.error || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "Unable to connect to test server",
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
        title: "Please Enter Issue Description",
        description: "Please describe the system issue you encountered",
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
          title: "Diagnosis Complete",
          description: data.data.result
        });
        
        // Show diagnosis results
        if (data.data.suggestions) {
          console.log('Diagnosis suggestions:', data.data.suggestions);
        }
      } else {
        toast({
          title: "Diagnosis Failed",
          description: data.error || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Diagnosis Request Failed",
        description: "Unable to connect to diagnosis service",
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
          title: "Web Test Complete",
          description: data.data.result
        });
        
        // Record test results
        if (data.data.metrics) {
          console.log('Test metrics:', data.data.metrics);
        }
        
        // Refresh data
        fetchTestData();
      } else {
        toast({
          title: "Web Test Failed",
          description: data.error || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Request Failed",
        description: "Unable to connect to test service",
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
        title: "Report Exported",
        description: "Test report has been downloaded to your device"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export test report",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string, health?: string) => {
    if (health === "error") {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Error</Badge>;
    }
    
    switch (status) {
      case "installed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Installed</Badge>;
      case "configured":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Configured</Badge>;
      case "researching":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Researching</Badge>;
      case "evaluating":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Evaluating</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTestStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Passed</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center gap-1"><XCircle className="w-3 h-3" />Failed</Badge>;
      case "running":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" />Running</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
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
          <p className="text-muted-foreground">Loading test data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.successRate}%</div>
            <p className="text-xs text-muted-foreground">Based on {summary.totalTests} tests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTests}</div>
            <p className="text-xs text-muted-foreground">Passed: {summary.passedTests}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averageDuration}s</div>
            <p className="text-xs text-muted-foreground">per test</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-orange-500" />Automation Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {autoModules.filter(m => m.status === 'running').length}/{autoModules.length || 4}
            </div>
            <p className="text-xs text-muted-foreground">
              Running · Avg success rate {autoModules.length > 0 ? Math.round(autoModules.reduce((a,m) => a + m.successRate, 0) / autoModules.length) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MCP cards */}
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
                    <span>Success Rate</span>
                    <span>{tool.successRate}%</span>
                  </div>
                  <Progress value={tool.successRate} className="h-2" />
                </div>
                
                {tool.lastRun && (
                  <div className="text-sm text-muted-foreground">
                    Last run: {new Date(tool.lastRun).toLocaleString()}
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
                        Running
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Run Test
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="automation" className="gap-2">
            <Terminal className="w-4 h-4" />
            Automated Testing
          </TabsTrigger>
          <TabsTrigger value="troubleshooting" className="gap-2">
            <Wrench className="w-4 h-4" />
            Troubleshooting
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Security Testing
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Performance Testing
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="w-4 h-4" />
            Test Reports
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="automation" className="space-y-4">
          {/* ── Automation module status (from /api/automation) ── */}
          {autoModules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  Automation Module Status
                </CardTitle>
                <CardDescription>Source: Automation center live data · {autoModules.length} modules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {autoModules.map(m => (
                    <div key={m.id} className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            m.status === 'running' ? 'bg-green-500 animate-pulse'
                            : m.status === 'error'  ? 'bg-red-500'
                            : 'bg-gray-400'
                          }`} />
                          <span className="font-medium text-sm text-slate-800">{m.name}</span>
                        </div>
                        <Badge className={`text-[10px] ${
                          m.status === 'running' ? 'bg-green-100 text-green-700'
                          : m.status === 'error'  ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                        }`}>
                          {m.status === 'running' ? 'Running' : m.status === 'error' ? 'Error' : 'Idle'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{m.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-3">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                            <span>Success Rate</span><span>{m.successRate}%</span>
                          </div>
                          <Progress value={m.successRate} className="h-1" />
                        </div>
                        <span className="text-[10px] text-slate-300">{m.runCount} runs</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-blue-500">
                  <Zap className="w-3 h-3" />
                  <a href="/automation" className="hover:underline">Go to Automation Center for details</a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Execution history (including automation flow records) ── */}
          <Card>
            <CardHeader>
              <CardTitle>Test Execution Log</CardTitle>
              <CardDescription>Test center + automation module execution history (combined)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Time</th>
                      <th className="text-left py-3 px-4 font-medium">Duration</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No records · Please run health check or automated tests first
                        </td>
                      </tr>
                    ) : (
                      testResults.slice(0, 15).map((result) => (
                        <tr key={result.id} className="border-b hover:bg-muted/50">
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              {(result as any).toolId === 'automation'
                                ? <Zap className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                : (result as any).category === 'performance'
                                  ? <BarChart3 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                  : (result as any).category === 'security'
                                    ? <Shield className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                    : <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              }
                              <span className="truncate max-w-[160px]">{(result as any).name || (result as any).tool || '—'}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                            {(() => {
                              const ts = (result as any).timestamp || (result as any).time;
                              if (!ts) return '—';
                              try { return new Date(ts).toLocaleTimeString('zh-CN'); } catch { return ts; }
                            })()}
                          </td>
                          <td className="py-2.5 px-4 text-xs text-muted-foreground">
                            {(result as any).duration > 0 ? `${(result as any).duration}ms` : (result as any).duration || '—'}
                          </td>
                          <td className="py-2.5 px-4">{getTestStatusBadge((result as any).status)}</td>
                          <td className="py-2.5 px-4 text-xs text-muted-foreground hidden md:table-cell truncate max-w-[180px]">
                            {(result as any).output || (result as any).details || '—'}
                          </td>
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
              <CardTitle>Troubleshooting MCP</CardTitle>
              <CardDescription>Use AI Assist for system diagnostics and problem solving</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">System Diagnostics</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter the issue you encountered, AI Assist will provide diagnostic suggestions and solutions.
                  </p>
                  <div className="space-y-3">
                    <textarea 
                      className="w-full p-3 border rounded-lg text-sm min-h-[100px]"
                      placeholder="e.g. Docker service cannot start, port 3000 occupied, insufficient memory..."
                      value={diagnosticIssue}
                      onChange={(e) => setDiagnosticIssue(e.target.value)}
                    />
                    <Button onClick={runDiagnostic} className="w-full gap-2">
                      <Search className="w-4 h-4" />
                      Start Diagnosis
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Common Diagnostic Commands</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start text-left" onClick={() => {
                      setDiagnosticIssue("Check system resource usage");
                      runDiagnostic();
                    }}>
                      <Terminal className="w-4 h-4 mr-2" />
                      Check System Resource Usage
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-left" onClick={() => {
                      setDiagnosticIssue("Check network connections and port usage");
                      runDiagnostic();
                    }}>
                      <Terminal className="w-4 h-4 mr-2" />
                      Check Network & Ports
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-left" onClick={() => {
                      setDiagnosticIssue("Check service status and logs");
                      runDiagnostic();
                    }}>
                      <Terminal className="w-4 h-4 mr-2" />
                      Check Service Status & Logs
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
              <CardTitle>Security Testing MCP</CardTitle>
              <CardDescription>Security scanning and vulnerability detection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Security testing features are under development...</p>
                <p className="text-sm mt-2">Planning to integrate OWASP ZAP, Nessus and other security testing MCPs</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Testing MCP</CardTitle>
              <CardDescription>Load testing and performance monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Web Performance Test</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Test website loading performance and response time
                  </p>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="flex-1 p-2 border rounded text-sm"
                        placeholder="Enter URL to test"
                        value={webTestUrl}
                        onChange={(e) => setWebTestUrl(e.target.value)}
                      />
                      <Button onClick={runWebTest} className="gap-2">
                        <Play className="w-4 h-4" />
                        Test
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Tip: You can test local services like http://localhost:3000 or external websites
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Performance Monitoring</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    System resource usage monitoring
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start text-left" onClick={() => {
                      setDiagnosticIssue("Check CPU and memory usage");
                      runDiagnostic();
                    }}>
                      <Cpu className="w-4 h-4 mr-2" />
                      Check CPU & Memory
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-left" onClick={() => {
                      setDiagnosticIssue("Check disk space and IO performance");
                      runDiagnostic();
                    }}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Check Disk Performance
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-left" onClick={() => {
                      setDiagnosticIssue("Check network bandwidth and latency");
                      runDiagnostic();
                    }}>
                      <Globe className="w-4 h-4 mr-2" />
                      Check Network Performance
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
              <CardTitle>Test Reports</CardTitle>
              <CardDescription>Export and analyze test results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Report Generation</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate detailed test reports with statistics and trend analysis.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={exportReport} className="gap-2">
                      <Download className="w-4 h-4" />
                      Export JSON Report
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={fetchTestData}>
                      <RefreshCw className="w-4 h-4" />
                      Refresh Data
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => {
                      if (confirm('Are you sure you want to clear all test data? This cannot be undone.')) {
                        fetch('/api/test', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'clear-data' })
                        }).then(() => {
                          toast({
                            title: "Data Cleared",
                            description: "All test data has been cleared"
                          });
                          fetchTestData();
                        });
                      }
                    }}>
                      <XCircle className="w-4 h-4" />
                      Clear Data
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Statistics Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Tests</div>
                      <div className="text-2xl font-bold">{summary.totalTests}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                      <div className="text-2xl font-bold text-green-600">{summary.successRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Avg Duration</div>
                      <div className="text-2xl font-bold">{summary.averageDuration}s</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Pass Rate</div>
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
                  <h3 className="font-medium mb-2">MCP Health Status</h3>
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
                            {tool.health === 'healthy' ? 'Healthy' :
                             tool.health === 'warning' ? 'Warning' :
                             tool.health === 'error' ? 'Error' : 'Unknown'}
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