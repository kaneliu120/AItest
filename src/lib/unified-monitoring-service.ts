// 统一监控和告警服务
// 阶段6: 集成所有子系统的统一监控和告警系统

// 监控指标接口
export interface MonitoringMetric {
  id: string;
  system: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
}

// 告警规则接口
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  system: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'neq' | 'gte' | 'lte';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  duration?: number; // 持续时间(秒)
  cooldown?: number; // 冷却时间(秒)
  enabled: boolean;
}

// 告警接口
export interface Alert {
  id: string;
  ruleId: string;
  system: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

// 通知渠道接口
export interface NotificationChannel {
  id: string;
  name: string;
  type: 'discord' | 'telegram' | 'email' | 'webhook';
  config: Record<string, any>;
  enabled: boolean;
}

// 系统健康状态接口
export interface SystemHealth {
  system: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: MonitoringMetric[];
  lastCheck: Date;
  uptime: number; // 秒
  errorRate: number; // 百分比
  responseTime: number; // 毫秒
}

// 统一监控服务类
export class UnifiedMonitoringService {
  private metrics: Map<string, MonitoringMetric> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private channels: Map<string, NotificationChannel> = new Map();
  private systemHealth: Map<string, SystemHealth> = new Map();
  private cleanupIntervalId?: ReturnType<typeof setInterval>;
  
  private readonly defaultRules: AlertRule[] = [
    // 知识增强开发系统告警规则
    {
      id: 'knowledge-query-time',
      name: '知识查询响应时间过高',
      description: '知识查询响应时间超过阈值',
      system: 'knowledge-enhanced-development',
      metric: '知识查询响应时间',
      condition: 'gt',
      threshold: 1000, // 1秒
      severity: 'warning',
      duration: 60,
      cooldown: 300,
      enabled: true
    },
    {
      id: 'knowledge-query-success',
      name: '知识查询成功率过低',
      description: '知识查询成功率低于阈值',
      system: 'knowledge-enhanced-development',
      metric: '查询成功率',
      condition: 'lt',
      threshold: 95, // 95%
      severity: 'critical',
      duration: 60,
      cooldown: 300,
      enabled: true
    },
    
    // 智能任务分发系统告警规则
    {
      id: 'dispatch-response-time',
      name: '任务分发响应时间过高',
      description: '任务分发响应时间超过阈值',
      system: 'intelligent-task-dispatch',
      metric: '任务分发响应时间',
      condition: 'gt',
      threshold: 500, // 500ms
      severity: 'warning',
      duration: 60,
      cooldown: 300,
      enabled: true
    },
    {
      id: 'dispatch-accuracy',
      name: '分发准确率过低',
      description: '分发准确率低于阈值',
      system: 'intelligent-task-dispatch',
      metric: '分发准确率',
      condition: 'lt',
      threshold: 90, // 90%
      severity: 'critical',
      duration: 60,
      cooldown: 300,
      enabled: true
    },
    
    // 上下文缓存系统告警规则
    {
      id: 'cache-hit-rate',
      name: '缓存命中率过低',
      description: '缓存命中率低于阈值',
      system: 'context-aware-cache',
      metric: '缓存命中率',
      condition: 'lt',
      threshold: 60, // 60%
      severity: 'critical',
      duration: 60,
      cooldown: 300,
      enabled: true
    },
    {
      id: 'cache-memory-usage',
      name: '缓存内存使用率过高',
      description: '缓存内存使用率超过阈值',
      system: 'context-aware-cache',
      metric: '内存使用率',
      condition: 'gt',
      threshold: 80, // 80%
      severity: 'critical',
      duration: 60,
      cooldown: 300,
      enabled: true
    },
    
    // 统一网关系统告警规则
    {
      id: 'api-response-time',
      name: 'API响应时间过高',
      description: 'API响应时间超过阈值',
      system: 'unified-gateway',
      metric: 'API响应时间',
      condition: 'gt',
      threshold: 200, // 200ms
      severity: 'warning',
      duration: 60,
      cooldown: 300,
      enabled: true
    },
    {
      id: 'api-success-rate',
      name: 'API请求成功率过低',
      description: 'API请求成功率低于阈值',
      system: 'unified-gateway',
      metric: '请求成功率',
      condition: 'lt',
      threshold: 99, // 99%
      severity: 'critical',
      duration: 60,
      cooldown: 300,
      enabled: true
    },
    
    // 自动化效率优化系统告警规则
    {
      id: 'token-reduction',
      name: 'Token减少百分比过低',
      description: 'Token减少百分比低于阈值',
      system: 'automation-efficiency-optimization',
      metric: 'Token减少百分比',
      condition: 'lt',
      threshold: 50, // 50%
      severity: 'warning',
      duration: 60,
      cooldown: 300,
      enabled: true
    },
    {
      id: 'efficiency-gain',
      name: '效率提升百分比过低',
      description: '效率提升百分比低于阈值',
      system: 'automation-efficiency-optimization',
      metric: '效率提升百分比',
      condition: 'lt',
      threshold: 30, // 30%
      severity: 'warning',
      duration: 60,
      cooldown: 300,
      enabled: true
    }
  ];
  
  constructor() {
    console.log('🚀 初始化统一监控和告警服务...');
    this.initializeDefaultRules();
    this.initializeDefaultChannels();
  }
  
  // 初始化默认告警规则
  private initializeDefaultRules(): void {
    this.defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
    console.log(`✅ 加载默认告警规则: ${this.defaultRules.length}个`);
  }
  
  // 初始化默认通知渠道
  private initializeDefaultChannels(): void {
    const defaultChannels: NotificationChannel[] = [
      {
        id: 'discord-alerts',
        name: 'Discord告警',
        type: 'discord',
        config: {
          webhookUrl: process.env.DISCORD_ALERT_WEBHOOK || '',
          channelId: process.env.DISCORD_ALERT_CHANNEL || '',
          mentionRoles: ['@here']
        },
        enabled: !!process.env.DISCORD_ALERT_WEBHOOK
      },
      {
        id: 'telegram-alerts',
        name: 'Telegram告警',
        type: 'telegram',
        config: {
          botToken: process.env.TELEGRAM_BOT_TOKEN || '',
          chatId: process.env.TELEGRAM_ALERT_CHAT_ID || ''
        },
        enabled: !!process.env.TELEGRAM_BOT_TOKEN
      }
    ];
    
    defaultChannels.forEach(channel => {
      this.channels.set(channel.id, channel);
    });
    
    console.log(`✅ 初始化通知渠道: ${defaultChannels.length}个`);
  }
  
  // 收集监控指标
  async collectMetrics(system: string, metrics: MonitoringMetric[]): Promise<void> {
    const timestamp = new Date();
    
    metrics.forEach(metric => {
      const metricId = `${system}:${metric.name}:${timestamp.getTime()}`;
      const fullMetric: MonitoringMetric = {
        ...metric,
        id: metricId,
        system,
        timestamp
      };
      
      this.metrics.set(metricId, fullMetric);
      
      // 检查告警规则
      this.checkAlertRules(system, metric.name, metric.value);
    });
    
    // 更新系统健康状态
    await this.updateSystemHealth(system, metrics);
    
    // 清理旧指标（保留最近1000个）
    this.cleanupOldMetrics();
  }
  
  // 检查告警规则
  private checkAlertRules(system: string, metricName: string, metricValue: number): void {
    const relevantRules = Array.from(this.rules.values()).filter(rule => 
      rule.system === system && 
      rule.metric === metricName && 
      rule.enabled
    );
    
    relevantRules.forEach(rule => {
      const shouldAlert = this.evaluateRuleCondition(rule, metricValue);
      
      if (shouldAlert) {
        this.createAlert(rule, metricValue);
      }
    });
  }
  
  // 评估规则条件
  private evaluateRuleCondition(rule: AlertRule, value: number): boolean {
    switch (rule.condition) {
      case 'gt': return value > rule.threshold;
      case 'lt': return value < rule.threshold;
      case 'eq': return value === rule.threshold;
      case 'neq': return value !== rule.threshold;
      case 'gte': return value >= rule.threshold;
      case 'lte': return value <= rule.threshold;
      default: return false;
    }
  }
  
  // 创建告警
  private createAlert(rule: AlertRule, currentValue: number): void {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 检查是否已有相同规则的活跃告警
    const existingAlert = Array.from(this.alerts.values()).find(alert => 
      alert.ruleId === rule.id && 
      !alert.resolved &&
      (Date.now() - alert.timestamp.getTime()) < (rule.cooldown || 300) * 1000
    );
    
    if (existingAlert) {
      // 已有活跃告警，跳过
      return;
    }
    
    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      system: rule.system,
      metric: rule.metric,
      currentValue,
      threshold: rule.threshold,
      severity: rule.severity,
      message: this.generateAlertMessage(rule, currentValue),
      timestamp: new Date(),
      acknowledged: false,
      resolved: false
    };
    
    this.alerts.set(alertId, alert);
    
    // 发送通知
    this.sendNotifications(alert);
    
    console.log(`🚨 创建告警: ${alert.message}`);
  }
  
  // 生成告警消息
  private generateAlertMessage(rule: AlertRule, currentValue: number): string {
    const conditionText = {
      'gt': '超过',
      'lt': '低于',
      'eq': '等于',
      'neq': '不等于',
      'gte': '超过或等于',
      'lte': '低于或等于'
    }[rule.condition] || '超过';
    
    return `${rule.system} - ${rule.name}: ${rule.metric} ${conditionText}阈值 (当前: ${currentValue}, 阈值: ${rule.threshold})`;
  }
  
  // 发送通知
  private async sendNotifications(alert: Alert): Promise<void> {
    const enabledChannels = Array.from(this.channels.values()).filter(channel => channel.enabled);
    
    for (const channel of enabledChannels) {
      try {
        await this.sendNotificationToChannel(channel, alert);
      } catch (error) {
        console.error(`❌ 发送通知到渠道 ${channel.name} 失败:`, error);
      }
    }
  }
  
  // 发送通知到特定渠道
  private async sendNotificationToChannel(channel: NotificationChannel, alert: Alert): Promise<void> {
    const message = this.formatAlertMessage(alert);
    
    switch (channel.type) {
      case 'discord':
        await this.sendDiscordNotification(channel.config, message, alert.severity);
        break;
      case 'telegram':
        await this.sendTelegramNotification(channel.config, message);
        break;
      case 'email':
        await this.sendEmailNotification(channel.config, message, alert);
        break;
      case 'webhook':
        await this.sendWebhookNotification(channel.config, alert);
        break;
    }
  }
  
  // 格式化告警消息
  private formatAlertMessage(alert: Alert): string {
    const severityEmoji = {
      'critical': '🚨',
      'warning': '⚠️',
      'info': 'ℹ️'
    }[alert.severity] || '📢';
    
    const time = alert.timestamp.toLocaleString('zh-CN');
    
    return `${severityEmoji} **${alert.severity.toUpperCase()} 告警**\n` +
           `**系统**: ${alert.system}\n` +
           `**指标**: ${alert.metric}\n` +
           `**当前值**: ${alert.currentValue}\n` +
           `**阈值**: ${alert.threshold}\n` +
           `**时间**: ${time}\n` +
           `**消息**: ${alert.message}`;
  }
  
  // 发送Discord通知（模拟）
  private async sendDiscordNotification(config: any, message: string, severity: string): Promise<void> {
    console.log(`📢 Discord通知: ${message}`);
    // 实际实现会调用Discord webhook
  }
  
  // 发送Telegram通知（模拟）
  private async sendTelegramNotification(config: any, message: string): Promise<void> {
    console.log(`📢 Telegram通知: ${message}`);
    // 实际实现会调用Telegram Bot API
  }
  
  // 发送Email通知（模拟）
  private async sendEmailNotification(config: any, message: string, alert: Alert): Promise<void> {
    console.log(`📧 Email通知: ${message}`);
    // 实际实现会发送邮件
  }
  
  // 发送Webhook通知（模拟）
  private async sendWebhookNotification(config: any, alert: Alert): Promise<void> {
    console.log(`🌐 Webhook通知: ${alert.message}`);
    // 实际实现会调用webhook
  }
  
  // 更新系统健康状态
  private async updateSystemHealth(system: string, metrics: MonitoringMetric[]): Promise<void> {
    const responseTimeMetric = metrics.find(m => m.name.includes('响应时间'));
    const errorRateMetric = metrics.find(m => m.name.includes('错误率') || m.name.includes('成功率'));
    
    const health: SystemHealth = {
      system,
      status: 'healthy', // 默认健康，实际会根据指标计算
      metrics,
      lastCheck: new Date(),
      uptime: 0, // 需要从系统获取
      errorRate: errorRateMetric ? (errorRateMetric.name.includes('成功率') ? 100 - errorRateMetric.value : errorRateMetric.value) : 0,
      responseTime: responseTimeMetric?.value || 0
    };
    
    // 根据指标计算状态
    health.status = this.calculateSystemStatus(health);
    
    this.systemHealth.set(system, health);
  }
  
  // 计算系统状态
  private calculateSystemStatus(health: SystemHealth): 'healthy' | 'degraded' | 'unhealthy' {
    if (health.errorRate > 10) return 'unhealthy';
    if (health.errorRate > 5) return 'degraded';
    if (health.responseTime > 1000) return 'degraded';
    return 'healthy';
  }
  
  // 清理旧指标
  private cleanupOldMetrics(): void {
    const now = Date.now();
    const metricsToDelete: string[] = [];
    
    this.metrics.forEach((metric, id) => {
      const age = now - metric.timestamp.getTime();
      if (age > 24 * 60 * 60 * 1000) { // 24小时
        metricsToDelete.push(id);
      }
    });
    
    metricsToDelete.forEach(id => {
      this.metrics.delete(id);
    });
    
    if (metricsToDelete.length > 0) {
      console.log(`🧹 清理旧指标: ${metricsToDelete.length}个`);
    }
  }
  
  // 清理旧告警
  private cleanupOldAlerts(): void {
    const now = Date.now();
    const alertsToDelete: string[] = [];
    
    this.alerts.forEach((alert, id) => {
      const age = now - alert.timestamp.getTime();
      if (age > 7 * 24 * 60 * 60 * 1000) { // 7天
        alertsToDelete.push(id);
      }
    });
    
    alertsToDelete.forEach(id => {
      this.alerts.delete(id);
    });
    
    if (alertsToDelete.length > 0) {
      console.log(`🧹 清理旧告警: ${alertsToDelete.length}个`);
    }
  }
  
  // 获取服务状态
  getServiceStatus(): any {
    const totalMetrics = this.metrics.size;
    const totalAlerts = this.alerts.size;
    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved).length;
    const totalRules = this.rules.size;
    const enabledRules = Array.from(this.rules.values()).filter(r => r.enabled).length;
    const totalChannels = this.channels.size;
    const enabledChannels = Array.from(this.channels.values()).filter(c => c.enabled).length;
    
    // 计算系统健康状态
    const systemHealthStatus = Array.from(this.systemHealth.values()).map(health => ({
      system: health.system,
      status: health.status,
      errorRate: health.errorRate,
      responseTime: health.responseTime
    }));
    
    // 计算整体健康状态
    const overallStatus = this.calculateOverallHealthStatus();
    
    return {
      status: 'healthy',
      service: 'unified-monitoring-service',
      timestamp: new Date().toISOString(),
      metrics: {
        totalMetrics,
        totalAlerts,
        activeAlerts,
        totalRules,
        enabledRules,
        totalChannels,
        enabledChannels
      },
      systemHealth: systemHealthStatus,
      overallStatus,
      configuration: {
        defaultRules: this.defaultRules.length,
        notificationChannels: Array.from(this.channels.values()).map(c => ({
          name: c.name,
          type: c.type,
          enabled: c.enabled
        }))
      }
    };
  }
  
  // 计算整体健康状态
  private calculateOverallHealthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    if (this.systemHealth.size === 0) return 'healthy';
    
    const unhealthySystems = Array.from(this.systemHealth.values()).filter(
      health => health.status === 'unhealthy'
    ).length;
    
    const degradedSystems = Array.from(this.systemHealth.values()).filter(
      health => health.status === 'degraded'
    ).length;
    
    if (unhealthySystems > 0) return 'unhealthy';
    if (degradedSystems > 0) return 'degraded';
    return 'healthy';
  }
  
  // 获取活跃告警
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  // 获取系统健康状态
  getSystemHealth(system?: string): SystemHealth[] {
    if (system) {
      const health = this.systemHealth.get(system);
      return health ? [health] : [];
    }
    
    return Array.from(this.systemHealth.values());
  }
  
  // 获取监控指标
  getMetrics(system?: string, metricName?: string, limit: number = 100): MonitoringMetric[] {
    let metrics = Array.from(this.metrics.values());
    
    if (system) {
      metrics = metrics.filter(m => m.system === system);
    }
    
    if (metricName) {
      metrics = metrics.filter(m => m.name === metricName);
    }
    
    // 按时间倒序排序
    metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return metrics.slice(0, limit);
  }
  
  // 获取告警规则
  getAlertRules(system?: string): AlertRule[] {
    let rules = Array.from(this.rules.values());
    
    if (system) {
      rules = rules.filter(r => r.system === system);
    }
    
    return rules;
  }
  
  // 添加或更新告警规则
  upsertAlertRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    console.log(`📝 更新告警规则: ${rule.name} (${rule.id})`);
  }
  
  // 删除告警规则
  deleteAlertRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      console.log(`🗑️ 删除告警规则: ${ruleId}`);
    }
    return deleted;
  }
  
  // 确认告警
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;
    
    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();
    
    console.log(`✅ 告警已确认: ${alertId} (${acknowledgedBy})`);
    return true;
  }
  
  // 解决告警
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;
    
    alert.resolved = true;
    alert.resolvedAt = new Date();
    
    console.log(`✅ 告警已解决: ${alertId}`);
    return true;
  }
  
  // 添加通知渠道
  addNotificationChannel(channel: NotificationChannel): void {
    this.channels.set(channel.id, channel);
    console.log(`📢 添加通知渠道: ${channel.name} (${channel.type})`);
  }
  
  // 启用/禁用通知渠道
  setChannelEnabled(channelId: string, enabled: boolean): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;
    
    channel.enabled = enabled;
    console.log(`⚙️ ${enabled ? '启用' : '禁用'}通知渠道: ${channel.name}`);
    return true;
  }
  
  // 获取性能报告
  getPerformanceReport(days: number = 7): any {
    const now = new Date();
    const startTime = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const recentMetrics = Array.from(this.metrics.values()).filter(
      metric => metric.timestamp >= startTime
    );
    
    const recentAlerts = Array.from(this.alerts.values()).filter(
      alert => alert.timestamp >= startTime
    );
    
    // 按系统分组指标
    const metricsBySystem = this.groupMetricsBySystem(recentMetrics);
    
    // 按严重性分组告警
    const alertsBySeverity = this.groupAlertsBySeverity(recentAlerts);
    
    // 计算趋势
    const trends = this.calculateTrends(recentMetrics);
    
    return {
      period: {
        start: startTime.toISOString(),
        end: now.toISOString(),
        days
      },
      summary: {
        totalMetrics: recentMetrics.length,
        totalAlerts: recentAlerts.length,
        activeAlerts: recentAlerts.filter(a => !a.resolved).length,
        systemsMonitored: metricsBySystem.length
      },
      metricsBySystem,
      alertsBySeverity,
      trends,
      recommendations: this.generateRecommendations(metricsBySystem, recentAlerts)
    };
  }
  
  // 按系统分组指标
  private groupMetricsBySystem(metrics: MonitoringMetric[]): Array<{
    system: string;
    metricCount: number;
    avgValue: number;
    minValue: number;
    maxValue: number;
  }> {
    const systems = new Set(metrics.map(m => m.system));
    const result: Array<{
      system: string;
      metricCount: number;
      avgValue: number;
      minValue: number;
      maxValue: number;
    }> = [];
    
    systems.forEach(system => {
      const systemMetrics = metrics.filter(m => m.system === system);
      const values = systemMetrics.map(m => m.value);
      
      result.push({
        system,
        metricCount: systemMetrics.length,
        avgValue: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
        minValue: values.length > 0 ? Math.min(...values) : 0,
        maxValue: values.length > 0 ? Math.max(...values) : 0
      });
    });
    
    return result;
  }
  
  // 按严重性分组告警
  private groupAlertsBySeverity(alerts: Alert[]): Record<string, number> {
    const result: Record<string, number> = {
      critical: 0,
      warning: 0,
      info: 0
    };
    
    alerts.forEach(alert => {
      result[alert.severity] = (result[alert.severity] || 0) + 1;
    });
    
    return result;
  }
  
  // 计算趋势
  private calculateTrends(metrics: MonitoringMetric[]): Array<{
    system: string;
    metric: string;
    trend: 'improving' | 'stable' | 'worsening';
    change: number;
  }> {
    // 简化实现：按最近24小时和之前24小时比较
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const prev24h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    const recentMetrics = metrics.filter(m => m.timestamp >= last24h);
    const previousMetrics = metrics.filter(m => m.timestamp >= prev24h && m.timestamp < last24h);
    
    const trends: Array<{
      system: string;
      metric: string;
      trend: 'improving' | 'stable' | 'worsening';
      change: number;
    }> = [];
    
    // 这里可以添加更复杂的趋势分析逻辑
    // 简化版本：返回空数组
    
    return trends;
  }
  
  // 生成建议
  private generateRecommendations(
    metricsBySystem: Array<{ system: string; avgValue: number }>,
    alerts: Alert[]
  ): Array<{
    priority: 'high' | 'medium' | 'low';
    system: string;
    suggestion: string;
    action: string;
  }> {
    const recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      system: string;
      suggestion: string;
      action: string;
    }> = [];
    
    // 基于活跃告警生成建议
    const activeAlerts = alerts.filter(a => !a.resolved);
    
    activeAlerts.forEach(alert => {
      recommendations.push({
        priority: alert.severity === 'critical' ? 'high' : 'medium',
        system: alert.system,
        suggestion: `解决活跃告警: ${alert.message}`,
        action: '检查系统状态并解决问题'
      });
    });
    
    // 基于系统健康状态生成建议
    metricsBySystem.forEach(systemMetrics => {
      // 这里可以添加基于指标值的建议逻辑
      // 例如：如果某个指标值异常，生成相应建议
    });
    
    return recommendations;
  }
  
  async start(): Promise<void> {
    console.log('🚀 启动统一监控和告警服务...');
    
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupOldMetrics();
      this.cleanupOldAlerts();
    }, 60 * 60 * 1000); // 每小时清理一次
    
    console.log('✅ 统一监控和告警服务已启动');
  }
  
  async stop(): Promise<void> {
    console.log('🛑 停止统一监控和告警服务...');
    if (this.cleanupIntervalId !== undefined) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = undefined;
    }
    console.log('✅ 统一监控和告警服务已停止');
  }
}

// 导出单例实例
export const unifiedMonitoringService = new UnifiedMonitoringService();