/**
 * 工具检查服务 - 负责工具状态检查和指标收集
 */

import { 
  ToolStatus, 
  ToolMetric, 
  ToolCheckResult,
  EcosystemConfig 
} from '../types';

export class ToolCheckerService {
  constructor(private config: EcosystemConfig) {}

  /**
   * 检查单个工具状态
   */
  async checkToolStatus(tool: ToolStatus): Promise<ToolCheckResult> {
    try {
      // 模拟检查过程
      await this.simulateCheckDelay();
      
      const responseTime = this.calculateResponseTime(tool);
      const status = this.determineToolStatus(tool, responseTime);
      const metric = this.createToolMetric(tool, responseTime, status);

      return {
        toolId: tool.id,
        status,
        responseTime,
        checkedAt: new Date(),
        details: metric
      };
    } catch (error) {
      console.error(`Tool check failed for ${tool.name}:`, error);
      return {
        toolId: tool.id,
        status: 'error',
        responseTime: 0,
        checkedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 批量检查工具状态
   */
  async checkMultipleTools(tools: ToolStatus[]): Promise<ToolCheckResult[]> {
    const results: ToolCheckResult[] = [];
    
    // 并行检查，但限制并发数
    const batchSize = 5;
    for (let i = 0; i < tools.length; i += batchSize) {
      const batch = tools.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(tool => this.checkToolStatus(tool))
      );
      results.push(...batchResults);
      
      // 批次间延迟，避免过载
      if (i + batchSize < tools.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * 计算响应时间
   */
  private calculateResponseTime(tool: ToolStatus): number {
    const baseTime = tool.responseTime || 50;
    const variation = Math.random() * 40 - 20; // ±20ms变化
    const networkJitter = Math.random() * 30; // 网络抖动
    
    return Math.max(1, baseTime + variation + networkJitter);
  }

  /**
   * 确定工具状态
   */
  private determineToolStatus(tool: ToolStatus, responseTime: number): ToolStatus['status'] {
    // 如果工具之前是离线状态，有50%几率恢复
    if (tool.status === 'offline' && Math.random() > 0.5) {
      return 'healthy';
    }

    // 基于响应时间判断状态
    if (responseTime > this.config.alertThresholds.responseTime * 2) {
      return 'error';
    } else if (responseTime > this.config.alertThresholds.responseTime) {
      return 'warning';
    }

    // 随机错误模拟
    if (Math.random() > 0.95) {
      return 'error';
    } else if (Math.random() > 0.9) {
      return 'warning';
    }

    return 'healthy';
  }

  /**
   * 创建工具指标
   */
  private createToolMetric(
    tool: ToolStatus, 
    responseTime: number, 
    status: ToolStatus['status']
  ): ToolMetric {
    return {
      timestamp: new Date(),
      toolId: tool.id,
      responseTime,
      status,
      memoryUsage: this.calculateMemoryUsage(tool),
      cpuUsage: this.calculateCpuUsage(tool),
      requestCount: this.calculateRequestCount(tool),
      errorCount: this.calculateErrorCount(status)
    };
  }

  /**
   * 计算内存使用率
   */
  private calculateMemoryUsage(tool: ToolStatus): number {
    const baseUsage = tool.category === 'database' ? 40 : 30;
    const variation = Math.random() * 30;
    return baseUsage + variation;
  }

  /**
   * 计算CPU使用率
   */
  private calculateCpuUsage(tool: ToolStatus): number {
    const baseUsage = tool.category === 'analytics' ? 35 : 25;
    const variation = Math.random() * 40;
    return baseUsage + variation;
  }

  /**
   * 计算请求数量
   */
  private calculateRequestCount(tool: ToolStatus): number {
    const baseRequests = tool.category === 'api' ? 500 : 100;
    const variation = Math.random() * 900;
    return Math.round(baseRequests + variation);
  }

  /**
   * 计算错误数量
   */
  private calculateErrorCount(status: ToolStatus['status']): number {
    if (status === 'error') {
      return 1 + Math.floor(Math.random() * 10);
    } else if (status === 'warning') {
      return Math.random() > 0.7 ? 1 : 0;
    }
    return 0;
  }

  /**
   * 模拟检查延迟
   */
  private async simulateCheckDelay(): Promise<void> {
    const delay = 100 + Math.random() * 400; // 100-500ms延迟
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * 验证工具配置
   */
  validateToolConfig(tool: ToolStatus): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!tool.id || tool.id.trim() === '') {
      errors.push('工具ID不能为空');
    }

    if (!tool.name || tool.name.trim() === '') {
      errors.push('工具名称不能为空');
    }

    if (!tool.category || tool.category.trim() === '') {
      errors.push('工具分类不能为空');
    }

    if (tool.responseTime !== undefined && tool.responseTime < 0) {
      errors.push('响应时间不能为负数');
    }

    if (tool.uptime !== undefined && (tool.uptime < 0 || tool.uptime > 100)) {
      errors.push('运行时间必须在0-100之间');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}