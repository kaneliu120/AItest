// 智canDispatchSystemCache集成修复

import { unifiedGatewayservervice, UnifiedRequest, UnifiedResponse } from './unified-gateway-service';
import { intelligentTaskDispatcher } from './intelligent-task-dispatcher';

// CacheStatistics
interface CacheStats {
  hits: number;
  misses: number;
  total: number;
  hitRate: number;
  size: number;
}

// 增强's智canDispatch器, 修复Cache集成问题
class EnhancedIntelligentTaskDispatcher {
  private cache: Map<string, { response: UnifiedResponse; timestamp: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5minCache
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    total: 0,
    hitRate: 0,
    size: 0
  };
  
  // 增强'sdispatchTaskmethod, 集成Cache
  async dispatchTaskWithCache(request: UnifiedRequest): Promise<UnifiedResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Check cache
      const cacheKey = this.generateCacheKey(request);
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
        // UpdateStatistics
        this.stats.hits++;
        this.stats.total++;
        this.stats.hitRate = this.stats.hits / this.stats.total;
        
        // 返回Cache response, UpdateResponsetime
        const cachedResponse = {
          ...cached.response,
          data: {
            ...cached.response.data,
            responseTime: Date.now() - startTime,
            cached: true,
            system: cached.response.data.system || 'cached',
            dispatchDecision: cached.response.data.dispatchDecision || {
              system: 'cached',
              strategy: 'cache',
              reason: 'Cache命Center',
              confidence: 1.0,
              estimatedTime: Date.now() - startTime,
              estimatedCost: 0.1,
              alternatives: []
            }
          },
          timestamp: new Date().toISOString()
        };
        
        console.log(`🎯 Cache命Center: ${cacheKey}`);
        return cachedResponse;
      }
      
      // 2. using原始智canDispatch器Process
      const response = await intelligentTaskDispatcher.dispatchTask(request);
      
      // UpdateStatistics
      this.stats.misses++;
      this.stats.total++;
      this.stats.hitRate = this.stats.hits / this.stats.total;
      
      // 3. Cache response
      if (response.success) {
        const responseToCache = {
          ...response,
          data: {
            ...response.data,
            cached: false // 原始Response不YesCache
          }
        };
        
        this.cache.set(cacheKey, {
          response: responseToCache,
          timestamp: Date.now()
        });
        
        this.stats.size = this.cache.size;
        
        // 限制CacheLargeSmall
        if (this.cache.size > 100) {
          const oldestKey = Array.from(this.cache.keys())[0];
          this.cache.delete(oldestKey);
          this.stats.size = this.cache.size;
        }
      }
      
      return response;
      
    } catch (error) {
      console.error('增强Dispatchfailed:', error);
      return await unifiedGatewayservervice.processRequest(request);
    }
  }
  
  // GenerateCache键
  private generateCacheKey(request: UnifiedRequest): string {
    const keyParts = [
      request.query.toLowerCase().replace(/\s+/g, '_').substring(0, 100),
      request.priority || 'medium',
      request.system || 'auto'
    ];
    
    // AddTaskType识别
    if (request.context?.queryType) {
      keyParts.push(request.context.queryType);
    }
    
    return keyParts.join('|');
  }
  
  // FetchCacheStatistics
  getCacheStats(): CacheStats {
    return {
      ...this.stats,
      size: this.cache.size
    };
  }
  
  // ClearCache
  clearCache(): void {
    this.cache.clear();
  }
}

// Export增强实例
export const enhancedIntelligentDispatcher = new EnhancedIntelligentTaskDispatcher();