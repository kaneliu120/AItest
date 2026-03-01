'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  DollarSign, 
  Briefcase, 
  BookOpen, 
  Workflow, 
  CheckCircle, 
  AlertCircle,
  PlayCircle,
  BarChart3
} from 'lucide-react';

interface SystemStatus {
  name: string;
  path: string;
  api: string;
  status: string;
  apiStatus: string;
}

interface WorkflowResult {
  workflow: string;
  steps: string[];
  timestamp: string;
  [key: string]: any;
}

export default function BusinessIntegrationDashboard() {
  const [systems, setSystems] = useState<SystemStatus[]>([]);
  const [workflowResults, setWorkflowResults] = useState<WorkflowResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrationStatus();
  }, []);

  const fetchIntegrationStatus = async () => {
    try {
      const response = await fetch('/api/integration/status');
      const data = await response.json();
      
      if (data.success && data.data.systems) {
        setSystems(data.data.systems);
      }
    } catch (error) {
      console.error('Failed to fetch integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = async (workflow: string, parameters?: any) => {
    setExecuting(workflow);
    try {
      const response = await fetch('/api/integration/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow, parameters })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWorkflowResults(prev => [data.data, ...prev.slice(0, 4)]);
        alert(`Workflow "${workflow}" executed successfully!`);
      } else {
        alert(`Workflow execution failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      alert('Workflow execution failed, please check network connection');
    } finally {
      setExecuting(null);
    }
  };

  const getSystemIcon = (name: string) => {
    switch (name) {
      case 'Finance System': return <DollarSign className="h-5 w-5" />;
      case 'Freelance System': return <Briefcase className="h-5 w-5" />;
      case 'Task System': return <Workflow className="h-5 w-5" />;
      case 'Knowledge Management System': return <BookOpen className="h-5 w-5" />;
      case 'My Skill Shop': return <Building2 className="h-5 w-5" />;
      default: return <Building2 className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Running':
      case 'Production':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">✅ {status}</Badge>;
      case 'Pending Integration':
      case 'Pending Start':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">🔄 {status}</Badge>;
      case 'API Unavailable':
      case 'Directory Not Found':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">❌ {status}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">❓ {status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading business integration status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Business Integration Hub</h1>
        <p className="text-gray-600 mt-2">
          Connect and manage all business systems with automated workflows
        </p>
      </div>

      <Tabs defaultValue="systems" className="space-y-6">
        <TabsList>
          <TabsTrigger value="systems">System Status</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="systems" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business System Status
              </CardTitle>
              <CardDescription>
                All connected business systems and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systems.map((system, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getSystemIcon(system.name)}
                          <CardTitle className="text-lg">{system.name}</CardTitle>
                        </div>
                        {getStatusBadge(system.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Path:</span>
                          <span className="font-mono text-xs truncate max-w-[200px]">
                            {system.path || 'Not configured'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>API:</span>
                          <span className="font-mono text-xs truncate max-w-[200px]">
                            {system.api || 'Not configured'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>API Status:</span>
                          <span className={system.apiStatus === 'Healthy' ? 'text-green-600' : 'text-red-600'}>
                            {system.apiStatus || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integration Endpoints</CardTitle>
              <CardDescription>Available integration API endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Core Systems</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Unified API Gateway:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">/api/v1/unified</code>
                    </div>
                    <div className="flex justify-between">
                      <span>Smart Task Dispatcher:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">/api/v2/dispatcher</code>
                    </div>
                    <div className="flex justify-between">
                      <span>Knowledge-Enhanced Dev:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">/api/v4/knowledge-dev</code>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Optimization Systems</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Automation Efficiency:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">/api/v5/automation</code>
                    </div>
                    <div className="flex justify-between">
                      <span>Unified Monitoring:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">/api/v6/monitoring</code>
                    </div>
                    <div className="flex justify-between">
                      <span>Business Integration:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">/api/integration</code>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Automation Workflows
              </CardTitle>
              <CardDescription>
                Predefined business automation workflows, one-click execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Freelance project management */}
                <Card className="border-2 border-blue-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      Freelance Project Management
                    </CardTitle>
                    <CardDescription>
                      Get project → Assign tasks → Archive knowledge → Track finance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Systems Involved:</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Freelance System</Badge>
                        <Badge variant="outline">Task System</Badge>
                        <Badge variant="outline">Knowledge Mgmt</Badge>
                        <Badge variant="outline">Finance System</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Workflow Steps:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        <li>Search freelance platform</li>
                        <li>Create and assign tasks</li>
                        <li>Archive in knowledge base</li>
                        <li>Finance tracking and reporting</li>
                      </ol>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => executeWorkflow('outsource-project', {
                        projectTitle: 'Website Development Project',
                        budget: 5000,
                        deadline: '2026-03-15'
                      })}
                      disabled={executing === 'outsource-project'}
                    >
                      {executing === 'outsource-project' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Executing...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Run Workflow
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Product development */}
                <Card className="border-2 border-green-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-green-600" />
                      Product Development
                    </CardTitle>
                    <CardDescription>
                      Requirements → Knowledge → Dispatch → Test
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Systems Involved:</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Knowledge Enhancement</Badge>
                        <Badge variant="outline">Task Dispatch</Badge>
                        <Badge variant="outline">Automation Optimization</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Workflow Steps:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        <li>Requirements analysis and planning</li>
                        <li>Knowledge enhancement and best practices</li>
                        <li>Smart task dispatch</li>
                        <li>Automated testing and deployment</li>
                      </ol>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => executeWorkflow('product-development', {
                        feature: 'User Auth System',
                        requirements: 'OAuth2, JWT, MFA support'
                      })}
                      disabled={executing === 'product-development'}
                    >
                      {executing === 'product-development' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Executing...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Run Workflow
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Finance monitoring */}
                <Card className="border-2 border-purple-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                      Finance Monitoring
                    </CardTitle>
                    <CardDescription>
                      Revenue tracking → Cost analysis → Report generation → Archive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Systems Involved:</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Finance System</Badge>
                        <Badge variant="outline">Knowledge Mgmt</Badge>
                        <Badge variant="outline">Monitoring & Alerts</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Workflow Steps:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        <li>Collect financial data</li>
                        <li>Analyze and calculate metrics</li>
                        <li>Generate reports and visualizations</li>
                        <li>Archive in knowledge base and alert</li>
                      </ol>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => executeWorkflow('finance-monitoring', {
                        period: 'monthly',
                        metrics: ['revenue', 'expenses', 'profit']
                      })}
                      disabled={executing === 'finance-monitoring'}
                    >
                      {executing === 'finance-monitoring' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Executing...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Run Workflow
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Results</CardTitle>
              <CardDescription>
                Recent workflow execution results and history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workflowResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Workflow className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>No results yet</p>
                  <p className="text-sm mt-2">Please run a workflow first</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workflowResults.map((result, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {result.workflow === 'outsource-project' && 'Freelance Project Management'}
                            {result.workflow === 'product-development' && 'Product Development'}
                            {result.workflow === 'finance-monitoring' && 'Finance Monitoring'}
                          </CardTitle>
                          <Badge className="bg-blue-100 text-blue-800">
                            {new Date(result.timestamp).toLocaleString('en-US')}
                          </Badge>
                        </div>
                        <CardDescription>
                          Steps: {result.steps.join(' → ')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">Execution time:</span>
                            <span>{new Date(result.timestamp).toLocaleTimeString('en-US')}</span>
                          </div>
                          {result.analysis && (
                            <div className="flex justify-between">
                              <span className="font-medium">Analysis result:</span>
                              <span className="text-green-600">✅ Done</span>
                            </div>
                          )}
                          {result.dispatch && (
                            <div className="flex justify-between">
                              <span className="font-medium">Task dispatch:</span>
                              <span className="text-green-600">✅ Done</span>
                            </div>
                          )}
                          {result.optimization && (
                            <div className="flex justify-between">
                              <span className="font-medium">Efficiency:</span>
                              <span className="text-green-600">✅ Done</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Integration Analytics
              </CardTitle>
              <CardDescription>
                Performance and usage analysis of the business integration system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Healthy Systems</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {systems.filter(s => s.status === 'Running' || s.status === 'Production').length}
                      <span className="text-sm text-gray-500 ml-1">/ {systems.length}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Running business systems</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">API Availability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {systems.filter(s => s.apiStatus === 'Healthy' || s.apiStatus === 'Accessible').length}
                      <span className="text-sm text-gray-500 ml-1">/ {systems.length}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Available API endpoints</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Workflow Executions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{workflowResults.length}</div>
                    <p className="text-xs text-gray-500 mt-1">Executed workflows</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Integration Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round((systems.filter(s => s.status === 'Running' || s.status === 'Production').length / systems.length) * 100)}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Overall integration completion</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">System Status Distribution</h3>
                <div className="space-y-2">
                  {systems.map((system, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getSystemIcon(system.name)}
                        <span>{system.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(system.status)}
                        <span className="text-sm text-gray-500">{system.apiStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-800">Business Integration Ready</h3>
            <p className="text-blue-700 text-sm mt-1">
              All business systems connected, workflows configured. You can now:
            </p>
            <ul className="text-blue-700 text-sm mt-2 space-y-1 list-disc list-inside">
              <li>Execute predefined workflows to automate business processes</li>
              <li>Monitor real-time status of all business systems</li>
              <li>Access all systems via unified API gateway</li>
              <li>Use knowledge enhancement to optimize business decisions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}