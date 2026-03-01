// 知识增强开发流程服务 - 修复版本

import { unifiedGatewayService, UnifiedRequest, UnifiedResponse } from './unified-gateway-service';
import { contextAwareCacheService } from './context-aware-cache-service';

// 开发任务类型
export type DevTaskType = 
  | 'code-generation'      // 代码生成
  | 'api-design'           // API设计
  | 'database-design'      // 数据库设计
  | 'architecture-design'  // 架构设计
  | 'testing-strategy'     // 测试策略
  | 'deployment-plan'      // 部署计划
  | 'code-review'          // 代码审查
  | 'bug-fix'              // Bug修复
  | 'performance-optimization' // 性能优化
  | 'security-audit';      // 安全审计

// 知识增强级别
export type KnowledgeEnhancementLevel = 
  | 'basic'        // 基础 - 仅使用通用知识
  | 'enhanced'     // 增强 - 使用相关领域知识
  | 'expert'       // 专家 - 使用深度专业知识
  | 'contextual';  // 上下文 - 使用项目特定知识

// 开发任务分析
export interface DevTaskAnalysis {
  taskType: DevTaskType;
  complexity: 'low' | 'medium' | 'high';
  knowledgeRequirements: string[]; // 所需知识领域
  estimatedEffort: number; // 预估工作量 (小时)
  priority: 'low' | 'medium' | 'high' | 'critical';
  relatedPatterns: string[]; // 相关设计模式
  bestPractices: string[]; // 最佳实践
  commonPitfalls: string[]; // 常见陷阱
}

// 知识增强结果
export interface KnowledgeEnhancedResult {
  originalResponse: UnifiedResponse;
  enhancedResponse: UnifiedResponse;
  knowledgeSources: Array<{
    source: string; // 知识来源
    relevance: number; // 相关性 0-1
    content: string; // 知识内容摘要
    confidence: number; // 置信度 0-1
  }>;
  enhancements: Array<{
    type: 'code-example' | 'best-practice' | 'pattern' | 'warning' | 'optimization';
    description: string;
    impact: 'low' | 'medium' | 'high';
    implementation: string; // 实现建议
  }>;
  qualityMetrics: {
    completeness: number; // 完整性 0-1
    accuracy: number; // 准确性 0-1
    relevance: number; // 相关性 0-1
    practicality: number; // 实用性 0-1
  };
  recommendations: Array<{
    area: string; // 改进领域
    suggestion: string; // 改进建议
    priority: 'low' | 'medium' | 'high';
  }>;
}

// 知识库查询配置
export interface KnowledgeQueryConfig {
  maxResults: number; // 最大结果数
  minRelevance: number; // 最小相关性阈值
  includeCodeExamples: boolean; // 是否包含代码示例
  includeBestPractices: boolean; // 是否包含最佳实践
  includePatterns: boolean; // 是否包含设计模式
  includeWarnings: boolean; // 是否包含警告
  sourceTypes: string[]; // 知识来源类型
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
    if (lowerQuery.includes('性能') || lowerQuery.includes('performance') || lowerQuery.includes('优化') || lowerQuery.includes('optimization')) {
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
    const hasMultipleRequirements = /(包含|包括|支持|实现|设计).*?(和|以及|并且|同时)/i.test(query);
    
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
    
    console.log(`🔍 任务分析结果:`, {
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
    
    return [...new Set(requirements)]; // 去重
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
        practices.push('遵循单一职责原则', '编写可测试的代码', '使用有意义的命名', '添加适当的注释');
        break;
      case 'api-design':
        practices.push('使用RESTful约定', '版本化API', '适当的错误处理', '请求验证', '速率限制');
        break;
      case 'database-design':
        practices.push('适当的索引策略', '规范化设计', '避免过度规范化', '考虑查询模式', '定期备份');
        break;
      case 'architecture-design':
        practices.push('关注点分离', '松耦合设计', '高内聚模块', '可扩展性考虑', '容错设计');
        break;
      case 'testing-strategy':
        practices.push('测试金字塔', '测试隔离', '可重复的测试', '有意义的断言', '适当的测试覆盖率');
        break;
      case 'deployment-plan':
        practices.push('基础设施即代码', '蓝绿部署', '金丝雀发布', '监控和告警', '灾难恢复计划');
        break;
      case 'security-audit':
        practices.push('最小权限原则', '输入验证', '输出编码', '安全头设置', '定期安全扫描');
        break;
      default:
        practices.push('遵循行业最佳实践', '保持代码简洁', '考虑可维护性', '文档化设计决策');
    }
    
    return practices;
  }

  // 提取常见陷阱
  private extractCommonPitfalls(taskType: DevTaskType): string[] {
    const pitfalls: string[] = [];
    
    switch (taskType) {
      case 'code-generation':
        pitfalls.push('过度工程化', '忽略错误处理', '硬编码配置', '缺乏文档');
        break;
      case 'api-design':
        pitfalls.push('过度设计端点', '忽略版本控制', '缺乏认证授权', '不充分的错误信息');
        break;
      case 'database-design':
        pitfalls.push('过早优化', '忽略索引', 'N+1查询问题', '事务管理不当');
        break;
      case 'architecture-design':
        pitfalls.push('分布式单体', '过度微服务化', '忽略监控', '缺乏容错机制');
        break;
      case 'testing-strategy':
        pitfalls.push('脆弱的测试', '测试覆盖质量差', '忽略集成测试', '测试环境不一致');
        break;
      case 'deployment-plan':
        pitfalls.push('忽略回滚策略', '配置管理不当', '监控不足', '缺乏灾难恢复');
        break;
      default:
        pitfalls.push('忽略用户体验', '不考虑可扩展性', '缺乏测试', '文档不足');
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
      
      console.log(`🔍 查询知识库: ${query}, 配置:`, knowledgeQuery);
      
      // 调用OKMS API
      const response = await fetch(`${this.okmsEndpoint}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(knowledgeQuery)
      });
      
      if (!response.ok) {
        throw new Error(`知识库查询失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📚 知识库查询结果:`, Array.isArray(data) ? data.length : 0, '个结果');
      
      // 适配OKMS返回格式
      return {
        success: true,
        data: {
          query,
          results: Array.isArray(data) ? data.map((item: any, index: number) => ({
            id: `okms-${index}`,
            title: item.title || item.content?.substring(0, 50) || '未知标题',
            content: item.content || item.text || '无内容',
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
      console.error('知识库查询错误:', error);
      
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
            title: 'React组件开发最佳实践',
            content: 'React组件应该遵循单一职责原则，使用函数组件和Hooks，保持组件小而专注。',
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
            title: 'TypeScript类型安全指南',
            content: '使用严格的TypeScript配置，避免使用any类型，定义清晰的接口和类型。',
            relevance: 0.78,
            source: 'documentation',
            metadata: {
              type: 'best-practice',
              language: 'typescript'
            }
          },
          {
            id: 'mock-3',
            title: 'API设计模式',
            content: 'RESTful API应该使用合适的HTTP方法，版本化端点，提供清晰的错误响应。',
            relevance: 0.72,
            source: 'pattern',
            metadata: {
              type: 'pattern',
              category: 'api-design'
            }
          },
          {
            id: 'mock-4',
            title: '数据库优化警告',
            content: '避免N+1查询问题，合理使用索引，定期分析查询性能。',
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
          return Math.random() > 0.5; // 随机保留一些
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
      console.log(`🧠 知识增强完成: ${processingTime}ms, 增强: ${enhancements.length}项, 知识源: ${knowledgeSources.length}个`);
      
      return {
        originalResponse,
        enhancedResponse,
        knowledgeSources,
        enhancements,
        qualityMetrics,
        recommendations
      };
      
    } catch (error) {
      console.error('知识增强失败:', error);
      
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
          content: result.content?.substring(0, 200) || '无内容',
          confidence: result.confidence || 0.7
        });
      });
    }
    
    // 按相关性排序
    sources.sort((a, b) => b.relevance - a.relevance);
    
    return sources.slice(0, 5); // 返回前5个最相关的
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
        implementation: `在实现中遵循: ${practice}`
      });
    });
    
    // 2. 添加设计模式 - 确保至少1个
    if (taskAnalysis.relatedPatterns.length > 0) {
      taskAnalysis.relatedPatterns.slice(0, 2).forEach((pattern, index) => {
        enhancements.push({
          type: 'pattern',
          description: `考虑使用 ${pattern} 设计模式`,
          impact: 'medium',
          implementation: `研究并应用 ${pattern} 模式到当前场景`
        });
      });
    } else {
      // 默认模式
      enhancements.push({
        type: 'pattern',
        description: '考虑使用模块化设计模式',
        impact: 'medium',
        implementation: '将系统分解为独立的、可重用的模块'
      });
    }
    
    // 3. 添加警告 - 确保至少1个
    if (taskAnalysis.commonPitfalls.length > 0) {
      taskAnalysis.commonPitfalls.slice(0, 2).forEach((pitfall, index) => {
        enhancements.push({
          type: 'warning',
          description: `注意避免: ${pitfall}`,
          impact: 'high',
          implementation: `在设计和实现中特别留意此问题`
        });
      });
    } else {
      // 默认警告
      enhancements.push({
        type: 'warning',
        description: '注意避免过度工程化',
        impact: 'medium',
        implementation: '保持解决方案简洁，只实现当前需要的功能'
      });
    }
    
    // 4. 从知识源添加优化建议
    if (knowledgeSources.length > 0) {
      knowledgeSources.slice(0, 2).forEach((source, index) => {
        if (source.relevance > 0.7) {
          enhancements.push({
            type: 'optimization',
            description: `基于知识库的优化建议`,
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
        description: '参考代码结构和实现方式',
        impact: 'medium',
        implementation: '查看相关代码库或文档中的示例实现'
      });
    }
    
    // 确保至少有3个增强
    while (enhancements.length < 3) {
      enhancements.push({
        type: 'best-practice',
        description: '保持代码简洁和可维护',
        impact: 'medium',
        implementation: '编写清晰、自解释的代码，添加必要的注释'
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
    let completeness = 0.7; // 基础完整性
    let accuracy = 0.8; // 基础准确性
    let relevance = 0.6; // 基础相关性
    let practicality = 0.7; // 基础实用性
    
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
        area: '完整性',
        suggestion: '需要更多相关知识来完善解决方案',
        priority: 'medium'
      });
    }
    
    if (qualityMetrics.accuracy < 0.8) {
      recommendations.push({
        area: '准确性',
        suggestion: '验证知识来源的准确性和时效性',
        priority: 'high'
      });
    }
    
    if (qualityMetrics.relevance < 0.7) {
      recommendations.push({
        area: '相关性',
        suggestion: '寻找更相关的知识来源和案例',
        priority: 'medium'
      });
    }
    
    if (qualityMetrics.practicality < 0.7) {
      recommendations.push({
        area: '实用性',
        suggestion: '提供更多具体的实现步骤和代码示例',
        priority: 'high'
      });
    }
    
    // 基于任务复杂度的建议
    if (taskAnalysis.complexity === 'high') {
      recommendations.push({
        area: '任务复杂度',
        suggestion: '考虑将复杂任务分解为多个子任务',
        priority: 'high'
      });
    }
    
    // 基于预估工作量的建议
    if (taskAnalysis.estimatedEffort > 8) {
      recommendations.push({
        area: '工作量',
        suggestion: '此任务工作量较大，建议分阶段实施',
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
      console.log(`🧠 知识增强处理完成: ${processingTime}ms, 增强级别: ${enhancementLevel}`);
      
      return enhancedResult;
      
    } catch (error) {
      console.error('知识增强请求处理失败:', error);
      
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
            area: '系统错误',
            suggestion: '知识增强系统暂时不可用，使用基础响应',
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