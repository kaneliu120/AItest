'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, StopCircle, Shield } from 'lucide-react';
import type { WorkflowDefinition, WorkflowInstance, WorkflowMetrics } from './types';

interface WorkflowOverviewTabProps {
  metrics: WorkflowMetrics | null;
  workflows: WorkflowDefinition[];
  instances: WorkflowInstance[];
  getStatusBadge: (status: string) => React.ReactNode;
  formatTime: (ts: string) => string;
  formatDuration: (start: string, end?: string) => string;
  executeWorkflow: (id: string) => void;
  controlWorkflow: (action: string, instanceId: string) => void;
}

export function WorkflowOverviewTab({
  metrics, workflows, instances, getStatusBadge, formatTime, formatDuration, executeWorkflow, controlWorkflow,
}: WorkflowOverviewTabProps) {
  return (
    <TabsContent value="overview" className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalWorkflows || 0}</div>
            <p className="text-xs text-gray-500 mt-1">{workflows.length} Definitions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Running</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics?.runningWorkflows || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Currently Active Instances</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.successRate?.toFixed(1) || 0}%</div>
            <Progress value={metrics?.successRate || 0} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Average Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.averageExecutionTime ? `${Math.round(metrics.averageExecutionTime / 1000)}s` : '0s'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Average Execution Time</p>
          </CardContent>
        </Card>
      </div>

      {/* Predefined Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Predefined Workflows
          </CardTitle>
          <CardDescription>System built-in automation workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflows.slice(0, 4).map((workflow) => (
              <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{workflow.name}</div>
                  <div className="text-sm text-gray-500">{workflow.description}</div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">v{workflow.version}</Badge>
                    <Badge variant="outline">{workflow.steps.length} Steps</Badge>
                  </div>
                </div>
                <Button size="sm" onClick={() => executeWorkflow(workflow.id)}>
                  <Play className="w-4 h-4 mr-1" />
                  Execute
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Instances */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workflow Instances</CardTitle>
          <CardDescription>Status of recently executed workflow instances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {instances.slice(0, 5).map((instance) => (
              <div key={instance.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusBadge(instance.status)}
                  <div>
                    <div className="font-medium">
                      {workflows.find(w => w.id === instance.workflowId)?.name || instance.workflowId}
                    </div>
                    <div className="text-sm text-gray-500">
                      Start: {formatTime(instance.startedAt)}
                      {instance.completedAt && ` | Duration: ${formatDuration(instance.startedAt, instance.completedAt)}`}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {instance.status === 'running' && (
                    <Button size="sm" variant="outline" onClick={() => controlWorkflow('pause', instance.id)}>
                      <Pause className="w-3 h-3" />
                    </Button>
                  )}
                  {instance.status === 'paused' && (
                    <Button size="sm" variant="outline" onClick={() => controlWorkflow('resume', instance.id)}>
                      <Play className="w-3 h-3" />
                    </Button>
                  )}
                  {(instance.status === 'running' || instance.status === 'paused') && (
                    <Button size="sm" variant="outline" onClick={() => controlWorkflow('cancel', instance.id)}>
                      <StopCircle className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
