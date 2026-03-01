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

// Tool service class
export class ToolService {
  private basePath = '/api/ecosystem/tools';

  // Get all tools
  async getTools(params?: ToolSearchParams): Promise<ToolsResponse> {
    return apiClient.get<ToolsResponse>(this.basePath, { params });
  }

  // Get a single tool
  async getTool(id: string): Promise<ToolResponse> {
    return apiClient.get<ToolResponse>(`${this.basePath}/${id}`);
  }

  // Create tool
  async createTool(tool: Omit<Tool, 'id' | 'metadata' | 'health' | 'usage' | 'configuration'>): Promise<ToolResponse> {
    return apiClient.post<ToolResponse>(this.basePath, tool);
  }

  // Update tool
  async updateTool(id: string, updates: Partial<Tool>): Promise<ToolResponse> {
    return apiClient.put<ToolResponse>(`${this.basePath}/${id}`, updates);
  }

  // Delete tool
  async deleteTool(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  // Configure tool
  async configureTool(id: string, config: ConfigureToolRequest): Promise<ToolResponse> {
    return apiClient.post<ToolResponse>(`${this.basePath}/${id}/configure`, config);
  }

  // Test tool
  async testTool(id: string, testRequest: TestToolRequest): Promise<any> {
    return apiClient.post(`${this.basePath}/${id}/test`, testRequest);
  }

  // Update tool status
  async updateToolStatus(id: string, statusRequest: UpdateToolStatusRequest): Promise<ToolResponse> {
    return apiClient.patch<ToolResponse>(`${this.basePath}/${id}/status`, statusRequest);
  }

  // Get tool health status
  async getToolHealth(id: string): Promise<ToolHealthResponse> {
    return apiClient.get<ToolHealthResponse>(`${this.basePath}/${id}/health`);
  }

  // Check all tools health status
  async checkAllToolsHealth(): Promise<ToolHealthResponse[]> {
    return apiClient.post<ToolHealthResponse[]>(`${this.basePath}/health-check`);
  }

  // Get tool statistics
  async getToolStatistics(): Promise<ToolStatisticsResponse> {
    return apiClient.get<ToolStatisticsResponse>(`${this.basePath}/statistics`);
  }

  // Search tools
  async searchTools(query: string, category?: string): Promise<ToolsResponse> {
    const params: any = { query };
    if (category) params.category = category;
    return this.getTools(params);
  }

  // Get tools by category
  async getToolsByCategory(category: string): Promise<ToolsResponse> {
    return this.getTools({ category: category as any });
  }

  // Get configured tools
  async getConfiguredTools(): Promise<ToolsResponse> {
    return this.getTools({ configured: true });
  }

  // Get unconfigured tools
  async getUnconfiguredTools(): Promise<ToolsResponse> {
    return this.getTools({ configured: false });
  }

  // Get active tools
  async getActiveTools(): Promise<ToolsResponse> {
    return this.getTools({ status: 'active' });
  }

  // Get tool events
  async getToolEvents(filter?: ToolEventFilter): Promise<any> {
    return apiClient.get(`${this.basePath}/events`, { params: filter });
  }

  // Export tool configuration
  async exportTools(): Promise<ToolExport> {
    return apiClient.get<ToolExport>(`${this.basePath}/export`);
  }

  // Import tool configuration
  async importTools(exportData: ToolExport): Promise<void> {
    await apiClient.post(`${this.basePath}/import`, exportData);
  }

  // Get tool dependencies
  async getToolDependencies(toolId: string): Promise<ToolDependency[]> {
    return apiClient.get<ToolDependency[]>(`${this.basePath}/${toolId}/dependencies`);
  }

  // Get tool versions
  async getToolVersions(toolId: string): Promise<ToolVersion[]> {
    return apiClient.get<ToolVersion[]>(`${this.basePath}/${toolId}/versions`);
  }

  // Get tool permissions
  async getToolPermissions(toolId: string): Promise<ToolPermission[]> {
    return apiClient.get<ToolPermission[]>(`${this.basePath}/${toolId}/permissions`);
  }

  // Configure tool Webhook
  async configureToolWebhook(toolId: string, webhook: ToolWebhook): Promise<ToolWebhook> {
    return apiClient.post<ToolWebhook>(`${this.basePath}/${toolId}/webhooks`, webhook);
  }

  // Get tool Webhooks
  async getToolWebhooks(toolId: string): Promise<ToolWebhook[]> {
    return apiClient.get<ToolWebhook[]>(`${this.basePath}/${toolId}/webhooks`);
  }

  // Mock data - for development and testing
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

  // Get mock statistics
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

  // Utility methods
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

  // Calculate tool health status color
  getHealthColor(status: string) {
    const colorMap: Record<string, string> = {
      healthy: 'green',
      degraded: 'yellow',
      unhealthy: 'red',
    };
    return colorMap[status] || 'gray';
  }

  // Calculate tool usage frequency
  getUsageFrequency(usageCount: number) {
    if (usageCount > 1000) return 'high';
    if (usageCount > 100) return 'medium';
    return 'low';
  }
}

// Create singleton instance
export const toolService = new ToolService();

// Export default instance
export default toolService;