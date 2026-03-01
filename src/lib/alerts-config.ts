export const ALERTS_CONFIG = {
  quietHours: { start: 23, end: 8 },
  cooldownMinutes: 180,
  stageThresholdHours: {
    accepted: 24,
    outsource_confirmed: 24,
    analysis_done: 24,
    automation_done: 12,
    troubleshooting: 8,
    deploy_ready: 6,
  } as Record<string, number>,
};
