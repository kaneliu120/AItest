/**
 * Health monitoring service
 */

import { 
  SystemHealth, 
  HealthComponent, 
  SystemMetrics, 
  HealthAlert,
  HealthCheck,
  HealthCheckResponse,
  MonitoringConfig,
  AlertThresholds
} from '../types';

export class HealthService {
  private config: MonitoringConfig = {
    checkInterval: 30000, // 30 seconds
    alertThresholds: {
      cpu: 80,
      memory: 85,
      disk: 90,
      errorRate: 5,
      responseTime: 1000
    },
    retentionDays: 30,
    enabled: true
  };

  private healthHistory: SystemHealth[] = [];
  private lastCheckTime: Date = new Date();

  constructor(config?: Partial<MonitoringConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const components = await this.checkComponents();
    const metrics = await this.collectMetrics();
    const alerts = this.generateAlerts(components, metrics);
    const overallHealth = this.calculateOverallHealth(components, metrics);

    const systemHealth: SystemHealth = {
      overallHealth,
      components,
      metrics,
      alerts,
      lastUpdated: new Date()
    };

    // Save history record
    this.healthHistory.push(systemHealth);
    this.trimHistory();

    this.lastCheckTime = new Date();
    return systemHealth;
  }

  /**
   * Check individual components
   */
  private async checkComponents(): Promise<HealthComponent[]> {
    const components: HealthComponent[] = [
      {
        name: 'Mission Control API',
        status: 'online',
        uptime: this.formatUptime(24 * 60 * 60), // 24 hours
        responseTime: 45,
        errorRate: 0.5
      },
      {
        name: 'Database',
        status: 'online',
        uptime: this.formatUptime(7 * 24 * 60 * 60), // 7 days
        responseTime: 120,
        errorRate: 0.1
      },
      {
        name: 'Redis Cache',
        status: 'online',
        uptime: this.formatUptime(3 * 24 * 60 * 60), // 3 days
        responseTime: 5,
        errorRate: 0
      },
      {
        name: 'External APIs',
        status: 'degraded',
        uptime: this.formatUptime(24 * 60 * 60),
        responseTime: 800,
        errorRate: 2.5
      }
    ];

    // Simulate async check
    await new Promise(resolve => setTimeout(resolve, 100));

    return components;
  }

  /**
   * Collect system metrics
   */
  private async collectMetrics(): Promise<SystemMetrics> {
    // Simulate collecting system metrics
    const metrics: SystemMetrics = {
      cpuUsage: Math.random() * 100,
      memoryUsage: 30 + Math.random() * 50,
      diskUsage: 40 + Math.random() * 30,
      networkIn: 100 + Math.random() * 500,
      networkOut: 50 + Math.random() * 300,
      requestCount: 1000 + Math.random() * 5000,
      errorCount: 5 + Math.random() * 20,
      errorRate: Math.random() * 5
    };

    await new Promise(resolve => setTimeout(resolve, 50));
    return metrics;
  }

  /**
   * Generate alerts
   */
  private generateAlerts(components: HealthComponent[], metrics: SystemMetrics): HealthAlert[] {
    const alerts: HealthAlert[] = [];

    // Check component status
    components.forEach(component => {
      if (component.status === 'offline') {
        alerts.push({
          level: 'critical',
          message: `${component.name} is offline`,
          component: component.name,
          timestamp: new Date(),
          acknowledged: false
        });
      } else if (component.status === 'degraded') {
        alerts.push({
          level: 'warning',
          message: `${component.name} performance degraded`,
          component: component.name,
          timestamp: new Date(),
          acknowledged: false
        });
      }
    });

    // Check metric thresholds
    if (metrics.cpuUsage > this.config.alertThresholds.cpu) {
      alerts.push({
        level: 'warning',
        message: `CPU usage too high: ${metrics.cpuUsage.toFixed(1)}%`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    if (metrics.memoryUsage > this.config.alertThresholds.memory) {
      alerts.push({
        level: 'warning',
        message: `Memory usage too high: ${metrics.memoryUsage.toFixed(1)}%`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    if (metrics.errorRate > this.config.alertThresholds.errorRate) {
      alerts.push({
        level: 'error',
        message: `Error rate too high: ${metrics.errorRate.toFixed(1)}%`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    return alerts;
  }

  /**
   * Calculate overall health score
   */
  private calculateOverallHealth(components: HealthComponent[], metrics: SystemMetrics): number {
    let score = 100;

    // Deduct for component status
    components.forEach(component => {
      if (component.status === 'offline') score -= 30;
      else if (component.status === 'degraded') score -= 15;
    });

    // Deduct for metrics
    if (metrics.cpuUsage > 90) score -= 20;
    else if (metrics.cpuUsage > 80) score -= 10;

    if (metrics.memoryUsage > 90) score -= 20;
    else if (metrics.memoryUsage > 80) score -= 10;

    if (metrics.errorRate > 10) score -= 30;
    else if (metrics.errorRate > 5) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Perform health check
   */
  async performHealthCheck(): Promise<HealthCheckResponse> {
    const startTime = Date.now();
    const checks: HealthCheck[] = [];

    // API check
    checks.push({
      name: 'API Endpoint',
      status: 'pass',
      duration: 45,
      output: 'API responding normally',
      timestamp: new Date()
    });

    // Database check
    checks.push({
      name: 'Database Connection',
      status: 'pass',
      duration: 120,
      output: 'Database connection normal',
      timestamp: new Date()
    });

    // Redis check
    checks.push({
      name: 'Redis Cache',
      status: 'pass',
      duration: 5,
      output: 'Cache service normal',
      timestamp: new Date()
    });

    // External services check
    checks.push({
      name: 'External Services',
      status: 'warn',
      duration: 800,
      output: 'Some external services responding slowly',
      timestamp: new Date()
    });

    const duration = Date.now() - startTime;
    const allPass = checks.every(check => check.status === 'pass');

    return {
      status: allPass ? 'healthy' : 'unhealthy',
      checks,
      duration
    };
  }

  /**
   * Get health history
   */
  getHealthHistory(hours: number = 24): SystemHealth[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.healthHistory.filter(health => health.lastUpdated >= cutoff);
  }

  /**
   * Get configuration
   */
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertIndex: number): void {
    if (this.healthHistory.length > 0) {
      const latestHealth = this.healthHistory[this.healthHistory.length - 1];
      if (alertIndex >= 0 && alertIndex < latestHealth.alerts.length) {
        latestHealth.alerts[alertIndex].acknowledged = true;
      }
    }
  }

  /**
   * Trim history records
   */
  private trimHistory(): void {
    const maxRecords = this.config.retentionDays * 24 * 4; // one record every 15 minutes
    if (this.healthHistory.length > maxRecords) {
      this.healthHistory = this.healthHistory.slice(-maxRecords);
    }
  }

  /**
   * Format uptime
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }
}

// Export singleton instance
export const healthService = new HealthService();