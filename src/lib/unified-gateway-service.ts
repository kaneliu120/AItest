// 统一API网关服务
import { Redis } from 'ioredis';
import { apiMonitoringService } from './api-monitoring-service';

// 系统类型定义
export type SystemType = 'mission-control' | 'okms' | 'openclaw' | 'auto';

// 任务分类定义
export type TaskType = 'code' | 'knowledge' | 'skill' | 'mixed';

// 统一请求接口
export interface UnifiedRequest {
  id: string;
  query: string;
  system?: SystemType; // specify system or auto-select
  priority?: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>; // context information
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// 统一响应接口
export interface UnifiedResponse {
  success: boolean;
  data: any;
  source: SystemType;
  taskType: TaskType;
  cached: boolean;
  responseTime: number;
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  timestamp: string;
  suggestions?: string[]; // follow-up suggestions
}

// 缓存项接口
interface CacheItem {
  queryVector: number[];
  response: UnifiedResponse;
  timestamp: string;
  usageCount: number;
  lastUsed: string;
}

// 任务分类器
class TaskClassifier {
  // 代码相关关键词
  private codeKeywords = [
    '代码', '开发', '编程', '前端', '后端', 'API', '函数', '类', '接口',
    '组件', '页面', '路由', '数据库', '部署', '构建', '测试', '调试',
    'bug', '错误', '修复', '优化', '重构', '架构', '设计模式'
  ];

  // 知识相关关键词  
  private knowledgeKeywords = [
    '知识', '文档', '学习', '研究', '查询', '搜索', '信息', '资料',
    '教程', '指南', '最佳实践', '经验', '历史', '记录', '归档',
    '总结', '分析', '报告', '统计', '数据', '内容'
  ];

  // 技能相关关键词
  private skillKeywords = [
    '执行', '运行', '操作', '工具', '技能', '命令', '脚本', '自动化',
    '工作流', '任务', '计划', '定时', '监控', '告警', '通知', '发送',
    '创建', '删除', '更新', '修改', '配置', '设置', '安装', '部署'
  ];

  // 分类任务
  classify(query: string): TaskType {
    const lowerQuery = query.toLowerCase();
    
    // 统计关键词匹配
    let codeScore = 0;
    let knowledgeScore = 0;
    let skillScore = 0;

    this.codeKeywords.forEach(keyword => {
      if (lowerQuery.includes(keyword.toLowerCase())) codeScore++;
    });

    this.knowledgeKeywords.forEach(keyword => {
      if (lowerQuery.includes(keyword.toLowerCase())) knowledgeScore++;
    });

    this.skillKeywords.forEach(keyword => {
      if (lowerQuery.includes(keyword.toLowerCase())) skillScore++;
    });

    // 确定主要类型
    const scores = [
      { type: 'code' as TaskType, score: codeScore },
      { type: 'knowledge' as TaskType, score: knowledgeScore },
      { type: 'skill' as TaskType, score: skillScore }
    ];

    scores.sort((a, b) => b.score - a.score);
    
    // 如果最高分>0且明显高于其他，返回该类型
    if (scores[0].score > 0 && scores[0].score > scores[1].score * 1.5) {
      return scores[0].type;
    }

    // 否则返回混合类型
    return 'mixed';
  }

  // 根据任务类型选择系统
  selectSystem(taskType: TaskType): SystemType {
    switch (taskType) {
      case 'code':
        return 'mission-control';
      case 'knowledge':
        return 'okms';
      case 'skill':
        return 'openclaw';
      case 'mixed':
        return 'auto'; // auto-dispatch
      default:
        return 'mission-control';
    }
  }
}

// 统一API网关服务
export class UnifiedGatewayService {
  private redis: Redis;
  private classifier: TaskClassifier;
  private cacheEnabled = true;
  private cacheTTL = 3600; // 1-hour cache
  
  // 缓存统计
  cacheHits: number;
  cacheMisses: number;

  constructor() {
    // 初始化Redis连接
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.classifier = new TaskClassifier();
    
    // 初始化缓存统计
    this.cacheHits = 0;
    this.cacheMisses = 0;

    // 监听Redis连接状态
    this.redis.on('connect', () => {
      console.log('✅ Redis connected - unified API gateway cache enabled');
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
      this.cacheEnabled = false;
    });
  }

  // Process unified request
  async processRequest(request: UnifiedRequest): Promise<UnifiedResponse> {
    const startTime = Date.now();
    
    try {
      // 1. 检查缓存
      let cachedResponse = await this.getCachedResponse(request);
      if (cachedResponse) {
        cachedResponse.cached = true;
        cachedResponse.responseTime = Date.now() - startTime;
        return cachedResponse;
      }

      // 2. 分类任务
      const taskType = this.classifier.classify(request.query);
      
      // 3. 选择系统（如果未指定）
      const targetSystem = request.system || this.classifier.selectSystem(taskType);

      // 4. 分发到对应系统
      let responseData;
      let sourceSystem: SystemType = targetSystem;

      if (targetSystem === 'auto') {
        // 自动分发：根据任务类型选择最优系统
        responseData = await this.distributeToOptimalSystem(request, taskType);
        sourceSystem = 'auto';
      } else {
        // 指定系统分发
        responseData = await this.distributeToSystem(request, targetSystem);
      }

      // 5. 构建响应
      const response: UnifiedResponse = {
        success: true,
        data: responseData,
        source: sourceSystem,
        taskType,
        cached: false,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

      // 6. 缓存响应
      await this.cacheResponse(request, response);

      // 7. 记录监控指标
      this.recordMetrics(request, response);

      return response;

    } catch (error) {
      console.error('Unified gateway processing error:', error);
      
      return {
        success: false,
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          requestId: request.id
        },
        source: request.system || 'mission-control',
        taskType: this.classifier.classify(request.query),
        cached: false,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  // 分发到最优系统（自动模式）
  private async distributeToOptimalSystem(request: UnifiedRequest, taskType: TaskType): Promise<any> {
    // 根据任务类型并行调用相关系统
    const promises: Promise<any>[] = [];
    
    if (taskType === 'code' || taskType === 'mixed') {
      promises.push(this.callMissionControl(request));
    }
    
    if (taskType === 'knowledge' || taskType === 'mixed') {
      promises.push(this.callOKMS(request));
    }
    
    if (taskType === 'skill' || taskType === 'mixed') {
      promises.push(this.callOpenClaw(request));
    }

    // 并行执行，取第一个成功的结果
    const results = await Promise.allSettled(promises);
    
    // 优先选择成功的响应
    for (const result of results) {
      if (result.status === 'fulfilled') {
        return result.value;
      }
    }

    // 如果都失败，返回错误
    throw new Error('All system calls failed');
  }

  // 分发到指定系统
  private async distributeToSystem(request: UnifiedRequest, system: SystemType): Promise<any> {
    switch (system) {
      case 'mission-control':
        return await this.callMissionControl(request);
      case 'okms':
        return await this.callOKMS(request);
      case 'openclaw':
        return await this.callOpenClaw(request);
      default:
        throw new Error(`Unknown system: ${system}`);
    }
  }

  // 调用Mission Control
  private async callMissionControl(request: UnifiedRequest): Promise<any> {
    try {
      // 调用Mission Control生态系统API
      const response = await fetch('http://localhost:3001/api/ecosystem/status?format=json');
      if (!response.ok) {
        throw new Error(`Mission Control API error: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        system: 'mission-control',
        action: 'ecosystem-status',
        query: request.query,
        data: data.data,
        timestamp: new Date().toISOString(),
        source: 'real-api'
      };
    } catch (error) {
      console.error('Mission Control call failed:', error);
      // 回退到模拟数据
      return {
        system: 'mission-control',
        action: 'processed',
        query: request.query,
        result: 'Mission Control processing complete (simulated)',
        timestamp: new Date().toISOString(),
        source: 'fallback'
      };
    }
  }

  // 调用OKMS
  private async callOKMS(request: UnifiedRequest): Promise<any> {
    try {
      // 调用OKMS搜索API
      const response = await fetch('http://localhost:8000/api/v1/search?q=' + encodeURIComponent(request.query));
      if (!response.ok) {
        throw new Error(`OKMS API error: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        system: 'okms',
        action: 'knowledge-retrieved',
        query: request.query,
        data: data,
        timestamp: new Date().toISOString(),
        source: 'real-api'
      };
    } catch (error) {
      console.error('OKMS call failed:', error);
      // 回退到模拟数据
      return {
        system: 'okms',
        action: 'knowledge-retrieved',
        query: request.query,
        knowledge: 'Related knowledge retrieval complete (simulated)',
        timestamp: new Date().toISOString(),
        source: 'fallback'
      };
    }
  }

  // 调用OpenClaw
  private async callOpenClaw(request: UnifiedRequest): Promise<any> {
    try {
      // 这里应该调用OpenClaw的API
      // 由于OpenClaw是本地服务，暂时使用模拟数据
      // 实际应该调用OpenClaw的技能执行API
      return {
        system: 'openclaw',
        action: 'skill-executed',
        query: request.query,
        result: 'OpenClaw skill execution complete (API configuration required)',
        timestamp: new Date().toISOString(),
        source: 'simulated',
        note: 'OpenClaw API endpoint configuration required'
      };
    } catch (error) {
      console.error('OpenClaw call failed:', error);
      return {
        system: 'openclaw',
        action: 'error',
        query: request.query,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        source: 'error'
      };
    }
  }

  // 缓存管理
  private async getCachedResponse(request: UnifiedRequest): Promise<UnifiedResponse | null> {
    if (!this.cacheEnabled) return null;

    try {
      const cacheKey = `unified:${request.query.substring(0, 100)}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        const parsed = JSON.parse(cached) as UnifiedResponse;
        
        // 检查缓存是否过期（基于使用频率）
        const cacheAge = Date.now() - new Date(parsed.timestamp).getTime();
        const maxAge = this.cacheTTL * 1000; // convert to ms
        
        if (cacheAge < maxAge) {
          // 更新最后使用时间
          await this.redis.expire(cacheKey, this.cacheTTL);
          this.cacheHits++;
          return parsed;
        } else {
          // 缓存过期，删除
          await this.redis.del(cacheKey);
          this.cacheMisses++;
        }
      } else {
        this.cacheMisses++;
      }
    } catch (error) {
      console.warn('Cache read failed:', error);
    }

    return null;
  }

  private async cacheResponse(request: UnifiedRequest, response: UnifiedResponse): Promise<void> {
    if (!this.cacheEnabled) return;

    try {
      const cacheKey = `unified:${request.query.substring(0, 100)}`;
      const cacheValue = JSON.stringify(response);
      
      await this.redis.setex(cacheKey, this.cacheTTL, cacheValue);
    } catch (error) {
      console.warn('Cache write failed:', error);
    }
  }

  // 记录监控指标
  private recordMetrics(request: UnifiedRequest, response: UnifiedResponse): void {
    apiMonitoringService.recordMetric({
      endpoint: '/api/v1/unified/process',
      method: 'POST',
      responseTime: response.responseTime,
      statusCode: response.success ? 200 : 500,
      success: response.success,
      userId: request.userId
    });
  }

  // Get cache statistics
  async getCacheStats(): Promise<any> {
    if (!this.cacheEnabled) {
      return { enabled: false, message: 'Cache not enabled' };
    }

    try {
      const keys = await this.redis.keys('unified:*');
      const totalSize = keys.length;
      
      // 获取一些缓存示例
      const sampleKeys = keys.slice(0, 5);
      const samples = [];
      
      for (const key of sampleKeys) {
        const value = await this.redis.get(key);
        if (value) {
          const parsed = JSON.parse(value);
          samples.push({
            key: key.substring(0, 50) + '...',
            timestamp: parsed.timestamp,
            taskType: parsed.taskType
          });
        }
      }

      return {
        enabled: true,
        totalCachedItems: totalSize,
        cacheTTL: this.cacheTTL,
        sampleItems: samples,
        cacheHits: this.cacheHits,
        cacheMisses: this.cacheMisses,
        hitRate: this.cacheHits + this.cacheMisses > 0 
          ? `${((this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100).toFixed(1)}%`
          : '0%'
      };
    } catch (error) {
      return { enabled: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 清空缓存
  async clearCache(): Promise<boolean> {
    if (!this.cacheEnabled) return false;

    try {
      const keys = await this.redis.keys('unified:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache flush failed:', error);
      return false;
    }
  }

  // 关闭连接
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// 导出单例实例
export const unifiedGatewayService = new UnifiedGatewayService();