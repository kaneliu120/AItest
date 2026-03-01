// Shared type definitions for workflows page and sub-components

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: Array<{
    id: string;
    name: string;
    description: string;
    module: string;
    action: string;
  }>;
  triggers: Array<{
    type: string;
    schedule?: string;
    eventType?: string;
  }>;
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  currentStep?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stepsStatus: Record<string, any>;
  startedAt: string;
  completedAt?: string;
  errors: string[];
}

export interface WorkflowMetrics {
  totalWorkflows: number;
  runningWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  averageExecutionTime: number;
  successRate: number;
  stepSuccessRate: Record<string, number>;
  moduleUsage: Record<string, number>;
  moduleUsageRuntime?: Record<string, number>;
  moduleFailCount?: Record<string, number>;
  moduleAvgDurationMs?: Record<string, number>;
  moduleFailureTopN?: Array<{ module: string; failures: number }>;
  alerts?: Array<{ level: 'info' | 'warning' | 'critical'; code: string; message: string }>;
}

export interface DlqItem {
  id: string;
  stepId: string;
  action: string;
  title: string;
  message: string;
  attempts?: number;
  lastError?: string;
  queuedAt: string;
}

export interface DlqStats {
  total: number;
  topErrors: Array<{ error: string; count: number }>;
  topActions: Array<{ action: string; count: number }>;
}

export interface DiagnosticHistoryItem {
  id: string;
  kind: string;
  command: string;
  output: unknown;
  createdAt: string;
}

export interface TrendPoint {
  bucket: string;
  total: number;
  completed: number;
  failed: number;
  successRate: number;
  averageExecutionTime: number;
}
