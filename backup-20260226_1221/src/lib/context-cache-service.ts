/**
 * 上下文智能缓存服务
 * 提供智能缓存管理，支持TTL、LRU淘汰、缓存统计等功能
 */

export interface CacheItem {
  value: any;
  timestamp: number;
  ttl?: number; // 生存时间（秒）
  accessCount: number;
  lastAccessed: number;
}

export class ContextCacheService {
  private cache: Map<string, CacheItem>;
  private maxSize: number;
  private stats: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    evictions: number;
  };

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }

  // 设置缓存
  set(key: string, value: any, ttl?: number): void {
    // 检查是否需要淘汰
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    });

    this.stats.sets++;
  }

  // 获取缓存
  get(key: string): any {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return undefined;
    }

    // 检查是否过期
    if (item.ttl && Date.now() - item.timestamp > item.ttl * 1000) {
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // 更新访问统计
    item.accessCount++;
    item.lastAccessed = Date.now();
    
    this.stats.hits++;
    return item.value;
  }

  // 删除缓存
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  // 清空缓存
  clear(): number {
    const size = this.cache.size;
    this.cache.clear();
    return size;
  }

  // 获取所有缓存键
  getAllKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // 获取缓存状态
  getCacheStatus(): any {
    const now = Date.now();
    const items = Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      age: Math.floor((now - item.timestamp) / 1000),
      ttl: item.ttl,
      accessCount: item.accessCount,
      lastAccessed: Math.floor((now - item.lastAccessed) / 1000),
      expired: item.ttl ? (now - item.timestamp > item.ttl * 1000) : false
    }));

    return {
      status: 'healthy',
      service: 'context-cache-service',
      timestamp: new Date().toISOString(),
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: Math.round((this.cache.size / this.maxSize) * 100),
      stats: this.stats,
      items: items.slice(0, 50) // 只返回前50个
    };
  }

  // 获取缓存统计
  getCacheStats(): any {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? Math.round((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100) 
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      totalOperations: this.stats.hits + this.stats.misses + this.stats.sets + this.stats.deletes,
      cacheSize: this.cache.size,
      maxSize: this.maxSize
    };
  }

  // LRU淘汰算法
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < lruTime) {
        lruTime = item.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
    }
  }

  // 清理过期缓存
  cleanupExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.ttl && now - item.timestamp > item.ttl * 1000) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// 导出单例实例
export const contextCacheService = new ContextCacheService();