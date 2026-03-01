/**
 * Alert manager service - responsible for alert generation, management, and notifications
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
   * Generate a tool alert
   */
  generateToolAlert(
    tool: ToolStatus, 
    metric: ToolMetric, 
    previousStatus?: ToolStatus['status']
  ): EcosystemAlert | null {
    // Check if alert should be generated
    const shouldAlert = this.shouldGenerateAlert(tool, metric, previousStatus);
    if (!shouldAlert) {
      return null;
    }

    // Determine alert level
    const level = this.determineAlertLevel(tool, metric);
    
    // Generate alert message
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
    
    // Send notifications
    this.sendNotifications(alert);

    return alert;
  }

  /**
   * Get alert list
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

    // Filter by level
    if (options.level && options.level.length > 0) {
      filtered = filtered.filter(alert => options.level!.includes(alert.level));
    }

    // Filter by acknowledged state
    if (options.acknowledged !== undefined) {
      filtered = filtered.filter(alert => alert.acknowledged === options.acknowledged);
    }

    // Filter by tool ID
    if (options.toolId) {
      filtered = filtered.filter(alert => alert.toolId === options.toolId);
    }

    // Filter by time range
    if (options.startDate) {
      filtered = filtered.filter(alert => alert.timestamp >= options.startDate!);
    }
    
    if (options.endDate) {
      filtered = filtered.filter(alert => alert.timestamp <= options.endDate!);
    }

    // Sort (descending by time)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Limit results
    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Acknowledge an alert
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
   * Acknowledge multiple alerts in batch
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
   * Get alert statistics
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
   * Clean up old alerts
   */
  cleanupOldAlerts(daysToKeep: number = 30): number {
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const initialCount = this.alerts.length;
    
    this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoff);
    
    return initialCount - this.alerts.length;
  }

  /**
   * Check whether an alert should be generated
   */
  private shouldGenerateAlert(
    tool: ToolStatus, 
    metric: ToolMetric, 
    previousStatus?: ToolStatus['status']
  ): boolean {
    // If status changed from healthy to unhealthy, generate alert
    if (previousStatus === 'healthy' && metric.status !== 'healthy') {
      return true;
    }

    // If response time exceeds threshold, generate alert
    if (metric.responseTime > this.config.alertThresholds.responseTime) {
      return true;
    }

    // If error count exceeds threshold, generate alert
    if (metric.errorCount && metric.errorCount > 10) {
      return true;
    }

    // If tool is offline, generate alert
    if (metric.status === 'offline') {
      return true;
    }

    return false;
  }

  /**
   * Determine alert level
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
   * Generate alert message
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
        return `${toolName} service is offline, please check immediately`;
      
      case 'error':
        if (metric.status === 'error') {
          return `${toolName} encountered an error, response time: ${responseTime}ms`;
        } else {
          return `${toolName} response time critically exceeded: ${responseTime}ms (threshold: ${threshold}ms)`;
        }
      
      case 'warning':
        return `${toolName} response time exceeded threshold: ${responseTime}ms (threshold: ${threshold}ms)`;
      
      case 'info':
      default:
        return `${toolName} status changed: ${metric.status}`;
    }
  }

  /**
   * Generate alert ID
   */
  private generateAlertId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `alert-${timestamp}-${random}`;
  }

  /**
   * Send notifications
   */
  private sendNotifications(alert: EcosystemAlert): void {
    const channels = this.config.notificationChannels || [];
    
    channels.forEach(channel => {
      switch (channel) {
        case 'dashboard':
          // Dashboard notifications are handled via state updates
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
   * Send email notification
   */
  private sendEmailNotification(alert: EcosystemAlert): void {
    // Simulate sending email
    console.log(`[Email] ${alert.level.toUpperCase()}: ${alert.message}`);
  }

  /**
   * Send Slack notification
   */
  private sendSlackNotification(alert: EcosystemAlert): void {
    // Simulate sending Slack message
    console.log(`[Slack] ${alert.level.toUpperCase()}: ${alert.message}`);
  }

  /**
   * Send Webhook notification
   */
  private sendWebhookNotification(alert: EcosystemAlert): void {
    // Simulate sending Webhook
    console.log(`[Webhook] ${alert.level.toUpperCase()}: ${alert.message}`);
  }

  /**
   * Trim alert records
   */
  private trimAlerts(): void {
    const maxRecords = this.config.retentionDays * 24; // max 24 alerts per day
    if (this.alerts.length > maxRecords) {
      this.alerts = this.alerts.slice(-maxRecords);
    }
  }
}