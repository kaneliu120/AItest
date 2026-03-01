/**
 * 健康监控模块类型定义
 */

export interface HealthMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  timestamp: Date;
  description?: string;
}

export interface SystemHealth {
  overallHealth: number; // 0-100
  components: HealthComponent[];
  metrics: SystemMetrics;
  alerts: HealthAlert[];
  lastUpdated: Date;
}

export interface HealthComponent {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: string;
  responseTime?: number;
  errorRate?: number;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  requestCount: number;
  errorCount: number;
  errorRate: number;
}

export interface HealthAlert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  component?: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface HealthCheckRequest {
  component?: string;
  detailed?: boolean;
  timeout?: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  checks: HealthCheck[];
  duration: number;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  output?: string;
  timestamp: Date;
}

// 监控配置
export interface MonitoringConfig {
  checkInterval: number; // 毫秒
  alertThresholds: AlertThresholds;
  retentionDays: number;
  enabled: boolean;
}

export interface AlertThresholds {
  cpu: number;
  memory: number;
  disk: number;
  errorRate: number;
  responseTime: number;
}

// 历史数据
export interface HealthHistory {
  timestamp: Date;
  metrics: SystemMetrics;
  alerts: HealthAlert[];
}

// interfaces are exported inline above