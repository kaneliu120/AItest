// 上下文智canCacheSystem

import { UnifiedRequest, UnifiedResponse } from './unified-gateway-service';
import { logger } from './logger';

// Cache项元data
export interface CacheItemMetadata {
  query: string;
  context: Record<string, unknown>;
  taskType: string;
  system: string;
  priority: string;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  similarityScore?: number; // Context similarity score
  relevanceScore?: number; // 相Off性得分
  confidence?: number; // 置信度
}

// Cache项
export interface CacheItem {
  key: string;
  response: UnifiedResponse;
  metadata: CacheItemMetadata;
  ttl: number; // 生存time (毫s)
}

// Context features
export interface ContextFeatures {
  keywords: string[];
  entities: string[]; // 实体识别
  intent: string; // 查询意Graph
  domain: string; // 领域Category
  complexity: number; // complexity评分 0-1
  urgency: number; // Urgent度评分 0-1
}

// 相似度Configuration
export interface SimilarityConfig {
  semanticWeight: number; // 语义权重 0-1
  keywordWeight: number; // Off键词权重 0-1
  contextWeight: number; // Context weight 0-1
  taskTypeWeight: number; // TaskType权重 0-1
  minSimilarity: number; // 最Small相似度阈值
  maxAlternatives: number; // 最Large备选quantity
}

// Cache策略
export interface CacheStrategy {
  name: string;
  ttl: number; // 生存time
  maxSize: number; // 最LargeCache项数
  evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'random';
  similarityThreshold: number; // 相似度阈值
  enablePartialMatch: boolean; // whether itenabled部分匹配
  enableContextAware: boolean; // whether itenabledContext-aware
  maxAlternatives?: number; // 最Large备选quantity
}

class ContextAwareCacheservervice {
  private cache: Map<string, CacheItem> = new Map();
  private strategies: Map<string, CacheStrategy> = new Map();
  private defaultStrategy: CacheStrategy;
  private similarityConfig: SimilarityConfig;
  
  // Statistics
  private stats = {
    hits: 0,
    misses: 0,
    semanticHits: 0, // 语义匹配命Center
    partialHits: 0, // 部分匹配命Center
    evictions: 0,
    totalSize: 0,
    averageResponseTime: 0
  };

  constructor() {
    // Default相似度Configuration
    this.similarityConfig = {
      semanticWeight: 0.4,
      keywordWeight: 0.3,
      contextWeight: 0.2,
      taskTypeWeight: 0.1,
      minSimilarity: 0.7,
      maxAlternatives: 3
    };

    // DefaultCache策略
    this.defaultStrategy = {
      name: 'default',
      ttl: 10 * 60 * 1000, // 10min
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
      ttl: 2 * 60 * 1000, // 2min
      maxSize: 500,
      evictionPolicy: 'lru',
      similarityThreshold: 0.9,
      enablePartialMatch: false,
      enableContextAware: true
    });
    this.strategies.set('long-term', {
      name: 'long-term',
      ttl: 60 * 60 * 1000, // 1Small时
      maxSize: 2000,
      evictionPolicy: 'lfu',
      similarityThreshold: 0.7,
      enablePartialMatch: true,
      enableContextAware: true
    });
    this.strategies.set('critical', {
      name: 'critical',
      ttl: 24 * 60 * 60 * 1000, // 24Small时
      maxSize: 100,
      evictionPolicy: 'lfu',
      similarityThreshold: 0.95,
      enablePartialMatch: false,
      enableContextAware: false
    });
  }

  // FetchCache (Context-aware)
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
        // Update访问Statistics
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

      // 2. Context-aware matching (ifenabled)
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

      // 3. 部分匹配 (ifenabled)
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

      // 4. 未命Center
      this.stats.misses++;
      this.updateStats(Date.now() - startTime);
      
      return {
        cached: false,
        matchType: 'none'
      };

    } catch (error) {
      logger.error('上下文CacheFetch failed', error, { module: 'context-aware-cache-service' });
      return {
        cached: false,
        matchType: 'none'
      };
    }
  }

  // SettingsCache
  async setWithContext(request: UnifiedRequest, response: UnifiedResponse, strategyName = 'default'): Promise<void> {
    const strategy = this.strategies.get(strategyName) || this.defaultStrategy;
    
    try {
      // GenerateCache键
      const key = this.generateExactKey(request);
      
      // 提取Context features
      const contextFeatures = await this.extractContextFeatures(request);
      
      // CreateCache项
      const cacheItem: CacheItem = {
        key,
        response: {
          ...response,
          data: {
            ...response.data,
            cached: false // NewCache项不YesCache命Center
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
          similarityScore: 1.0, // 精确匹配
          relevanceScore: this.calculateRelevanceScore(request, response),
          confidence: 0.9 // 初始置信度
        },
        ttl: strategy.ttl
      };

      // AddtoCache
      this.cache.set(key, cacheItem);
      this.stats.totalSize = this.cache.size;

      // Checkwhether itneed to清理
      if (this.cache.size > strategy.maxSize) {
        this.evictCache(strategy);
      }

      // LogCache项特征 (用于后续相似度匹配)
      await this.recordCacheFeatures(key, contextFeatures);

    } catch (error) {
      logger.error('上下文CacheSettingsfailed', error, { module: 'context-aware-cache-service' });
    }
  }

  // Generate精确Cache键
  private generateExactKey(request: UnifiedRequest): string {
    const keyParts = [
      request.query.toLowerCase().trim().replace(/\s+/g, '_'),
      request.priority || 'medium',
      request.system || 'auto',
      JSON.stringify(request.context || {})
    ];
    
    return keyParts.join('|');
  }

  // 提取Context features
  private async extractContextFeatures(request: UnifiedRequest): Promise<ContextFeatures> {
    const query = request.query.toLowerCase();
    
    // 简单Off键词提取
    const keywords = this.extractKeywords(query);
    
    // 实体识别 (简化版)
    const entities = this.extractEntities(query);
    
    // 意Graph识别
    const intent = this.detectIntent(query);
    
    // 领域Category
    const domain = this.classifyDomain(query);
    
    // complexityEvaluation
    const complexity = this.assessComplexity(query);
    
    // Urgent度Evaluation
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

  // 提取Off键词
  private extractKeywords(query: string): string[] {
    // remove停用词, 提取All意义'sOff键词
    const stopWords = new Set([
      ''s', '了', 'in', 'Yes', '我', 'All', '和', '就', '不', '人', '都', '一', '一 ', '上', '也', '很', 'to', '说', 'need to', '去', '你', 'will', '着', '没All', '看', '好', '自己', '这'
    ]);
    
    const words = query.split(/[\s,, .. !! ?? ;；:: ]+/);
    const keywords = words
      .filter(word => word.length > 1 && !stopWords.has(word))
      .slice(0, 10); // 限制Off键词quantity
    
    return keywords;
  }

  // 提取实体
  private extractEntities(query: string): string[] {
    // 简单实体识别 (可extend)
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

  // 检测意Graph
  private detectIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('如何') || lowerQuery.includes('怎么') || lowerQuery.includes('怎样')) {
      return 'how-to';
    } else if (lowerQuery.includes('什么') || lowerQuery.includes('哪些') || lowerQuery.includes('for什么')) {
      return 'what-is';
    } else if (lowerQuery.includes('Create') || lowerQuery.includes('实现') || lowerQuery.includes('Development')) {
      return 'create';
    } else if (lowerQuery.includes('optimize') || lowerQuery.includes('改进') || lowerQuery.includes('improve')) {
      return 'optimize';
    } else if (lowerQuery.includes('Configuration') || lowerQuery.includes('Settings') || lowerQuery.includes('Install')) {
      return 'configure';
    } else if (lowerQuery.includes('Execute') || lowerQuery.includes('运行') || lowerQuery.includes('操作')) {
      return 'execute';
    }
    
    return 'general';
  }

  // Category领域
  private classifyDomain(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('react') || lowerQuery.includes('vue') || lowerQuery.includes('前端')) {
      return 'frontend';
    } else if (lowerQuery.includes('node') || lowerQuery.includes('express') || lowerQuery.includes('后端')) {
      return 'backend';
    } else if (lowerQuery.includes('data库') || lowerQuery.includes('mysql') || lowerQuery.includes('postgres')) {
      return 'database';
    } else if (lowerQuery.includes('Deployment') || lowerQuery.includes('docker') || lowerQuery.includes('kubernetes')) {
      return 'devops';
    } else if (lowerQuery.includes('Test') || lowerQuery.includes('单元Test') || lowerQuery.includes('集成Test')) {
      return 'testing';
    } else if (lowerQuery.includes('Security') || lowerQuery.includes('Auth') || lowerQuery.includes('authorize')) {
      return 'security';
    }
    
    return 'general';
  }

  // Evaluationcomplexity
  private assessComplexity(query: string): number {
    // 基于查询长度和Off键词quantity
    const length = query.length;
    const keywordCount = this.extractKeywords(query).length;
    
    let complexity = 0;
    
    if (length > 100) complexity += 0.3;
    else if (length > 50) complexity += 0.2;
    else complexity += 0.1;
    
    if (keywordCount > 5) complexity += 0.4;
    else if (keywordCount > 3) complexity += 0.3;
    else complexity += 0.2;
    
    // Checkwhether itcontains复杂概念
    const complexConcepts = ['微servervice', 'distributed', 'and发', 'async', 'Performanceoptimize', '架构设计'];
    complexConcepts.forEach(concept => {
      if (query.includes(concept)) complexity += 0.2;
    });
    
    return Math.min(1, complexity);
  }

  // EvaluationUrgent度
  private assessUrgency(priority?: string): number {
    switch (priority) {
      case 'critical': return 1.0;
      case 'high': return 0.8;
      case 'medium': return 0.5;
      case 'low': return 0.2;
      default: return 0.5;
    }
  }

  // find上下文匹配
  private async findContextMatch(request: UnifiedRequest, strategy: CacheStrategy): Promise<{
    cached: boolean;
    response?: UnifiedResponse;
    similarity?: number;
    matchType?: 'semantic' | 'partial';
    alternatives?: Array<{ item: CacheItem; similarity: number }>;
  }> {
    const requestFeatures = await this.extractContextFeatures(request);
    const matches: Array<{ item: CacheItem; similarity: number }> = [];
    
    // traverseCache项计算相似度
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) continue;
      
      // FetchCache项特征 (这里简化Process, 实际should存储特征)
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
    
    // by相似度Sort
    matches.sort((a, b) => b.similarity - a.similarity);
    
    if (matches.length > 0) {
      const bestMatch = matches[0];
      
      // UpdateCache项访问Statistics
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
    
    // 1. Off键词相似度
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
    
    // 3. 意Graph相似度
    const intentSimilarity = features1.intent === features2.intent ? 1 : 0.3;
    similarity += intentSimilarity * this.similarityConfig.contextWeight;
    
    // 4. 领域相似度
    const domainSimilarity = features1.domain === features2.domain ? 1 : 0.5;
    similarity += domainSimilarity * this.similarityConfig.taskTypeWeight;
    
    // 5. complexity相似度 (差异越Small得分越High)
    const complexityDiff = Math.abs(features1.complexity - features2.complexity);
    const complexitySimilarity = 1 - complexityDiff;
    similarity += complexitySimilarity * 0.1;
    
    // 6. Urgent度相似度
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

  // find部分匹配
  private async findPartialMatch(request: UnifiedRequest, strategy: CacheStrategy): Promise<{
    cached: boolean;
    response?: UnifiedResponse;
    similarity?: number;
    alternatives?: Array<{ item: CacheItem; similarity: number }>;
  }> {
    const requestKeywords = this.extractKeywords(request.query);
    const matches: Array<{ item: CacheItem; similarity: number }> = [];
    
    // traverseCache项
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) continue;
      
      const itemKeywords = this.extractKeywords(item.metadata.query);
      const keywordSimilarity = this.calculateSetSimilarity(
        new Set(requestKeywords),
        new Set(itemKeywords)
      );
      
      // CheckTaskTypewhether it匹配
      const taskTypeMatch = request.context?.queryType === item.metadata.taskType;
      
      // 综合评分
      let similarity = keywordSimilarity;
      if (taskTypeMatch) similarity += 0.2;
      
      if (similarity >= strategy.similarityThreshold * 0.8) { // 降Low阈值
        matches.push({ item, similarity });
      }
    }
    
    // by相似度Sort
    matches.sort((a, b) => b.similarity - a.similarity);
    
    if (matches.length > 0) {
      const bestMatch = matches[0];
      
      // Update访问Statistics
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

  // LogCache特征 (简化实现)
  private async recordCacheFeatures(key: string, features: ContextFeatures): Promise<void> {
    // in实际实现Center, 这里shouldwill特征存储to特征库
    // 这里简化Process, 只LogLogging
    console.log(`📝 LogCache特征: ${key}`);
    console.log(`   Off键词: ${features.keywords.slice(0, 5).join(', ')}`);
    console.log(`   意Graph: ${features.intent}, 领域: ${features.domain}`);
  }

  // 计算相Off性得分
  private calculateRelevanceScore(request: UnifiedRequest, response: UnifiedResponse): number {
    let score = 0.5; // basic分
    
    // Responsesuccess加分
    if (response.success) score += 0.2;
    
    // Responsetime快加分
    const responseTime = response.data.responseTime || 0;
    if (responseTime < 100) score += 0.1;
    else if (responseTime < 500) score += 0.05;
    
    // TaskType匹配加分
    if (response.data.taskType && request.context?.queryType === response.data.taskType) {
      score += 0.15;
    }
    
    return Math.min(1, score);
  }

  // Checkwhether itexpired
  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.metadata.timestamp > item.ttl;
  }

  // 清理Cache
  private evictCache(strategy: CacheStrategy): void {
    const items = Array.from(this.cache.entries());
    
    switch (strategy.evictionPolicy) {
      case 'lru': // 最近最Lessusing
        items.sort((a, b) => a[1].metadata.lastAccessed - b[1].metadata.lastAccessed);
        break;
      case 'lfu': // 最不经常using
        items.sort((a, b) => a[1].metadata.accessCount - b[1].metadata.accessCount);
        break;
      case 'fifo': // 先进先出
        items.sort((a, b) => a[1].metadata.timestamp - b[1].metadata.timestamp);
        break;
      case 'random': // 随机
        items.sort(() => Math.random() - 0.5);
        break;
    }
    
    // removeexceeds limit's项
    const toRemove = items.slice(0, items.length - strategy.maxSize);
    toRemove.forEach(([key]) => {
      this.cache.delete(key);
      this.stats.evictions++;
    });
    
    this.stats.totalSize = this.cache.size;
  }

  // UpdateStatistics
  private updateStats(responseTime: number): void {
    const totalRequests = this.stats.hits + this.stats.misses;
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  // FetchCacheStatistics
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

  // FetchCache项Details
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
      .sort((a, b) => b.accessCount - a.accessCount) // by访问 times数Sort
      .slice(0, limit);
    
    return items;
  }

  // ClearCache
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

  // UpdateConfiguration
  updateSimilarityConfig(config: Partial<SimilarityConfig>): void {
    this.similarityConfig = { ...this.similarityConfig, ...config };
  }

  // Add策略
  addStrategy(name: string, strategy: CacheStrategy): void {
    this.strategies.set(name, strategy);
  }

  // remove策略
  removeStrategy(name: string): boolean {
    return this.strategies.delete(name);
  }

  // Fetch策略
  getStrategy(name: string): CacheStrategy | undefined {
    return this.strategies.get(name);
  }

  // Fetch所All策略
  getAllStrategies(): CacheStrategy[] {
    return Array.from(this.strategies.values());
  }
}

// Export单例实例
export const contextAwareCacheservervice = new ContextAwareCacheservervice();