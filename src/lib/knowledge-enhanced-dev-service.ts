// 知识增强开发流程服务 - 修复版本

import { unifiedGatewayService, UnifiedRequest, UnifiedResponse } from './unified-gateway-service';
import { contextAwareCacheService } from './context-aware-cache-service';

// 开发任务类型
export type DevTaskType = 
  | 'code-generation' // code generation
  | 'api-design'           // API design
  | 'database-design' // database design
  | 'architecture-design' // architecture design
  | 'testing-strategy' // testing strategy
  | 'deployment-plan' // deployment plan
  | 'code-review' // code review
  | 'bug-fix'              // bug fix
  | 'performance-optimization' // performance optimization
  | 'security-audit'; // security audit

 // knowledge enhancement level
export type KnowledgeEnhancementLevel = 
  | 'basic' // basic - uses general knowledge only
  | 'enhanced' // enhanced - uses domain-specific knowledge
  | 'expert' // expert - uses deep specialized knowledge
  | 'contextual'; // contextual - uses project-specific knowledge

// 开发任务分析
export interface DevTaskAnalysis {
  taskType: DevTaskType;
  complexity: 'low' | 'medium' | 'high';
  knowledgeRequirements: string[]; // required knowledge domains
  estimatedEffort: number; // estimated effort (hours)
  priority: 'low' | 'medium' | 'high' | 'critical';
  relatedPatterns: string[]; // related design patterns
  bestPractices: string[]; // best practices
  commonPitfalls: string[]; // common pitfalls
}

// 知识增强结果
export interface KnowledgeEnhancedResult {
  originalResponse: UnifiedResponse;
  enhancedResponse: UnifiedResponse;
  knowledgeSources: Array<{
    source: string; // knowledge source
    relevance: number; // relevance 0-1
    content: string; // knowledge content summary
    confidence: number; // confidence 0-1
  }>;
  enhancements: Array<{
    type: 'code-example' | 'best-practice' | 'pattern' | 'warning' | 'optimization';
    description: string;
    impact: 'low' | 'medium' | 'high';
    implementation: string; // implementation suggestion
  }>;
  qualityMetrics: {
    completeness: number; // completeness 0-1
    accuracy: number; // accuracy 0-1
    relevance: number; // relevance 0-1
    practicality: number; // practicality 0-1
  };
  recommendations: Array<{
    area: string; // improvement area
    suggestion: string; // improvement suggestion
    priority: 'low' | 'medium' | 'high';
  }>;
}

// 知识库查询配置
export interface KnowledgeQueryConfig {
  maxResults: number; // max results
  minRelevance: number; // minimum relevance threshold
  includeCodeExamples: boolean; // include code examples
  includeBestPractices: boolean; // include best practices
  includePatterns: boolean; // include design patterns
  includeWarnings: boolean; // include warnings
  sourceTypes: string[]; // knowledge source types
}

class KnowledgeEnhancedDevService {
  private okmsEndpoint = 'http://localhost:8000/api/v1';
  private defaultConfig: KnowledgeQueryConfig = {
    maxResults: 5,
    minRelevance: 0.7,
    includeCodeExamples: true,
    includeBestPractices: true,
    includePatterns: true,
    includeWarnings: true,
    sourceTypes: ['code', 'documentation', 'best-practice', 'pattern', 'warning']
  };

  // 分析开发任务 - 修复版本
  async analyzeDevTask(query: string, context?: any): Promise<DevTaskAnalysis> {
    const lowerQuery = query.toLowerCase();
    
    // 确定任务类型 - 更精确的匹配
    let taskType: DevTaskType = 'code-generation';
    
    // 优先级匹配顺序
    if (lowerQuery.includes('性能') || lowerQuery.includes('performance') || lowerQuery.includes('优化') || lowerQuery.includes('optimization') || lowerQuery.includes('perf')) {
      taskType = 'performance-optimization';
    } else if (lowerQuery.includes('数据库') || lowerQuery.includes('database') || lowerQuery.includes('表') || lowerQuery.includes('table') || lowerQuery.includes('索引') || lowerQuery.includes('index')) {
      taskType = 'database-design';
    } else if (lowerQuery.includes('api') || lowerQuery.includes('接口') || lowerQuery.includes('endpoint') || lowerQuery.includes('rest') || lowerQuery.includes('graphql')) {
      taskType = 'api-design';
    } else if (lowerQuery.includes('架构') || lowerQuery.includes('architecture') || lowerQuery.includes('微服务') || lowerQuery.includes('microservice') || lowerQuery.includes('系统设计') || lowerQuery.includes('system design')) {
      taskType = 'architecture-design';
    } else if (lowerQuery.includes('测试') || lowerQuery.includes('test') || lowerQuery.includes('testing') || lowerQuery.includes('单元测试') || lowerQuery.includes('e2e')) {
      taskType = 'testing-strategy';
    } else if (lowerQuery.includes('部署') || lowerQuery.includes('deploy') || lowerQuery.includes('deployment') || lowerQuery.includes('docker') || lowerQuery.includes('kubernetes')) {
      taskType = 'deployment-plan';
    } else if (lowerQuery.includes('审查') || lowerQuery.includes('review') || lowerQuery.includes('code review') || lowerQuery.includes('代码审查')) {
      taskType = 'code-review';
    } else if (lowerQuery.includes('bug') || lowerQuery.includes('错误') || lowerQuery.includes('修复') || lowerQuery.includes('fix')) {
      taskType = 'bug-fix';
    } else if (lowerQuery.includes('安全') || lowerQuery.includes('security') || lowerQuery.includes('审计') || lowerQuery.includes('audit')) {
      taskType = 'security-audit';
    } else if (lowerQuery.includes('创建') || lowerQuery.includes('create') || lowerQuery.includes('开发') || lowerQuery.includes('develop') || lowerQuery.includes('组件') || lowerQuery.includes('component')) {
      taskType = 'code-generation';
    }
    
    // 确定复杂度 - 基于查询详细程度
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    const wordCount = query.split(/\s+/).length;
    const hasTechnicalTerms = /(react|typescript|next\.js|nest\.js|postgresql|docker|kubernetes|aws|azure)/i.test(query);
    const hasMultipleRequirements = /(包含|包括|支持|实现|设计|contains|includes|support|implement|design).*?(和|以及|并且|同时|and|as well as)/i.test(query);
    
    if (wordCount < 15 && !hasTechnicalTerms && !hasMultipleRequirements) {
      complexity = 'low';
    } else if (wordCount > 40 || (hasTechnicalTerms && hasMultipleRequirements)) {
      complexity = 'high';
    }
    
    // 提取知识需求
    const knowledgeRequirements = this.extractKnowledgeRequirements(taskType);
    
    // 预估工作量
    const estimatedEffort = this.estimateEffort(taskType, complexity);
    
    // 确定优先级 - 基于上下文和关键词
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (context?.priority) {
      priority = context.priority;
    } else if (lowerQuery.includes('紧急') || lowerQuery.includes('urgent') || lowerQuery.includes('critical') || lowerQuery.includes('立即')) {
      priority = 'critical';
    } else if (lowerQuery.includes('重要') || lowerQuery.includes('important') || lowerQuery.includes('high') || lowerQuery.includes('优先')) {
      priority = 'high';
    } else if (lowerQuery.includes('低') || lowerQuery.includes('low') || lowerQuery.includes('optional') || lowerQuery.includes('可选')) {
      priority = 'low';
    }
    
    // 提取相关模式
    const relatedPatterns = this.extractRelatedPatterns(query, taskType);
    
    // 提取最佳实践 - 确保总是有内容
    const bestPractices = this.extractBestPractices(taskType);
    
    // 提取常见陷阱 - 确保总是有内容
    const commonPitfalls = this.extractCommonPitfalls(taskType);
    
    console.log(`�� Task analysis result:`, {
      taskType,
      complexity,
      estimatedEffort,
      priority,
      patternsCount: relatedPatterns.length,
      practicesCount: bestPractices.length,
      pitfallsCount: commonPitfalls.length
    });
    
    return {
      taskType,
      complexity,
      knowledgeRequirements,
      estimatedEffort,
      priority,
      relatedPatterns,
      bestPractices,
      commonPitfalls
    };
  }

  // 提取知识需求
  private extractKnowledgeRequirements(taskType: DevTaskType): string[] {
    const requirements: string[] = [];
    
    switch (taskType) {
      case 'code-generation':
        requirements.push('programming-language', 'framework', 'design-patterns', 'best-practices');
        break;
      case 'api-design':
        requirements.push('rest-api', 'authentication', 'authorization', 'error-handling', 'versioning');
        break;
      case 'database-design':
        requirements.push('database-modeling', 'indexing', 'query-optimization', 'normalization', 'transactions');
        break;
      case 'architecture-design':
        requirements.push('system-design', 'scalability', 'reliability', 'maintainability', 'microservices');
        break;
      case 'testing-strategy':
        requirements.push('unit-testing', 'integration-testing', 'e2e-testing', 'test-frameworks', 'mocking');
        break;
      case 'deployment-plan':
        requirements.push('ci-cd', 'containerization', 'orchestration', 'monitoring', 'scaling');
        break;
      case 'code-review':
        requirements.push('code-quality', 'security', 'performance', 'maintainability', 'best-practices');
        break;
      case 'bug-fix':
        requirements.push('debugging', 'root-cause-analysis', 'testing', 'prevention');
        break;
      case 'performance-optimization':
        requirements.push('profiling', 'bottleneck-identification', 'caching', 'optimization-techniques');
        break;
      case 'security-audit':
        requirements.push('authentication', 'authorization', 'encryption', 'vulnerability');
        break;
    }
    
    return [...new Set(requirements)]; // deduplicate
  }

  // 预估工作量
  private estimateEffort(taskType: DevTaskType, complexity: 'low' | 'medium' | 'high'): number {
    const baseEffort: Record<DevTaskType, number> = {
      'code-generation': 2,
      'api-design': 4,
      'database-design': 3,
      'architecture-design': 8,
      'testing-strategy': 3,
      'deployment-plan': 5,
      'code-review': 2,
      'bug-fix': 1,
      'performance-optimization': 4,
      'security-audit': 6
    };
    
    const complexityMultiplier: Record<'low' | 'medium' | 'high', number> = {
      'low': 0.5,
      'medium': 1,
      'high': 2
    };
    
    return baseEffort[taskType] * complexityMultiplier[complexity];
  }

  // 提取相关模式
  private extractRelatedPatterns(query: string, taskType: DevTaskType): string[] {
    const patterns: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // 通用设计模式
    const designPatterns = [
      'singleton', 'factory', 'observer', 'strategy', 'decorator',
      'adapter', 'facade', 'proxy', 'command', 'iterator',
      'repository', 'unit-of-work', 'specification', 'mediator'
    ];
    
    designPatterns.forEach(pattern => {
      if (lowerQuery.includes(pattern)) {
        patterns.push(pattern);
      }
    });
    
    // 任务类型特定模式
    switch (taskType) {
      case 'api-design':
        patterns.push('rest', 'graphql', 'rpc', 'crud', 'pagination', 'filtering', 'sorting');
        break;
      case 'database-design':
        patterns.push('normalization', 'denormalization', 'indexing', 'partitioning', 'sharding');
        break;
      case 'architecture-design':
        patterns.push('microservices', 'monolith', 'event-sourcing', 'cqrs', 'saga', 'circuit-breaker');
        break;
      case 'testing-strategy':
        patterns.push('arrange-act-assert', 'given-when-then', 'mock', 'stub', 'spy');
        break;
    }
    
    // 确保至少有一些模式
    if (patterns.length === 0) {
      patterns.push('best-practice', 'modular-design', 'separation-of-concerns');
    }
    
    return [...new Set(patterns)];
  }

  // 提取最佳实践
  private extractBestPractices(taskType: DevTaskType): string[] {
    const practices: string[] = [];
    
    switch (taskType) {
      case 'code-generation':
        practices.push('Follow single responsibility principle', 'Write testable code', 'Use meaningful names', 'Add appropriate comments');
        break;
      case 'api-design':
        practices.push('Use RESTful conventions', 'Version your APIs', 'Proper error handling', 'Request validation', 'Rate limiting');
        break;
      case 'database-design':
        practices.push('Proper indexing strategy', 'Normalized design', 'Avoid over-normalization', 'Consider query patterns', 'Regular backups');
        break;
      case 'architecture-design':
        practices.push('Separation of concerns', 'Loose coupling design', 'High cohesion modules', 'Scalability consideration', 'Fault-tolerant design');
        break;
      case 'testing-strategy':
        practices.push('Testing pyramid', 'Test isolation', 'Repeatable tests', 'Meaningful assertions', 'Appropriate test coverage');
        break;
      case 'deployment-plan':
        practices.push('Infrastructure as code', 'Blue-green deployment', 'Canary releases', 'Monitoring and alerting', 'Disaster recovery plan');
        break;
      case 'security-audit':
        practices.push('Principle of least privilege', 'Input validation', 'Output encoding', 'Security headers', 'Regular security scans');
        break;
      default:
        practices.push('Follow industry best practices', 'Keep code clean', 'Consider maintainability', 'Document design decisions');
    }
    
    return practices;
  }

  // 提取常见陷阱
  private extractCommonPitfalls(taskType: DevTaskType): string[] {
    const pitfalls: string[] = [];
    
    switch (taskType) {
      case 'code-generation':
        pitfalls.push('Over-engineering', 'Ignoring error handling', 'Hardcoded configuration', 'Lack of documentation');
        break;
      case 'api-design':
        pitfalls.push('Over-designing endpoints', 'Ignoring versioning', 'Missing authentication/authorization', 'Insufficient error messages');
        break;
      case 'database-design':
        pitfalls.push('Premature optimization', 'Ignoring indexes', 'N+1 query problem', 'Improper transaction management');
        break;
      case 'architecture-design':
        pitfalls.push('Distributed monolith', 'Over-microservicing', 'Ignoring monitoring', 'Lack of fault tolerance');
        break;
      case 'testing-strategy':
        pitfalls.push('Brittle tests', 'Poor test coverage quality', 'Ignoring integration tests', 'Inconsistent test environments');
        break;
      case 'deployment-plan':
        pitfalls.push('Ignoring rollback strategy', 'Poor configuration management', 'Insufficient monitoring', 'Lack of disaster recovery');
        break;
      default:
        pitfalls.push('Ignoring user experience', 'Not considering scalability', 'Lack of tests', 'Insufficient documentation');
    }
    
    return pitfalls;
  }

  // 查询知识库 - 修复版本
  async queryKnowledgeBase(query: string, config?: Partial<KnowledgeQueryConfig>): Promise<any> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    
    try {
      // 构建知识查询 - 适配OKMS API格式
      const knowledgeQuery = {
        query,
        limit: mergedConfig.maxResults,
        min_score: mergedConfig.minRelevance
      };
      
      console.log(`🔍 Querying knowledge base: ${query}, config:`, knowledgeQuery);
      
      // 调用OKMS API
      const response = await fetch(`${this.okmsEndpoint}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(knowledgeQuery)
      });
      
      if (!response.ok) {
        throw new Error(`Knowledge base query failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📚 Knowledge base query result:`, Array.isArray(data) ? data.length : 0, 'results');
      
      // 适配OKMS返回格式
      return {
        success: true,
        data: {
          query,
          results: Array.isArray(data) ? data.map((item: any, index: number) => ({
            id: `okms-${index}`,
            title: item.title || item.content?.substring(0, 50) || 'Unknown title',
            content: item.content || item.text || 'No content',
            relevance: item.score || item.relevance || 0.7,
            source: 'okms-knowledge-base',
            metadata: {
              type: item.type || 'document',
              language: 'typescript',
              framework: 'react'
            }
          })) : []
        }
      };
      
    } catch (error) {
      console.error('Knowledge base query error:', error);
      
      // 返回模拟数据作为回退
      return this.getFallbackKnowledgeData(query, mergedConfig);
    }
  }

  // 获取回退知识数据
  private getFallbackKnowledgeData(query: string, config:KnowledgeQueryConfig): any {
    const lowerQuery = query.toLowerCase();
    
    // 模拟知识数据
    const mockKnowledge = {
      success: true,
      data: {
        query,
        results: [
          {
            id: 'mock-1',
            title: 'React Component Development Best Practices',
            content: 'React components should follow the single responsibility principle, use functional components and Hooks, and stay small and focused.',
            relevance: 0.85,
            source: 'best-practice',
            metadata: {
              type: 'code-example',
              language: 'typescript',
              framework: 'react'
            }
          },
          {
            id: 'mock-2',
            title: 'TypeScript Type Safety Guide',
            content: 'Use strict TypeScript configuration, avoid using the any type, and define clear interfaces and types.',
            relevance: 0.78,
            source: 'documentation',
            metadata: {
              type: 'best-practice',
              language: 'typescript'
            }
          },
          {
            id: 'mock-3',
            title: 'API Design Patterns',
            content: 'RESTful APIs should use appropriate HTTP methods, version endpoints, and provide clear error responses.',
            relevance: 0.72,
            source: 'pattern',
            metadata: {
              type: 'pattern',
              category: 'api-design'
            }
          },
          {
            id: 'mock-4',
            title: 'Database Optimization Warnings',
            content: 'Avoid N+1 query problems, use indexes appropriately, and regularly analyze query performance.',
            relevance: 0.68,
            source: 'warning',
            metadata: {
              type: 'warning',
              severity: 'medium'
            }
          }
        ].filter(item => {
          // 根据查询相关性过滤
          if (lowerQuery.includes('react') && item.title.includes('React')) return true;
          if (lowerQuery.includes('typescript') && item.title.includes('TypeScript')) return true;
          if (lowerQuery.includes('api') && item.title.includes('API')) return true;
          if (lowerQuery.includes('数据库') && item.title.includes('数据库')) return true;
          return Math.random() > 0.5; // randomly keep some
        }).slice(0, config.maxResults)
      }
    };
    
    return mockKnowledge;
  }

  // 增强开发响应
  async enhanceDevResponse(
    originalRequest: UnifiedRequest,
    originalResponse: UnifiedResponse,
    enhancementLevel: KnowledgeEnhancementLevel = 'enhanced'
  ): Promise<KnowledgeEnhancedResult> {
    const startTime = Date.now();
    
    try {
      // 1. 分析开发任务
      const taskAnalysis = await this.analyzeDevTask(
        originalRequest.query, originalRequest.context);
      
      // 2. 查询知识库
      const knowledgeConfig: Partial<KnowledgeQueryConfig> = {
        maxResults: enhancementLevel === 'basic' ? 2 : enhancementLevel === 'enhanced' ? 4 : 6,
        minRelevance: enhancementLevel === 'basic' ? 0.6 : enhancementLevel === 'enhanced' ? 0.7 : 0.8
      };
      
      const knowledgeResults = await this.queryKnowledgeBase(originalRequest.query, knowledgeConfig);
      
      // 3. 提取相关知识
      const knowledgeSources = this.extractKnowledgeSources(knowledgeResults, taskAnalysis);
      
      // 4. 生成增强内容 - 修复：确保总是有内容
      const enhancements = this.generateEnhancements(taskAnalysis, knowledgeSources, originalResponse);
      
      // 5. 创建增强响应
      const enhancedResponse = this.createEnhancedResponse(originalResponse, enhancements, taskAnalysis);
      
      // 6. 计算质量指标
      const qualityMetrics = this.calculateQualityMetrics(originalResponse, enhancements, knowledgeSources);
      
      // 7. 生成改进建议
      const recommendations = this.generateRecommendations(taskAnalysis, qualityMetrics);
      
      const processingTime = Date.now() - startTime;
      console.log(`🧠 Knowledge enhancement complete: ${processingTime}ms, enhancements: ${enhancements.length}, sources: ${knowledgeSources.length}`);
      
      return {
        originalResponse,
        enhancedResponse,
        knowledgeSources,
        enhancements,
        qualityMetrics,
        recommendations
      };
      
    } catch (error) {
      console.error('Knowledge enhancement failed:', error);
      
      // 返回原始响应作为回退
      return {
        originalResponse,
        enhancedResponse: originalResponse,
        knowledgeSources: [],
        enhancements: [],
        qualityMetrics: {
          completeness: 0.5,
          accuracy: 0.5,
          relevance: 0.5,
          practicality: 0.5
        },
        recommendations: []
      };
    }
  }

  // 提取知识来源
  private extractKnowledgeSources(knowledgeResults: any, taskAnalysis: DevTaskAnalysis): Array<{
    source: string;
    relevance: number;
    content: string;
    confidence: number;
  }> {
    const sources: Array<{
      source: string;
      relevance: number;
      content: string;
      confidence: number;
    }> = [];
    
    if (knowledgeResults.success && knowledgeResults.data?.results) {
      knowledgeResults.data.results.forEach((result: any) => {
        // 计算与任务的相关性
        let relevance = result.relevance || 0.5;
        
        // 根据任务类型调整相关性
        if (taskAnalysis.relatedPatterns.some(pattern => 
          result.content?.toLowerCase().includes(pattern.toLowerCase())
        )) {
          relevance += 0.2;
        }
        
        if (taskAnalysis.bestPractices.some(practice => 
          result.content?.toLowerCase().includes(practice.toLowerCase())
        )) {
          relevance += 0.15;
        }
        
        sources.push({
          source: result.source || 'unknown',
          relevance: Math.min(1, relevance),
          content: result.content?.substring(0, 200) || 'No content',
          confidence: result.confidence || 0.7
        });
      });
    }
    
    // 按相关性排序
    sources.sort((a, b) => b.relevance - a.relevance);
    
    return sources.slice(0, 5); // return top 5 most relevant
  }

  // 生成增强内容 - 修复版本：确保总是有内容
  private generateEnhancements(
    taskAnalysis: DevTaskAnalysis,
    knowledgeSources: Array<any>,
    originalResponse: UnifiedResponse
  ): Array<{
    type: 'code-example' | 'best-practice' | 'pattern' | 'warning' | 'optimization';
    description: string;
    impact: 'low' | 'medium' | 'high';
    implementation: string;
  }> {
    const enhancements: Array<{
      type: 'code-example' | 'best-practice' | 'pattern' | 'warning' | 'optimization';
      description: string;
      impact: 'low' | 'medium' | 'high';
      implementation: string;
    }> = [];
    
    // 1. 添加最佳实践 - 确保至少2个
    taskAnalysis.bestPractices.slice(0, 3).forEach((practice, index) => {
      enhancements.push({
        type: 'best-practice',
        description: practice,
        impact: index === 0 ? 'high' : 'medium',
        implementation: `Follow in implementation: ${practice}`
      });
    });
    
    // 2. 添加设计模式 - 确保至少1个
    if (taskAnalysis.relatedPatterns.length > 0) {
      taskAnalysis.relatedPatterns.slice(0, 2).forEach((pattern, index) => {
        enhancements.push({
          type: 'pattern',
          description: `Consider using the ${pattern} design pattern`,
          impact: 'medium',
          implementation: `Research and apply the ${pattern} pattern to the current context`
        });
      });
    } else {
      // 默认模式
      enhancements.push({
        type: 'pattern',
        description: 'Consider using a modular design pattern',
        impact: 'medium',
        implementation: 'Decompose the system into independent, reusable modules'
      });
    }
    
    // 3. 添加警告 - 确保至少1个
    if (taskAnalysis.commonPitfalls.length > 0) {
      taskAnalysis.commonPitfalls.slice(0, 2).forEach((pitfall, index) => {
        enhancements.push({
          type: 'warning',
          description: `Be careful to avoid: ${pitfall}`,
          impact: 'high',
          implementation: `Pay special attention to this in design and implementation`
        });
      });
    } else {
      // 默认警告
      enhancements.push({
        type: 'warning',
        description: 'Be careful to avoid over-engineering',
        impact: 'medium',
        implementation: 'Keep solutions simple, only implement what is currently needed'
      });
    }
    
    // 4. 从知识源添加优化建议
    if (knowledgeSources.length > 0) {
      knowledgeSources.slice(0, 2).forEach((source, index) => {
        if (source.relevance > 0.7) {
          enhancements.push({
            type: 'optimization',
            description: `Knowledge-base optimization suggestion`,
            impact: 'medium',
            implementation: source.content.substring(0, 100)
          });
        }
      });
    }
    
    // 5. 根据任务类型添加代码示例
    if (taskAnalysis.taskType === 'code-generation' || taskAnalysis.taskType === 'api-design') {
      enhancements.push({
        type: 'code-example',
        description: 'Reference code structure and implementation approach',
        impact: 'medium',
        implementation: 'Review example implementations in related codebases or documentation'
      });
    }
    
    // 确保至少有3个增强
    while (enhancements.length < 3) {
      enhancements.push({
        type: 'best-practice',
        description: 'Keep code clean and maintainable',
        impact: 'medium',
        implementation: 'Write clear, self-documenting code with necessary comments'
      });
    }
    
    return enhancements;
  }

  // 创建增强响应
  private createEnhancedResponse(
    originalResponse: UnifiedResponse,
    enhancements: Array<any>,
    taskAnalysis: DevTaskAnalysis
  ): UnifiedResponse {
    // 创建增强数据
    const enhancedData = {
      ...originalResponse.data,
      knowledgeEnhanced: true,
      taskAnalysis: {
        type: taskAnalysis.taskType,
        complexity: taskAnalysis.complexity,
        estimatedEffort: taskAnalysis.estimatedEffort,
        priority: taskAnalysis.priority
      },
      enhancements: enhancements.map(enh => ({
        type: enh.type,
        description: enh.description,
        impact: enh.impact
      })),
      summary: {
        totalEnhancements: enhancements.length,
        highImpactEnhancements: enhancements.filter(e => e.impact === 'high').length,
        mediumImpactEnhancements: enhancements.filter(e => e.impact === 'medium').length,
        lowImpactEnhancements: enhancements.filter(e => e.impact === 'low').length
      }
    };
    
    return {
      ...originalResponse,
      data: enhancedData,
      // metadata not in UnifiedResponse interface
    };
  }

  // 计算质量指标
  private calculateQualityMetrics(
    originalResponse: UnifiedResponse,
    enhancements: Array<any>,
    knowledgeSources: Array<any>
  ): {
    completeness: number;
    accuracy: number;
    relevance: number;
    practicality: number;
  } {
    let completeness = 0.7; // base completeness
    let accuracy = 0.8; // base accuracy
    let relevance = 0.6; // base relevance
    let practicality = 0.7; // base practicality
    
    // 基于增强内容调整指标
    if (enhancements.length > 0) {
      completeness += 0.1 * Math.min(enhancements.length, 5) / 5;
    }
    
    // 基于知识源调整指标
    if (knowledgeSources.length > 0) {
      const avgRelevance = knowledgeSources.reduce((sum, source) => sum + source.relevance, 0) / knowledgeSources.length;
      relevance += 0.2 * avgRelevance;
      
      const avgConfidence = knowledgeSources.reduce((sum, source) => sum + source.confidence, 0) / knowledgeSources.length;
      accuracy += 0.1 * avgConfidence;
    }
    
    // 基于响应质量调整指标
    if (originalResponse.success) {
      practicality += 0.1;
    }
    
    // 限制在0-1范围内
    return {
      completeness: Math.min(1, completeness),
      accuracy: Math.min(1, accuracy),
      relevance: Math.min(1, relevance),
      practicality: Math.min(1, practicality)
    };
  }

  // 生成改进建议
  private generateRecommendations(
    taskAnalysis: DevTaskAnalysis,
    qualityMetrics: any
  ): Array<{
    area: string;
    suggestion: string;
    priority: 'low' | 'medium' | 'high';
  }> {
    const recommendations: Array<{
      area: string;
      suggestion: string;
      priority: 'low' | 'medium' | 'high';
    }> = [];
    
    // 基于质量指标的建议
    if (qualityMetrics.completeness < 0.7) {
      recommendations.push({
        area: 'Completeness',
        suggestion: 'Need more relevant knowledge to complete the solution',
        priority: 'medium'
      });
    }
    
    if (qualityMetrics.accuracy < 0.8) {
      recommendations.push({
        area: 'Accuracy',
        suggestion: 'Verify the accuracy and timeliness of knowledge sources',
        priority: 'high'
      });
    }
    
    if (qualityMetrics.relevance < 0.7) {
      recommendations.push({
        area: 'Relevance',
        suggestion: 'Find more relevant knowledge sources and examples',
        priority: 'medium'
      });
    }
    
    if (qualityMetrics.practicality < 0.7) {
      recommendations.push({
        area: 'Practicality',
        suggestion: 'Provide more specific implementation steps and code examples',
        priority: 'high'
      });
    }
    
    // 基于任务复杂度的建议
    if (taskAnalysis.complexity === 'high') {
      recommendations.push({
        area: 'Task Complexity',
        suggestion: 'Consider decomposing complex tasks into multiple subtasks',
        priority: 'high'
      });
    }
    
    // 基于预估工作量的建议
    if (taskAnalysis.estimatedEffort > 8) {
      recommendations.push({
        area: 'Workload',
        suggestion: 'This task has significant workload; consider phased implementation',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  // 处理知识增强的开发请求
  async processKnowledgeEnhancedRequest(
    request: UnifiedRequest,
    enhancementLevel: KnowledgeEnhancementLevel = 'enhanced'
  ): Promise<KnowledgeEnhancedResult> {
    const startTime = Date.now();
    
    try {
      // 1. 首先尝试从上下文缓存获取
      const cacheRequest: UnifiedRequest = {
        ...request,
        metadata: {
          ...request.metadata,
          enhancementLevel
        }
      };
      
      const cacheResult = await contextAwareCacheService.getWithContext(cacheRequest);
      
      if (cacheResult.cached && cacheResult.response) {
        // 缓存命中，直接返回
        return {
          originalResponse: cacheResult.response,
          enhancedResponse: cacheResult.response,
          knowledgeSources: [],
          enhancements: [],
          qualityMetrics: {
            completeness: 0.8,
            accuracy: 0.9,
            relevance: cacheResult.similarity || 0.8,
            practicality: 0.8
          },
          recommendations: []
        };
      }
      
      // 2. 使用统一网关处理原始请求
      const originalResponse = await unifiedGatewayService.processRequest(request);
      
      // 3. 知识增强处理
      const enhancedResult = await this.enhanceDevResponse(request, originalResponse, enhancementLevel);
      
      // 4. 缓存增强结果
      if (enhancedResult.enhancedResponse.success) {
        await contextAwareCacheService.setWithContext(cacheRequest, enhancedResult.enhancedResponse);
      }
      
      const processingTime = Date.now() - startTime;
      console.log(`🧠 Knowledge enhancement complete: ${processingTime}ms, enhancement level: ${enhancementLevel}`);
      
      return enhancedResult;
      
    } catch (error) {
      console.error('Knowledge enhancement request processing failed:', error);
      
      // 回退到原始统一网关
      const fallbackResponse = await unifiedGatewayService.processRequest(request);
      
      return {
        originalResponse: fallbackResponse,
        enhancedResponse: fallbackResponse,
        knowledgeSources: [],
        enhancements: [],
        qualityMetrics: {
          completeness: 0.5,
          accuracy: 0.5,
          relevance: 0.5,
          practicality: 0.5
        },
        recommendations: [
          {
            area: 'System Error',
            suggestion: 'Knowledge enhancement system temporarily unavailable, using basic response',
            priority: 'high'
          }
        ]
      };
    }
  }

  // 获取服务状态
  getServiceStatus(): any {
    return {
      status: 'healthy',
      service: 'knowledge-enhanced-dev-service',
      features: [
        'task-analysis',
        'knowledge-query',
        'response-enhancement',
        'quality-metrics',
        'recommendations'
      ],
      config: this.defaultConfig,
      endpoints: {
        okms: this.okmsEndpoint,
        cache: 'context-aware-cache-service',
        gateway: 'unified-gateway-service'
      },
      capabilities: [
        'code-generation',
        'api-design', 
        'database-design',
        'architecture-design',
        'testing-strategy',
        'deployment-plan',
        'code-review',
        'bug-fix',
        'performance-optimization',
        'security-audit'
      ]
    };
  }
}

// 导出单例实例
export const knowledgeEnhancedDevService = new KnowledgeEnhancedDevService();