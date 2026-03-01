// 简化的故障诊断引擎 - 避免类型错误
export interface FaultDetectionRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: (context: any) => boolean | Promise<boolean>;
  action: (context: any) => Promise<any>;
  tags: string[];
  enabled: boolean;
}

export interface RepairStep {
  id: string;
  description: string;
  action: () => Promise<any>;
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
        name: '高CPU使用率检测',
        description: '检测CPU使用率超过80%的情况',
        severity: 'medium',
        condition: async (context) => context?.systemMetrics?.cpuUsage > 80,
        action: async (context) => ({
          faultId: `cpu-high-${Date.now()}`,
          ruleId: 'high-cpu-usage',
          timestamp: new Date(),
          severity: 'medium',
          description: 'CPU使用率过高',
          rootCause: '系统负载过高或资源不足',
          suggestedActions: ['检查运行中的进程', '优化代码性能', '增加系统资源'],
          automaticRepairAvailable: true,
          repairSteps: [
            {
              id: 'analyze-processes',
              description: '分析占用CPU的进程',
              action: async () => ({ success: true, message: '进程分析完成' }),
              requiresConfirmation: false,
              estimatedTime: 5
            }
          ],
          confidence: 0.8,
          data: { cpuUsage: context?.systemMetrics?.cpuUsage }
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
  async diagnose(context: any): Promise<any[]> {
    const results = [];
    
    for (const rule of this.rules.values()) {
      if (rule.enabled) {
        try {
          const shouldTrigger = await rule.condition(context);
          if (shouldTrigger) {
            const result = await rule.action(context);
            results.push(result);
          }
        } catch (error) {
          console.error(`规则 ${rule.name} 执行失败:`, error);
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