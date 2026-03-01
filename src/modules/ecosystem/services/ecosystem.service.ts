/**
 * Tool ecosystem service
 */

import { 
  ToolStatus, 
  MonitoringStats, 
  ToolCategory, 
  EcosystemAlert,
  ToolMetric,
  EcosystemConfig,
  ToolCheckResult,
  EcosystemSummary,
  ToolCategoryEnum
} from '../types';

export class EcosystemService {
  private config: EcosystemConfig = {
    checkInterval: 60000, // 1 minute
    alertThresholds: {
      responseTime: 1000,
      errorRate: 5,
      memoryUsage: 80,
      cpuUsage: 75
    },
    retentionDays: 30,
    autoRecovery: true,
    notificationChannels: ['dashboard', 'email']
  };

  private tools: ToolStatus[] = [];
  private metrics: ToolMetric[] = [];
  private alerts: EcosystemAlert[] = [];
  private categories: ToolCategory[] = [];

  constructor(config?: Partial<EcosystemConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.initializeData();
  }

  /**
   * Initialize data
   */
  private initializeData(): void {
    // Initialize tool data
    this.tools = [
      {
        id: 'tool-001',
        name: 'API Gateway',
        status: 'healthy',
        category: ToolCategoryEnum.DEPLOYMENT,
        description: 'Unified API gateway service',
        lastChecked: new Date(),
        responseTime: 45,
        uptime: 99.8,
        version: '2.1.0',
        dependencies: ['redis', 'postgres'],
        config: { timeout: 30000, retries: 3 }
      },
      {
        id: 'tool-002',
        name: 'Redis Cache',
        status: 'healthy',
        category: ToolCategoryEnum.DATABASE,
        description: 'High-performance cache service',
        lastChecked: new Date(),
        responseTime: 5,
        uptime: 99.9,
        version: '7.0.0',
        config: { maxMemory: '2GB', evictionPolicy: 'allkeys-lru' }
      },
      {
        id: 'tool-003',
        name: 'PostgreSQL',
        status: 'warning',
        category: ToolCategoryEnum.DATABASE,
        description: 'Primary database service',
        lastChecked: new Date(Date.now() - 300000),
        responseTime: 120,
        uptime: 99.5,
        version: '15.0',
        dependencies: ['backup-service'],
        config: { maxConnections: 100, maintenanceWindow: '02:00' }
      },
      {
        id: 'tool-004',
        name: 'Monitoring Dashboard',
        status: 'healthy',
        category: ToolCategoryEnum.MONITORING,
        description: 'System monitoring dashboard',
        lastChecked: new Date(),
        responseTime: 80,
        uptime: 99.7,
        version: '1.5.2',
        config: { refreshInterval: 30000, retentionDays: 90 }
      },
      {
        id: 'tool-005',
        name: 'CI/CD Pipeline',
        status: 'error',
        category: ToolCategoryEnum.DEPLOYMENT,
        description: 'Continuous integration and deployment pipeline',
        lastChecked: new Date(Date.now() - 600000),
        responseTime: 5000,
        uptime: 95.2,
        version: '3.0.1',
        dependencies: ['github', 'docker'],
        config: { parallelJobs: 5, timeout: 1800000 }
      },
      {
        id: 'tool-006',
        name: 'Authentication Service',
        status: 'healthy',
        category: ToolCategoryEnum.SECURITY,
        description: 'User authentication and authorization service',
        lastChecked: new Date(),
        responseTime: 60,
        uptime: 99.9,
        version: '2.3.0',
        config: { jwtExpiry: '24h', mfaEnabled: true }
      },
      {
        id: 'tool-007',
        name: 'Message Queue',
        status: 'offline',
        category: ToolCategoryEnum.COMMUNICATION,
        description: 'Message queue service',
        lastChecked: new Date(Date.now() - 900000),
        responseTime: 0,
        uptime: 98.5,
        version: '5.0.0',
        config: { queueSize: 10000, consumers: 5 }
      },
      {
        id: 'tool-008',
        name: 'Analytics Engine',
        status: 'healthy',
        category: ToolCategoryEnum.ANALYTICS,
        description: 'Data analytics engine',
        lastChecked: new Date(),
        responseTime: 200,
        uptime: 99.6,
        version: '1.2.0',
        config: { batchSize: 1000, processingDelay: 5000 }
      }
    ];

    // Initialize categories
    this.categories = Object.values(ToolCategoryEnum).map(category => ({
      id: category,
      name: this.formatCategoryName(category),
      description: this.getCategoryDescription(category),
      icon: this.getCategoryIcon(category),
      toolCount: this.tools.filter(tool => tool.category === category).length,
      healthyCount: this.tools.filter(tool => 
        tool.category === category && tool.status === 'healthy'
      ).length
    }));

    // Initialize alerts
    this.alerts = [
      {
        id: 'alert-001',
        toolId: 'tool-005',
        toolName: 'CI/CD Pipeline',
        level: 'error',
        message: 'CI/CD pipeline failed, build timed out',
        timestamp: new Date(Date.now() - 300000),
        acknowledged: false,
        details: { buildId: 'build-12345', error: 'Docker build timeout' }
      },
      {
        id: 'alert-002',
        toolId: 'tool-007',
        toolName: 'Message Queue',
        level: 'critical',
        message: 'Message queue service offline',
        timestamp: new Date(Date.now() - 600000),
        acknowledged: true,
        details: { lastSeen: '10 minutes ago', recoveryAttempts: 2 }
      },
      {
        id: 'alert-003',
        toolId: 'tool-003',
        toolName: 'PostgreSQL',
        level: 'warning',
        message: 'Database response time exceeded threshold',
        timestamp: new Date(Date.now() - 1800000),
        acknowledged: false,
        details: { responseTime: 120, threshold: 100 }
      }
    ];

    // Initialize metrics
    this.generateMockMetrics();
  }

  /**
   * Get ecosystem summary
   */
  async getEcosystemSummary(): Promise<EcosystemSummary> {
    const stats = this.calculateStats();
    const recentAlerts = this.getRecentAlerts(10);
    const topPerformers = this.getTopPerformers(5);
    const needsAttention = this.getToolsNeedingAttention(5);
    const systemHealth = this.calculateSystemHealth();

    return {
      stats,
      categories: this.categories,
      recentAlerts,
      topPerformers,
      needsAttention,
      systemHealth
    };
  }

  /**
   * Get all tool statuses
   */
  async getAllTools(): Promise<ToolStatus[]> {
    return [...this.tools];
  }

  /**
   * Get tool details
   */
  async getToolDetails(toolId: string): Promise<ToolStatus | null> {
    return this.tools.find(tool => tool.id === toolId) || null;
  }

  /**
   * Check tool status
   */
  async checkToolStatus(toolId: string): Promise<ToolCheckResult> {
    const tool = this.tools.find(t => t.id === toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    // Simulate check process
    await new Promise(resolve => setTimeout(resolve, 500));

    const responseTime = Math.random() * 200;
    let status: ToolStatus['status'] = 'healthy';
    
    if (responseTime > this.config.alertThresholds.responseTime) {
      status = 'warning';
    } else if (Math.random() > 0.9) {
      status = 'error';
    }

    // Update tool status
    tool.status = status;
    tool.responseTime = responseTime;
    tool.lastChecked = new Date();

    // Record metrics
    const metric: ToolMetric = {
      timestamp: new Date(),
      toolId,
      responseTime,
      status,
      memoryUsage: 30 + Math.random() * 50,
      cpuUsage: 20 + Math.random() * 60,
      requestCount: 100 + Math.random() * 900,
      errorCount: Math.random() > 0.95 ? 1 + Math.random() * 5 : 0
    };
    
    this.metrics.push(metric);
    this.trimMetrics();

    // Check if alert needs to be generated
    if (status === 'error' || responseTime > this.config.alertThresholds.responseTime * 2) {
      this.generateAlert(tool, metric);
    }

    return {
      toolId,
      status,
      responseTime,
      checkedAt: new Date(),
      details: metric
    };
  }

  /**
   * Check all tools in batch
   */
  async checkAllTools(): Promise<ToolCheckResult[]> {
    const results: ToolCheckResult[] = [];
    
    for (const tool of this.tools) {
      try {
        const result = await this.checkToolStatus(tool.id);
        results.push(result);
      } catch (error) {
        console.error(`Failed to check tool ${tool.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Get tool metrics history
   */
  async getToolMetrics(toolId: string, hours: number = 24): Promise<ToolMetric[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(
      metric => metric.toolId === toolId && metric.timestamp >= cutoff
    );
  }

  /**
   * Get alerts
   */
  async getAlerts(options: {
    level?: EcosystemAlert['level'][];
    acknowledged?: boolean;
    toolId?: string;
    limit?: number;
  } = {}): Promise<EcosystemAlert[]> {
    let filtered = [...this.alerts];

    if (options.level && options.level.length > 0) {
      filtered = filtered.filter(alert => options.level!.includes(alert.level));
    }

    if (options.acknowledged !== undefined) {
      filtered = filtered.filter(alert => alert.acknowledged === options.acknowledged);
    }

    if (options.toolId) {
      filtered = filtered.filter(alert => alert.toolId === options.toolId);
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    // Sort by time descending
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Get configuration
   */
  getConfig(): EcosystemConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EcosystemConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Calculate statistics
   */
  private calculateStats(): MonitoringStats {
    const totalTools = this.tools.length;
    const healthyTools = this.tools.filter(t => t.status === 'healthy').length;
    const warningTools = this.tools.filter(t => t.status === 'warning').length;
    const errorTools = this.tools.filter(t => t.status === 'error' || t.status === 'offline').length;
    
    const avgResponseTime = this.tools.reduce((sum, tool) => sum + (tool.responseTime || 0), 0) / totalTools;
    const overallUptime = this.tools.reduce((sum, tool) => sum + (tool.uptime || 0), 0) / totalTools;
    
    const recentAlerts = this.alerts.filter(
      alert => !alert.acknowledged && 
      (Date.now() - alert.timestamp.getTime()) < 24 * 60 * 60 * 1000
    ).length;

    return {
      totalTools,
      healthyTools,
      warningTools,
      errorTools,
      lastUpdate: new Date().toISOString(),
      avgResponseTime,
      overallUptime,
      recentAlerts
    };
  }

  /**
   * Get recent alerts
   */
  private getRecentAlerts(limit: number): EcosystemAlert[] {
    return this.alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get top performing tools
   */
  private getTopPerformers(limit: number): ToolStatus[] {
    return [...this.tools]
      .filter(tool => tool.status === 'healthy')
      .sort((a, b) => (a.responseTime || 0) - (b.responseTime || 0))
      .slice(0, limit);
  }

  /**
   * Get tools needing attention
   */
  private getToolsNeedingAttention(limit: number): ToolStatus[] {
    return [...this.tools]
      .filter(tool => tool.status !== 'healthy')
      .sort((a, b) => {
        const priority = { error: 0, offline: 1, warning: 2, healthy: 3 };
        return priority[a.status] - priority[b.status];
      })
      .slice(0, limit);
  }

  /**
   * Calculate overall system health score
   */
  private calculateSystemHealth(): number {
    const stats = this.calculateStats();
    let score = 100;

    // Deduct for error tools
    score -= stats.errorTools * 15;
    
    // Deduct for warning tools
    score -= stats.warningTools * 5;

    // Deduct for response time
    if (stats.avgResponseTime > 1000) score -= 20;
    else if (stats.avgResponseTime > 500) score -= 10;

    // Deduct for uptime
    if (stats.overallUptime < 95) score -= 30;
    else if (stats.overallUptime < 99) score -= 10;

    // Deduct for alerts
    score -= stats.recentAlerts * 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate alert
   */
  private generateAlert(tool: ToolStatus, metric: ToolMetric): void {
    const alert: EcosystemAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      toolId: tool.id,
      toolName: tool.name,
      level: tool.status === 'error' ? 'error' : 'warning',
      message: `${tool.name} ${tool.status === 'error' ? 'encountered an error' : 'performance degraded'}`,
      timestamp: new Date(),
      acknowledged: false,
      details: {
        responseTime: metric.responseTime,
        status: metric.status,
        threshold: this.config.alertThresholds.responseTime
      }
    };

    this.alerts.unshift(alert);
    this.trimAlerts();
  }

  /**
   * Generate mock metrics data
   */
  private generateMockMetrics(): void {
    const now = Date.now();
    const hours = 24;

    for (let i = 0; i < hours * 12; i++) { // one data point every 5 minutes
      const timestamp = new Date(now - (hours - i / 12) * 60 * 60 * 1000);
      
      this.tools.forEach(tool => {
        const responseTime = tool.responseTime || 50;
        const variation = Math.random() * 40 - 20;
        
        this.metrics.push({
          timestamp,
          toolId: tool.id,
          responseTime: Math.max(1, responseTime + variation),
          status: Math.random() > 0.05 ? 'healthy' : 
                  Math.random() > 0.5 ? 'warning' : 'error',
          memoryUsage: 20 + Math.random() * 60,
          cpuUsage: 15 + Math.random() * 50,
          requestCount: 50 + Math.random() * 950,
          errorCount: Math.random() > 0.9 ? Math.floor(Math.random() * 10) : 0
        });
      });
    }
  }

  /**
   * Trim metrics data
   */
  private trimMetrics(): void {
    const maxRecords = this.config.retentionDays * 24 * 12; // one record every 5 minutes
    if (this.metrics.length > maxRecords) {
      this.metrics = this.metrics.slice(-maxRecords);
    }
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

  /**
   * Format category name
   */
  private formatCategoryName(category: string): string {
    const names: Record<string, string> = {
      [ToolCategoryEnum.DEVELOPMENT]: 'Development Tools',
      [ToolCategoryEnum.MONITORING]: 'Monitoring Tools',
      [ToolCategoryEnum.AUTOMATION]: 'Automation Tools',
      [ToolCategoryEnum.DATABASE]: 'Database',
      [ToolCategoryEnum.SECURITY]: 'Security Tools',
      [ToolCategoryEnum.COMMUNICATION]: 'Communication Tools',
      [ToolCategoryEnum.ANALYTICS]: 'Analytics Tools',
      [ToolCategoryEnum.DEPLOYMENT]: 'Deployment Tools',
      [ToolCategoryEnum.TESTING]: 'Testing Tools',
      [ToolCategoryEnum.DOCUMENTATION]: 'Documentation Tools',
      [ToolCategoryEnum.OTHER]: 'Other Tools'
    };
    
    return names[category] || category;
  }

  /**
   * Get category description
   */
  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      [ToolCategoryEnum.DEVELOPMENT]: 'Code development, debugging, and version control tools',
      [ToolCategoryEnum.MONITORING]: 'System monitoring, logging, and performance analysis tools',
      [ToolCategoryEnum.AUTOMATION]: 'Automation scripts and workflow tools',
      [ToolCategoryEnum.DATABASE]: 'Database management and query tools',
      [ToolCategoryEnum.SECURITY]: 'Security authentication, encryption, and protection tools',
      [ToolCategoryEnum.COMMUNICATION]: 'Message queue, notifications, and communication tools',
      [ToolCategoryEnum.ANALYTICS]: 'Data analysis and visualization tools',
      [ToolCategoryEnum.DEPLOYMENT]: 'Deployment, containerization, and CI/CD tools',
      [ToolCategoryEnum.TESTING]: 'Testing frameworks and quality assurance tools',
      [ToolCategoryEnum.DOCUMENTATION]: 'Documentation generation and management tools',
      [ToolCategoryEnum.OTHER]: 'Other types of tools and services'
    };
    
    return descriptions[category] || 'Tools and services';
  }

  /**
   * Get category icon
   */
  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      [ToolCategoryEnum.DEVELOPMENT]: '💻',
      [ToolCategoryEnum.MONITORING]: '📊',
      [ToolCategoryEnum.AUTOMATION]: '⚙️',
      [ToolCategoryEnum.DATABASE]: '🗄️',
      [ToolCategoryEnum.SECURITY]: '🔒',
      [ToolCategoryEnum.COMMUNICATION]: '📡',
      [ToolCategoryEnum.ANALYTICS]: '📈',
      [ToolCategoryEnum.DEPLOYMENT]: '🚀',
      [ToolCategoryEnum.TESTING]: '🧪',
      [ToolCategoryEnum.DOCUMENTATION]: '📚',
      [ToolCategoryEnum.OTHER]: '🔧'
    };
    
    return icons[category] || '🔧';
  }
}

// Export singleton instance
export const ecosystemService = new EcosystemService();