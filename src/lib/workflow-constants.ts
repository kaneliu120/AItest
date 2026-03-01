export const WORKFLOW_STAGES = [
  'draft',
  'accepted',
  'outsource_confirmed',
  'analysis_done',
  'automation_done',
  'test_passed',
  'test_failed',
  'troubleshooting',
  'deploy_ready',
  'deployed',
  'invoiced',
  'closed',
] as const;

export type WorkflowStage = typeof WORKFLOW_STAGES[number];

export const TERMINAL_STAGES: WorkflowStage[] = ['closed'];
