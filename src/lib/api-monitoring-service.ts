// API监控服务
export interface ApiMetric {
  endpoint: string;
  method: string;
  timestamp: string;
  responseTime: number; // 毫秒
  statusCode: number;
  success: boolean;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface ApiStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  endpoints: Record<string, {
    total: number;
    success: number;
    failure: number;
    avgResponseTime: number;
    lastCalled: string;
  }>;
  hourlyTraffic: Record<string, number>; // 小时 -> 请求数
  dailyTraffic: Record<string, number>; // 日期 -> 请求数
}

export interface PerformanceAlert {
  id: string;
  endpoint: string;
  type: 'slow_response' | 'high_error_rate' | 'traffic_spike';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

class ApiMonitoringService {
  private metrics: ApiMetric[] = [];
  private maxMetrics = 10000; // 最多保存10000条记录
  private alerts: PerformanceAlert[] = [];
  private statsCache: ApiStats | null = null;
  private lastStatsUpdate = 0;
  private statsCacheTTL = 60000; // 1分钟缓存

  // 记录API调用
  recordMetric(metric: Omit<ApiMetric, 'timestamp'>): void {
    const fullMetric: ApiMetric = {
      ...metric,
      timestamp: new Date().toISOString()
    };

    this.metrics.push(fullMetric);

    // 限制记录数量
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // 清除缓存
    this.statsCache = null;

    // 检查性能问题
    this.checkPerformance(fullMetric);
  }

  // 获取API统计
  getStats(): ApiStats {
    const now = Date.now();
    
    // 使用缓存
    if (this.statsCache && now - this.lastStatsUpdate < this.statsCacheTTL) {
      return this.statsCache;
    }

    if (this.metrics.length === 0) {
      this.statsCache = this.getEmptyStats();
      this.lastStatsUpdate = now;
      return this.statsCache;
    }

    // 计算基本统计
    const totalRequests = this.metrics.length;
    const successfulRequests = this.metrics.filter(m => m.success).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const responseTimes = this.metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / totalRequests;
    const p95Index = Math.floor(totalRequests * 0.95);
    const p99Index = Math.floor(totalRequests * 0.99);
    const p95ResponseTime = responseTimes[p95Index] || 0;
    const p99ResponseTime = responseTimes[p99Index] || 0;

    // 按端点统计
    const endpoints: Record<string, any> = {};
    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpoints[key]) {
        endpoints[key] = {
          total: 0,
          success: 0,
          failure: 0,
          responseTimes: [],
          lastCalled: metric.timestamp
        };
      }
      
      endpoints[key].total++;
      if (metric.success) {
        endpoints[key].success++;
      } else {
        endpoints[key].failure++;
      }
      endpoints[key].responseTimes.push(metric.responseTime);
      endpoints[key].lastCalled = metric.timestamp;
    });

    // 计算端点平均响应时间
    Object.keys(endpoints).forEach(key => {
      const endpoint = endpoints[key];
      endpoint.avgResponseTime = endpoint.responseTimes.reduce((sum: number, time: number) => sum + time, 0) / endpoint.responseTimes.length;
      delete endpoint.responseTimes;
    });

    // 按小时统计流量
    const hourlyTraffic: Record<string, number> = {};
    this.metrics.forEach(metric => {
      const date = new Date(metric.timestamp);
      const hourKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:00`;
      hourlyTraffic[hourKey] = (hourlyTraffic[hourKey] || 0) + 1;
    });

    // 按天统计流量
    const dailyTraffic: Record<string, number> = {};
    this.metrics.forEach(metric => {
      const date = new Date(metric.timestamp);
      const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      dailyTraffic[dayKey] = (dailyTraffic[dayKey] || 0) + 1;
    });

    this.statsCache = {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      endpoints,
      hourlyTraffic,
      dailyTraffic
    };

    this.lastStatsUpdate = now;
    return this.statsCache;
  }

  // 获取性能告警
  getAlerts(includeResolved = false): PerformanceAlert[] {
    if (includeResolved) {
      return this.alerts;
    }
    return this.alerts.filter(alert => !alert.resolved);
  }

  // 标记告警为已解决
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // 获取端点性能详情
  getEndpointStats(endpoint: string, method = 'GET') {
    const key = `${method} ${endpoint}`;
    const stats = this.getStats();
    return stats.endpoints[key] || null;
  }

  // 获取最近指标
  getRecentMetrics(limit = 100): ApiMetric[] {
    return this.metrics.slice(-limit).reverse();
  }

  // 清空指标（用于测试）
  clearMetrics(): void {
    this.metrics = [];
    this.statsCache = null;
  }

  // 私有方法
  private getEmptyStats(): ApiStats {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      endpoints: {},
      hourlyTraffic: {},
      dailyTraffic: {}
    };
  }

  private checkPerformance(metric: ApiMetric): void {
    // 检查慢响应
    if (metric.responseTime > 1000) { // 超过1秒
      this.createAlert({
        endpoint: metric.endpoint,
        type: 'slow_response',
        severity: metric.responseTime > 3000 ? 'high' : 'medium',
        message: `API响应时间过长: ${metric.responseTime}ms (端点: ${metric.endpoint})`
      });
    }

    // 检查错误率（基于最近100个请求）
    const recentMetrics = this.metrics.slice(-100);
    if (recentMetrics.length >= 20) {
      const endpointMetrics = recentMetrics.filter(m => 
        m.endpoint === metric.endpoint && m.method === metric.method
      );
      
      if (endpointMetrics.length >= 10) {
        const errorCount = endpointMetrics.filter(m => !m.success).length;
        const errorRate = errorCount / endpointMetrics.length;
        
        if (errorRate > 0.1) { // 错误率超过10%
          this.createAlert({
            endpoint: metric.endpoint,
            type: 'high_error_rate',
            severity: errorRate > 0.3 ? 'high' : 'medium',
            message: `API错误率过高: ${(errorRate * 100).toFixed(1)}% (端点: ${metric.endpoint})`
          });
        }
      }
    }
  }

  private createAlert(alert: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const newAlert: PerformanceAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    // 避免重复告警
    const existingAlert = this.alerts.find(a => 
      a.endpoint === newAlert.endpoint && 
      a.type === newAlert.type && 
      !a.resolved
    );

    if (!existingAlert) {
      this.alerts.push(newAlert);
      
      // 限制告警数量
      if (this.alerts.length > 100) {
        this.alerts = this.alerts.slice(-100);
      }
    }
  }
}

// 导出单例实例
export const apiMonitoringService = new ApiMonitoringService();

// Next.js中间件包装器
export function withApiMonitoring(handler: Function) {
  return async function monitoredHandler(...args: any[]) {
    const startTime = Date.now();
    let success = true;
    let statusCode = 200;

    try {
      const response = await handler(...args);
      statusCode = response?.status || 200;
      return response;
    } catch (error) {
      success = false;
      statusCode = 500;
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      
      // 提取端点信息
      const [req] = args;
      const endpoint = req?.url?.split('?')[0] || 'unknown';
      const method = req?.method || 'GET';
      
      apiMonitoringService.recordMetric({
        endpoint,
        method,
        responseTime,
        statusCode,
        success,
        userAgent: req?.headers?.get('user-agent'),
        ipAddress: req?.headers?.get('x-forwarded-for') || req?.headers?.get('x-real-ip')
      });
    }
  };
}