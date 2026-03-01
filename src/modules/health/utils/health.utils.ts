/**
 * Health monitoring utility functions
 */

import { HealthMetric, SystemMetrics, HealthAlert } from '../types';

/**
 * Format byte size
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format time duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

/**
 * Calculate metric trend
 */
export function calculateTrend(
  current: number,
  previous: number
): { value: number; direction: 'up' | 'down' | 'stable' } {
  if (previous === 0) return { value: 0, direction: 'stable' };
  
  const change = ((current - previous) / previous) * 100;
  const absChange = Math.abs(change);
  
  if (absChange < 0.1) return { value: change, direction: 'stable' };
  return { 
    value: change, 
    direction: change > 0 ? 'up' : 'down' 
  };
}

/**
 * Evaluate health status
 */
export function evaluateHealthStatus(
  value: number,
  thresholds: { warning: number; critical: number }
): 'healthy' | 'warning' | 'critical' {
  if (value <= thresholds.warning) return 'healthy';
  if (value <= thresholds.critical) return 'warning';
  return 'critical';
}

/**
 * Filter and sort alerts
 */
export function filterAndSortAlerts(
  alerts: HealthAlert[],
  options: {
    level?: HealthAlert['level'][];
    acknowledged?: boolean;
    maxAgeHours?: number;
    sortBy?: 'timestamp' | 'level';
  } = {}
): HealthAlert[] {
  let filtered = [...alerts];

  // Filter by level
  if (options.level && options.level.length > 0) {
    filtered = filtered.filter(alert => options.level!.includes(alert.level));
  }

  // Filter by acknowledged state
  if (options.acknowledged !== undefined) {
    filtered = filtered.filter(alert => alert.acknowledged === options.acknowledged);
  }

  // Filter by time
  if (options.maxAgeHours) {
    const cutoff = new Date(Date.now() - options.maxAgeHours * 60 * 60 * 1000);
    filtered = filtered.filter(alert => alert.timestamp >= cutoff);
  }

  // Sort
  if (options.sortBy === 'timestamp') {
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } else if (options.sortBy === 'level') {
    const levelOrder = { critical: 0, error: 1, warning: 2, info: 3 };
    filtered.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);
  }

  return filtered;
}

/**
 * Generate health report summary
 */
export function generateHealthSummary(
  metrics: SystemMetrics,
  alerts: HealthAlert[]
): {
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  criticalIssues: number;
  warnings: number;
  recommendations: string[];
} {
  const criticalAlerts = alerts.filter(a => a.level === 'critical' && !a.acknowledged);
  const warningAlerts = alerts.filter(a => a.level === 'warning' && !a.acknowledged);

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (criticalAlerts.length > 0 || metrics.errorRate > 10) {
    overallStatus = 'unhealthy';
  } else if (warningAlerts.length > 0 || metrics.cpuUsage > 80 || metrics.memoryUsage > 85) {
    overallStatus = 'degraded';
  }

  const recommendations: string[] = [];

  if (metrics.cpuUsage > 80) {
    recommendations.push('Consider optimizing CPU-intensive tasks or adding more compute resources');
  }

  if (metrics.memoryUsage > 85) {
    recommendations.push('Check for memory leaks or consider adding more memory');
  }

  if (metrics.errorRate > 5) {
    recommendations.push('Investigate error causes and fix them');
  }

  if (criticalAlerts.length > 0) {
    recommendations.push('Address critical alerts immediately');
  }

  return {
    overallStatus,
    criticalIssues: criticalAlerts.length,
    warnings: warningAlerts.length,
    recommendations
  };
}

/**
 * Validate health data
 */
export function validateHealthData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  const requiredFields = ['overallHealth', 'components', 'metrics', 'alerts', 'lastUpdated'];
  
  for (const field of requiredFields) {
    if (!(field in data)) return false;
  }

  // Validate types
  if (typeof data.overallHealth !== 'number' || data.overallHealth < 0 || data.overallHealth > 100) {
    return false;
  }

  if (!Array.isArray(data.components) || !Array.isArray(data.alerts)) {
    return false;
  }

  return true;
}

/**
 * Generate mock health data (for testing)
 */
export function generateMockHealthData(): any {
  return {
    overallHealth: 85 + Math.random() * 15,
    components: [
      {
        name: 'API Gateway',
        status: Math.random() > 0.1 ? 'online' : 'degraded',
        uptime: '7d 12h',
        responseTime: 50 + Math.random() * 100,
        errorRate: Math.random() * 3
      },
      {
        name: 'Database',
        status: 'online',
        uptime: '30d',
        responseTime: 100 + Math.random() * 50,
        errorRate: Math.random() * 1
      }
    ],
    metrics: {
      cpuUsage: 30 + Math.random() * 50,
      memoryUsage: 40 + Math.random() * 40,
      diskUsage: 50 + Math.random() * 30,
      networkIn: 200 + Math.random() * 800,
      networkOut: 100 + Math.random() * 400,
      requestCount: 10000 + Math.random() * 50000,
      errorCount: 10 + Math.random() * 50
    },
    alerts: Math.random() > 0.7 ? [
      {
        level: Math.random() > 0.5 ? 'warning' : 'error',
        message: 'CPU usage exceeded threshold',
        timestamp: new Date(),
        acknowledged: false
      }
    ] : [],
    lastUpdated: new Date()
  };
}

/**
 * Export all utility functions
 */
export default {
  formatBytes,
  formatPercent,
  formatDuration,
  calculateTrend,
  evaluateHealthStatus,
  filterAndSortAlerts,
  generateHealthSummary,
  validateHealthData,
  generateMockHealthData
};