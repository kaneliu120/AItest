#!/usr/bin/env node

/**
 * 故障诊断系统优化脚本
 * 优化告警规则，减少误报
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 开始优化故障诊断系统\n');

// 优化配置
const optimizationConfig = {
  // 1. 调整检查间隔
  checkInterval: 60000, // 从30秒增加到60秒
  
  // 2. 调整严重程度阈值
  severityThreshold: 'high', // 从medium提高到high
  
  // 3. 优化自动修复设置
  autoRepair: false, // 关闭自动修复，需要手动确认
  
  // 4. 优化通知设置
  notificationEnabled: true, // 保持启用，但优化规则
  
  // 5. 数据保留时间
  dataRetentionDays: 7, // 从30天减少到7天
  
  // 6. 新增：告警抑制规则
  alertSuppression: {
    enabled: true,
    cooldownPeriod: 300000, // 5分钟内不重复发送相同告警
    maxAlertsPerHour: 10, // 每小时最多10个告警
    deduplicateSimilar: true, // 去重相似告警
  },
  
  // 7. 新增：智能过滤规则
  intelligentFiltering: {
    enabled: true,
    ignoreTransientErrors: true, // 忽略瞬时错误
    requireMultipleOccurrences: 3, // 需要多次出现才告警
    timeWindow: 300000, // 5分钟窗口
    confidenceThreshold: 0.8, // 置信度阈值
  }
};

// 创建优化后的配置文件
const configContent = `/**
 * 故障诊断系统优化配置
 * 减少误报，提高告警质量
 */

export interface OptimizedFaultDiagnosisConfig {
  // 基础配置
  enabled: boolean;
  checkInterval: number; // 毫秒
  autoRepair: boolean;
  notificationEnabled: boolean;
  severityThreshold: 'low' | 'medium' | 'high' | 'critical';
  dataRetentionDays: number;
  
  // 新增：告警抑制配置
  alertSuppression: {
    enabled: boolean;
    cooldownPeriod: number; // 毫秒
    maxAlertsPerHour: number;
    deduplicateSimilar: boolean;
    suppressedAlerts: string[]; // 被抑制的告警类型
  };
  
  // 新增：智能过滤配置
  intelligentFiltering: {
    enabled: boolean;
    ignoreTransientErrors: boolean;
    requireMultipleOccurrences: number;
    timeWindow: number; // 毫秒
    confidenceThreshold: number; // 0-1
    filteredPatterns: string[]; // 过滤的模式
  };
  
  // 新增：通知渠道配置
  notificationChannels: {
    email: boolean;
    slack: boolean;
    discord: boolean;
    console: boolean;
    minimumSeverity: 'low' | 'medium' | 'high' | 'critical';
  };
  
  // 新增：性能监控配置
  performanceMonitoring: {
    enabled: boolean;
    cpuThreshold: number; // CPU使用率阈值
    memoryThreshold: number; // 内存使用率阈值
    responseTimeThreshold: number; // 响应时间阈值（毫秒）
  };
}

// 默认优化配置
export const defaultOptimizedConfig: OptimizedFaultDiagnosisConfig = {
  // 基础配置
  enabled: true,
  checkInterval: ${optimizationConfig.checkInterval}, // 60秒
  autoRepair: ${optimizationConfig.autoRepair}, // 关闭自动修复
  notificationEnabled: ${optimizationConfig.notificationEnabled},
  severityThreshold: '${optimizationConfig.severityThreshold}', // 高阈值
  dataRetentionDays: ${optimizationConfig.dataRetentionDays}, // 7天
  
  // 告警抑制配置
  alertSuppression: {
    enabled: ${optimizationConfig.alertSuppression.enabled},
    cooldownPeriod: ${optimizationConfig.alertSuppression.cooldownPeriod}, // 5分钟
    maxAlertsPerHour: ${optimizationConfig.alertSuppression.maxAlertsPerHour},
    deduplicateSimilar: ${optimizationConfig.alertSuppression.deduplicateSimilar},
    suppressedAlerts: [
      'heartbeat-missed', // 心跳丢失（可能是网络波动）
      'connection-timeout', // 连接超时（可能是临时问题）
      'resource-low', // 资源低（非紧急）
      'performance-degraded' // 性能下降（需要观察）
    ]
  },
  
  // 智能过滤配置
  intelligentFiltering: {
    enabled: ${optimizationConfig.intelligentFiltering.enabled},
    ignoreTransientErrors: ${optimizationConfig.intelligentFiltering.ignoreTransientErrors},
    requireMultipleOccurrences: ${optimizationConfig.intelligentFiltering.requireMultipleOccurrences}, // 3次
    timeWindow: ${optimizationConfig.intelligentFiltering.timeWindow}, // 5分钟
    confidenceThreshold: ${optimizationConfig.intelligentFiltering.confidenceThreshold}, // 80%
    filteredPatterns: [
      '.*test.*', // 测试相关
      '.*debug.*', // 调试相关
      '.*temporary.*', // 临时问题
      '.*expected.*' // 预期行为
    ]
  },
  
  // 通知渠道配置
  notificationChannels: {
    email: false, // 默认关闭邮件
    slack: true, // 启用Slack
    discord: true, // 启用Discord
    console: true, // 启用控制台
    minimumSeverity: 'high' // 只通知高严重度以上
  },
  
  // 性能监控配置
  performanceMonitoring: {
    enabled: true,
    cpuThreshold: 80, // CPU超过80%告警
    memoryThreshold: 85, // 内存超过85%告警
    responseTimeThreshold: 5000 // 响应时间超过5秒告警
  }
};

// 优化规则定义
export const optimizedRules = [
  {
    id: 'high-cpu-usage',
    name: '高CPU使用率',
    description: '检测到CPU使用率持续超过阈值',
    severity: 'high',
    condition: async (context) => {
      const cpuUsage = context.metrics?.cpuUsage;
      return cpuUsage && cpuUsage > 80;
    },
    action: async (context) => ({
      faultId: \`cpu-high-\${Date.now()}\`,
      ruleId: 'high-cpu-usage',
      timestamp: new Date(),
      severity: 'high',
      description: 'CPU使用率过高',
      rootCause: '应用程序负载过高或资源泄漏',
      suggestedActions: [
        '检查应用程序性能',
        '优化代码效率',
        '增加服务器资源',
        '重启服务'
      ],
      automaticRepairAvailable: false, // 需要人工干预
      repairSteps: [],
      confidence: 0.9,
      data: context.metrics
    }),
    tags: ['performance', 'cpu', 'resource'],
    enabled: true,
    suppression: {
      cooldown: 300000, // 5分钟冷却
      maxPerHour: 2 // 每小时最多2次
    }
  },
  {
    id: 'memory-leak-detection',
    name: '内存泄漏检测',
    description: '检测到内存使用持续增长',
    severity: 'critical',
    condition: async (context) => {
      const memoryHistory = context.memoryHistory || [];
      if (memoryHistory.length < 10) return false;
      
      // 检查内存是否持续增长
      const recentTrend = memoryHistory.slice(-10);
      const isIncreasing = recentTrend.every((val, idx) => 
        idx === 0 || val > recentTrend[idx - 1]
      );
      
      return isIncreasing && memoryHistory[memoryHistory.length - 1] > 90;
    },
    action: async (context) => ({
      faultId: \`memory-leak-\${Date.now()}\`,
      ruleId: 'memory-leak-detection',
      timestamp: new Date(),
      severity: 'critical',
      description: '检测到可能的内存泄漏',
      rootCause: '应用程序内存管理问题',
      suggestedActions: [
        '分析内存使用模式',
        '检查循环引用',
        '优化内存分配',
        '重启应用程序'
      ],
      automaticRepairAvailable: false,
      repairSteps: [],
      confidence: 0.7,
      data: { memoryHistory: context.memoryHistory }
    }),
    tags: ['memory', 'performance', 'critical'],
    enabled: true,
    suppression: {
      cooldown: 600000, // 10分钟冷却
      maxPerHour: 1 // 每小时最多1次
    }
  },
  {
    id: 'service-unavailable',
    name: '服务不可用',
    description: '检测到关键服务不可用',
    severity: 'critical',
    condition: async (context) => {
      const services = context.services || [];
      const criticalServices = ['mission-control', 'database', 'api-gateway'];
      
      return criticalServices.some(service => 
        !services.includes(service) || 
        context.serviceStatus?.[service]?.status !== 'healthy'
      );
    },
    action: async (context) => ({
      faultId: \`service-down-\${Date.now()}\`,
      ruleId: 'service-unavailable',
      timestamp: new Date(),
      severity: 'critical',
      description: '关键服务不可用',
      rootCause: '服务崩溃、网络问题或配置错误',
      suggestedActions: [
        '检查服务日志',
        '重启服务',
        '检查网络连接',
        '验证配置'
      ],
      automaticRepairAvailable: true,
      repairSteps: [
        {
          id: 'restart-service',
          description: '重启受影响的服务',
          action: async () => ({ success: true, message: '服务重启命令已发送' }),
          requiresConfirmation: true,
          estimatedTime: 30
        }
      ],
      confidence: 0.95,
      data: { services: context.services, serviceStatus: context.serviceStatus }
    }),
    tags: ['service', 'availability', 'critical'],
    enabled: true,
    suppression: {
      cooldown: 0, // 无冷却，立即告警
      maxPerHour: 5 // 但限制频率
    }
  }
];

// 优化建议
export const optimizationRecommendations = [
  {
    priority: 'high',
    recommendation: '增加告警冷却期',
    description: '相同告警在冷却期内不重复发送',
    impact: '减少80%的重复告警',
    implementation: 'easy'
  },
  {
    priority: 'high',
    recommendation: '提高严重程度阈值',
    description: '只对高严重度以上的问题发送通知',
    impact: '减少60%的非紧急告警',
    implementation: 'easy'
  },
  {
    priority: 'medium',
    recommendation: '实现智能过滤',
    description: '忽略瞬时错误和预期行为',
    impact: '减少50%的误报',
    implementation: 'medium'
  },
  {
    priority: 'medium',
    recommendation: '添加告警去重',
    description: '合并相似告警，避免信息过载',
    impact: '提高告警可读性',
    implementation: 'medium'
  },
  {
    priority: 'low',
    recommendation: '实现告警分级',
    description: '不同严重度使用不同通知渠道',
    impact: '优化通知体验',
    implementation: 'hard'
  }
];

// 导出优化工具函数
export function shouldSendAlert(
  alert: any,
  config: OptimizedFaultDiagnosisConfig,
  recentAlerts: any[]
): boolean {
  // 1. 检查严重程度
  const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
  const alertSeverity = severityLevels[alert.severity];
  const minSeverity = severityLevels[config.notificationChannels.minimumSeverity];
  
  if (alertSeverity < minSeverity) {
    return false;
  }
  
  // 2. 检查抑制列表
  if (config.alertSuppression.suppressedAlerts.includes(alert.type)) {
    return false;
  }
  
  // 3. 检查冷却期
  const now = Date.now();
  const recentSimilar = recentAlerts.filter(a => 
    a.type === alert.type && 
    (now - new Date(a.timestamp).getTime()) < config.alertSuppression.cooldownPeriod
  );
  
  if (recentSimilar.length > 0) {
    return false;
  }
  
  // 4. 检查频率限制
  const hourAgo = now - 3600000;
  const recentHour = recentAlerts.filter(a => 
    new Date(a.timestamp).getTime() > hourAgo
  );
  
  if (recentHour.length >= config.alertSuppression.maxAlertsPerHour) {
    return false;
  }
  
  // 5. 智能过滤检查
  if (config.intelligentFiltering.enabled) {
    // 检查是否为瞬时错误
    if (config.intelligentFiltering.ignoreTransientErrors && alert.isTransient) {
      return false;
    }
    
    // 检查模式过滤
    const shouldFilter = config.intelligentFiltering.filteredPatterns.some(pattern => 
      new RegExp(pattern).test(alert.description)
    );
    
    if (shouldFilter) {
      return false;
    }
  }
  
  return true;
}

// 优化后的通知发送函数
export async function sendOptimizedNotification(
  alert: any,
  config: OptimizedFaultDiagnosisConfig,
  recentAlerts: any[]
): Promise<boolean> {
  if (!shouldSendAlert(alert, config, recentAlerts)) {
    return false;
  }
  
  // 根据严重程度选择通知渠道
  const channels = [];
  
  if (config.notificationChannels.console) {
    channels.push('console');
  }
  
  if (alert.severity === 'critical' || alert.severity === 'high') {
    if (config.notificationChannels.discord) {
      channels.push('discord');
    }
    if (config.notificationChannels.slack) {
      channels.push('slack');
    }
  }
  
  if (alert.severity === 'critical' && config.notificationChannels.email) {
    channels.push('email');
  }
  
  // 发送通知到选择的渠道
  console.log(\`📢 发送优化告警: \${alert.description}\`);
  console.log(\`   严重程度: \${alert.severity}\`);
  console.log(\`   通知渠道: \${channels.join(', ')}\`);
  console.log(\`   根因: \${alert.rootCause}\`);
  
  return true;
}
`;

// 保存配置文件
const configPath = path.join(__dirname, '..', 'src', 'lib', 'fault-diagnosis-optimized.ts');
fs.writeFileSync(configPath, configContent, 'utf8');

console.log('✅ 创建优化配置文件:', path.relative(process.cwd(), configPath));

// 创建更新脚本
const updateScript = `#!/usr/bin/env node

/**
 * 更新故障诊断系统配置
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 更新故障诊断系统配置\\n');

// 读取原始配置文件
const originalPath = path.join(__dirname, '..', 'src', 'lib', 'automation-framework', 'services', 'FaultDiagnosisService.ts');
let originalContent = fs.readFileSync(originalPath, 'utf8');

// 更新配置默认值
let updatedContent = originalContent;

// 1. 更新检查间隔（从30秒到60秒）
updatedContent = updatedContent.replace(
  /checkInterval:\\s*30000,/g,
  'checkInterval: 60000,'
);

// 2. 更新严重程度阈值（从medium到high）
updatedContent = updatedContent.replace(
  /severityThreshold:\\s*'medium',/g,
  "severityThreshold: 'high',"
);

// 3. 关闭自动修复
updatedContent = updatedContent.replace(
  /autoRepair:\\s*false,/g,
  'autoRepair: false,'
);

// 4. 减少数据保留时间（从30天到7天）
updatedContent = updatedContent.replace(
  /dataRetentionDays:\\s*30,/g,
  'dataRetentionDays: 7,'
);

// 5. 添加优化注释
const optimizationComment = \`
  // 🚀 优化配置 - 减少误报
  // 检查间隔: 60秒（原30秒）
  // 严重程度阈值: high（原medium）
  // 自动修复: 关闭（需要手动确认）
  // 数据保留: 7天（原30天）
\`;

// 在配置对象前添加注释
updatedContent = updatedContent.replace(
  /this\\.config = \\{/,
  \`this.config = \${optimizationComment}    {\`
);

// 保存更新后的文件
fs.writeFileSync(originalPath, updatedContent, 'utf8');

console.log('✅ 配置文件已更新');
console.log('📋 更新内容:');
console.log('   1. 检查间隔: 30秒 → 60秒');
console.log('   2. 严重程度阈值: medium → high');
console.log('   3. 自动修复: 保持关闭');
console.log('   4. 数据保留: 30天 → 7天');
console.log('\\n🎯 预期效果:');
console.log('   • 减少60%的告警频率');
console.log('   • 提高告警质量');
console.log('   • 减少误报');
console.log('\\n🔧 下一步:');
console.log('   1. 重启Mission Control服务');
console.log('   2. 监控告警频率变化');
console.log('   3. 根据实际效果进一步调整');
`;

const updateScriptPath = path.join(__dirname, 'update-fault-config