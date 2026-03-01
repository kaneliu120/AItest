/**
 * Tool ecosystem module type definitions
 */

export interface ToolStatus {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'offline';
  category: string;
  description: string;
  lastChecked: Date;
  responseTime?: number;
  uptime?: number;
  version?: string;
  dependencies?: string[];
  config?: Record<string, any>;
}

export interface MonitoringStats {
  totalTools: number;
  healthyTools: number;
  warningTools: number;
  errorTools: number;
  lastUpdate: string;
  avgResponseTime: number;
  overallUptime: number;
  recentAlerts: number;
}

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  toolCount: number;
  healthyCount: number;
}

export interface EcosystemAlert {
  id: string;
  toolId: string;
  toolName: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  details?: Record<string, any>;
}

export interface ToolMetric {
  timestamp: Date;
  toolId: string;
  responseTime: number;
  status: 'healthy' | 'warning' | 'error';
  memoryUsage?: number;
  cpuUsage?: number;
  requestCount?: number;
  errorCount?: number;
}

export interface EcosystemConfig {
  checkInterval: number;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  retentionDays: number;
  autoRecovery: boolean;
  notificationChannels: string[];
}

export interface ToolCheckResult {
  toolId: string;
  status: 'healthy' | 'warning' | 'error' | 'offline';
  responseTime: number;
  checkedAt: Date;
  details?: Record<string, any>;
  error?: string;
}

export interface EcosystemSummary {
  stats: MonitoringStats;
  categories: ToolCategory[];
  recentAlerts: EcosystemAlert[];
  topPerformers: ToolStatus[];
  needsAttention: ToolStatus[];
  systemHealth: number; // 0-100
}

// Tool category enum
export enum ToolCategoryEnum {
  DEVELOPMENT = 'development',
  MONITORING = 'monitoring',
  AUTOMATION = 'automation',
  DATABASE = 'database',
  SECURITY = 'security',
  COMMUNICATION = 'communication',
  ANALYTICS = 'analytics',
  DEPLOYMENT = 'deployment',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  OTHER = 'other'
}

// Export all types
export type {
  ToolStatus,
  MonitoringStats,
  ToolCategory,
  EcosystemAlert,
  ToolMetric,
  EcosystemConfig,
  ToolCheckResult,
  EcosystemSummary
};