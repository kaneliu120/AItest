/**
 * 健康监控服务
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
    checkInterval: 30000, // 30秒
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
   * 获取系统健康状态
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

    // 保存历史记录
    this.healthHistory.push(systemHealth);
    this.trimHistory();

    this.lastCheckTime = new Date();
    return systemHealth;
  }

  /**
   * 检查各个组件
   */
  private async checkComponents(): Promise<HealthComponent[]> {
    const components: HealthComponent[] = [
      {
        name: 'Mission Control API',
        status: 'online',
        uptime: this.formatUptime(24 * 60 * 60), // 24小时
        responseTime: 45,
        errorRate: 0.5
      },
      {
        name: 'Database',
        status: 'online',
        uptime: this.formatUptime(7 * 24 * 60 * 60), // 7天
        responseTime: 120,
        errorRate: 0.1
      },
      {
        name: 'Redis Cache',
        status: 'online',
        uptime: this.formatUptime(3 * 24 * 60 * 60), // 3天
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

    // 模拟异步检查
    await new Promise(resolve => setTimeout(resolve, 100));

    return components;
  }

  /**
   * 收集系统指标
   */
  private async collectMetrics(): Promise<SystemMetrics> {
    // 模拟收集系统指标
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
   * 生成告警
   */
  private generateAlerts(components: HealthComponent[], metrics: SystemMetrics): HealthAlert[] {
    const alerts: HealthAlert[] = [];

    // 检查组件状态
    components.forEach(component => {
      if (component.status === 'offline') {
        alerts.push({
          level: 'critical',
          message: `${component.name} 离线`,
          component: component.name,
          timestamp: new Date(),
          acknowledged: false
        });
      } else if (component.status === 'degraded') {
        alerts.push({
          level: 'warning',
          message: `${component.name} 性能下降`,
          component: component.name,
          timestamp: new Date(),
          acknowledged: false
        });
      }
    });

    // 检查指标阈值
    if (metrics.cpuUsage > this.config.alertThresholds.cpu) {
      alerts.push({
        level: 'warning',
        message: `CPU使用率过高: ${metrics.cpuUsage.toFixed(1)}%`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    if (metrics.memoryUsage > this.config.alertThresholds.memory) {
      alerts.push({
        level: 'warning',
        message: `内存使用率过高: ${metrics.memoryUsage.toFixed(1)}%`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    if (metrics.errorRate > this.config.alertThresholds.errorRate) {
      alerts.push({
        level: 'error',
        message: `错误率过高: ${metrics.errorRate.toFixed(1)}%`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    return alerts;
  }

  /**
   * 计算整体健康度
   */
  private calculateOverallHealth(components: HealthComponent[], metrics: SystemMetrics): number {
    let score = 100;

    // 组件状态扣分
    components.forEach(component => {
      if (component.status === 'offline') score -= 30;
      else if (component.status === 'degraded') score -= 15;
    });

    // 指标扣分
    if (metrics.cpuUsage > 90) score -= 20;
    else if (metrics.cpuUsage > 80) score -= 10;

    if (metrics.memoryUsage > 90) score -= 20;
    else if (metrics.memoryUsage > 80) score -= 10;

    if (metrics.errorRate > 10) score -= 30;
    else if (metrics.errorRate > 5) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck(): Promise<HealthCheckResponse> {
    const startTime = Date.now();
    const checks: HealthCheck[] = [];

    // API检查
    checks.push({
      name: 'API Endpoint',
      status: 'pass',
      duration: 45,
      output: 'API响应正常',
      timestamp: new Date()
    });

    // 数据库检查
    checks.push({
      name: 'Database Connection',
      status: 'pass',
      duration: 120,
      output: '数据库连接正常',
      timestamp: new Date()
    });

    // Redis检查
    checks.push({
      name: 'Redis Cache',
      status: 'pass',
      duration: 5,
      output: '缓存服务正常',
      timestamp: new Date()
    });

    // 外部服务检查
    checks.push({
      name: 'External Services',
      status: 'warn',
      duration: 800,
      output: '部分外部服务响应较慢',
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
   * 获取健康历史
   */
  getHealthHistory(hours: number = 24): SystemHealth[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.healthHistory.filter(health => health.lastUpdated >= cutoff);
  }

  /**
   * 获取配置
   */
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 确认告警
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
   * 清理历史记录
   */
  private trimHistory(): void {
    const maxRecords = this.config.retentionDays * 24 * 4; // 每15分钟一条记录
    if (this.healthHistory.length > maxRecords) {
      this.healthHistory = this.healthHistory.slice(-maxRecords);
    }
  }

  /**
   * 格式化运行时间
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

// 导出单例实例
export const healthService = new HealthService();