// 统一API网Offservervice
import { Redis } from 'ioredis';
import { apiMonitoringservervice } from './api-monitoring-service';

// SystemType定义
export type SystemType = 'mission-control' | 'okms' | 'openclaw' | 'auto';

// TaskCategory定义
export type TaskType = 'code' | 'knowledge' | 'skill' | 'mixed';

// 统一RequestInterface
export interface UnifiedRequest {
  id: string;
  query: string;
  system?: SystemType; // 指定Systemor自动选择
  priority?: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>; // 上下文information
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// 统一ResponseInterface
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
  suggestions?: string[]; // 后续建议
}

// Cache项Interface
interface CacheItem {
  queryVector: number[];
  response: UnifiedResponse;
  timestamp: string;
  usageCount: number;
  lastUsed: string;
}

// TaskCategory器
class TaskClassifier {
  // code相OffOff键词
  private codeKeywords = [
    'code', 'Development', '编程', '前端', '后端', 'API', 'function', 'class', 'Interface',
    'Component', '页面', 'route', 'data库', 'Deployment', '构建', 'Test', 'Debug',
    'bug', 'error', '修复', 'optimize', '重构', '架构', '设计模式'
  ];

  // 知识相OffOff键词  
  private knowledgeKeywords = [
    '知识', 'document', '学习', '研究', '查询', 'Search', 'information', '资料',
    '教程', 'guide', '最佳实践', '经验', '历史', 'Log', 'Archived',
    '总结', 'Analytics', 'Report', 'Statistics', 'data', 'content'
  ];

  // Skill相OffOff键词
  private skillKeywords = [
    'Execute', '运行', '操作', 'Tool', 'Skill', '命令', 'Script', 'Automation',
    'Workflow', 'Task', '计划', '定时', 'Monitoring', 'Alert', 'Notification', 'Send',
    'Create', 'Delete', 'Update', 'modify', 'Configuration', 'Settings', 'Install', 'Deployment'
  ];

  // CategoryTask
  classify(query: string): TaskType {
    const lowerQuery = query.toLowerCase();
    
    // StatisticsOff键词匹配
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

    // 确定主need toType
    const scores = [
      { type: 'code' as TaskType, score: codeScore },
      { type: 'knowledge' as TaskType, score: knowledgeScore },
      { type: 'skill' as TaskType, score: skillScore }
    ];

    scores.sort((a, b) => b.score - a.score);
    
    // if最High分>0且明显High于Other, 返回该Type
    if (scores[0].score > 0 && scores[0].score > scores[1].score * 1.5) {
      return scores[0].type;
    }

    // Nothen返回混合Type
    return 'mixed';
  }

  // 根据TaskType选择System
  selectSystem(taskType: TaskType): SystemType {
    switch (taskType) {
      case 'code':
        return 'mission-control';
      case 'knowledge':
        return 'okms';
      case 'skill':
        return 'openclaw';
      case 'mixed':
        return 'auto'; // 自动Dispatch
      default:
        return 'mission-control';
    }
  }
}

// 统一API网Offservervice
export class UnifiedGatewayservervice {
  private redis: Redis;
  private classifier: TaskClassifier;
  private cacheEnabled = true;
  private cacheTTL = 3600; // 1Small时Cache
  
  // CacheStatistics
  cacheHits: number;
  cacheMisses: number;

  constructor() {
    // InitializeRedisConnect
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.classifier = new TaskClassifier();
    
    // InitializeCacheStatistics
    this.cacheHits = 0;
    this.cacheMisses = 0;

    // 监听RedisConnectStatus
    this.redis.on('connect', () => {
      console.log('✅ RedisConnectsuccess - 统一API网OffCacheenabled');
    });

    this.redis.on('error', (error) => {
      console.error('❌ RedisConnecterror:', error);
      this.cacheEnabled = false;
    });
  }

  // Process统一Request
  async processRequest(request: UnifiedRequest): Promise<UnifiedResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Check cache
      let cachedResponse = await this.getCachedResponse(request);
      if (cachedResponse) {
        cachedResponse.cached = true;
        cachedResponse.responseTime = Date.now() - startTime;
        return cachedResponse;
      }

      // 2. CategoryTask
      const taskType = this.classifier.classify(request.query);
      
      // 3. 选择System(ifUnassigned)
      const targetSystem = request.system || this.classifier.selectSystem(taskType);

      // 4. Dispatchtofor应System
      let responseData;
      let sourceSystem: SystemType = targetSystem;

      if (targetSystem === 'auto') {
        // 自动Dispatch: 根据TaskType选择最优System
        responseData = await this.distributeToOptimalSystem(request, taskType);
        sourceSystem = 'auto';
      } else {
        // 指定SystemDispatch
        responseData = await this.distributeToSystem(request, targetSystem);
      }

      // 5. 构建Response
      const response: UnifiedResponse = {
        success: true,
        data: responseData,
        source: sourceSystem,
        taskType,
        cached: false,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

      // 6. Cache response
      await this.cacheResponse(request, response);

      // 7. LogMonitoringmetrics
      this.recordMetrics(request, response);

      return response;

    } catch (error) {
      console.error('Unified GatewayProcesserror:', error);
      
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

  // Dispatchto最优System(自动模式)
  private async distributeToOptimalSystem(request: UnifiedRequest, taskType: TaskType): Promise<any> {
    // 根据TaskTypeand行调用相OffSystem
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

    // and行Execute, 取第一 success'sresult
    const results = await Promise.allSettled(promises);
    
    // 优先选择success'sResponse
    for (const result of results) {
      if (result.status === 'fulfilled') {
        return result.value;
      }
    }

    // if都failed, 返回error
    throw new Error('所AllSystem调用failed');
  }

  // Dispatchto指定System
  private async distributeToSystem(request: UnifiedRequest, system: SystemType): Promise<any> {
    switch (system) {
      case 'mission-control':
        return await this.callMissionControl(request);
      case 'okms':
        return await this.callOKMS(request);
      case 'openclaw':
        return await this.callOpenClaw(request);
      default:
        throw new Error(`UnknownSystem: ${system}`);
    }
  }

  // 调用Mission Control
  private async callMissionControl(request: UnifiedRequest): Promise<any> {
    try {
      // 调用Mission Control生态SystemAPI
      const response = await fetch('http://localhost:3001/api/ecosystem/status?format=json');
      if (!response.ok) {
        throw new Error(`Mission Control APIerror: ${response.status}`);
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
      console.error('调用Mission Controlfailed:', error);
      // 回退to模拟data
      return {
        system: 'mission-control',
        action: 'processed',
        query: request.query,
        result: 'Mission ControlProcessCompleted (模拟)',
        timestamp: new Date().toISOString(),
        source: 'fallback'
      };
    }
  }

  // 调用OKMS
  private async callOKMS(request: UnifiedRequest): Promise<any> {
    try {
      // 调用OKMSSearchAPI
      const response = await fetch('http://localhost:8000/api/v1/search?q=' + encodeURIComponent(request.query));
      if (!response.ok) {
        throw new Error(`OKMS APIerror: ${response.status}`);
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
      console.error('调用OKMSfailed:', error);
      // 回退to模拟data
      return {
        system: 'okms',
        action: 'knowledge-retrieved',
        query: request.query,
        knowledge: '相Off知识点检索Completed (模拟)',
        timestamp: new Date().toISOString(),
        source: 'fallback'
      };
    }
  }

  // 调用OpenClaw
  private async callOpenClaw(request: UnifiedRequest): Promise<any> {
    try {
      // 这里should调用OpenClaw'sAPI
      // due toOpenClawYesLocalservervice, 暂时using模拟data
      // 实际should调用OpenClaw'sSkillExecuteAPI
      return {
        system: 'openclaw',
        action: 'skill-executed',
        query: request.query,
        result: 'OpenClawSkillExecuteCompleted (need toConfigurationAPI)',
        timestamp: new Date().toISOString(),
        source: 'simulated',
        note: 'need toConfigurationOpenClaw APIendpoint'
      };
    } catch (error) {
      console.error('调用OpenClawfailed:', error);
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

  // Cache管理
  private async getCachedResponse(request: UnifiedRequest): Promise<UnifiedResponse | null> {
    if (!this.cacheEnabled) return null;

    try {
      const cacheKey = `unified:${request.query.substring(0, 100)}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        const parsed = JSON.parse(cached) as UnifiedResponse;
        
        // Check cachewhether itexpired(基于using频率)
        const cacheAge = Date.now() - new Date(parsed.timestamp).getTime();
        const maxAge = this.cacheTTL * 1000; // convertfor毫s
        
        if (cacheAge < maxAge) {
          // Update最后usingtime
          await this.redis.expire(cacheKey, this.cacheTTL);
          this.cacheHits++;
          return parsed;
        } else {
          // Cacheexpired, Delete
          await this.redis.del(cacheKey);
          this.cacheMisses++;
        }
      } else {
        this.cacheMisses++;
      }
    } catch (error) {
      console.warn('Cache读取failed:', error);
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
      console.warn('Cache写入failed:', error);
    }
  }

  // LogMonitoringmetrics
  private recordMetrics(request: UnifiedRequest, response: UnifiedResponse): void {
    apiMonitoringservervice.recordMetric({
      endpoint: '/api/v1/unified/process',
      method: 'POST',
      responseTime: response.responseTime,
      statusCode: response.success ? 200 : 500,
      success: response.success,
      userId: request.userId
    });
  }

  // FetchCacheStatistics
  async getCacheStats(): Promise<any> {
    if (!this.cacheEnabled) {
      return { enabled: false, message: 'Cache未enabled' };
    }

    try {
      const keys = await this.redis.keys('unified:*');
      const totalSize = keys.length;
      
      // Fetch一些CacheExample
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

  // ClearCache
  async clearCache(): Promise<boolean> {
    if (!this.cacheEnabled) return false;

    try {
      const keys = await this.redis.keys('unified:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('ClearCachefailed:', error);
      return false;
    }
  }

  // CloseConnect
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Export单例实例
export const unifiedGatewayservervice = new UnifiedGatewayservervice();