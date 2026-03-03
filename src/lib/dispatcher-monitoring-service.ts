// 智canDispatchSystemMonitoringservervice

import { TaskHistory } from './intelligent-task-dispatcher';

export interface MonitoringMetric {
  timestamp: string;
  metric: string;
  value: number;
  tags: Record<string, string>;
}

export interface AlertRule {
  id: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  enabled: boolean;
}

export interface Alert {
  id: string;
  ruleId: string;
  timestamp: string;
  metric: string;
  value: number;
  threshold: number;
  severity: string;
  message: string;
  resolved: boolean;
  resolvedAt?: string;
}

class DispatcherMonitoringservervice {
  private metrics: MonitoringMetric[] = [];
  private maxMetrics = 1000;
  private alerts: Alert[] = [];
  private maxAlerts = 100;
  
  private rules: AlertRule[] = [
    {
      id: 'high-error-rate',
      metric: 'error_rate',
      condition: 'gte',
      threshold: 0.1, // 10%error率
      severity: 'error',
      message: 'error率超过10%, need to立i.e.Check',
      enabled: true
    },
    {
      id: 'slow-response',
      metric: 'avg_response_time',
      condition: 'gte',
      threshold: 3000, // 3s
      severity: 'warning',
      message: '平均Responsetime超过3s, Performanceneed tooptimize',
      enabled: true
    },
    {
      id: 'low-cache-hit',
      metric: 'cache_hit_rate',
      condition: 'lte',
      threshold: 0.1, // 10%Cachehit rate
      severity: 'warning',
      message: 'Cachehit rateLow于10%, need tooptimizeCache策略',
      enabled: true
    },
    {
      id: 'system-overload',
      metric: 'requests_per_minute',
      condition: 'gte',
      threshold: 100, // 每min100 Request
      severity: 'warning',
      message: 'System负载过High, 考虑扩容',
      enabled: true
    }
  ];

  // LogTaskExecute
  recordTaskExecution(task: TaskHistory): void {
    const timestamp = new Date().toISOString();
    
    // LogResponsetime
    this.recordMetric({
      timestamp,
      metric: 'response_time',
      value: task.executionTime,
      tags: {
        system: task.systemUsed,
        taskType: task.taskType,
        success: task.success.toString(),
        cached: task.cached.toString()
      }
    });
    
    // Logsuccess率
    this.recordMetric({
      timestamp,
      metric: 'task_success',
      value: task.success ? 1 : 0,
      tags: {
        system: task.systemUsed,
        taskType: task.taskType
      }
    });
    
    // LogCacheStatus
    this.recordMetric({
      timestamp,
      metric: 'cache_hit',
      value: task.cached ? 1 : 0,
      tags: {
        system: task.systemUsed,
        taskType: task.taskType
      }
    });
    
    // CheckAlert
    this.checkAlerts();
  }

  // Logmetrics
  private recordMetric(metric: MonitoringMetric): void {
    this.metrics.push(metric);
    
    // 限制metricsquantity
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // FetchSystemPerformancemetrics
  getPerformanceMetrics(timeWindowMinutes = 60): {
    totalTasks: number;
    successfulTasks: number;
    errorRate: number;
    avgResponseTime: number;
    cacheHitRate: number;
    requestsPerMinute: number;
    systemDistribution: Record<string, number>;
    taskTypeDistribution: Record<string, number>;
  } {
    const now = Date.now();
    const windowStart = now - (timeWindowMinutes * 60 * 1000);
    
    const recentMetrics = this.metrics.filter(m => 
      new Date(m.timestamp).getTime() > windowStart
    );
    
    const recentTasks = recentMetrics.filter(m => m.metric === 'response_time');
    const successMetrics = recentMetrics.filter(m => m.metric === 'task_success');
    const cacheMetrics = recentMetrics.filter(m => m.metric === 'cache_hit');
    
    const totalTasks = recentTasks.length;
    const successfulTasks = successMetrics.filter(m => m.value === 1).length;
    const errorRate = totalTasks > 0 ? (totalTasks - successfulTasks) / totalTasks : 0;
    
    const avgResponseTime = recentTasks.length > 0 ? 
      recentTasks.reduce((sum, m) => sum + m.value, 0) / recentTasks.length : 0;
    
    const cacheHits = cacheMetrics.filter(m => m.value === 1).length;
    const cacheHitRate = cacheMetrics.length > 0 ? cacheHits / cacheMetrics.length : 0;
    
    const requestsPerMinute = totalTasks / timeWindowMinutes;
    
    // System分布
    const systemDistribution: Record<string, number> = {};
    recentTasks.forEach(metric => {
      const system = metric.tags.system;
      systemDistribution[system] = (systemDistribution[system] || 0) + 1;
    });
    
    // TaskType分布
    const taskTypeDistribution: Record<string, number> = {};
    recentTasks.forEach(metric => {
      const taskType = metric.tags.taskType;
      taskTypeDistribution[taskType] = (taskTypeDistribution[taskType] || 0) + 1;
    });
    
    return {
      totalTasks,
      successfulTasks,
      errorRate,
      avgResponseTime,
      cacheHitRate,
      requestsPerMinute,
      systemDistribution,
      taskTypeDistribution
    };
  }

  // CheckAlert
  private checkAlerts(): void {
    const metrics = this.getPerformanceMetrics(5); // 最近5min
    
    this.rules.forEach(rule => {
      if (!rule.enabled) return;
      
      let value: number;
      switch (rule.metric) {
        case 'error_rate':
          value = metrics.errorRate;
          break;
        case 'avg_response_time':
          value = metrics.avgResponseTime;
          break;
        case 'cache_hit_rate':
          value = metrics.cacheHitRate;
          break;
        case 'requests_per_minute':
          value = metrics.requestsPerMinute;
          break;
        default:
          return;
      }
      
      let triggered = false;
      switch (rule.condition) {
        case 'gt':
          triggered = value > rule.threshold;
          break;
        case 'lt':
          triggered = value < rule.threshold;
          break;
        case 'eq':
          triggered = value === rule.threshold;
          break;
        case 'gte':
          triggered = value >= rule.threshold;
          break;
        case 'lte':
          triggered = value <= rule.threshold;
          break;
      }
      
      if (triggered) {
        // Checkwhether italreadyAll相同Alert
        const existingAlert = this.alerts.find(
          a => a.ruleId === rule.id && !a.resolved
        );
        
        if (!existingAlert) {
          const alert: Alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ruleId: rule.id,
            timestamp: new Date().toISOString(),
            metric: rule.metric,
            value,
            threshold: rule.threshold,
            severity: rule.severity,
            message: rule.message,
            resolved: false
          };
          
          this.alerts.unshift(alert);
          
          // 限制Alertquantity
          if (this.alerts.length > this.maxAlerts) {
            this.alerts = this.alerts.slice(0, this.maxAlerts);
          }
          
          // LogAlertLogging
          console.log(`🚨 AlertTrigger: ${rule.severity.toUpperCase()} - ${rule.message}`);
          console.log(`   metrics: ${rule.metric} = ${value}, 阈值: ${rule.threshold}`);
        }
      }
    });
  }

  // Get active alerts
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  // Fetch所AllAlert
  getAllAlerts(limit = 50): Alert[] {
    return this.alerts.slice(0, limit);
  }

  // 解决Alert
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // FetchMonitoringDashboarddata
  getDashboardData() {
    const performance = this.getPerformanceMetrics(60); // 最近1Small时
    const activeAlerts = this.getActiveAlerts();
    
    return {
      performance,
      alerts: {
        active: activeAlerts.length,
        total: this.alerts.length,
        bySeverity: {
          critical: activeAlerts.filter(a => a.severity === 'critical').length,
          error: activeAlerts.filter(a => a.severity === 'error').length,
          warning: activeAlerts.filter(a => a.severity === 'warning').length,
          info: activeAlerts.filter(a => a.severity === 'info').length
        }
      },
      metrics: {
        total: this.metrics.length,
        recent: this.metrics.slice(-100).length
      },
      timestamp: new Date().toISOString()
    };
  }

  // Clear所Alldata(用于Test)
  clearAll(): void {
    this.metrics = [];
    this.alerts = [];
  }
}

// Export单例实例
export const dispatcherMonitoringservervice = new DispatcherMonitoringservervice();