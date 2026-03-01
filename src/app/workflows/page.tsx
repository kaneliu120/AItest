'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play, Pause, StopCircle, RefreshCw,
  CheckCircle, XCircle, Clock, BarChart3,
  Workflow, Zap, TrendingUp
} from 'lucide-react';
import { WorkflowOverviewTab } from './_components/WorkflowOverviewTab';
import { WorkflowInstancesTab } from './_components/WorkflowInstancesTab';
import { WorkflowMetricsTab } from './_components/WorkflowMetricsTab';
import type {
  WorkflowDefinition, WorkflowInstance, WorkflowMetrics,
  DlqItem, DlqStats, DiagnosticHistoryItem, TrendPoint,
} from './_components/types';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [trendPoints, setTrendPoints] = useState<TrendPoint[]>([]);
  const [diagKindFilter, setDiagKindFilter] = useState<'all' | 'telegram-env' | 'discord-env' | 'network-check' | 'generic-env'>('all');
  const [diagHoursFilter, setDiagHoursFilter] = useState<'24' | '72' | '168'>('24');
  const [dlqItems, setDlqItems] = useState<DlqItem[]>([]);
  const [dlqStats, setDlqStats] = useState<DlqStats | null>(null);
  const [diagHistory, setDiagHistory] = useState<DiagnosticHistoryItem[]>([]);
  const [dlqQuery, setDlqQuery] = useState('');
  const [dlqPage, setDlqPage] = useState(1);
  const [selectedDlq, setSelectedDlq] = useState<Record<string, boolean>>({});
  const [metricsWindow, setMetricsWindow] = useState<'1h' | '24h' | '7d'>('24h');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const suggestDiagnosticCommand = (errorText: string) => {
    const t = errorText.toLowerCase();
    if (t.includes('telegram') || t.includes('bot') || t.includes('chat_id')) {
      return 'echo "TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN:+set}" && echo "TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID:+set}"';
    }
    if (t.includes('discord') || t.includes('webhook')) {
      return 'echo "DISCORD_WEBHOOK_URL=${DISCORD_WEBHOOK_URL:+set}"';
    }
    if (t.includes('fetch') || t.includes('network') || t.includes('timeout')) {
      return 'curl -I https://api.telegram.org && curl -I https://discord.com';
    }
    return 'printenv | grep -E "TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID|DISCORD_WEBHOOK_URL"';
  };

  const copyDiagnostic = async (errorText: string) => {
    const cmd = suggestDiagnosticCommand(errorText);
    try {
      await navigator.clipboard.writeText(cmd);
      alert('Diagnostic command copied');
    } catch (e) {
      console.error('Copy failed:', e);
      alert(`Copy failed, please copy manually:\n${cmd}`);
    }
  };

  const runDiagnostic = async (errorText: string) => {
    const t = errorText.toLowerCase();
    const kind = t.includes('telegram') || t.includes('bot') || t.includes('chat_id')
      ? 'telegram-env'
      : t.includes('discord') || t.includes('webhook')
      ? 'discord-env'
      : t.includes('fetch') || t.includes('network') || t.includes('timeout')
      ? 'network-check'
      : 'generic-env';

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run-notification-diagnostic', kind }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`Diagnostic result (${kind}):\n${JSON.stringify(data.data.output, null, 2)}`);
        fetchDiagHistory();
      } else {
        alert(`Diagnostic failed: ${data.error}`);
      }
    } catch (e) {
      console.error('Failed to run diagnostic:', e);
      alert('Failed to run diagnostic');
    }
  };

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows?action=list');
      const data = await response.json();
      
      if (data.success) {
        setWorkflows(data.data.workflows || []);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    }
  };

  const fetchInstances = async () => {
    try {
      const response = await fetch('/api/workflows?action=instances');
      const data = await response.json();
      
      if (data.success) {
        setInstances(data.data.instances || []);
      }
    } catch (error) {
      console.error('Failed to fetch instances:', error);
    }
  };

  const fetchMetrics = async (window: '1h' | '24h' | '7d' = metricsWindow) => {
    try {
      const response = await fetch(`/api/workflows?action=metrics&window=${window}`);
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const fetchTrend = async (window: '1h' | '24h' | '7d' = metricsWindow) => {
    try {
      const hours = window === '1h' ? 1 : window === '7d' ? 168 : 24;
      const response = await fetch(`/api/workflows?action=metrics-trend&hours=${hours}`);
      const data = await response.json();
      if (data.success) {
        setTrendPoints(data.data.points || []);
      }
    } catch (error) {
      console.error('Failed to fetch trend:', error);
    }
  };

  const fetchDlq = async () => {
    try {
      const response = await fetch('/api/workflows?action=notification-dlq&limit=50');
      const data = await response.json();
      if (data.success) {
        setDlqItems(data.data.items || []);
        setDlqStats(data.data.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch DLQ:', error);
    }
  };

  const fetchDiagHistory = async (kind: 'all' | 'telegram-env' | 'discord-env' | 'network-check' | 'generic-env' = diagKindFilter, hours: '24' | '72' | '168' = diagHoursFilter) => {
    try {
      const response = await fetch('/api/workflows?action=diagnostic-history&limit=100');
      const data = await response.json();
      if (data.success) {
        const now = Date.now();
        const cutoff = now - Number(hours) * 3600 * 1000;
        const all = (data.data.items || []) as DiagnosticHistoryItem[];
        const filtered = all.filter((i) => {
          const t = new Date(i.createdAt).getTime();
          const inTime = Number.isFinite(t) ? t >= cutoff : true;
          const inKind = kind === 'all' ? true : i.kind === kind;
          return inTime && inKind;
        });
        setDiagHistory(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch diagnostic history:', error);
    }
  };

  const executeWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          workflowId,
          input: {},
          priority: 'medium'
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Workflow ${workflowId} started`);
        fetchInstances();
      } else {
        alert(`Execution failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      alert('Execution failed');
    }
  };

  const controlWorkflow = async (action: string, instanceId: string) => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, instanceId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Operation successful: ${data.message}`);
        fetchInstances();
      } else {
        alert(`Operation failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to control workflow:', error);
      alert('Operation failed');
    }
  };

  const replayDlq = async (id?: string) => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'replay-notification-dlq',
          ...(id ? { id } : { limit: 10 }),
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`DLQ replay submitted: ${data.data?.queued || 0} items`);
        fetchDlq();
      } else {
        alert(`DLQ replay failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to replay DLQ:', error);
      alert('Failed to replay DLQ');
    }
  };

  const clearDlq = async (opts: { all?: boolean; ids?: string[] }) => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-notification-dlq', ...opts }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`DLQ cleared: ${data.data?.cleared || 0} items`);
        setSelectedDlq({});
        fetchDlq();
      } else {
        alert(`DLQ clear failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to clear DLQ:', error);
      alert('Failed to clear DLQ');
    }
  };

  const refreshData = () => {
    setLoading(true);
    Promise.all([
      fetchWorkflows(),
      fetchInstances(),
      fetchMetrics(metricsWindow),
      fetchTrend(metricsWindow),
      fetchDlq(),
      fetchDiagHistory(diagKindFilter, diagHoursFilter),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: React.ReactNode }> = {
      running: { color: 'bg-blue-100 text-blue-800', icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
      completed: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      failed: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> },
      paused: { color: 'bg-yellow-100 text-yellow-800', icon: <Pause className="w-3 h-3" /> },
      pending: { color: 'bg-gray-100 text-gray-800', icon: <Clock className="w-3 h-3" /> },
    };
    
    const variant = variants[status] || variants.pending;
    
    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        {variant.icon}
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = endTime - startTime;
    
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${Math.floor(duration / 1000)}s`;
    return `${Math.floor(duration / 60000)}m`;
  };

  const filteredDlq = dlqItems.filter(item => {
    const q = dlqQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.message.toLowerCase().includes(q) ||
      item.stepId.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });

  const dlqPageSize = 10;
  const dlqTotalPages = Math.max(1, Math.ceil(filteredDlq.length / dlqPageSize));
  const safeDlqPage = Math.min(dlqPage, dlqTotalPages);
  const pagedDlq = filteredDlq.slice((safeDlqPage - 1) * dlqPageSize, safeDlqPage * dlqPageSize);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="mt-2 text-gray-600">Loading workflow data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Workflow className="w-8 h-8" />
            Workflow Orchestrator
          </h1>
          <p className="text-gray-600 mt-2">
            Automated workflow orchestration system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={metricsWindow}
            onChange={(e) => {
              const w = e.target.value as '1h' | '24h' | '7d';
              setMetricsWindow(w);
              fetchMetrics(w);
              fetchTrend(w);
            }}
            className="border rounded px-2 py-2 text-sm"
          >
            <option value="1h">Window: 1h</option>
            <option value="24h">Window: 24h</option>
            <option value="7d">Window: 7d</option>
          </select>
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />Overview</TabsTrigger>
          <TabsTrigger value="workflows">
            <Workflow className="w-4 h-4 mr-2" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="instances">
            <Zap className="w-4 h-4 mr-2" />
            Instances
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <TrendingUp className="w-4 h-4 mr-2" />Metrics</TabsTrigger>
        </TabsList>

        <WorkflowOverviewTab
          metrics={metrics}
          workflows={workflows}
          instances={instances}
          getStatusBadge={getStatusBadge}
          formatTime={formatTime}
          formatDuration={formatDuration}
          executeWorkflow={executeWorkflow}
          controlWorkflow={controlWorkflow}
        />
        {/* Workflows Tab */}
        <TabsContent value="workflows">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Definitions</CardTitle>
              <CardDescription>
                All registered Workflow Definitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-lg">{workflow.name}</div>
                        <div className="text-gray-600 mt-1">{workflow.description}</div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">ID: {workflow.id}</Badge>
                          <Badge variant="outline">v{workflow.version}</Badge>
                          <Badge variant="outline">{workflow.steps.length} Steps</Badge>
                        </div>
                      </div>
                      <Button 
                        onClick={() => executeWorkflow(workflow.id)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Execute
                      </Button>
                    </div>
                    
                    <div className="mt-4">
                      <div className="font-medium mb-2">Steps:</div>
                      <div className="space-y-2">
                        {workflow.steps.map((step, index) => (
                          <div key={step.id} className="flex items-center gap-3 text-sm">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{step.name}</div>
                              <div className="text-gray-500">{step.description}</div>
                            </div>
                            <Badge variant="outline">{step.module}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="font-medium mb-2">Triggers:</div>
                      <div className="flex gap-2">
                        {workflow.triggers.map((trigger, index) => (
                          <Badge key={index} variant="secondary">
                            {trigger.type === 'schedule' ? `Schedule: ${trigger.schedule}` : 
                             trigger.type === 'event' ? `Event: ${trigger.eventType}` : 
                             trigger.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <WorkflowInstancesTab
          instances={instances}
          workflows={workflows}
          getStatusBadge={getStatusBadge}
          formatTime={formatTime}
          formatDuration={formatDuration}
          controlWorkflow={controlWorkflow}
        />
        <WorkflowMetricsTab
          metrics={metrics}
          metricsWindow={metricsWindow}
          trendPoints={trendPoints}
          dlqItems={dlqItems}
          dlqStats={dlqStats}
          dlqPage={dlqPage}
          setDlqPage={setDlqPage}
          dlqQuery={dlqQuery}
          setDlqQuery={setDlqQuery}
          selectedDlq={selectedDlq}
          setSelectedDlq={setSelectedDlq}
          diagHistory={diagHistory}
          diagKindFilter={diagKindFilter}
          setDiagKindFilter={setDiagKindFilter}
          diagHoursFilter={diagHoursFilter}
          setDiagHoursFilter={setDiagHoursFilter}
          replayDlq={replayDlq}
          fetchDlq={fetchDlq}
          clearDlq={clearDlq}
          fetchDiagHistory={fetchDiagHistory}
          copyDiagnostic={copyDiagnostic}
          runDiagnostic={runDiagnostic}
        />
      </Tabs>
    </div>
  );
}