/**
 * Health monitoring dashboard component
 */

import React, { useState, useEffect } from 'react';
import { 
  SystemHealth, 
  HealthComponent, 
  HealthAlert,
  SystemMetrics 
} from '../types';
import { healthService } from '../services/health.service';

interface HealthDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showDetails?: boolean;
}

const HealthDashboard: React.FC<HealthDashboardProps> = ({
  autoRefresh = true,
  refreshInterval = 30000,
  showDetails = true
}) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load health data
  const loadHealthData = async () => {
    try {
      setLoading(true);
      const data = await healthService.getSystemHealth();
      setHealth(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
      console.error('Health data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadHealthData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      loadHealthData();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval]);

  // Manual refresh
  const handleRefresh = () => {
    loadHealthData();
  };

  // Acknowledge alert
  const handleAcknowledgeAlert = (index: number) => {
    if (health) {
      healthService.acknowledgeAlert(index);
      // Reload data to update UI
      loadHealthData();
    }
  };

  // Render health score
  const renderHealthScore = (score: number) => {
    let color = 'text-green-600';
    let bgColor = 'bg-green-100';
    
    if (score < 70) {
      color = 'text-red-600';
      bgColor = 'bg-red-100';
    } else if (score < 85) {
      color = 'text-yellow-600';
      bgColor = 'bg-yellow-100';
    }

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full ${bgColor}`}>
        <span className={`text-2xl font-bold ${color}`}>{score}</span>
        <span className="ml-2 text-sm text-gray-600">/100</span>
      </div>
    );
  };

  // Render component status
  const renderComponentStatus = (component: HealthComponent) => {
    let statusColor = 'bg-green-500';
    let statusText = 'Online';
    
    if (component.status === 'offline') {
      statusColor = 'bg-red-500';
      statusText = 'Offline';
    } else if (component.status === 'degraded') {
      statusColor = 'bg-yellow-500';
      statusText = 'Degraded';
    }

    return (
      <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200">
        <div>
          <h4 className="font-medium text-gray-900">{component.name}</h4>
          <p className="text-sm text-gray-500">Uptime: {component.uptime}</p>
          {component.responseTime && (
            <p className="text-sm text-gray-500">Response time: {component.responseTime}ms</p>
          )}
        </div>
        <div className="flex items-center">
          <span className={`w-3 h-3 rounded-full ${statusColor} mr-2`}></span>
          <span className="text-sm font-medium">{statusText}</span>
        </div>
      </div>
    );
  };

  // Render metric card
  const renderMetricCard = (label: string, value: number, unit: string, threshold: number) => {
    const isCritical = value > threshold;
    const colorClass = isCritical ? 'text-red-600' : 'text-gray-900';
    
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-2xl font-bold ${colorClass}`}>
              {value.toFixed(1)}{unit}
            </p>
          </div>
          {isCritical && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
              Warning
            </span>
          )}
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${isCritical ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(value, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  // Render alert
  const renderAlert = (alert: HealthAlert, index: number) => {
    let alertColor = 'bg-blue-100 text-blue-800 border-blue-200';
    let alertIcon = 'ℹ️';
    
    if (alert.level === 'warning') {
      alertColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
      alertIcon = '⚠️';
    } else if (alert.level === 'error') {
      alertColor = 'bg-red-100 text-red-800 border-red-200';
      alertIcon = '❌';
    } else if (alert.level === 'critical') {
      alertColor = 'bg-red-200 text-red-900 border-red-300';
      alertIcon = '🚨';
    }

    return (
      <div key={`${alert.component ?? 'sys'}-${new Date(alert.timestamp).getTime()}`} className={`p-3 rounded-lg border ${alertColor} mb-2`}>
        <div className="flex justify-between items-start">
          <div className="flex items-start">
            <span className="mr-2">{alertIcon}</span>
            <div>
              <p className="font-medium">{alert.message}</p>
              <p className="text-sm opacity-75">
                {alert.component && `Component: ${alert.component} • `}
                {new Date(alert.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
          {!alert.acknowledged && (
            <button
              onClick={() => handleAcknowledgeAlert(index)}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Acknowledge
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading health data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <span className="text-red-600 mr-2">❌</span>
          <div>
            <h3 className="font-medium text-red-800">Load failed</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="p-6 text-center text-gray-500">
        No health data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title and refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Health Monitor</h2>
          <p className="text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
            {autoRefresh && ` • Auto-refresh: every ${refreshInterval / 1000}s`}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {renderHealthScore(health.overallHealth)}
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <span className="mr-2">🔄</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Alert area */}
      {health.alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">System Alerts ({health.alerts.length})</h3>
          <div className="space-y-2">
            {health.alerts.map((alert, index) => renderAlert(alert, index))}
          </div>
        </div>
      )}

      {/* Component status */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-3">Component Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {health.components.map((component) => (
            <div key={component.name}>
              {renderComponentStatus(component)}
            </div>
          ))}
        </div>
      </div>

      {/* System metrics */}
      {showDetails && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">System Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderMetricCard('CPU Usage', health.metrics.cpuUsage, '%', 80)}
            {renderMetricCard('Memory Usage', health.metrics.memoryUsage, '%', 85)}
            {renderMetricCard('Disk Usage', health.metrics.diskUsage, '%', 90)}
            {renderMetricCard('Error Rate', health.metrics.errorRate, '%', 5)}
          </div>
        </div>
      )}

      {/* Additional info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-2">Network Traffic</h4>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Inbound</p>
              <p className="text-lg font-semibold">
                {(health.metrics.networkIn / 1024).toFixed(1)} KB/s
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Outbound</p>
              <p className="text-lg font-semibold">
                {(health.metrics.networkOut / 1024).toFixed(1)} KB/s
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-2">Request Statistics</h4>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Total Requests</p>
              <p className="text-lg font-semibold">
                {health.metrics.requestCount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Errors</p>
              <p className="text-lg font-semibold text-red-600">
                {health.metrics.errorCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-2">Monitoring Config</h4>
          <div className="space-y-1 text-sm">
            <p>Check interval: {healthService.getConfig().checkInterval / 1000}s</p>
            <p>CPU alert threshold: {healthService.getConfig().alertThresholds.cpu}%</p>
            <p>Memory alert threshold: {healthService.getConfig().alertThresholds.memory}%</p>
            <p>Data retention: {healthService.getConfig().retentionDays} days</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthDashboard;