import { getWorkflowAlertConfig } from './workflow-alert-config';

export type MetricAlert = { level: 'info' | 'warning' | 'critical'; code: string; message: string };

export function buildMetricAlerts(input: {
  successRate: number;
  totalFinished: number;
  averageExecutionTime: number;
  moduleFailureTopN: Array<{ module: string; failures: number }>;
  dlqSize: number;
}): MetricAlert[] {
  const cfg = getWorkflowAlertConfig();
  const alerts: MetricAlert[] = [];

  if (input.totalFinished > 0) {
    if (input.successRate < cfg.successRateCritical) {
      alerts.push({ level: 'critical', code: 'LOW_SUCCESS_RATE', message: `Workflow success rate too low: ${input.successRate.toFixed(1)}%` });
    } else if (input.successRate < cfg.successRateWarning) {
      alerts.push({ level: 'warning', code: 'SUCCESS_RATE_DROP', message: `Workflow success rate dropped: ${input.successRate.toFixed(1)}%` });
    }
  } else {
    alerts.push({ level: 'info', code: 'INSUFFICIENT_SAMPLE', message: 'No completed/failed samples in current window, success rate not evaluated' });
  }

  if (input.dlqSize >= cfg.dlqBacklogCritical) {
    alerts.push({ level: 'critical', code: 'DLQ_BACKLOG_HIGH', message: `Notification DLQ backlog too high: ${input.dlqSize}` });
  } else if (input.dlqSize >= cfg.dlqBacklogWarning) {
    alerts.push({ level: 'warning', code: 'DLQ_BACKLOG', message: `Notification DLQ backlog: ${input.dlqSize}` });
  }

  if (input.averageExecutionTime > cfg.avgExecutionSlowMs) {
    alerts.push({ level: 'warning', code: 'AVG_EXECUTION_SLOW', message: `Average execution time too high: ${Math.round(input.averageExecutionTime)}ms` });
  }

  if (input.moduleFailureTopN.length > 0 && input.moduleFailureTopN[0].failures >= cfg.moduleFailureHotspot) {
    alerts.push({
      level: 'warning',
      code: 'MODULE_FAILURE_HOTSPOT',
      message: `Module failure hotspot: ${input.moduleFailureTopN[0].module} (${input.moduleFailureTopN[0].failures})`,
    });
  }

  return alerts;
}
