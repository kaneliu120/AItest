// 上下文智能缓存系统

import { UnifiedRequest, UnifiedResponse } from './unified-gateway-service';
import { logger } from './logger';

// 缓存项元数据
export interface CacheItemMetadata {
  query: string;
  context: Record<string, unknown>;
  taskType: string;
  system: string;
  priority: string;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  similarityScore?: number; // context similarity score
  relevanceScore?: number; // relevance score
  confidence?: number; // confidence score
}

// 缓存项
export interface CacheItem {
  key: string;
  response: UnifiedResponse;
  metadata: CacheItemMetadata;
  ttl: number; // time-to-live (ms)
}

// 上下文特征
export interface ContextFeatures {
  keywords: string[];
  entities: string[]; // entity recognition
  intent: string; // query intent
  domain: string; // domain category
  complexity: number; // complexity score 0-1
  urgency: number; // urgency score 0-1
}

// 相似度配置
export interface SimilarityConfig {
  semanticWeight: number; // semantic weight 0-1
  keywordWeight: number; // keyword weight 0-1
  contextWeight: number; // context weight 0-1
  taskTypeWeight: number; // task type weight 0-1
  minSimilarity: number; // minimum similarity threshold
  maxAlternatives: number; // maximum number of alternatives
}

// 缓存策略
export interface CacheStrategy {
  name: string;
  ttl: number; // time-to-live
  maxSize: number; // maximum cache entries
  evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'random';
  similarityThreshold: number; // similarity threshold
  enablePartialMatch: boolean; // whether to enable partial matching
  enableContextAware: boolean; // whether to enable context awareness
  maxAlternatives?: number; // maximum number of alternatives
}

class ContextAwareCacheService {
  private cache: Map<string, CacheItem> = new Map();
  private strategies: Map<string, CacheStrategy> = new Map();
  private defaultStrategy: CacheStrategy;
  private similarityConfig: SimilarityConfig;
  
  // 统计
  private stats = {
    hits: 0,
    misses: 0,
    semanticHits: 0, // semantic match hits
    partialHits: 0, // partial match hits
    evictions: 0,
    totalSize: 0,
    averageResponseTime: 0
  };

  constructor() {
    // 默认相似度配置
    this.similarityConfig = {
      semanticWeight: 0.4,
      keywordWeight: 0.3,
      contextWeight: 0.2,
      taskTypeWeight: 0.1,
      minSimilarity: 0.7,
      maxAlternatives: 3
    };

    // 默认缓存策略
    this.defaultStrategy = {
      name: 'default',
      ttl: 10 * 60 * 1000, // 10 minutes
      maxSize: 1000,
      evictionPolicy: 'lru',
      similarityThreshold: 0.8,
      enablePartialMatch: true,
      enableContextAware: true
    };

    // 预定义策略
    this.strategies.set('default', this.defaultStrategy);
    this.strategies.set('short-term', {
      name: 'short-term',
      ttl: 2 * 60 * 1000, // 2 minutes
      maxSize: 500,
      evictionPolicy: 'lru',
      similarityThreshold: 0.9,
      enablePartialMatch: false,
      enableContextAware: true
    });
    this.strategies.set('long-term', {
      name: 'long-term',
      ttl: 60 * 60 * 1000, // 1 hour
      maxSize: 2000,
      evictionPolicy: 'lfu',
      similarityThreshold: 0.7,
      enablePartialMatch: true,
      enableContextAware: true
    });
    this.strategies.set('critical', {
      name: 'critical',
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 100,
      evictionPolicy: 'lfu',
      similarityThreshold: 0.95,
      enablePartialMatch: false,
      enableContextAware: false
    });
  }

  // 获取缓存 (上下文感知)
  async getWithContext(request: UnifiedRequest, strategyName = 'default'): Promise<{
    cached: boolean;
    response?: UnifiedResponse;
    similarity?: number;
    matchType?: 'exact' | 'semantic' | 'partial' | 'none';
    alternatives?: Array<{ item: CacheItem; similarity: number }>;
  }> {
    const strategy = this.strategies.get(strategyName) || this.defaultStrategy;
    const startTime = Date.now();

    try {
      // 1. 精确匹配
      const exactKey = this.generateExactKey(request);
      const exactItem = this.cache.get(exactKey);
      
      if (exactItem && !this.isExpired(exactItem)) {
        // 更新访问统计
        exactItem.metadata.accessCount++;
        exactItem.metadata.lastAccessed = Date.now();
        
        this.stats.hits++;
        this.updateStats(Date.now() - startTime);
        
        return {
          cached: true,
          response: exactItem.response,
          similarity: 1.0,
          matchType: 'exact'
        };
      }

      // 2. 上下文感知匹配 (如果启用)
      if (strategy.enableContextAware) {
        const contextMatch = await this.findContextMatch(request, strategy);
        
        if (contextMatch.cached) {
          this.stats.semanticHits++;
          this.stats.hits++;
          this.updateStats(Date.now() - startTime);
          
          return {
            cached: true,
            response: contextMatch.response,
            similarity: contextMatch.similarity,
            matchType: contextMatch.matchType,
            alternatives: contextMatch.alternatives
          };
        }
      }

      // 3. 部分匹配 (如果启用)
      if (strategy.enablePartialMatch) {
        const partialMatch = await this.findPartialMatch(request, strategy);
        
        if (partialMatch.cached) {
          this.stats.partialHits++;
          this.stats.hits++;
          this.updateStats(Date.now() - startTime);
          
          return {
            cached: true,
            response: partialMatch.response,
            similarity: partialMatch.similarity,
            matchType: 'partial',
            alternatives: partialMatch.alternatives
          };
        }
      }

      // 4. 未命中
      this.stats.misses++;
      this.updateStats(Date.now() - startTime);
      
      return {
        cached: false,
        matchType: 'none'
      };

    } catch (error) {
      logger.error('Context cache get failed', error, { module: 'context-aware-cache-service' });
      return {
        cached: false,
        matchType: 'none'
      };
    }
  }

  // Set cache
  async setWithContext(request: UnifiedRequest, response: UnifiedResponse, strategyName = 'default'): Promise<void> {
    const strategy = this.strategies.get(strategyName) || this.defaultStrategy;
    
    try {
      // 生成缓存键
      const key = this.generateExactKey(request);
      
      // 提取上下文特征
      const contextFeatures = await this.extractContextFeatures(request);
      
      // 创建缓存项
      const cacheItem: CacheItem = {
        key,
        response: {
          ...response,
          data: {
            ...response.data,
            cached: false // new cache entry is not a cache hit
          }
        },
        metadata: {
          query: request.query,
          context: request.context || {},
          taskType: response.data.taskType || 'unknown',
          system: response.data.source || 'unknown',
          priority: request.priority || 'medium',
          timestamp: Date.now(),
          accessCount: 0,
          lastAccessed: Date.now(),
          similarityScore: 1.0, // exact match
          relevanceScore: this.calculateRelevanceScore(request, response),
          confidence: 0.9 // initial confidence
        },
        ttl: strategy.ttl
      };

      // 添加到缓存
      this.cache.set(key, cacheItem);
      this.stats.totalSize = this.cache.size;

      // 检查是否需要清理
      if (this.cache.size > strategy.maxSize) {
        this.evictCache(strategy);
      }

      // 记录缓存项特征 (用于后续相似度匹配)
      await this.recordCacheFeatures(key, contextFeatures);

    } catch (error) {
      logger.error('Context cache set failed', error, { module: 'context-aware-cache-service' });
    }
  }

  // 生成精确缓存键
  private generateExactKey(request: UnifiedRequest): string {
    const keyParts = [
      request.query.toLowerCase().trim().replace(/\s+/g, '_'),
      request.priority || 'medium',
      request.system || 'auto',
      JSON.stringify(request.context || {})
    ];
    
    return keyParts.join('|');
  }

  // 提取上下文特征
  private async extractContextFeatures(request: UnifiedRequest): Promise<ContextFeatures> {
    const query = request.query.toLowerCase();
    
    // 简单关键词提取
    const keywords = this.extractKeywords(query);
    
    // 实体识别 (简化版)
    const entities = this.extractEntities(query);
    
    // 意图识别
    const intent = this.detectIntent(query);
    
    // 领域分类
    const domain = this.classifyDomain(query);
    
    // 复杂度评估
    const complexity = this.assessComplexity(query);
    
    // 紧急度评估
    const urgency = this.assessUrgency(request.priority);
    
    return {
      keywords,
      entities,
      intent,
      domain,
      complexity,
      urgency
    };
  }

  // 提取关键词
  private extractKeywords(query: string): string[] {
    // 移除停用词，提取有意义的关键词
    const stopWords = new Set([
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'
    ]);
    
    const words = query.split(/[\s,，.。!！?？;；:：]+/);
    const keywords = words
      .filter(word => word.length > 1 && !stopWords.has(word))
      .slice(0, 10); // limit keyword count
    
    return keywords;
  }

  // 提取实体
  private extractEntities(query: string): string[] {
    // 简单实体识别 (可扩展)
    const techEntities = ['react', 'vue', 'angular', 'nextjs', 'nodejs', 'python', 'java', 'typescript', 'javascript'];
    const dbEntities = ['mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch'];
    const cloudEntities = ['aws', 'azure', 'gcp', 'docker', 'kubernetes'];
    
    const entities: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    [...techEntities, ...dbEntities, ...cloudEntities].forEach(entity => {
      if (lowerQuery.includes(entity)) {
        entities.push(entity);
      }
    });
    
    return entities;
  }

  // 检测意图
  private detectIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('如何') || lowerQuery.includes('怎么') || lowerQuery.includes('怎样')) {
      return 'how-to';
    } else if (lowerQuery.includes('什么') || lowerQuery.includes('哪些') || lowerQuery.includes('为什么')) {
      return 'what-is';
    } else if (lowerQuery.includes('创建') || lowerQuery.includes('实现') || lowerQuery.includes('开发')) {
      return 'create';
    } else if (lowerQuery.includes('优化') || lowerQuery.includes('改进') || lowerQuery.includes('提升')) {
      return 'optimize';
    } else if (lowerQuery.includes('配置') || lowerQuery.includes('设置') || lowerQuery.includes('安装')) {
      return 'configure';
    } else if (lowerQuery.includes('执行') || lowerQuery.includes('运行') || lowerQuery.includes('操作')) {
      return 'execute';
    }
    
    return 'general';
  }

  // 分类领域
  private classifyDomain(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('react') || lowerQuery.includes('vue') || lowerQuery.includes('前端')) {
      return 'frontend';
    } else if (lowerQuery.includes('node') || lowerQuery.includes('express') || lowerQuery.includes('后端')) {
      return 'backend';
    } else if (lowerQuery.includes('数据库') || lowerQuery.includes('mysql') || lowerQuery.includes('postgres')) {
      return 'database';
    } else if (lowerQuery.includes('部署') || lowerQuery.includes('docker') || lowerQuery.includes('kubernetes')) {
      return 'devops';
    } else if (lowerQuery.includes('测试') || lowerQuery.includes('单元测试') || lowerQuery.includes('集成测试')) {
      return 'testing';
    } else if (lowerQuery.includes('安全') || lowerQuery.includes('认证') || lowerQuery.includes('授权')) {
      return 'security';
    }
    
    return 'general';
  }

  // 评估复杂度
  private assessComplexity(query: string): number {
    // 基于查询长度和关键词数量
    const length = query.length;
    const keywordCount = this.extractKeywords(query).length;
    
    let complexity = 0;
    
    if (length > 100) complexity += 0.3;
    else if (length > 50) complexity += 0.2;
    else complexity += 0.1;
    
    if (keywordCount > 5) complexity += 0.4;
    else if (keywordCount > 3) complexity += 0.3;
    else complexity += 0.2;
    
    // 检查是否包含复杂概念
    const complexConcepts = ['microservices', 'distributed', 'concurrent', 'async', 'performance optimization', 'architecture design', '微服务', '分布式', '并发', '异步', '架构设计'];
    complexConcepts.forEach(concept => {
      if (query.includes(concept)) complexity += 0.2;
    });
    
    return Math.min(1, complexity);
  }

  // 评估紧急度
  private assessUrgency(priority?: string): number {
    switch (priority) {
      case 'critical': return 1.0;
      case 'high': return 0.8;
      case 'medium': return 0.5;
      case 'low': return 0.2;
      default: return 0.5;
    }
  }

  // 查找上下文匹配
  private async findContextMatch(request: UnifiedRequest, strategy: CacheStrategy): Promise<{
    cached: boolean;
    response?: UnifiedResponse;
    similarity?: number;
    matchType?: 'semantic' | 'partial';
    alternatives?: Array<{ item: CacheItem; similarity: number }>;
  }> {
    const requestFeatures = await this.extractContextFeatures(request);
    const matches: Array<{ item: CacheItem; similarity: number }> = [];
    
    // 遍历缓存项计算相似度
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) continue;
      
      // 获取缓存项特征 (这里简化处理，实际应该存储特征)
      const itemFeatures = await this.extractContextFeatures({
        query: item.metadata.query,
        priority: item.metadata.priority,
        context: item.metadata.context
      } as UnifiedRequest);
      
      // 计算相似度
      const similarity = this.calculateSimilarity(requestFeatures, itemFeatures);
      
      if (similarity >= strategy.similarityThreshold) {
        matches.push({ item, similarity });
      }
    }
    
    // 按相似度排序
    matches.sort((a, b) => b.similarity - a.similarity);
    
    if (matches.length > 0) {
      const bestMatch = matches[0];
      
      // 更新缓存项访问统计
      bestMatch.item.metadata.accessCount++;
      bestMatch.item.metadata.lastAccessed = Date.now();
      bestMatch.item.metadata.similarityScore = bestMatch.similarity;
      
      return {
        cached: true,
        response: bestMatch.item.response,
        similarity: bestMatch.similarity,
        matchType: 'semantic',
        alternatives: matches.slice(1, strategy.maxAlternatives)
      };
    }
    
    return {
      cached: false
    };
  }

  // 计算相似度
  private calculateSimilarity(features1: ContextFeatures, features2: ContextFeatures): number {
    let similarity = 0;
    
    // 1. 关键词相似度
    const keywordSimilarity = this.calculateSetSimilarity(
      new Set(features1.keywords),
      new Set(features2.keywords)
    );
    similarity += keywordSimilarity * this.similarityConfig.keywordWeight;
    
    // 2. 实体相似度
    const entitySimilarity = this.calculateSetSimilarity(
      new Set(features1.entities),
      new Set(features2.entities)
    );
    similarity += entitySimilarity * this.similarityConfig.semanticWeight;
    
    // 3. 意图相似度
    const intentSimilarity = features1.intent === features2.intent ? 1 : 0.3;
    similarity += intentSimilarity * this.similarityConfig.contextWeight;
    
    // 4. 领域相似度
    const domainSimilarity = features1.domain === features2.domain ? 1 : 0.5;
    similarity += domainSimilarity * this.similarityConfig.taskTypeWeight;
    
    // 5. 复杂度相似度 (差异越小得分越高)
    const complexityDiff = Math.abs(features1.complexity - features2.complexity);
    const complexitySimilarity = 1 - complexityDiff;
    similarity += complexitySimilarity * 0.1;
    
    // 6. 紧急度相似度
    const urgencyDiff = Math.abs(features1.urgency - features2.urgency);
    const urgencySimilarity = 1 - urgencyDiff;
    similarity += urgencySimilarity * 0.1;
    
    return Math.min(1, similarity);
  }

  // 计算集合相似度 (Jaccard系数)
  private calculateSetSimilarity(set1: Set<string>, set2: Set<string>): number {
    if (set1.size === 0 && set2.size === 0) return 1;
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  // 查找部分匹配
  private async findPartialMatch(request: UnifiedRequest, strategy: CacheStrategy): Promise<{
    cached: boolean;
    response?: UnifiedResponse;
    similarity?: number;
    alternatives?: Array<{ item: CacheItem; similarity: number }>;
  }> {
    const requestKeywords = this.extractKeywords(request.query);
    const matches: Array<{ item: CacheItem; similarity: number }> = [];
    
    // 遍历缓存项
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) continue;
      
      const itemKeywords = this.extractKeywords(item.metadata.query);
      const keywordSimilarity = this.calculateSetSimilarity(
        new Set(requestKeywords),
        new Set(itemKeywords)
      );
      
      // 检查任务类型是否匹配
      const taskTypeMatch = request.context?.queryType === item.metadata.taskType;
      
      // 综合评分
      let similarity = keywordSimilarity;
      if (taskTypeMatch) similarity += 0.2;
      
      if (similarity >= strategy.similarityThreshold * 0.8) { // lowered threshold
        matches.push({ item, similarity });
      }
    }
    
    // 按相似度排序
    matches.sort((a, b) => b.similarity - a.similarity);
    
    if (matches.length > 0) {
      const bestMatch = matches[0];
      
      // 更新访问统计
      bestMatch.item.metadata.accessCount++;
      bestMatch.item.metadata.lastAccessed = Date.now();
      bestMatch.item.metadata.similarityScore = bestMatch.similarity;
      
      return {
        cached: true,
        response: bestMatch.item.response,
        similarity: bestMatch.similarity,
        alternatives: matches.slice(1, strategy.maxAlternatives)
      };
    }
    
    return {
      cached: false
    };
  }

  // 记录缓存特征 (简化实现)
  private async recordCacheFeatures(key: string, features: ContextFeatures): Promise<void> {
    // 在实际实现中，这里应该将特征存储到特征库
    // 这里简化处理，只记录日志
    console.log(`📝 Recording cache features: ${key}`);
    console.log(`   Keywords: ${features.keywords.slice(0, 5).join(', ')}`);
    console.log(`   Intent: ${features.intent}, Domain: ${features.domain}`);
  }

  // 计算相关性得分
  private calculateRelevanceScore(request: UnifiedRequest, response: UnifiedResponse): number {
    let score = 0.5; // base score
    
    // 响应成功加分
    if (response.success) score += 0.2;
    
    // 响应时间快加分
    const responseTime = response.data.responseTime || 0;
    if (responseTime < 100) score += 0.1;
    else if (responseTime < 500) score += 0.05;
    
    // 任务类型匹配加分
    if (response.data.taskType && request.context?.queryType === response.data.taskType) {
      score += 0.15;
    }
    
    return Math.min(1, score);
  }

  // 检查是否过期
  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.metadata.timestamp > item.ttl;
  }

  // 清理缓存
  private evictCache(strategy: CacheStrategy): void {
    const items = Array.from(this.cache.entries());
    
    switch (strategy.evictionPolicy) {
      case 'lru': // least recently used
        items.sort((a, b) => a[1].metadata.lastAccessed - b[1].metadata.lastAccessed);
        break;
      case 'lfu': // least frequently used
        items.sort((a, b) => a[1].metadata.accessCount - b[1].metadata.accessCount);
        break;
      case 'fifo': // first in, first out
        items.sort((a, b) => a[1].metadata.timestamp - b[1].metadata.timestamp);
        break;
      case 'random': // random
        items.sort(() => Math.random() - 0.5);
        break;
    }
    
    // 移除超出限制的项
    const toRemove = items.slice(0, items.length - strategy.maxSize);
    toRemove.forEach(([key]) => {
      this.cache.delete(key);
      this.stats.evictions++;
    });
    
    this.stats.totalSize = this.cache.size;
  }

  // 更新统计
  private updateStats(responseTime: number): void {
    const totalRequests = this.stats.hits + this.stats.misses;
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  // Get cache statistics
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    const semanticHitRate = this.stats.hits > 0 ? (this.stats.semanticHits / this.stats.hits) * 100 : 0;
    const partialHitRate = this.stats.hits > 0 ? (this.stats.partialHits / this.stats.hits) * 100 : 0;
    
    return {
      ...this.stats,
      totalRequests,
      hitRate: hitRate.toFixed(2),
      semanticHitRate: semanticHitRate.toFixed(2),
      partialHitRate: partialHitRate.toFixed(2),
      averageResponseTime: this.stats.averageResponseTime.toFixed(2),
      cacheSize: this.cache.size,
      strategies: Array.from(this.strategies.keys())
    };
  }

  // 获取缓存项详情
  getCacheItems(limit = 50): Array<{
    key: string;
    query: string;
    taskType: string;
    system: string;
    timestamp: string;
    accessCount: number;
    similarityScore?: number;
    relevanceScore?: number;
    ttl: number;
    expired: boolean;
  }> {
    const items = Array.from(this.cache.entries())
      .map(([key, item]) => ({
        key,
        query: item.metadata.query.substring(0, 50) + (item.metadata.query.length > 50 ? '...' : ''),
        taskType: item.metadata.taskType,
        system: item.metadata.system,
        timestamp: new Date(item.metadata.timestamp).toISOString(),
        accessCount: item.metadata.accessCount,
        similarityScore: item.metadata.similarityScore,
        relevanceScore: item.metadata.relevanceScore,
        ttl: item.ttl,
        expired: this.isExpired(item)
      }))
      .sort((a, b) => b.accessCount - a.accessCount) // sort by access count
      .slice(0, limit);
    
    return items;
  }

  // 清空缓存
  clearCache(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      semanticHits: 0,
      partialHits: 0,
      evictions: 0,
      totalSize: 0,
      averageResponseTime: 0
    };
  }

  // 更新配置
  updateSimilarityConfig(config: Partial<SimilarityConfig>): void {
    this.similarityConfig = { ...this.similarityConfig, ...config };
  }

  // 添加策略
  addStrategy(name: string, strategy: CacheStrategy): void {
    this.strategies.set(name, strategy);
  }

  // 移除策略
  removeStrategy(name: string): boolean {
    return this.strategies.delete(name);
  }

  // 获取策略
  getStrategy(name: string): CacheStrategy | undefined {
    return this.strategies.get(name);
  }

  // 获取所有策略
  getAllStrategies(): CacheStrategy[] {
    return Array.from(this.strategies.values());
  }
}

// 导出单例实例
export const contextAwareCacheService = new ContextAwareCacheService();