import { logger } from '@/lib/logger';
// 简化的故障诊断引擎 - 避免类型错误
export interface FaultDetectionRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: (context: Record<string, unknown>) => boolean | Promise<boolean>;
  action: (context: Record<string, unknown>) => Promise<unknown>;
  tags: string[];
  enabled: boolean;
}

export interface RepairStep {
  id: string;
  description: string;
  action: () => Promise<unknown>;
  requiresConfirmation: boolean;
  estimatedTime: number;
}

export class FaultDiagnosisEngine {
  private rules: Map<string, FaultDetectionRule> = new Map();

  constructor() {
    // 初始化默认规则
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // 简化的默认规则
    const defaultRules: FaultDetectionRule[] = [
      {
        id: 'high-cpu-usage',
        name: 'High CPU Usage Detection',
        description: 'Detects CPU usage exceeding 80%',
        severity: 'medium',
        condition: async (context) => (((context.systemMetrics as Record<string, unknown> | undefined)?.cpuUsage as number | undefined) ?? 0) > 80,
        action: async (context) => ({
          faultId: `cpu-high-${Date.now()}`,
          ruleId: 'high-cpu-usage',
          timestamp: new Date(),
          severity: 'medium',
          description: 'CPU usage too high',
          rootCause: 'System load too high or insufficient resources',
          suggestedActions: ['Check running processes', 'Optimize code performance', 'Add system resources'],
          automaticRepairAvailable: true,
          repairSteps: [
            {
              id: 'analyze-processes',
              description: 'Analyze CPU-consuming processes',
              action: async () => ({ success: true, message: 'Process analysis complete' }),
              requiresConfirmation: false,
              estimatedTime: 5
            }
          ],
          confidence: 0.8,
          data: { cpuUsage: ((context.systemMetrics as Record<string, unknown> | undefined)?.cpuUsage as number | undefined) ?? 0 }
        }),
        tags: ['performance', 'cpu'],
        enabled: true
      }
    ];

    defaultRules.forEach(rule => this.addRule(rule));
  }

  // 添加检测规则
  addRule(rule: FaultDetectionRule): void {
    this.rules.set(rule.id, rule);
  }

  // 移除检测规则
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  // 运行诊断
  async diagnose(context: Record<string, unknown>): Promise<unknown[]> {
    const results: unknown[] = [];
    
    for (const rule of this.rules.values()) {
      if (rule.enabled) {
        try {
          const shouldTrigger = await rule.condition(context);
          if (shouldTrigger) {
            const result = await rule.action(context);
            results.push(result);
          }
        } catch (error) {
          logger.error('Rule execution failed', error, { module: 'FaultDiagnosisEngine', rule: rule.name });
        }
      }
    }
    
    return results;
  }

  // 获取所有规则
  getAllRules(): FaultDetectionRule[] {
    return Array.from(this.rules.values());
  }

  // 启用/禁用规则
  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      return true;
    }
    return false;
  }
}