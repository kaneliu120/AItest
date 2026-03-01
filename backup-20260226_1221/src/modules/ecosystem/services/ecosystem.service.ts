/**
 * 工具生态系统服务
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
    checkInterval: 60000, // 1分钟
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
   * 初始化数据
   */
  private initializeData(): void {
    // 初始化工具数据
    this.tools = [
      {
        id: 'tool-001',
        name: 'API Gateway',
        status: 'healthy',
        category: ToolCategoryEnum.DEPLOYMENT,
        description: '统一API网关服务',
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
        description: '高性能缓存服务',
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
        description: '主数据库服务',
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
        description: '系统监控仪表盘',
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
        description: '持续集成部署流水线',
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
        description: '用户认证和授权服务',
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
        description: '消息队列服务',
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
        description: '数据分析引擎',
        lastChecked: new Date(),
        responseTime: 200,
        uptime: 99.6,
        version: '1.2.0',
        config: { batchSize: 1000, processingDelay: 5000 }
      }
    ];

    // 初始化分类
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

    // 初始化告警
    this.alerts = [
      {
        id: 'alert-001',
        toolId: 'tool-005',
        toolName: 'CI/CD Pipeline',
        level: 'error',
        message: '部署流水线失败，构建超时',
        timestamp: new Date(Date.now() - 300000),
        acknowledged: false,
        details: { buildId: 'build-12345', error: 'Docker build timeout' }
      },
      {
        id: 'alert-002',
        toolId: 'tool-007',
        toolName: 'Message Queue',
        level: 'critical',
        message: '消息队列服务离线',
        timestamp: new Date(Date.now() - 600000),
        acknowledged: true,
        details: { lastSeen: '10分钟前', recoveryAttempts: 2 }
      },
      {
        id: 'alert-003',
        toolId: 'tool-003',
        toolName: 'PostgreSQL',
        level: 'warning',
        message: '数据库响应时间超过阈值',
        timestamp: new Date(Date.now() - 1800000),
        acknowledged: false,
        details: { responseTime: 120, threshold: 100 }
      }
    ];

    // 初始化指标
    this.generateMockMetrics();
  }

  /**
   * 获取生态系统摘要
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
   * 获取所有工具状态
   */
  async getAllTools(): Promise<ToolStatus[]> {
    return [...this.tools];
  }

  /**
   * 获取工具详情
   */
  async getToolDetails(toolId: string): Promise<ToolStatus | null> {
    return this.tools.find(tool => tool.id === toolId) || null;
  }

  /**
   * 检查工具状态
   */
  async checkToolStatus(toolId: string): Promise<ToolCheckResult> {
    const tool = this.tools.find(t => t.id === toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    // 模拟检查过程
    await new Promise(resolve => setTimeout(resolve, 500));

    const responseTime = Math.random() * 200;
    let status: ToolStatus['status'] = 'healthy';
    
    if (responseTime > this.config.alertThresholds.responseTime) {
      status = 'warning';
    } else if (Math.random() > 0.9) {
      status = 'error';
    }

    // 更新工具状态
    tool.status = status;
    tool.responseTime = responseTime;
    tool.lastChecked = new Date();

    // 记录指标
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

    // 检查是否需要生成告警
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
   * 批量检查工具状态
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
   * 获取工具指标历史
   */
  async getToolMetrics(toolId: string, hours: number = 24): Promise<ToolMetric[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(
      metric => metric.toolId === toolId && metric.timestamp >= cutoff
    );
  }

  /**
   * 获取告警
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

    // 按时间倒序排序
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 确认告警
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * 获取配置
   */
  getConfig(): EcosystemConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<EcosystemConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 计算统计信息
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
   * 获取最近告警
   */
  private getRecentAlerts(limit: number): EcosystemAlert[] {
    return this.alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * 获取表现最佳的工具
   */
  private getTopPerformers(limit: number): ToolStatus[] {
    return [...this.tools]
      .filter(tool => tool.status === 'healthy')
      .sort((a, b) => (a.responseTime || 0) - (b.responseTime || 0))
      .slice(0, limit);
  }

  /**
   * 获取需要关注的工具
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
   * 计算系统健康度
   */
  private calculateSystemHealth(): number {
    const stats = this.calculateStats();
    let score = 100;

    // 错误工具扣分
    score -= stats.errorTools * 15;
    
    // 警告工具扣分
    score -= stats.warningTools * 5;

    // 响应时间扣分
    if (stats.avgResponseTime > 1000) score -= 20;
    else if (stats.avgResponseTime > 500) score -= 10;

    // 运行时间扣分
    if (stats.overallUptime < 95) score -= 30;
    else if (stats.overallUptime < 99) score -= 10;

    // 告警扣分
    score -= stats.recentAlerts * 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * 生成告警
   */
  private generateAlert(tool: ToolStatus, metric: ToolMetric): void {
    const alert: EcosystemAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      toolId: tool.id,
      toolName: tool.name,
      level: tool.status === 'error' ? 'error' : 'warning',
      message: `${tool.name} ${tool.status === 'error' ? '发生错误' : '性能下降'}`,
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
   * 生成模拟指标数据
   */
  private generateMockMetrics(): void {
    const now = Date.now();
    const hours = 24;

    for (let i = 0; i < hours * 12; i++) { // 每5分钟一条数据
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
   * 清理指标数据
   */
  private trimMetrics(): void {
    const maxRecords = this.config.retentionDays * 24 * 12; // 每5分钟一条记录
    if (this.metrics.length > maxRecords) {
      this.metrics = this.metrics.slice(-maxRecords);
    }
  }

  /**
   * 清理告警数据
   */
  private trimAlerts(): void {
    const maxRecords = this.config.retentionDays * 24; // 每天最多24条告警
    if (this.alerts.length > maxRecords) {
      this.alerts = this.alerts.slice(-maxRecords);
    }
  }

  /**
   * 格式化分类名称
   */
  private formatCategoryName(category: string): string {
    const names: Record<string, string> = {
      [ToolCategoryEnum.DEVELOPMENT]: '开发工具',
      [ToolCategoryEnum.MONITORING]: '监控工具',
      [ToolCategoryEnum.AUTOMATION]: '自动化工具',
      [ToolCategoryEnum.DATABASE]: '数据库',
      [ToolCategoryEnum.SECURITY]: '安全工具',
      [ToolCategoryEnum.COMMUNICATION]: '通信工具',
      [ToolCategoryEnum.ANALYTICS]: '分析工具',
      [ToolCategoryEnum.DEPLOYMENT]: '部署工具',
      [ToolCategoryEnum.TESTING]: '测试工具',
      [ToolCategoryEnum.DOCUMENTATION]: '文档工具',
      [ToolCategoryEnum.OTHER]: '其他工具'
    };
    
    return names[category] || category;
  }

  /**
   * 获取分类描述
   */
  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      [ToolCategoryEnum.DEVELOPMENT]: '代码开发、调试和版本控制工具',
      [ToolCategoryEnum.MONITORING]: '系统监控、日志和性能分析工具',
      [ToolCategoryEnum.AUTOMATION]: '自动化脚本和工作流工具',
      [ToolCategoryEnum.DATABASE]: '数据库管理和查询工具',
      [ToolCategoryEnum.SECURITY]: '安全认证、加密和防护工具',
      [ToolCategoryEnum.COMMUNICATION]: '消息队列、通知和通信工具',
      [ToolCategoryEnum.ANALYTICS]: '数据分析和可视化工具',
      [ToolCategoryEnum.DEPLOYMENT]: '部署、容器化和CI/CD工具',
      [ToolCategoryEnum.TESTING]: '测试框架和质量保证工具',
      [ToolCategoryEnum.DOCUMENTATION]: '文档生成和管理工具',
      [ToolCategoryEnum.OTHER]: '其他类型的工具和服务'
    };
    
    return descriptions[category] || '工具和服务';
  }

  /**
   * 获取分类图标
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

// 导出单例实例
export const ecosystemService = new EcosystemService();