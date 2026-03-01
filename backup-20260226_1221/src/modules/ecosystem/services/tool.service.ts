import { apiClient } from '../../../shared/api/client';
import { 
  Tool, 
  ToolSearchParams, 
  ToolsResponse, 
  ToolResponse, 
  ToolHealthResponse,
  ToolStatisticsResponse,
  ConfigureToolRequest,
  TestToolRequest,
  UpdateToolStatusRequest,
  ToolEventFilter,
  ToolExport,
  ToolDependency,
  ToolVersion,
  ToolPermission,
  ToolWebhook,
  TOOL_CATEGORIES,
  TOOL_STATUSES,
} from '../types';

// 工具服务类
export class ToolService {
  private basePath = '/api/ecosystem/tools';

  // 获取所有工具
  async getTools(params?: ToolSearchParams): Promise<ToolsResponse> {
    return apiClient.get<ToolsResponse>(this.basePath, { params });
  }

  // 获取单个工具
  async getTool(id: string): Promise<ToolResponse> {
    return apiClient.get<ToolResponse>(`${this.basePath}/${id}`);
  }

  // 创建工具
  async createTool(tool: Omit<Tool, 'id' | 'metadata' | 'health' | 'usage' | 'configuration'>): Promise<ToolResponse> {
    return apiClient.post<ToolResponse>(this.basePath, tool);
  }

  // 更新工具
  async updateTool(id: string, updates: Partial<Tool>): Promise<ToolResponse> {
    return apiClient.put<ToolResponse>(`${this.basePath}/${id}`, updates);
  }

  // 删除工具
  async deleteTool(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  // 配置工具
  async configureTool(id: string, config: ConfigureToolRequest): Promise<ToolResponse> {
    return apiClient.post<ToolResponse>(`${this.basePath}/${id}/configure`, config);
  }

  // 测试工具
  async testTool(id: string, testRequest: TestToolRequest): Promise<any> {
    return apiClient.post(`${this.basePath}/${id}/test`, testRequest);
  }

  // 更新工具状态
  async updateToolStatus(id: string, statusRequest: UpdateToolStatusRequest): Promise<ToolResponse> {
    return apiClient.patch<ToolResponse>(`${this.basePath}/${id}/status`, statusRequest);
  }

  // 获取工具健康状态
  async getToolHealth(id: string): Promise<ToolHealthResponse> {
    return apiClient.get<ToolHealthResponse>(`${this.basePath}/${id}/health`);
  }

  // 检查所有工具健康状态
  async checkAllToolsHealth(): Promise<ToolHealthResponse[]> {
    return apiClient.post<ToolHealthResponse[]>(`${this.basePath}/health-check`);
  }

  // 获取工具统计
  async getToolStatistics(): Promise<ToolStatisticsResponse> {
    return apiClient.get<ToolStatisticsResponse>(`${this.basePath}/statistics`);
  }

  // 搜索工具
  async searchTools(query: string, category?: string): Promise<ToolsResponse> {
    const params: any = { query };
    if (category) params.category = category;
    return this.getTools(params);
  }

  // 按分类获取工具
  async getToolsByCategory(category: string): Promise<ToolsResponse> {
    return this.getTools({ category: category as any });
  }

  // 获取配置的工具
  async getConfiguredTools(): Promise<ToolsResponse> {
    return this.getTools({ configured: true });
  }

  // 获取未配置的工具
  async getUnconfiguredTools(): Promise<ToolsResponse> {
    return this.getTools({ configured: false });
  }

  // 获取活跃工具
  async getActiveTools(): Promise<ToolsResponse> {
    return this.getTools({ status: 'active' });
  }

  // 获取工具事件
  async getToolEvents(filter?: ToolEventFilter): Promise<any> {
    return apiClient.get(`${this.basePath}/events`, { params: filter });
  }

  // 导出工具配置
  async exportTools(): Promise<ToolExport> {
    return apiClient.get<ToolExport>(`${this.basePath}/export`);
  }

  // 导入工具配置
  async importTools(exportData: ToolExport): Promise<void> {
    await apiClient.post(`${this.basePath}/import`, exportData);
  }

  // 获取工具依赖
  async getToolDependencies(toolId: string): Promise<ToolDependency[]> {
    return apiClient.get<ToolDependency[]>(`${this.basePath}/${toolId}/dependencies`);
  }

  // 获取工具版本
  async getToolVersions(toolId: string): Promise<ToolVersion[]> {
    return apiClient.get<ToolVersion[]>(`${this.basePath}/${toolId}/versions`);
  }

  // 获取工具权限
  async getToolPermissions(toolId: string): Promise<ToolPermission[]> {
    return apiClient.get<ToolPermission[]>(`${this.basePath}/${toolId}/permissions`);
  }

  // 配置工具Webhook
  async configureToolWebhook(toolId: string, webhook: ToolWebhook): Promise<ToolWebhook> {
    return apiClient.post<ToolWebhook>(`${this.basePath}/${toolId}/webhooks`, webhook);
  }

  // 获取工具Webhooks
  async getToolWebhooks(toolId: string): Promise<ToolWebhook[]> {
    return apiClient.get<ToolWebhook[]>(`${this.basePath}/${toolId}/webhooks`);
  }

  // 模拟数据 - 用于开发和测试
  getMockTools(): Tool[] {
    return [
      {
        id: '1',
        name: 'GitHub Integration',
        description: 'Integrate with GitHub for repository management and automation',
        category: 'development',
        status: 'active',
        icon: 'github',
        color: '#24292e',
        integration: {
          type: 'api',
          endpoint: 'https://api.github.com',
          apiKeyRequired: true,
          oauthRequired: false,
          documentationUrl: 'https://docs.github.com/en/rest',
        },
        configuration: {
          isConfigured: true,
          lastConfigured: '2026-02-24T10:30:00Z',
          configurationUrl: '/ecosystem/tools/1/configure',
          requiredPermissions: ['repo', 'read:org'],
        },
        usage: {
          totalUses: 1250,
          lastUsed: '2026-02-24T14:45:00Z',
          successRate: 98.5,
          averageResponseTime: 120,
        },
        health: {
          status: 'healthy',
          lastChecked: '2026-02-24T15:00:00Z',
          uptime: 99.9,
        },
        metadata: {
          version: '2.1.0',
          author: 'Mission Control Team',
          repository: 'https://github.com/mission-control/github-integration',
          license: 'MIT',
          tags: ['git', 'version-control', 'ci-cd'],
          createdAt: '2026-01-15T09:00:00Z',
          updatedAt: '2026-02-20T14:30:00Z',
        },
      },
      {
        id: '2',
        name: 'Slack Notifications',
        description: 'Send notifications and alerts to Slack channels',
        category: 'communication',
        status: 'active',
        icon: 'slack',
        color: '#4A154B',
        integration: {
          type: 'webhook',
          endpoint: 'https://hooks.slack.com/services',
          apiKeyRequired: true,
          oauthRequired: true,
          documentationUrl: 'https://api.slack.com/messaging/webhooks',
        },
        configuration: {
          isConfigured: true,
          lastConfigured: '2026-02-23T16:20:00Z',
          configurationUrl: '/ecosystem/tools/2/configure',
          requiredPermissions: ['channels:read', 'chat:write'],
        },
        usage: {
          totalUses: 890,
          lastUsed: '2026-02-24T13:15:00Z',
          successRate: 99.2,
          averageResponseTime: 80,
        },
        health: {
          status: 'healthy',
          lastChecked: '2026-02-24T15:00:00Z',
          uptime: 99.8,
        },
        metadata: {
          version: '1.5.2',
          author: 'Mission Control Team',
          repository: 'https://github.com/mission-control/slack-integration',
          license: 'MIT',
          tags: ['notifications', 'alerts', 'team-communication'],
          createdAt: '2026-01-10T11:00:00Z',
          updatedAt: '2026-02-18T10:15:00Z',
        },
      },
      {
        id: '3',
        name: 'PostgreSQL Monitor',
        description: 'Monitor PostgreSQL database performance and health',
        category: 'database',
        status: 'active',
        icon: 'database',
        color: '#336791',
        integration: {
          type: 'api',
          endpoint: 'http://localhost:5432',
          apiKeyRequired: false,
          oauthRequired: false,
          documentationUrl: 'https://www.postgresql.org/docs/',
        },
        configuration: {
          isConfigured: true,
          lastConfigured: '2026-02-22T09:45:00Z',
          configurationUrl: '/ecosystem/tools/3/configure',
          requiredPermissions: ['SELECT', 'MONITOR'],
        },
        usage: {
          totalUses: 2450,
          lastUsed: '2026-02-24T14:30:00Z',
          successRate: 99.8,
          averageResponseTime: 50,
        },
        health: {
          status: 'healthy',
          lastChecked: '2026-02-24T15:00:00Z',
          uptime: 100,
        },
        metadata: {
          version: '3.2.1',
          author: 'Mission Control Team',
          repository: 'https://github.com/mission-control/postgres-monitor',
          license: 'Apache-2.0',
          tags: ['database', 'monitoring', 'performance'],
          createdAt: '2026-01-05T14:00:00Z',
          updatedAt: '2026-02-15T16:45:00Z',
        },
      },
      {
        id: '4',
        name: 'Docker Deployer',
        description: 'Automated Docker container deployment and management',
        category: 'deployment',
        status: 'maintenance',
        icon: 'docker',
        color: '#2496ED',
        integration: {
          type: 'cli',
          endpoint: 'http://localhost:2375',
          apiKeyRequired: false,
          oauthRequired: false,
          documentationUrl: 'https://docs.docker.com/engine/api/',
        },
        configuration: {
          isConfigured: true,
          lastConfigured: '2026-02-20T11:30:00Z',
          configurationUrl: '/ecosystem/tools/4/configure',
          requiredPermissions: ['docker:exec'],
        },
        usage: {
          totalUses: 560,
          lastUsed: '2026-02-23T17:45:00Z',
          successRate: 95.3,
          averageResponseTime: 200,
        },
        health: {
          status: 'degraded',
          lastChecked: '2026-02-24T15:00:00Z',
          errorMessage: 'High latency detected',
          uptime: 97.5,
        },
        metadata: {
          version: '2.0.3',
          author: 'Mission Control Team',
          repository: 'https://github.com/mission-control/docker-deployer',
          license: 'MIT',
          tags: ['containers', 'deployment', 'orchestration'],
          createdAt: '2026-01-20T10:00:00Z',
          updatedAt: '2026-02-22T13:20:00Z',
        },
      },
      {
        id: '5',
        name: 'Security Scanner',
        description: 'Automated security vulnerability scanning',
        category: 'security',
        status: 'experimental',
        icon: 'shield',
        color: '#FF6B6B',
        integration: {
          type: 'api',
          endpoint: 'https://api.security-scanner.com',
          apiKeyRequired: true,
          oauthRequired: false,
          documentationUrl: 'https://docs.security-scanner.com',
        },
        configuration: {
          isConfigured: false,
          configurationUrl: '/ecosystem/tools/5/configure',
          requiredPermissions: ['scan:run', 'results:read'],
        },
        usage: {
          totalUses: 12,
          lastUsed: '2026-02-19T15:30:00Z',
          successRate: 83.3,
          averageResponseTime: 1500,
        },
        health: {
          status: 'unhealthy',
          lastChecked: '2026-02-24T15:00:00Z',
          errorMessage: 'API key not configured',
          uptime: 0,
        },
        metadata: {
          version: '0.9.0',
          author: 'Mission Control Team',
          repository: 'https://github.com/mission-control/security-scanner',
          license: 'GPL-3.0',
          tags: ['security', 'vulnerability', 'scanning'],
          createdAt: '2026-02-10T09:00:00Z',
          updatedAt: '2026-02-21T11:45:00Z',
        },
      },
    ];
  }

  // 获取模拟统计
  getMockStatistics() {
    return {
      totalTools: 5,
      activeTools: 3,
      configuredTools: 4,
      byCategory: {
        development: 1,
        automation: 0,
        monitoring: 0,
        analytics: 0,
        security: 1,
        productivity: 0,
        communication: 1,
        infrastructure: 0,
        database: 1,
        testing: 0,
        deployment: 1,
        documentation: 0,
      },
      byStatus: {
        active: 3,
        inactive: 0,
        maintenance: 1,
        deprecated: 0,
        experimental: 1,
      },
      usageByDay: [
        { date: '2026-02-20', count: 245 },
        { date: '2026-02-21', count: 312 },
        { date: '2026-02-22', count: 278 },
        { date: '2026-02-23', count: 345 },
        { date: '2026-02-24', count: 289 },
      ],
      topTools: [
        { toolId: '3', name: 'PostgreSQL Monitor', usageCount: 2450 },
        { toolId: '1', name: 'GitHub Integration', usageCount: 1250 },
        { toolId: '2', name: 'Slack Notifications', usageCount: 890 },
        { toolId: '4', name: 'Docker Deployer', usageCount: 560 },
        { toolId: '5', name: 'Security Scanner', usageCount: 12 },
      ],
      errorRate: 1.2,
      averageResponseTime: 190,
    };
  }

  // 工具类方法
  getToolCategories() {
    return TOOL_CATEGORIES;
  }

  getToolStatuses() {
    return TOOL_STATUSES;
  }

  formatToolStatus(status: string) {
    const statusMap: Record<string, string> = {
      active: 'Active',
      inactive: 'Inactive',
      maintenance: 'Maintenance',
      deprecated: 'Deprecated',
      experimental: 'Experimental',
    };
    return statusMap[status] || status;
  }

  formatToolCategory(category: string) {
    const categoryMap: Record<string, string> = {
      development: 'Development',
      automation: 'Automation',
      monitoring: 'Monitoring',
      analytics: 'Analytics',
      security: 'Security',
      productivity: 'Productivity',
      communication: 'Communication',
      infrastructure: 'Infrastructure',
      database: 'Database',
      testing: 'Testing',
      deployment: 'Deployment',
      documentation: 'Documentation',
    };
    return categoryMap[category] || category;
  }

  // 计算工具健康状态颜色
  getHealthColor(status: string) {
    const colorMap: Record<string, string> = {
      healthy: 'green',
      degraded: 'yellow',
      unhealthy: 'red',
    };
    return colorMap[status] || 'gray';
  }

  // 计算工具使用频率
  getUsageFrequency(usageCount: number) {
    if (usageCount > 1000) return 'high';
    if (usageCount > 100) return 'medium';
    return 'low';
  }
}

// 创建单例实例
export const toolService = new ToolService();

// 导出默认实例
export default toolService;