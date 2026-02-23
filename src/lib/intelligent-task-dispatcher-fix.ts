// 智能分发系统缓存集成修复

import { unifiedGatewayService, UnifiedRequest, UnifiedResponse } from './unified-gateway-service';
import { intelligentTaskDispatcher } from './intelligent-task-dispatcher';

// 缓存统计
interface CacheStats {
  hits: number;
  misses: number;
  total: number;
  hitRate: number;
  size: number;
}

// 增强的智能分发器，修复缓存集成问题
class EnhancedIntelligentTaskDispatcher {
  private cache: Map<string, { response: UnifiedResponse; timestamp: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5分钟缓存
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    total: 0,
    hitRate: 0,
    size: 0
  };
  
  // 增强的dispatchTask方法，集成缓存
  async dispatchTaskWithCache(request: UnifiedRequest): Promise<UnifiedResponse> {
    const startTime = Date.now();
    
    try {
      // 1. 检查缓存
      const cacheKey = this.generateCacheKey(request);
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
        // 更新统计
        this.stats.hits++;
        this.stats.total++;
        this.stats.hitRate = this.stats.hits / this.stats.total;
        
        // 返回缓存响应，更新响应时间
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
              reason: '缓存命中',
              confidence: 1.0,
              estimatedTime: Date.now() - startTime,
              estimatedCost: 0.1,
              alternatives: []
            }
          },
          timestamp: new Date().toISOString()
        };
        
        console.log(`🎯 缓存命中: ${cacheKey}`);
        return cachedResponse;
      }
      
      // 2. 使用原始智能分发器处理
      const response = await intelligentTaskDispatcher.dispatchTask(request);
      
      // 更新统计
      this.stats.misses++;
      this.stats.total++;
      this.stats.hitRate = this.stats.hits / this.stats.total;
      
      // 3. 缓存响应
      if (response.success) {
        const responseToCache = {
          ...response,
          data: {
            ...response.data,
            cached: false // 原始响应不是缓存
          }
        };
        
        this.cache.set(cacheKey, {
          response: responseToCache,
          timestamp: Date.now()
        });
        
        this.stats.size = this.cache.size;
        
        // 限制缓存大小
        if (this.cache.size > 100) {
          const oldestKey = Array.from(this.cache.keys())[0];
          this.cache.delete(oldestKey);
          this.stats.size = this.cache.size;
        }
      }
      
      return response;
      
    } catch (error) {
      console.error('增强分发失败:', error);
      return await unifiedGatewayService.processRequest(request);
    }
  }
  
  // 生成缓存键
  private generateCacheKey(request: UnifiedRequest): string {
    const keyParts = [
      request.query.toLowerCase().replace(/\s+/g, '_').substring(0, 100),
      request.priority || 'medium',
      request.system || 'auto'
    ];
    
    // 添加任务类型识别
    if (request.context?.queryType) {
      keyParts.push(request.context.queryType);
    }
    
    return keyParts.join('|');
  }
  
  // 获取缓存统计
  getCacheStats(): CacheStats {
    return {
      ...this.stats,
      size: this.cache.size
    };
  }
  
  // 清空缓存
  clearCache(): void {
    this.cache.clear();
  }
}

// 导出增强实例
export const enhancedIntelligentDispatcher = new EnhancedIntelligentTaskDispatcher();