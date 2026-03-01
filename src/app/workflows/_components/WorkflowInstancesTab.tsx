'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { Play, Pause, StopCircle } from 'lucide-react';
import type { WorkflowDefinition, WorkflowInstance } from './types';

interface WorkflowInstancesTabProps {
  instances: WorkflowInstance[];
  workflows: WorkflowDefinition[];
  getStatusBadge: (status: string) => React.ReactNode;
  formatTime: (ts: string) => string;
  formatDuration: (start: string, end?: string) => string;
  controlWorkflow: (action: string, instanceId: string) => void;
}

export function WorkflowInstancesTab({
  instances, workflows, getStatusBadge, formatTime, formatDuration, controlWorkflow,
}: WorkflowInstancesTabProps) {
  return (
    <TabsContent value="instances">
      <Card>
        <CardHeader>
          <CardTitle>Workflow Instances</CardTitle>
          <CardDescription>All running Workflow Instances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {instances.map((instance) => {
              const workflow = workflows.find(w => w.id === instance.workflowId);
              return (
                <div key={instance.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(instance.status)}
                        <div className="font-bold text-lg">{workflow?.name || instance.workflowId}</div>
                      </div>
                      <div className="text-gray-600 mt-1">Instance ID: {instance.id}</div>
                      <div className="flex gap-2 mt-2">
                        <div className="text-sm"><span className="font-medium">Start:</span> {formatTime(instance.startedAt)}</div>
                        {instance.completedAt && (
                          <div className="text-sm"><span className="font-medium">End:</span> {formatTime(instance.completedAt)}</div>
                        )}
                        <div className="text-sm"><span className="font-medium">Duration:</span> {formatDuration(instance.startedAt, instance.completedAt)}</div>
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

                  {instance.currentStep && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-700">Current Step:</div>
                      <div className="text-blue-600">{instance.currentStep}</div>
                    </div>
                  )}

                  {instance.errors.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg">
                      <div className="font-medium text-red-700">Errors:</div>
                      <ul className="text-red-600 text-sm list-disc list-inside">
                        {instance.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4">
                    <div className="font-medium mb-2">Step Status:</div>
                    <div className="space-y-2">
                      {Object.entries(instance.stepsStatus || {}).map(([stepId, stepStatus]) => (
                        <div key={stepId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(stepStatus.status)}
                            <span>{stepId}</span>
                          </div>
                          <div className="text-gray-500">
                            {stepStatus.startedAt && `Start: ${formatTime(stepStatus.startedAt)}`}
                            {stepStatus.completedAt && ` | End: ${formatTime(stepStatus.completedAt)}`}
                            {stepStatus.attempts > 0 && ` | Attempts: ${stepStatus.attempts}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
