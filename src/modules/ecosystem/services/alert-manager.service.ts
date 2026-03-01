/**
 * 告警管理服务 - 负责告警的生成、管理和通知
 */

import { 
  EcosystemAlert, 
  ToolStatus, 
  ToolMetric,
  EcosystemConfig 
} from '../types';

export class AlertManagerService {
  private alerts: EcosystemAlert[] = [];

  constructor(private config: EcosystemConfig) {}

  /**
   * 生成工具告警
   */
  generateToolAlert(
    tool: ToolStatus, 
    metric: ToolMetric, 
    previousStatus?: ToolStatus['status']
  ): EcosystemAlert | null {
    // 检查是否需要生成告警
    const shouldAlert = this.shouldGenerateAlert(tool, metric, previousStatus);
    if (!shouldAlert) {
      return null;
    }

    // 确定告警级别
    const level = this.determineAlertLevel(tool, metric);
    
    // 生成告警消息
    const message = this.generateAlertMessage(tool, metric, level);

    const alert: EcosystemAlert = {
      id: this.generateAlertId(),
      toolId: tool.id,
      toolName: tool.name,
      level,
      message,
      timestamp: new Date(),
      acknowledged: false,
      details: {
        responseTime: metric.responseTime,
        status: metric.status,
        previousStatus,
        thresholds: this.config.alertThresholds
      }
    };

    this.alerts.unshift(alert);
    this.trimAlerts();
    
    // 发送通知
    this.sendNotifications(alert);

    return alert;
  }

  /**
   * 获取告警列表
   */
  getAlerts(options: {
    level?: EcosystemAlert['level'][];
    acknowledged?: boolean;
    toolId?: string;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}): EcosystemAlert[] {
    let filtered = [...this.alerts];

    // 按级别过滤
    if (options.level && options.level.length > 0) {
      filtered = filtered.filter(alert => options.level!.includes(alert.level));
    }

    // 按确认状态过滤
    if (options.acknowledged !== undefined) {
      filtered = filtered.filter(alert => alert.acknowledged === options.acknowledged);
    }

    // 按工具ID过滤
    if (options.toolId) {
      filtered = filtered.filter(alert => alert.toolId === options.toolId);
    }

    // 按时间范围过滤
    if (options.startDate) {
      filtered = filtered.filter(alert => alert.timestamp >= options.startDate!);
    }
    
    if (options.endDate) {
      filtered = filtered.filter(alert => alert.timestamp <= options.endDate!);
    }

    // 排序（按时间倒序）
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // 限制数量
    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * 确认告警
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.details = {
        ...alert.details,
        acknowledgedAt: new Date().toISOString()
      };
      return true;
    }
    return false;
  }

  /**
   * 批量确认告警
   */
  acknowledgeAlerts(alertIds: string[]): { success: string[]; failed: string[] } {
    const success: string[] = [];
    const failed: string[] = [];

    alertIds.forEach(alertId => {
      if (this.acknowledgeAlert(alertId)) {
        success.push(alertId);
      } else {
        failed.push(alertId);
      }
    });

    return { success, failed };
  }

  /**
   * 获取告警统计
   */
  getAlertStats(): {
    total: number;
    acknowledged: number;
    unacknowledged: number;
    byLevel: Record<EcosystemAlert['level'], number>;
    last24Hours: number;
  } {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const total = this.alerts.length;
    const acknowledged = this.alerts.filter(a => a.acknowledged).length;
    const unacknowledged = total - acknowledged;
    
    const byLevel = {
      info: this.alerts.filter(a => a.level === 'info').length,
      warning: this.alerts.filter(a => a.level === 'warning').length,
      error: this.alerts.filter(a => a.level === 'error').length,
      critical: this.alerts.filter(a => a.level === 'critical').length
    };

    const last24Hours = this.alerts.filter(
      a => a.timestamp >= twentyFourHoursAgo
    ).length;

    return {
      total,
      acknowledged,
      unacknowledged,
      byLevel,
      last24Hours
    };
  }

  /**
   * 清理旧告警
   */
  cleanupOldAlerts(daysToKeep: number = 30): number {
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const initialCount = this.alerts.length;
    
    this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoff);
    
    return initialCount - this.alerts.length;
  }

  /**
   * 检查是否需要生成告警
   */
  private shouldGenerateAlert(
    tool: ToolStatus, 
    metric: ToolMetric, 
    previousStatus?: ToolStatus['status']
  ): boolean {
    // 如果状态从健康变为非健康，生成告警
    if (previousStatus === 'healthy' && metric.status !== 'healthy') {
      return true;
    }

    // 如果响应时间超过阈值，生成告警
    if (metric.responseTime > this.config.alertThresholds.responseTime) {
      return true;
    }

    // 如果错误数量超过阈值，生成告警
    if (metric.errorCount && metric.errorCount > 10) {
      return true;
    }

    // 如果工具离线，生成告警
    if (metric.status === 'offline') {
      return true;
    }

    return false;
  }

  /**
   * 确定告警级别
   */
  private determineAlertLevel(tool: ToolStatus, metric: ToolMetric): EcosystemAlert['level'] {
    if (metric.status === 'offline') {
      return 'critical';
    }

    if (metric.status === 'error') {
      return 'error';
    }

    if (metric.responseTime > this.config.alertThresholds.responseTime * 2) {
      return 'error';
    }

    if (metric.responseTime > this.config.alertThresholds.responseTime) {
      return 'warning';
    }

    if (metric.errorCount && metric.errorCount > 5) {
      return 'warning';
    }

    return 'info';
  }

  /**
   * 生成告警消息
   */
  private generateAlertMessage(
    tool: ToolStatus, 
    metric: ToolMetric, 
    level: EcosystemAlert['level']
  ): string {
    const toolName = tool.name;
    const responseTime = metric.responseTime.toFixed(1);
    const threshold = this.config.alertThresholds.responseTime;

    switch (level) {
      case 'critical':
        return `${toolName} 服务离线，请立即检查`;
      
      case 'error':
        if (metric.status === 'error') {
          return `${toolName} 发生错误，响应时间: ${responseTime}ms`;
        } else {
          return `${toolName} 响应时间严重超时: ${responseTime}ms (阈值: ${threshold}ms)`;
        }
      
      case 'warning':
        return `${toolName} 响应时间超过阈值: ${responseTime}ms (阈值: ${threshold}ms)`;
      
      case 'info':
      default:
        return `${toolName} 状态变化: ${metric.status}`;
    }
  }

  /**
   * 生成告警ID
   */
  private generateAlertId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `alert-${timestamp}-${random}`;
  }

  /**
   * 发送通知
   */
  private sendNotifications(alert: EcosystemAlert): void {
    const channels = this.config.notificationChannels || [];
    
    channels.forEach(channel => {
      switch (channel) {
        case 'dashboard':
          // 仪表盘通知已通过状态更新处理
          break;
          
        case 'email':
          this.sendEmailNotification(alert);
          break;
          
        case 'slack':
          this.sendSlackNotification(alert);
          break;
          
        case 'webhook':
          this.sendWebhookNotification(alert);
          break;
      }
    });
  }

  /**
   * 发送邮件通知
   */
  private sendEmailNotification(alert: EcosystemAlert): void {
    // 模拟发送邮件
    console.log(`[Email] ${alert.level.toUpperCase()}: ${alert.message}`);
  }

  /**
   * 发送Slack通知
   */
  private sendSlackNotification(alert: EcosystemAlert): void {
    // 模拟发送Slack消息
    console.log(`[Slack] ${alert.level.toUpperCase()}: ${alert.message}`);
  }

  /**
   * 发送Webhook通知
   */
  private sendWebhookNotification(alert: EcosystemAlert): void {
    // 模拟发送Webhook
    console.log(`[Webhook] ${alert.level.toUpperCase()}: ${alert.message}`);
  }

  /**
   * 清理告警数据
   */
  private trimAlerts(): void {
    const maxRecords = this.config.retentionDays * 24; // 每天最多24条告警
    if (this.alerts.length > maxRecords) {
      this.alerts = this.alerts.slice(-maxRecords);
    }
  }
}