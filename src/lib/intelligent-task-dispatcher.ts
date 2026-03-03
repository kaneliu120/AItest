// 智能任务分发系统
import { unifiedGatewayService, UnifiedRequest, UnifiedResponse } from './unified-gateway-service';
import { apiMonitoringService } from './api-monitoring-service';
import { dispatcherMonitoringService } from './dispatcher-monitoring-service';

// 任务优先级定义
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

// 任务执行策略
export type ExecutionStrategy = 'sequential' | 'parallel' | 'fallback' | 'optimistic';

// 任务历史记录
export interface TaskHistory {
  taskId: string;
  query: string;
  taskType: string;
  priority: TaskPriority;
  executionTime: number;
  success: boolean;
  cached: boolean;
  timestamp: string;
  systemUsed: string;
  tokenUsage?: number;
}

// 系统性能指标
export interface SystemPerformance {
  system: string;
  taskType: string;
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  successRate: number;
  lastUsed: string;
  costPerRequest?: number; // estimated cost
}

// 智能分发配置
export interface DispatchConfig {
  // 性能权重
  performanceWeight: number; // 0-1
  costWeight: number; // 0-1  
  reliabilityWeight: number; // 0-1
  cacheWeight: number; // 0-1
  
  // 策略配置
  defaultStrategy: ExecutionStrategy;
  enablePredictiveRouting: boolean;
  enableLoadBalancing: boolean;
  maxParallelTasks: number;
  timeoutMs: number;
}

// 分发决策
export interface DispatchDecision {
  system: string;
  strategy: ExecutionStrategy;
  reason: string;
  confidence: number; // 0-1
  estimatedTime: number; // ms
  estimatedCost: number; // estimated cost
  alternatives: Array<{
    system: string;
    score: number;
    reason: string;
  }>;
}

class IntelligentTaskDispatcher {
  private taskHistory: TaskHistory[] = [];
  private maxHistorySize = 1000;
  private systemPerformance: Map<string, SystemPerformance> = new Map();
  private config: DispatchConfig;
  
  constructor(config?: Partial<DispatchConfig>) {
    this.config = {
      performanceWeight: 0.4,
      costWeight: 0.3,
      reliabilityWeight: 0.2,
      cacheWeight: 0.1,
      defaultStrategy: 'optimistic',
      enablePredictiveRouting: true,
      enableLoadBalancing: true,
      maxParallelTasks: 3,
      timeoutMs: 30000,
      ...config
    };
    
    this.initializeSystemPerformance();
  }

  // 初始化系统性能数据
  private initializeSystemPerformance(): void {
    const systems = ['mission-control', 'okms', 'openclaw'];
    const taskTypes = ['code', 'knowledge', 'skill', 'mixed'];
    
    systems.forEach(system => {
      taskTypes.forEach(taskType => {
        const key = `${system}:${taskType}`;
        this.systemPerformance.set(key, {
          system,
          taskType,
          totalRequests: 0,
          successfulRequests: 0,
          averageResponseTime: 0,
          successRate: 1.0, // initial assumption: 100% success rate
          lastUsed: new Date().toISOString(),
          costPerRequest: this.estimateCost(system, taskType)
        });
      });
    });
  }

  // 预估成本
  private estimateCost(system: string, taskType: string): number {
    // 基于系统类型和任务类型的成本预估
    const baseCosts: Record<string, number> = {
      'mission-control': 0.5, // moderate cost
      'okms': 0.3, // lower cost (local RAG)
      'openclaw': 0.8 // higher cost (may call external APIs)
    };
    
    const taskMultipliers: Record<string, number> = {
      'code': 1.2,
      'knowledge': 1.0,
      'skill': 1.5,
      'mixed': 1.3
    };
    
    const baseCost = baseCosts[system] || 1.0;
    const multiplier = taskMultipliers[taskType] || 1.0;
    
    return baseCost * multiplier;
  }

  // 智能分发任务
  async dispatchTask(request: UnifiedRequest): Promise<UnifiedResponse> {
    const startTime = Date.now();
    
    try {
      // 1. 分析任务
      const taskAnalysis = this.analyzeTask(request);
      
      // 2. 做出分发决策
      const decision = this.makeDispatchDecision(request, taskAnalysis);
      
      // 3. 执行任务
      let response: UnifiedResponse;
      
      switch (decision.strategy) {
        case 'sequential':
          response = await this.executeSequential(request, decision);
          break;
        case 'parallel':
          response = await this.executeParallel(request, decision);
          break;
        case 'fallback':
          response = await this.executeWithFallback(request, decision);
          break;
        case 'optimistic':
        default:
          response = await this.executeOptimistic(request, decision);
          break;
      }
      
      // 4. 记录历史和学习
      await this.recordTaskHistory(request, response, decision, Date.now() - startTime);
      
      // 5. 更新系统性能
      this.updateSystemPerformance(decision.system, taskAnalysis.taskType, response, Date.now() - startTime);
      
      // 6. 在响应中添加分发决策信息
      return {
        ...response,
        data: {
          ...response.data,
          dispatchDecision: {
            system: decision.system as NonNullable<UnifiedRequest['system']>,
            strategy: decision.strategy,
            reason: decision.reason,
            confidence: decision.confidence,
            estimatedTime: decision.estimatedTime,
            estimatedCost: decision.estimatedCost,
            alternatives: decision.alternatives
          }
        }
      };
      
    } catch (error) {
      console.error('Intelligent task dispatch failed:', error);
      
      // 回退到基础统一网关
      return await unifiedGatewayService.processRequest(request);
    }
  }

  // 分析任务
  private analyzeTask(request: UnifiedRequest): {
    taskType: string;
    complexity: 'low' | 'medium' | 'high';
    urgency: 'low' | 'medium' | 'high';
    estimatedTokens: number;
  } {
    // 使用统一网关的分类器（简化版本）
    const query = request.query.toLowerCase();
    
    // 任务类型分析
    let taskType = 'mixed';
    if (query.includes('代码') || query.includes('开发') || query.includes('编程')) {
      taskType = 'code';
    } else if (query.includes('知识') || query.includes('查询') || query.includes('搜索')) {
      taskType = 'knowledge';
    } else if (query.includes('执行') || query.includes('运行') || query.includes('操作')) {
      taskType = 'skill';
    }
    
    // 复杂度分析（基于查询长度和关键词）
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    const queryLength = query.length;
    if (queryLength < 20) complexity = 'low';
    else if (queryLength > 100) complexity = 'high';
    
    // 紧急度分析（基于优先级）
    let urgency: 'low' | 'medium' | 'high' = 'medium';
    switch (request.priority) {
      case 'low': urgency = 'low'; break;
      case 'high': urgency = 'high'; break;
      case 'critical': urgency = 'high'; break;
    }
    
    // 预估Token数
    const estimatedTokens = Math.ceil(queryLength * 1.5); // simple estimate
    
    return {
      taskType,
      complexity,
      urgency,
      estimatedTokens
    };
  }

  // 做出分发决策
  private makeDispatchDecision(request: UnifiedRequest, analysis: ReturnType<typeof this.analyzeTask>): DispatchDecision {
    const systems = ['mission-control', 'okms', 'openclaw'];
    const taskType = analysis.taskType;
    
    // 计算每个系统的得分
    const systemScores = systems.map(system => {
      const performance = this.systemPerformance.get(`${system}:${taskType}`);
      if (!performance) {
        return {
          system,
          score: 0.5, // default score
          reason: 'No historical performance data'
        };
      }
      
      // 计算综合得分
      let score = 0;
      
      // 1. 性能得分 (响应时间)
      const performanceScore = this.calculatePerformanceScore(performance.averageResponseTime);
      score += performanceScore * this.config.performanceWeight;
      
      // 2. 可靠性得分 (成功率)
      const reliabilityScore = performance.successRate;
      score += reliabilityScore * this.config.reliabilityWeight;
      
      // 3. 成本得分 (成本越低得分越高)
      const costScore = performance.costPerRequest ? 1 / performance.costPerRequest : 1;
      score += costScore * this.config.costWeight;
      
      // 4. 缓存得分 (基于历史缓存命中率)
      const cacheScore = this.calculateCacheScore(system, taskType);
      score += cacheScore * this.config.cacheWeight;
      
      // 5. 负载均衡考虑
      if (this.config.enableLoadBalancing) {
        const loadScore = this.calculateLoadScore(system);
        score *= loadScore;
      }
      
      return {
        system,
        score,
        reason: `perf:${performanceScore.toFixed(2)}, reliability:${reliabilityScore.toFixed(2)}, cost:${costScore.toFixed(2)}`
      };
    });
    
    // 排序并选择最佳系统
    systemScores.sort((a, b) => b.score - a.score);
    const bestSystem = systemScores[0];
    
    // 确定执行策略
    let strategy: ExecutionStrategy = this.config.defaultStrategy;
    let reason = '';
    
    if (analysis.urgency === 'high' || request.priority === 'critical') {
      strategy = 'parallel';
      reason = 'High-priority task, using parallel execution';
    } else if (analysis.complexity === 'high') {
      strategy = 'fallback';
      reason = 'Complex task, using fallback strategy';
    } else if (bestSystem.score < 0.7 && systemScores[1] && systemScores[1].score > 0.6) {
      strategy = 'optimistic';
      reason = 'Multiple systems perform similarly, using optimistic execution';
    }
    
    // 预估时间和成本
    const performance = this.systemPerformance.get(`${bestSystem.system}:${taskType}`);
    const estimatedTime = performance ? performance.averageResponseTime : 1000;
    const estimatedCost = performance ? performance.costPerRequest || 1.0 : 1.0;
    
    return {
      system: bestSystem.system,
      strategy,
      reason: `${reason} (${bestSystem.reason})`,
      confidence: bestSystem.score,
      estimatedTime,
      estimatedCost,
      alternatives: systemScores.slice(1, 3) // top 3 alternatives
    };
  }

  // 计算性能得分 (响应时间越短得分越高)
  private calculatePerformanceScore(responseTime: number): number {
    if (responseTime <= 0) return 1.0;
    
    // 响应时间在1秒内得1分，超过5秒得0分，线性插值
    const maxTime = 5000; // 5 seconds
    const score = Math.max(0, 1 - (responseTime / maxTime));
    return Math.min(1, score);
  }

  // 计算缓存得分
  private calculateCacheScore(system: string, taskType: string): number {
    // 从历史记录中计算缓存命中率
    const relevantHistory = this.taskHistory.filter(
      task => task.systemUsed === system && task.taskType === taskType
    );
    
    if (relevantHistory.length === 0) return 0.5; // default
    
    const cacheHits = relevantHistory.filter(task => task.cached).length;
    const cacheRate = cacheHits / relevantHistory.length;
    
    return cacheRate;
  }

  // 计算负载得分
  private calculateLoadScore(system: string): number {
    // 基于最近使用频率计算负载
    const now = Date.now();
    const recentTasks = this.taskHistory.filter(
      task => task.systemUsed === system && 
      now - new Date(task.timestamp).getTime() < 60000 // last 1 minute
    );
    
    // 任务越多，负载越高，得分越低
    const loadFactor = Math.min(1, recentTasks.length / 10); // max 10 tasks/minute
    return 1 - (loadFactor * 0.3); // reduce score by at most 30%
  }

  // 执行策略：乐观执行 (使用最佳系统)
  private async executeOptimistic(request: UnifiedRequest, decision: DispatchDecision): Promise<UnifiedResponse> {
    const modifiedRequest: UnifiedRequest = {
      ...request,
      system: decision.system as NonNullable<UnifiedRequest['system']>
    };
    
    return await unifiedGatewayService.processRequest(modifiedRequest);
  }

  // 执行策略：顺序执行 (按优先级尝试多个系统)
  private async executeSequential(request: UnifiedRequest, decision: DispatchDecision): Promise<UnifiedResponse> {
    const systemsToTry = [decision.system, ...decision.alternatives.map(a => a.system)];
    
    for (const system of systemsToTry) {
      try {
        const modifiedRequest: UnifiedRequest = {
          ...request,
          system: system as NonNullable<UnifiedRequest['system']>
        };
        
        const response = await unifiedGatewayService.processRequest(modifiedRequest);
        
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn(`System ${system} execution failed:`, error);
        // 继续尝试下一个系统
      }
    }
    
    throw new Error('All systems failed to execute');
  }

  // 执行策略：并行执行 (同时尝试多个系统，取最快成功结果)
  private async executeParallel(request: UnifiedRequest, decision: DispatchDecision): Promise<UnifiedResponse> {
    const systemsToTry = [decision.system, ...decision.alternatives.map(a => a.system)];
    const limitedSystems = systemsToTry.slice(0, this.config.maxParallelTasks);
    
    const promises = limitedSystems.map(async (system) => {
      try {
        const modifiedRequest: UnifiedRequest = {
          ...request,
          system: system as NonNullable<UnifiedRequest['system']>
        };
        
        return await unifiedGatewayService.processRequest(modifiedRequest);
      } catch (error) {
        return {
          success: false,
          data: { error: error instanceof Error ? error.message : 'Unknown error' },
          source: system as UnifiedResponse['source'],
          taskType: 'mixed' as const,
          cached: false,
          responseTime: 0,
          timestamp: new Date().toISOString()
        };
      }
    });
    
    // 使用Promise.race等待第一个成功的结果
    return new Promise((resolve, reject) => {
      let completed = 0;
      let hasSuccess = false;
      
      promises.forEach(promise => {
        promise.then(result => {
          completed++;
          
          if (result.success && !hasSuccess) {
            hasSuccess = true;
            resolve(result);
          } else if (completed === promises.length && !hasSuccess) {
            reject(new Error('All parallel executions failed'));
          }
        }).catch(() => {
          completed++;
          if (completed === promises.length && !hasSuccess) {
            reject(new Error('All parallel executions failed'));
          }
        });
      });
    });
  }

  // 执行策略：回退执行 (主系统失败时回退到备选)
  private async executeWithFallback(request: UnifiedRequest, decision: DispatchDecision): Promise<UnifiedResponse> {
    try {
      // 首先尝试主系统
      const primaryRequest: UnifiedRequest = {
        ...request,
        system: decision.system as NonNullable<UnifiedRequest['system']>
      };
      
      const primaryResponse = await unifiedGatewayService.processRequest(primaryRequest);
      
      if (primaryResponse.success) {
        return primaryResponse;
      }
    } catch (error) {
      console.warn(`Primary system ${decision.system} execution failed:`, error);
    }
    
    // 主系统失败，尝试第一个备选
    if (decision.alternatives.length > 0) {
      const fallbackSystem = decision.alternatives[0].system;
      const fallbackRequest: UnifiedRequest = {
        ...request,
        system: fallbackSystem as NonNullable<UnifiedRequest['system']>
      };
      
      return await unifiedGatewayService.processRequest(fallbackRequest);
    }
    
    throw new Error('Both primary and fallback systems failed to execute');
  }

  // 记录任务历史
  private async recordTaskHistory(
    request: UnifiedRequest, 
    response: UnifiedResponse, 
    decision: DispatchDecision,
    executionTime: number
  ): Promise<void> {
    const history: TaskHistory = {
      taskId: request.id,
      query: request.query.substring(0, 100), // truncate long query
      taskType: (response.taskType || (response.data as any)?.taskType || 'mixed') as string,
      priority: request.priority || 'medium',
      executionTime,
      success: response.success,
      cached: (response.cached ?? (response.data as any)?.cached ?? false) as boolean,
      timestamp: new Date().toISOString(),
      systemUsed: decision.system,
      tokenUsage: response.tokenUsage?.total ?? (response.data as any)?.tokenUsage?.total
    };
    
    this.taskHistory.unshift(history);
    
    // 限制历史记录大小
    if (this.taskHistory.length > this.maxHistorySize) {
      this.taskHistory = this.taskHistory.slice(0, this.maxHistorySize);
    }
    
    // 记录到监控系统
    apiMonitoringService.recordMetric({
      endpoint: '/api/v2/dispatcher/dispatch',
      method: 'POST',
      responseTime: executionTime,
      statusCode: response.success ? 200 : 500,
      success: response.success,
      userId: request.userId
    });
    
    // 记录到分发器监控系统
    dispatcherMonitoringService.recordTaskExecution(history);
  }

  // 更新系统性能
  private updateSystemPerformance(
    system: string, 
    taskType: string, 
    response: UnifiedResponse, 
    executionTime: number
  ): void {
    const key = `${system}:${taskType}`;
    const current = this.systemPerformance.get(key);
    
    if (!current) {
      this.systemPerformance.set(key, {
        system,
        taskType,
        totalRequests: 1,
        successfulRequests: response.success ? 1 : 0,
        averageResponseTime: executionTime,
        successRate: response.success ? 1.0 : 0.0,
        lastUsed: new Date().toISOString(),
        costPerRequest: this.estimateCost(system, taskType)
      });
      return;
    }
    
    //    // 更新系统性能数据
    current.totalRequests += 1;
    current.successfulRequests += response.success ? 1 : 0;
    
    // 更新平均响应时间 (指数移动平均)
    const alpha = 0.3; // smoothing factor
    current.averageResponseTime = alpha * executionTime + (1 - alpha) * current.averageResponseTime;
    
    // 更新成功率
    current.successRate = current.successfulRequests / current.totalRequests;
    current.lastUsed = new Date().toISOString();
    
    this.systemPerformance.set(key, current);
  }

  // 获取任务历史
  getTaskHistory(limit = 50): TaskHistory[] {
    return this.taskHistory.slice(0, limit);
  }

  // 获取系统性能报告
  getSystemPerformanceReport(): SystemPerformance[] {
    return Array.from(this.systemPerformance.values());
  }

  // 获取分发统计
  getDispatchStats(): { totalTasks: number; successfulTasks: number; successRate: number; cachedTasks: number; cacheRate: number; averageExecutionTime: number; systemStats: Record<string, { total: number; successful: number; averageTime: number; totalTime: number }>; taskTypeStats: Record<string, { total: number; successful: number }>; lastUpdated: string } {
    const totalTasks = this.taskHistory.length;
    const successfulTasks = this.taskHistory.filter(t => t.success).length;
    const cachedTasks = this.taskHistory.filter(t => t.cached).length;
    
    // 按系统统计
    const systemStats: Record<string, { total: number; successful: number; averageTime: number; totalTime: number }> = {};
    this.taskHistory.forEach(task => {
      if (!systemStats[task.systemUsed]) {
        systemStats[task.systemUsed] = {
          total: 0,
          successful: 0,
          averageTime: 0,
          totalTime: 0
        };
      }
      
      const stats = systemStats[task.systemUsed];
      stats.total += 1;
      stats.successful += task.success ? 1 : 0;
      stats.totalTime += task.executionTime;
      stats.averageTime = stats.totalTime / stats.total;
    });
    
    // 按任务类型统计
    const taskTypeStats: Record<string, { total: number; successful: number }> = {};
    this.taskHistory.forEach(task => {
      if (!taskTypeStats[task.taskType]) {
        taskTypeStats[task.taskType] = {
          total: 0,
          successful: 0
        };
      }
      
      const stats = taskTypeStats[task.taskType];
      stats.total += 1;
      stats.successful += task.success ? 1 : 0;
    });
    
    return {
      totalTasks,
      successfulTasks,
      successRate: totalTasks > 0 ? (successfulTasks / totalTasks) : 0,
      cachedTasks,
      cacheRate: totalTasks > 0 ? (cachedTasks / totalTasks) : 0,
      averageExecutionTime: totalTasks > 0 ? 
        this.taskHistory.reduce((sum, t) => sum + t.executionTime, 0) / totalTasks : 0,
      systemStats,
      taskTypeStats,
      lastUpdated: new Date().toISOString()
    };
  }

  // 清空历史记录 (用于测试)
  clearHistory(): void {
    this.taskHistory = [];
    this.initializeSystemPerformance();
  }

  // 更新配置
  updateConfig(newConfig: Partial<DispatchConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // 获取当前配置
  getConfig(): DispatchConfig {
    return { ...this.config };
  }
}

// 导出单例实例
export const intelligentTaskDispatcher = new IntelligentTaskDispatcher();