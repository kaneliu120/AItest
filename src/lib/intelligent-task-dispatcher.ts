// 智canTaskDispatchSystem
import { unifiedGatewayservervice, UnifiedRequest, UnifiedResponse } from './unified-gateway-service';
import { apiMonitoringservervice } from './api-monitoring-service';
import { dispatcherMonitoringservervice } from './dispatcher-monitoring-service';

// TaskPriority定义
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

// TaskExecute策略
export type ExecutionStrategy = 'sequential' | 'parallel' | 'fallback' | 'optimistic';

// Task历史Log
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

// SystemPerformancemetrics
export interface SystemPerformance {
  system: string;
  taskType: string;
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  successRate: number;
  lastUsed: string;
  costPerRequest?: number; // 预估成本
}

// 智canDispatchConfiguration
export interface DispatchConfig {
  // Performance权重
  performanceWeight: number; // 0-1
  costWeight: number; // 0-1  
  reliabilityWeight: number; // 0-1
  cacheWeight: number; // 0-1
  
  // 策略Configuration
  defaultStrategy: ExecutionStrategy;
  enablePredictiveRouting: boolean;
  enableLoadBalancing: boolean;
  maxParallelTasks: number;
  timeoutMs: number;
}

// Dispatchdecision making
export interface DispatchDecision {
  system: string;
  strategy: ExecutionStrategy;
  reason: string;
  confidence: number; // 0-1
  estimatedTime: number; // 毫s
  estimatedCost: number; // 预估成本
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

  // InitializeSystemPerformancedata
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
          successRate: 1.0, // 初始false设100%success率
          lastUsed: new Date().toISOString(),
          costPerRequest: this.estimateCost(system, taskType)
        });
      });
    });
  }

  // 预估成本
  private estimateCost(system: string, taskType: string): number {
    // 基于SystemType和TaskType's成本预估
    const baseCosts: Record<string, number> = {
      'mission-control': 0.5, // Center等成本
      'okms': 0.3, // 较Low成本 (LocalRAG)
      'openclaw': 0.8 // 较High成本 (可can调用External APIs)
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

  // 智canDispatchTask
  async dispatchTask(request: UnifiedRequest): Promise<UnifiedResponse> {
    const startTime = Date.now();
    
    try {
      // 1. AnalyticsTask
      const taskAnalysis = this.analyzeTask(request);
      
      // 2. 做出Dispatchdecision making
      const decision = this.makeDispatchDecision(request, taskAnalysis);
      
      // 3. ExecuteTask
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
      
      // 4. Log历史和学习
      await this.recordTaskHistory(request, response, decision, Date.now() - startTime);
      
      // 5. UpdateSystemPerformance
      this.updateSystemPerformance(decision.system, taskAnalysis.taskType, response, Date.now() - startTime);
      
      // 6. inResponseCenterAddDispatchdecision makinginformation
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
      
      // 回退tobasicUnified Gateway
      return await unifiedGatewayservervice.processRequest(request);
    }
  }

  // AnalyticsTask
  private analyzeTask(request: UnifiedRequest): {
    taskType: string;
    complexity: 'low' | 'medium' | 'high';
    urgency: 'low' | 'medium' | 'high';
    estimatedTokens: number;
  } {
    // usingUnified Gateway'sCategory器(简化Version)
    const query = request.query.toLowerCase();
    
    // TaskTypeAnalytics
    let taskType = 'mixed';
    if (query.includes('code') || query.includes('Development') || query.includes('coding')) {
      taskType = 'code';
    } else if (query.includes('knowledge') || query.includes('query') || query.includes('Search')) {
      taskType = 'knowledge';
    } else if (query.includes('Execute') || query.includes('run') || query.includes('operation')) {
      taskType = 'skill';
    }
    
    // complexityAnalytics(基于查询长度和Off键词)
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    const queryLength = query.length;
    if (queryLength < 20) complexity = 'low';
    else if (queryLength > 100) complexity = 'high';
    
    // Urgent度Analytics(基于Priority)
    let urgency: 'low' | 'medium' | 'high' = 'medium';
    switch (request.priority) {
      case 'low': urgency = 'low'; break;
      case 'high': urgency = 'high'; break;
      case 'critical': urgency = 'high'; break;
    }
    
    // 预估Token数
    const estimatedTokens = Math.ceil(queryLength * 1.5); // 简单估算
    
    return {
      taskType,
      complexity,
      urgency,
      estimatedTokens
    };
  }

  // 做出Dispatchdecision making
  private makeDispatchDecision(request: UnifiedRequest, analysis: ReturnType<typeof this.analyzeTask>): DispatchDecision {
    const systems = ['mission-control', 'okms', 'openclaw'];
    const taskType = analysis.taskType;
    
    // 计算每 System's得分
    const systemScores = systems.map(system => {
      const performance = this.systemPerformance.get(`${system}:${taskType}`);
      if (!performance) {
        return {
          system,
          score: 0.5, // Default分数
          reason: 'No historical performance data'
        };
      }
      
      // 计算Overall score
      let score = 0;
      
      // 1. Performance得分 (Responsetime)
      const performanceScore = this.calculatePerformanceScore(performance.averageResponseTime);
      score += performanceScore * this.config.performanceWeight;
      
      // 2. reliability得分 (success率)
      const reliabilityScore = performance.successRate;
      score += reliabilityScore * this.config.reliabilityWeight;
      
      // 3. 成本得分 (成本越Low得分越High)
      const costScore = performance.costPerRequest ? 1 / performance.costPerRequest : 1;
      score += costScore * this.config.costWeight;
      
      // 4. Cache得分 (基于历史Cachehit rate)
      const cacheScore = this.calculateCacheScore(system, taskType);
      score += cacheScore * this.config.cacheWeight;
      
      // 5. load balancing考虑
      if (this.config.enableLoadBalancing) {
        const loadScore = this.calculateLoadScore(system);
        score *= loadScore;
      }
      
      return {
        system,
        score,
        reason: `Performance:${performanceScore.toFixed(2)}, reliability:${reliabilityScore.toFixed(2)}, cost:${costScore.toFixed(2)}`
      };
    });
    
    // Sortand选择最佳System
    systemScores.sort((a, b) => b.score - a.score);
    const bestSystem = systemScores[0];
    
    // 确定Execute策略
    let strategy: ExecutionStrategy = this.config.defaultStrategy;
    let reason = '';
    
    if (analysis.urgency === 'high' || request.priority === 'critical') {
      strategy = 'parallel';
      reason = 'High priority task, using parallel execution';
    } else if (analysis.complexity === 'high') {
      strategy = 'fallback';
      reason = 'Complex task, using fallback strategy';
    } else if (bestSystem.score < 0.7 && systemScores[1] && systemScores[1].score > 0.6) {
      strategy = 'optimistic';
      reason = 'Multiple systems performing similarly, using optimistic execution';
    }
    
    // 预估time和成本
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
      alternatives: systemScores.slice(1, 3) // 前3alternatives
    };
  }

  // 计算Performance得分 (Responsetime越短得分越High)
  private calculatePerformanceScore(responseTime: number): number {
    if (responseTime <= 0) return 1.0;
    
    // Responsetimein1s内得1分, 超过5s得0分, 线性插值
    const maxTime = 5000; // 5s
    const score = Math.max(0, 1 - (responseTime / maxTime));
    return Math.min(1, score);
  }

  // 计算Cache得分
  private calculateCacheScore(system: string, taskType: string): number {
    // From历史LogCenter计算Cachehit rate
    const relevantHistory = this.taskHistory.filter(
      task => task.systemUsed === system && task.taskType === taskType
    );
    
    if (relevantHistory.length === 0) return 0.5; // Default
    
    const cacheHits = relevantHistory.filter(task => task.cached).length;
    const cacheRate = cacheHits / relevantHistory.length;
    
    return cacheRate;
  }

  // 计算负载得分
  private calculateLoadScore(system: string): number {
    // 基于最近using频率计算负载
    const now = Date.now();
    const recentTasks = this.taskHistory.filter(
      task => task.systemUsed === system && 
      now - new Date(task.timestamp).getTime() < 60000 // 最近1min
    );
    
    // Task越More, 负载越High, 得分越Low
    const loadFactor = Math.min(1, recentTasks.length / 10); // 最More10 Task/min
    return 1 - (loadFactor * 0.3); // 最More降Low30%得分
  }

  // Execute策略: 乐观Execute (using最佳System)
  private async executeOptimistic(request: UnifiedRequest, decision: DispatchDecision): Promise<UnifiedResponse> {
    const modifiedRequest: UnifiedRequest = {
      ...request,
      system: decision.system as NonNullable<UnifiedRequest['system']>
    };
    
    return await unifiedGatewayservervice.processRequest(modifiedRequest);
  }

  // Execute策略: 顺序Execute (byPriority尝试More System)
  private async executeSequential(request: UnifiedRequest, decision: DispatchDecision): Promise<UnifiedResponse> {
    const systemsToTry = [decision.system, ...decision.alternatives.map(a => a.system)];
    
    for (const system of systemsToTry) {
      try {
        const modifiedRequest: UnifiedRequest = {
          ...request,
          system: system as NonNullable<UnifiedRequest['system']>
        };
        
        const response = await unifiedGatewayservervice.processRequest(modifiedRequest);
        
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn(`System ${system} Executefailed:`, error);
        // 继续尝试下一 System
      }
    }
    
    throw new Error('All systems execution failed');
  }

  // Execute策略: and行Execute (同时尝试More System, 取最快successresult)
  private async executeParallel(request: UnifiedRequest, decision: DispatchDecision): Promise<UnifiedResponse> {
    const systemsToTry = [decision.system, ...decision.alternatives.map(a => a.system)];
    const limitedSystems = systemsToTry.slice(0, this.config.maxParallelTasks);
    
    const promises = limitedSystems.map(async (system) => {
      try {
        const modifiedRequest: UnifiedRequest = {
          ...request,
          system: system as NonNullable<UnifiedRequest['system']>
        };
        
        return await unifiedGatewayservervice.processRequest(modifiedRequest);
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
    
    // usingPromise.race等待第一 success'sresult
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
            reject(new Error('所Alland行Execute都failed'));
          }
        }).catch(() => {
          completed++;
          if (completed === promises.length && !hasSuccess) {
            reject(new Error('所Alland行Execute都failed'));
          }
        });
      });
    });
  }

  // Execute策略: 回退Execute (主Systemfailed时回退to备选)
  private async executeWithFallback(request: UnifiedRequest, decision: DispatchDecision): Promise<UnifiedResponse> {
    try {
      // 首先尝试主System
      const primaryRequest: UnifiedRequest = {
        ...request,
        system: decision.system as NonNullable<UnifiedRequest['system']>
      };
      
      const primaryResponse = await unifiedGatewayservervice.processRequest(primaryRequest);
      
      if (primaryResponse.success) {
        return primaryResponse;
      }
    } catch (error) {
      console.warn(`主System ${decision.system} Executefailed:`, error);
    }
    
    // 主Systemfailed, 尝试第一alternatives
    if (decision.alternatives.length > 0) {
      const fallbackSystem = decision.alternatives[0].system;
      const fallbackRequest: UnifiedRequest = {
        ...request,
        system: fallbackSystem as NonNullable<UnifiedRequest['system']>
      };
      
      return await unifiedGatewayservervice.processRequest(fallbackRequest);
    }
    
    throw new Error('主System和备选System都Executefailed');
  }

  // LogTask历史
  private async recordTaskHistory(
    request: UnifiedRequest, 
    response: UnifiedResponse, 
    decision: DispatchDecision,
    executionTime: number
  ): Promise<void> {
    const history: TaskHistory = {
      taskId: request.id,
      query: request.query.substring(0, 100), // 截断长查询
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
    
    // 限制历史LogLargeSmall
    if (this.taskHistory.length > this.maxHistorySize) {
      this.taskHistory = this.taskHistory.slice(0, this.maxHistorySize);
    }
    
    // LogtoMonitoringSystem
    apiMonitoringservervice.recordMetric({
      endpoint: '/api/v2/dispatcher/dispatch',
      method: 'POST',
      responseTime: executionTime,
      statusCode: response.success ? 200 : 500,
      success: response.success,
      userId: request.userId
    });
    
    // LogtoDispatch器MonitoringSystem
    dispatcherMonitoringservervice.recordTaskExecution(history);
  }

  // UpdateSystemPerformance
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
    
    //    // UpdateSystemPerformancedata
    current.totalRequests += 1;
    current.successfulRequests += response.success ? 1 : 0;
    
    // Update平均Responsetime (指数move平均)
    const alpha = 0.3; // 平滑因子
    current.averageResponseTime = alpha * executionTime + (1 - alpha) * current.averageResponseTime;
    
    // Updated successfully率
    current.successRate = current.successfulRequests / current.totalRequests;
    current.lastUsed = new Date().toISOString();
    
    this.systemPerformance.set(key, current);
  }

  // FetchTask历史
  getTaskHistory(limit = 50): TaskHistory[] {
    return this.taskHistory.slice(0, limit);
  }

  // FetchSystemPerformanceReport
  getSystemPerformanceReport(): SystemPerformance[] {
    return Array.from(this.systemPerformance.values());
  }

  // FetchDispatchStatistics
  getDispatchStats(): { totalTasks: number; successfulTasks: number; successRate: number; cachedTasks: number; cacheRate: number; averageExecutionTime: number; systemStats: Record<string, { total: number; successful: number; averageTime: number; totalTime: number }>; taskTypeStats: Record<string, { total: number; successful: number }>; lastUpdated: string } {
    const totalTasks = this.taskHistory.length;
    const successfulTasks = this.taskHistory.filter(t => t.success).length;
    const cachedTasks = this.taskHistory.filter(t => t.cached).length;
    
    // bySystemStatistics
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
    
    // byTaskTypeStatistics
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

  // Clear历史Log (用于Test)
  clearHistory(): void {
    this.taskHistory = [];
    this.initializeSystemPerformance();
  }

  // UpdateConfiguration
  updateConfig(newConfig: Partial<DispatchConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // FetchCurrentConfiguration
  getConfig(): DispatchConfig {
    return { ...this.config };
  }
}

// Export单例实例
export const intelligentTaskDispatcher = new IntelligentTaskDispatcher();