/**
 * Tool checker service - responsible for tool status checks and metric collection
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
   * Check status of a single tool
   */
  async checkToolStatus(tool: ToolStatus): Promise<ToolCheckResult> {
    try {
      // Simulate check process
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
   * Check multiple tools in batch
   */
  async checkMultipleTools(tools: ToolStatus[]): Promise<ToolCheckResult[]> {
    const results: ToolCheckResult[] = [];
    
    // Run checks in parallel, but limit concurrency
    const batchSize = 5;
    for (let i = 0; i < tools.length; i += batchSize) {
      const batch = tools.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(tool => this.checkToolStatus(tool))
      );
      results.push(...batchResults);
      
      // Delay between batches to avoid overload
      if (i + batchSize < tools.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Calculate response time
   */
  private calculateResponseTime(tool: ToolStatus): number {
    const baseTime = tool.responseTime || 50;
    const variation = Math.random() * 40 - 20; // ±20ms variation
    const networkJitter = Math.random() * 30; // network jitter
    
    return Math.max(1, baseTime + variation + networkJitter);
  }

  /**
   * Determine tool status
   */
  private determineToolStatus(tool: ToolStatus, responseTime: number): ToolStatus['status'] {
    // If the tool was previously offline, 50% chance of recovery
    if (tool.status === 'offline' && Math.random() > 0.5) {
      return 'healthy';
    }

    // Determine status based on response time
    if (responseTime > this.config.alertThresholds.responseTime * 2) {
      return 'error';
    } else if (responseTime > this.config.alertThresholds.responseTime) {
      return 'warning';
    }

    // Random error simulation
    if (Math.random() > 0.95) {
      return 'error';
    } else if (Math.random() > 0.9) {
      return 'warning';
    }

    return 'healthy';
  }

  /**
   * Create tool metric
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
   * Calculate memory usage
   */
  private calculateMemoryUsage(tool: ToolStatus): number {
    const baseUsage = tool.category === 'database' ? 40 : 30;
    const variation = Math.random() * 30;
    return baseUsage + variation;
  }

  /**
   * Calculate CPU usage
   */
  private calculateCpuUsage(tool: ToolStatus): number {
    const baseUsage = tool.category === 'analytics' ? 35 : 25;
    const variation = Math.random() * 40;
    return baseUsage + variation;
  }

  /**
   * Calculate request count
   */
  private calculateRequestCount(tool: ToolStatus): number {
    const baseRequests = tool.category === 'api' ? 500 : 100;
    const variation = Math.random() * 900;
    return Math.round(baseRequests + variation);
  }

  /**
   * Calculate error count
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
   * Simulate check delay
   */
  private async simulateCheckDelay(): Promise<void> {
    const delay = 100 + Math.random() * 400; // 100-500ms delay
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Validate tool configuration
   */
  validateToolConfig(tool: ToolStatus): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!tool.id || tool.id.trim() === '') {
      errors.push('Tool ID cannot be empty');
    }

    if (!tool.name || tool.name.trim() === '') {
      errors.push('Tool name cannot be empty');
    }

    if (!tool.category || tool.category.trim() === '') {
      errors.push('Tool category cannot be empty');
    }

    if (tool.responseTime !== undefined && tool.responseTime < 0) {
      errors.push('Response time cannot be negative');
    }

    if (tool.uptime !== undefined && (tool.uptime < 0 || tool.uptime > 100)) {
      errors.push('Uptime must be between 0 and 100');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}