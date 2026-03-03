/**
 * 性能优化服务
 * 优化需求分析系统的性能和资源使用
 */

/**
 * 安全日志记录器
 */
const logger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data);
    }
  },
  info: (message: string) => {
    console.log(`[INFO] ${message}`);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  }
};


/**
 * 安全解析日期字符串
 */
const parseDate = (dateString: string): Date => {
  const timestamp = Date.parse(dateString);
  if (isNaN(timestamp)) {
    console.warn('Invalid date string:', dateString);
    return new Date();
  }
  return new Date(timestamp);
};


export interface PerformanceMetrics {
  timestamp: string;
  responseTime: number; // ms
  memoryUsage: number; // MB
  cpuUsage: number; // percentage
  requestCount: number;
  errorRate: number; // percentage
  cacheHitRate: number; // percentage
}

export interface OptimizationReport {
  id: string;
  generatedAt: string;
  metrics: PerformanceMetrics;
  recommendations: OptimizationRecommendation[];
  improvements: PerformanceImprovement[];
  nextSteps: string[];
}

export interface OptimizationRecommendation {
  area: 'caching' | 'database' | 'api' | 'memory' | 'concurrency';
  priority: 'high' | 'medium' | 'low';
  description: string;
  expectedImpact: string;
  implementationEffort: 'low' | 'medium' | 'high';
}

export interface PerformanceImprovement {
  area: string;
  before: number;
  after: number;
  improvement: number; // percentage
  description: string;
}

export class PerformanceOptimizer {
  private metricsHistory: PerformanceMetrics[] = [];
  private readonly MAX_HISTORY = 100;

  /**
   * 记录性能指标
   */
  recordMetrics(metrics: Partial<PerformanceMetrics>): void {
    const fullMetrics: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      responseTime: metrics.responseTime || 0,
      memoryUsage: metrics.memoryUsage || 0,
      cpuUsage: metrics.cpuUsage || 0,
      requestCount: metrics.requestCount || 0,
      errorRate: metrics.errorRate || 0,
      cacheHitRate: metrics.cacheHitRate || 0,
    };

    this.metricsHistory.push(fullMetrics);
    
    // 保持历史记录大小
    if (this.metricsHistory.length > this.MAX_HISTORY) {
      this.metricsHistory = this.metricsHistory.slice(-this.MAX_HISTORY);
    }
  }

  /**
   * 生成优化报告
   */
  generateOptimizationReport(): OptimizationReport {
    const latestMetrics = this.getLatestMetrics();
    const recommendations = this.analyzePerformance(latestMetrics);
    const improvements = this.calculateImprovements();
    
    return {
      id: `opt_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      metrics: latestMetrics,
      recommendations,
      improvements,
      nextSteps: this.generateNextSteps(recommendations),
    };
  }

  /**
   * 获取最新指标
   */
  private getLatestMetrics(): PerformanceMetrics {
    if (this.metricsHistory.length === 0) {
      return this.createDefaultMetrics();
    }
    
    return this.metricsHistory[this.metricsHistory.length - 1];
  }

  /**
   * 分析性能问题
   */
  private analyzePerformance(metrics: PerformanceMetrics): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // 响应时间分析
    if (metrics.responseTime > 1000) {
      recommendations.push({
        area: 'api',
        priority: 'high',
        description: 'API response time exceeds 1 second, optimization required',
        expectedImpact: 'Response time reduced by 50-80%',
        implementationEffort: 'medium',
      });
    } else if (metrics.responseTime > 500) {
      recommendations.push({
        area: 'api',
        priority: 'medium',
        description: 'API response time exceeds 500ms, optimization recommended',
        expectedImpact: 'Response time reduced by 30-50%',
        implementationEffort: 'low',
      });
    }

    // 内存使用分析
    if (metrics.memoryUsage > 500) {
      recommendations.push({
        area: 'memory',
        priority: 'high',
        description: 'Memory usage exceeds 500MB, risk of memory leak',
        expectedImpact: 'Memory usage reduced by 40-60%',
        implementationEffort: 'high',
      });
    } else if (metrics.memoryUsage > 200) {
      recommendations.push({
        area: 'memory',
        priority: 'medium',
        description: 'Memory usage is high, optimization recommended',
        expectedImpact: 'Memory usage reduced by 20-30%',
        implementationEffort: 'medium',
      });
    }

    // 缓存命中率分析
    if (metrics.cacheHitRate < 50) {
      recommendations.push({
        area: 'caching',
        priority: 'high',
        description: 'Cache hit rate below 50%, cache strategy needs optimization',
        expectedImpact: 'Cache hit rate improved to 70-90%',
        implementationEffort: 'medium',
      });
    }

    // 错误率分析
    if (metrics.errorRate > 5) {
      recommendations.push({
        area: 'api',
        priority: 'high',
        description: 'Error rate exceeds 5%, immediate fix required',
        expectedImpact: 'Error rate reduced to below 1%',
        implementationEffort: 'high',
      });
    }

    // 并发性能建议
    if (metrics.requestCount > 1000 && metrics.responseTime > 300) {
      recommendations.push({
        area: 'concurrency',
        priority: 'medium',
        description: 'Response time increases under high concurrency, optimize concurrent processing',
        expectedImpact: 'Support higher concurrency with stable response times',
        implementationEffort: 'high',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 计算改进效果
   */
  private calculateImprovements(): PerformanceImprovement[] {
    if (this.metricsHistory.length < 2) {
      return [];
    }

    const firstMetrics = this.metricsHistory[0];
    const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    
    const improvements: PerformanceImprovement[] = [];

    // 响应时间改进
    if (firstMetrics.responseTime > 0 && latestMetrics.responseTime > 0) {
      const improvement = ((firstMetrics.responseTime - latestMetrics.responseTime) / firstMetrics.responseTime) * 100;
      improvements.push({
        area: 'Response Time',
        before: firstMetrics.responseTime,
        after: latestMetrics.responseTime,
        improvement: Math.round(improvement),
        description: improvement > 0 ? 'Response time decreased' : 'Response time increased',
      });
    }

    // 内存使用改进
    if (firstMetrics.memoryUsage > 0 && latestMetrics.memoryUsage > 0) {
      const improvement = ((firstMetrics.memoryUsage - latestMetrics.memoryUsage) / firstMetrics.memoryUsage) * 100;
      improvements.push({
        area: 'Memory Usage',
        before: firstMetrics.memoryUsage,
        after: latestMetrics.memoryUsage,
        improvement: Math.round(improvement),
        description: improvement > 0 ? 'Memory usage decreased' : 'Memory usage increased',
      });
    }

    // 错误率改进
    if (firstMetrics.errorRate > 0 && latestMetrics.errorRate > 0) {
      const improvement = ((firstMetrics.errorRate - latestMetrics.errorRate) / firstMetrics.errorRate) * 100;
      improvements.push({
        area: 'Error Rate',
        before: firstMetrics.errorRate,
        after: latestMetrics.errorRate,
        improvement: Math.round(improvement),
        description: improvement > 0 ? 'Error rate decreased' : 'Error rate increased',
      });
    }

    return improvements;
  }

  /**
   * 生成下一步行动
   */
  private generateNextSteps(recommendations: OptimizationRecommendation[]): string[] {
    const nextSteps: string[] = [];
    
    const highPriority = recommendations.filter(r => r.priority === 'high');
    const mediumPriority = recommendations.filter(r => r.priority === 'medium');

    if (highPriority.length > 0) {
      nextSteps.push('Address high-priority optimization recommendations immediately');
      highPriority.slice(0, 2).forEach(rec => {
        nextSteps.push(`Implement: ${rec.description}`);
      });
    }

    if (mediumPriority.length > 0) {
      nextSteps.push('Plan to address medium-priority optimization recommendations');
    }

    // 监控建议
    nextSteps.push('Continuously monitor performance metrics');
    nextSteps.push('Generate performance reports regularly');
    nextSteps.push('Establish performance baselines');

    // 技术债务管理
    nextSteps.push('Create a technical debt reduction plan');
    nextSteps.push('Establish code quality review process');

    return nextSteps;
  }

  /**
   * 创建默认指标
   */
  private createDefaultMetrics(): PerformanceMetrics {
    return {
      timestamp: new Date().toISOString(),
      responseTime: 150,
      memoryUsage: 120,
      cpuUsage: 25,
      requestCount: 100,
      errorRate: 1.5,
      cacheHitRate: 65,
    };
  }

  /**
   * 获取性能趋势
   */
  getPerformanceTrends(): {
    responseTimeTrend: number[];
    memoryUsageTrend: number[];
    errorRateTrend: number[];
    timestamps: string[];
  } {
    const responseTimeTrend = this.metricsHistory.map(m => m.responseTime);
    const memoryUsageTrend = this.metricsHistory.map(m => m.memoryUsage);
    const errorRateTrend = this.metricsHistory.map(m => m.errorRate);
    const timestamps = this.metricsHistory.map(m => 
      new Date(m.timestamp).toLocaleTimeString()
    );

    return {
      responseTimeTrend,
      memoryUsageTrend,
      errorRateTrend,
      timestamps,
    };
  }

  /**
   * 获取性能摘要
   */
  getPerformanceSummary(): {
    avgResponseTime: number;
    avgMemoryUsage: number;
    totalRequests: number;
    successRate: number;
    recommendationsCount: number;
  } {
    if (this.metricsHistory.length === 0) {
      return {
        avgResponseTime: 0,
        avgMemoryUsage: 0,
        totalRequests: 0,
        successRate: 100,
        recommendationsCount: 0,
      };
    }

    const totalRequests = this.metricsHistory.reduce((sum, m) => sum + m.requestCount, 0);
    const avgResponseTime = this.metricsHistory.reduce((sum, m) => sum + m.responseTime, 0) / this.metricsHistory.length;
    const avgMemoryUsage = this.metricsHistory.reduce((sum, m) => sum + m.memoryUsage, 0) / this.metricsHistory.length;
    const avgErrorRate = this.metricsHistory.reduce((sum, m) => sum + m.errorRate, 0) / this.metricsHistory.length;
    const successRate = 100 - avgErrorRate;

    const report = this.generateOptimizationReport();
    const recommendationsCount = report.recommendations.length;

    return {
      avgResponseTime: Math.round(avgResponseTime),
      avgMemoryUsage: Math.round(avgMemoryUsage),
      totalRequests,
      successRate: Math.round(successRate * 100) / 100,
      recommendationsCount,
    };
  }

  /**
   * 清理历史数据
   */
  clearHistory(): void {
    this.metricsHistory = [];
  }

  /**
   * 导出性能数据
   */
  exportPerformanceData(): string {
    const summary = this.getPerformanceSummary();
    const trends = this.getPerformanceTrends();
    const report = this.generateOptimizationReport();

    return JSON.stringify({
      summary,
      trends,
      report,
      metricsHistory: this.metricsHistory,
    }, null, 2);
  }

  /**
   * 模拟性能测试
   */
  async runPerformanceTest(): Promise<PerformanceMetrics> {
    logger.debug('Starting performance test...');
    
    const startTime = Date.now();
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 模拟内存使用
    const memoryUsage = process.memoryUsage?.()?.heapUsed / 1024 / 1024 || 120;
    
    // 模拟CPU使用
    const cpuUsage = Math.random() * 50;
    
    const responseTime = Date.now() - startTime;
    
    const metrics: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      responseTime,
      memoryUsage: Math.round(memoryUsage),
      cpuUsage: Math.round(cpuUsage),
      requestCount: 1,
      errorRate: Math.random() > 0.95 ? 5 : 0, // 5% error rate
      cacheHitRate: Math.random() > 0.3 ? 70 : 30, // 70% cache hit rate
    };
    
    this.recordMetrics(metrics);
    
    logger.debug('Performance test complete:', metrics);
    return metrics;
  }
}