import { buildMetricAlerts } from '@/lib/workflow/metric-alerts';

describe('buildMetricAlerts', () => {
  it('returns INSUFFICIENT_SAMPLE when no finished samples', () => {
    const alerts = buildMetricAlerts({
      successRate: 0,
      totalFinished: 0,
      averageExecutionTime: 0,
      moduleFailureTopN: [],
      dlqSize: 0,
    });

    expect(alerts.some(a => a.code === 'INSUFFICIENT_SAMPLE')).toBe(true);
    expect(alerts.some(a => a.code === 'LOW_SUCCESS_RATE')).toBe(false);
  });

  it('returns LOW_SUCCESS_RATE for low success', () => {
    const alerts = buildMetricAlerts({
      successRate: 50,
      totalFinished: 10,
      averageExecutionTime: 1000,
      moduleFailureTopN: [{ module: 'finance', failures: 6 }],
      dlqSize: 1,
    });

    expect(alerts.some(a => a.code === 'LOW_SUCCESS_RATE')).toBe(true);
    expect(alerts.some(a => a.code === 'MODULE_FAILURE_HOTSPOT')).toBe(true);
  });
});
