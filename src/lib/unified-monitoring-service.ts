// 统一Monitoring和Alertservervice
// Stage6: 集成所All子System's统一Monitoring和AlertSystem

// MonitoringmetricsInterface
export interface MonitoringMetric {
  id: string;
  system: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
}

// Alert规thenInterface
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  system: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'neq' | 'gte' | 'lte';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  duration?: number; // 持续time(s)
  cooldown?: number; // 冷却time(s)
  enabled: boolean;
}

// AlertInterface
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

// Notification渠道Interface
export interface NotificationChannel {
  id: string;
  name: string;
  type: 'discord' | 'telegram' | 'email' | 'webhook';
  config: Record<string, any>;
  enabled: boolean;
}

// SystemHealthStatusInterface
export interface SystemHealth {
  system: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: MonitoringMetric[];
  lastCheck: Date;
  uptime: number; // s
  errorRate: number; // 百分比
  responseTime: number; // 毫s
}

// 统一Monitoringserverviceclass
export class UnifiedMonitoringservervice {
  private metrics: Map<string, MonitoringMetric> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private channels: Map<string, NotificationChannel> = new Map();
  private systemHealth: Map<string, SystemHealth> = new Map();
  private cleanupIntervalId?: ReturnType<typeof setInterval>;
  
  private readonly defaultRules: AlertRule[] = [
    // Knowledge EnhancedDevelopmentSystemAlert规then
    {
      id: 'knowledge-query-time',
      name: '知识查询Responsetime过High',
      description: '知识查询Responsetime超过阈值',
      system: 'knowledge-enhanced-development',
      metric: '知识查询Responsetime',
      condition: 'gt',
      threshold: 1000, // 1s
      severity: 'warning',
      duration: 60,
      cooldown: 300,
      enabled: true
    },
    {
      id: 'knowledge-query-success',
      name: '知识查询success率过Low',
      description: '知识查询success率Low于阈值',
      system: 'knowledge-enhanced-development',
      metric: '查询success率',
      condition: 'lt',
      threshold: 95, // 95%
      severity: 'critical',
      duration: 60,
      cooldown: 300,
      enabled: true
    },
    
    // 智canTaskDispatchSystemAlert规then
    {
      id: 'dispatch-response-time',
      name: 'TaskDispatchResponsetime过High',
      description: 'TaskDispatchResponsetime超过阈值',
      system: 'intelligent-task-dispatch',
      metric: 'TaskDispatchResponsetime',
      condition: 'gt',
      threshold: 500, // 500ms
      severity: 'warning',
      duration: 60,
      cooldown: 300,
      enabled: true
    },
    {
      id: 'dispatch-accuracy',
      name: 'Dispatch准确率过Low',
      description: 'Dispatch准确率Low于阈值',
      system: 'intelligent-task-dispatch',
      metric: 'Dispatch准确率',
      condition: 'lt',
      threshold: 90, // 90%
      severity: 'critical',
      duration: 60,
      cooldown: 300,
      enabled: true
    },
    
    // 上下文CacheSystemAlert规then
    {
      id: 'cache-hit-rate',
      name: 'Cachehit rate过Low',
      description: 'Cachehit rateLow于阈值',
      system: 'context-aware-cache',
      metric: 'Cachehit rate',
      condition: 'lt',
      threshold: 60, // 60%
      severity: 'critical',
      duration: 60,
      cooldown: 300,
      enabled: true
    },
    {
      id: 'cache-memory-usage',
      name: 'Cache内存usage rate过High',
      description: 'Cache内存usage rate超过阈值',
      system: 'context-aware-cache',
      metric: '内存usage rate',
      condition: 'gt',
      threshold: 80, // 80%
      severity: 'critical',
      duration: 60,
      cooldown: 300,
      enabled: true
    },
    
    // Unified GatewaySystemAlert规then
    {
      id: 'api-response-time',
      name: 'APIResponsetime过High',
      description: 'APIResponsetime超过阈值',
      system: 'unified-gateway',
      metric: 'APIResponsetime',
      condition: 'gt',
      threshold: 200, // 200ms
      severity: 'warning',
      duration: 60,
      cooldown: 300,
      enabled: true
    },
    {
      id: 'api-success-rate',
      name: 'APIRequest successful率过Low',
      description: 'APIRequest successful率Low于阈值',
      system: 'unified-gateway',
      metric: 'Request successful率',
      condition: 'lt',
      threshold: 99, // 99%
      severity: 'critical',
      duration: 60,
      cooldown: 300,
      enabled: true
    },
    
    // AutomationEfficiency OptimizationSystemAlert规then
    {
      id: 'token-reduction',
      name: 'Tokenreduce百分比过Low',
      description: 'Tokenreduce百分比Low于阈值',
      system: 'automation-efficiency-optimization',
      metric: 'Tokenreduce百分比',
      condition: 'lt',
      threshold: 50, // 50%
      severity: 'warning',
      duration: 60,
      cooldown: 300,
      enabled: true
    },
    {
      id: 'efficiency-gain',
      name: 'efficiency improvement百分比过Low',
      description: 'efficiency improvement百分比Low于阈值',
      system: 'automation-efficiency-optimization',
      metric: 'efficiency improvement百分比',
      condition: 'lt',
      threshold: 30, // 30%
      severity: 'warning',
      duration: 60,
      cooldown: 300,
      enabled: true
    }
  ];
  
  constructor() {
    console.log('🚀 Initialize统一Monitoring和Alertservervice...');
    this.initializeDefaultRules();
    this.initializeDefaultChannels();
  }
  
  // InitializeDefaultAlert规then
  private initializeDefaultRules(): void {
    this.defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
    console.log(`✅ LoadDefaultAlert规then: ${this.defaultRules.length} `);
  }
  
  // InitializeDefaultNotification渠道
  private initializeDefaultChannels(): void {
    const defaultChannels: NotificationChannel[] = [
      {
        id: 'discord-alerts',
        name: 'DiscordAlert',
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
        name: 'TelegramAlert',
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
    
    console.log(`✅ InitializeNotification渠道: ${defaultChannels.length} `);
  }
  
  // 收集Monitoringmetrics
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
      
      // CheckAlert规then
      this.checkAlertRules(system, metric.name, metric.value);
    });
    
    // UpdateSystemHealthStatus
    await this.updateSystemHealth(system, metrics);
    
    // 清理Oldmetrics(保留最近1000 )
    this.cleanupOldMetrics();
  }
  
  // CheckAlert规then
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
  
  // Evaluation规then 件
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
  
  // CreateAlert
  private createAlert(rule: AlertRule, currentValue: number): void {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Checkwhether italreadyAll相同规then'sActiveAlert
    const existingAlert = Array.from(this.alerts.values()).find(alert => 
      alert.ruleId === rule.id && 
      !alert.resolved &&
      (Date.now() - alert.timestamp.getTime()) < (rule.cooldown || 300) * 1000
    );
    
    if (existingAlert) {
      // alreadyAllActiveAlert, 跳过
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
    
    // SendNotification
    this.sendNotifications(alert);
    
    console.log(`🚨 CreateAlert: ${alert.message}`);
  }
  
  // GenerateAlertMessage
  private generateAlertMessage(rule: AlertRule, currentValue: number): string {
    const conditionText = {
      'gt': '超过',
      'lt': 'Low于',
      'eq': '等于',
      'neq': 'not equal to',
      'gte': '超过or等于',
      'lte': 'Low于or等于'
    }[rule.condition] || '超过';
    
    return `${rule.system} - ${rule.name}: ${rule.metric} ${conditionText}阈值 (Current: ${currentValue}, 阈值: ${rule.threshold})`;
  }
  
  // SendNotification
  private async sendNotifications(alert: Alert): Promise<void> {
    const enabledChannels = Array.from(this.channels.values()).filter(channel => channel.enabled);
    
    for (const channel of enabledChannels) {
      try {
        await this.sendNotificationToChannel(channel, alert);
      } catch (error) {
        console.error(`❌ SendNotificationto渠道 ${channel.name} failed:`, error);
      }
    }
  }
  
  // SendNotificationto特定渠道
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
  
  // Format化AlertMessage
  private formatAlertMessage(alert: Alert): string {
    const severityEmoji = {
      'critical': '🚨',
      'warning': '⚠️',
      'info': 'ℹ️'
    }[alert.severity] || '📢';
    
    const time = alert.timestamp.toLocaleString('zh-CN');
    
    return `${severityEmoji} **${alert.severity.toUpperCase()} Alert**\n` +
           `**System**: ${alert.system}\n` +
           `**metrics**: ${alert.metric}\n` +
           `**Current值**: ${alert.currentValue}\n` +
           `**阈值**: ${alert.threshold}\n` +
           `**time**: ${time}\n` +
           `**Message**: ${alert.message}`;
  }
  
  // SendDiscordNotification(模拟)
  private async sendDiscordNotification(config: any, message: string, severity: string): Promise<void> {
    console.log(`📢 DiscordNotification: ${message}`);
    // 实际实现will调用Discord webhook
  }
  
  // SendTelegramNotification(模拟)
  private async sendTelegramNotification(config: any, message: string): Promise<void> {
    console.log(`📢 TelegramNotification: ${message}`);
    // 实际实现will调用Telegram Bot API
  }
  
  // SendEmailNotification(模拟)
  private async sendEmailNotification(config: any, message: string, alert: Alert): Promise<void> {
    console.log(`📧 EmailNotification: ${message}`);
    // 实际实现willSend邮件
  }
  
  // SendWebhookNotification(模拟)
  private async sendWebhookNotification(config: any, alert: Alert): Promise<void> {
    console.log(`🌐 WebhookNotification: ${alert.message}`);
    // 实际实现will调用webhook
  }
  
  // UpdateSystemHealthStatus
  private async updateSystemHealth(system: string, metrics: MonitoringMetric[]): Promise<void> {
    const responseTimeMetric = metrics.find(m => m.name.includes('Responsetime'));
    const errorRateMetric = metrics.find(m => m.name.includes('error率') || m.name.includes('success率'));
    
    const health: SystemHealth = {
      system,
      status: 'healthy', // DefaultHealth, 实际will根据metrics计算
      metrics,
      lastCheck: new Date(),
      uptime: 0, // need toFromSystemFetch
      errorRate: errorRateMetric ? (errorRateMetric.name.includes('success率') ? 100 - errorRateMetric.value : errorRateMetric.value) : 0,
      responseTime: responseTimeMetric?.value || 0
    };
    
    // 根据metrics计算Status
    health.status = this.calculateSystemStatus(health);
    
    this.systemHealth.set(system, health);
  }
  
  // 计算SystemStatus
  private calculateSystemStatus(health: SystemHealth): 'healthy' | 'degraded' | 'unhealthy' {
    if (health.errorRate > 10) return 'unhealthy';
    if (health.errorRate > 5) return 'degraded';
    if (health.responseTime > 1000) return 'degraded';
    return 'healthy';
  }
  
  // 清理Oldmetrics
  private cleanupOldMetrics(): void {
    const now = Date.now();
    const metricsToDelete: string[] = [];
    
    this.metrics.forEach((metric, id) => {
      const age = now - metric.timestamp.getTime();
      if (age > 24 * 60 * 60 * 1000) { // 24Small时
        metricsToDelete.push(id);
      }
    });
    
    metricsToDelete.forEach(id => {
      this.metrics.delete(id);
    });
    
    if (metricsToDelete.length > 0) {
      console.log(`🧹 清理Oldmetrics: ${metricsToDelete.length} `);
    }
  }
  
  // 清理OldAlert
  private cleanupOldAlerts(): void {
    const now = Date.now();
    const alertsToDelete: string[] = [];
    
    this.alerts.forEach((alert, id) => {
      const age = now - alert.timestamp.getTime();
      if (age > 7 * 24 * 60 * 60 * 1000) { // 7d
        alertsToDelete.push(id);
      }
    });
    
    alertsToDelete.forEach(id => {
      this.alerts.delete(id);
    });
    
    if (alertsToDelete.length > 0) {
      console.log(`🧹 清理OldAlert: ${alertsToDelete.length} `);
    }
  }
  
  // Get service status
  getserverviceStatus(): any {
    const totalMetrics = this.metrics.size;
    const totalAlerts = this.alerts.size;
    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved).length;
    const totalRules = this.rules.size;
    const enabledRules = Array.from(this.rules.values()).filter(r => r.enabled).length;
    const totalChannels = this.channels.size;
    const enabledChannels = Array.from(this.channels.values()).filter(c => c.enabled).length;
    
    // 计算SystemHealthStatus
    const systemHealthStatus = Array.from(this.systemHealth.values()).map(health => ({
      system: health.system,
      status: health.status,
      errorRate: health.errorRate,
      responseTime: health.responseTime
    }));
    
    // 计算整体HealthStatus
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
  
  // 计算整体HealthStatus
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
  
  // Get active alerts
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  // FetchSystemHealthStatus
  getSystemHealth(system?: string): SystemHealth[] {
    if (system) {
      const health = this.systemHealth.get(system);
      return health ? [health] : [];
    }
    
    return Array.from(this.systemHealth.values());
  }
  
  // FetchMonitoringmetrics
  getMetrics(system?: string, metricName?: string, limit: number = 100): MonitoringMetric[] {
    let metrics = Array.from(this.metrics.values());
    
    if (system) {
      metrics = metrics.filter(m => m.system === system);
    }
    
    if (metricName) {
      metrics = metrics.filter(m => m.name === metricName);
    }
    
    // bytime倒序Sort
    metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return metrics.slice(0, limit);
  }
  
  // FetchAlert规then
  getAlertRules(system?: string): AlertRule[] {
    let rules = Array.from(this.rules.values());
    
    if (system) {
      rules = rules.filter(r => r.system === system);
    }
    
    return rules;
  }
  
  // AddorUpdateAlert规then
  upsertAlertRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    console.log(`📝 UpdateAlert规then: ${rule.name} (${rule.id})`);
  }
  
  // DeleteAlert规then
  deleteAlertRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      console.log(`🗑️ DeleteAlert规then: ${ruleId}`);
    }
    return deleted;
  }
  
  // ConfirmAlert
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;
    
    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();
    
    console.log(`✅ Alert acknowledged: ${alertId} (${acknowledgedBy})`);
    return true;
  }
  
  // 解决Alert
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;
    
    alert.resolved = true;
    alert.resolvedAt = new Date();
    
    console.log(`✅ Alert resolved: ${alertId}`);
    return true;
  }
  
  // AddNotification渠道
  addNotificationChannel(channel: NotificationChannel): void {
    this.channels.set(channel.id, channel);
    console.log(`📢 AddNotification渠道: ${channel.name} (${channel.type})`);
  }
  
  // enabled/disabledNotification渠道
  setChannelEnabled(channelId: string, enabled: boolean): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;
    
    channel.enabled = enabled;
    console.log(`⚙️ ${enabled ? 'enabled' : 'disabled'}Notification渠道: ${channel.name}`);
    return true;
  }
  
  // FetchPerformanceReport
  getPerformanceReport(days: number = 7): any {
    const now = new Date();
    const startTime = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const recentMetrics = Array.from(this.metrics.values()).filter(
      metric => metric.timestamp >= startTime
    );
    
    const recentAlerts = Array.from(this.alerts.values()).filter(
      alert => alert.timestamp >= startTime
    );
    
    // bySystemgroupmetrics
    const metricsBySystem = this.groupMetricsBySystem(recentMetrics);
    
    // byCritical性groupAlert
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
  
  // bySystemgroupmetrics
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
  
  // byCritical性groupAlert
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
    // 简化实现: by最近24Small时和之前24Small时比较
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
    
    // 这里canAdd更复杂's趋势Analytics逻辑
    // 简化Version: 返回nullArray
    
    return trends;
  }
  
  // Generate建议
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
    
    // 基于ActiveAlertGenerate建议
    const activeAlerts = alerts.filter(a => !a.resolved);
    
    activeAlerts.forEach(alert => {
      recommendations.push({
        priority: alert.severity === 'critical' ? 'high' : 'medium',
        system: alert.system,
        suggestion: `解决ActiveAlert: ${alert.message}`,
        action: 'CheckSystemStatusand解决问题'
      });
    });
    
    // 基于SystemHealthStatusGenerate建议
    metricsBySystem.forEach(systemMetrics => {
      // 这里canAdd基于metrics值's建议逻辑
      // e.g.: if某 metrics值Abnormal, Generate相应建议
    });
    
    return recommendations;
  }
  
  async start(): Promise<void> {
    console.log('🚀 Start统一Monitoring和Alertservervice...');
    
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupOldMetrics();
      this.cleanupOldAlerts();
    }, 60 * 60 * 1000); // 每Small时清理一 times
    
    console.log('✅ 统一Monitoring和AlertservervicealreadyStart');
  }
  
  async stop(): Promise<void> {
    console.log('🛑 Stop统一Monitoring和Alertservervice...');
    if (this.cleanupIntervalId !== undefined) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = undefined;
    }
    console.log('✅ 统一Monitoring和AlertserverviceStopped');
  }
}

// Export单例实例
export const unifiedMonitoringservervice = new UnifiedMonitoringservervice();