export interface WorkflowAlertConfig {
  successRateCritical: number;
  successRateWarning: number;
  dlqBacklogWarning: number;
  dlqBacklogCritical: number;
  avgExecutionSlowMs: number;
  moduleFailureHotspot: number;
}

export const defaultWorkflowAlertConfig: WorkflowAlertConfig = {
  successRateCritical: 80,
  successRateWarning: 92,
  dlqBacklogWarning: 8,
  dlqBacklogCritical: 20,
  avgExecutionSlowMs: 60000,
  moduleFailureHotspot: 5,
};

export function getWorkflowAlertConfig(): WorkflowAlertConfig {
  return {
    successRateCritical: Number(process.env.WF_ALERT_SUCCESS_CRITICAL || defaultWorkflowAlertConfig.successRateCritical),
    successRateWarning: Number(process.env.WF_ALERT_SUCCESS_WARNING || defaultWorkflowAlertConfig.successRateWarning),
    dlqBacklogWarning: Number(process.env.WF_ALERT_DLQ_WARNING || defaultWorkflowAlertConfig.dlqBacklogWarning),
    dlqBacklogCritical: Number(process.env.WF_ALERT_DLQ_CRITICAL || defaultWorkflowAlertConfig.dlqBacklogCritical),
    avgExecutionSlowMs: Number(process.env.WF_ALERT_SLOW_MS || defaultWorkflowAlertConfig.avgExecutionSlowMs),
    moduleFailureHotspot: Number(process.env.WF_ALERT_MODULE_FAIL_HOTSPOT || defaultWorkflowAlertConfig.moduleFailureHotspot),
  };
}
