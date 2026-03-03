/**
 * 智能需求分析服务
 * 使用AI分析需求文档，提取关键信息
 */

import { ParsedDocument } from './document-parser-service';

export interface RequirementAnalysis {
  id: string;
  documentId: string;
  analysisDate: string;
  
  // 需求分类
  categories: {
    functional: Array<{
      id: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      complexity: 'simple' | 'medium' | 'complex';
      estimatedEffort: number; // 小时
    }>;
    nonFunctional: Array<{
      id: string;
      type: 'performance' | 'security' | 'usability' | 'reliability' | 'scalability';
      description: string;
      requirements: string[];
    }>;
    business: Array<{
      id: string;
      description: string;
      businessValue: 'critical' | 'high' | 'medium' | 'low';
      stakeholders: string[];
    }>;
  };
  
  // 技术栈推荐
  techStack: {
    frontend: Array<{
      framework: string;
      recommendation: string;
      pros: string[];
      cons: string[];
      suitability: number; // 0-100
    }>;
    backend: Array<{
      framework: string;
      recommendation: string;
      pros: string[];
      cons: string[];
      suitability: number;
    }>;
    database: Array<{
      type: string;
      recommendation: string;
      pros: string[];
      cons: string[];
      suitability: number;
    }>;
    deployment: Array<{
      platform: string;
      recommendation: string;
      pros: string[];
      cons: string[];
      suitability: number;
    }>;
  };
  
  // 复杂度评估
  complexity: {
    overall: number; // 1-10
    technical: {
      score: number;
      factors: string[];
    };
    business: {
      score: number;
      factors: string[];
    };
    integration: {
      score: number;
      factors: string[];
    };
  };
  
  // 风险评估
  risks: Array<{
    id: string;
    description: string;
    probability: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
  
  // 工作量估算
  effortEstimation: {
    totalHours: number;
    breakdown: {
      analysis: number;
      design: number;
      development: number;
      testing: number;
      deployment: number;
      documentation: number;
    };
    teamSize: number;
    timeline: {
      optimistic: number; // 天
      realistic: number;
      pessimistic: number;
    };
  };
  
  // 依赖关系
  dependencies: Array<{
    from: string;
    to: string;
    type: 'technical' | 'business' | 'external';
    description: string;
  }>;
  
  // 建议
  recommendations: {
    immediateActions: string[];
    technicalDecisions: string[];
    riskMitigations: string[];
    successFactors: string[];
  };
}

export class RequirementsAnalyzerService {
  private grokApiKey: string;
  private knowledgeBaseUrl: string;

  constructor() {
    this.grokApiKey = process.env.GROK_API_KEY || '';
    this.knowledgeBaseUrl = process.env.KNOWLEDGE_BASE_URL || 'http://localhost:8000/api/v1';
  }

  /**
   * 分析需求文档
   */
  async analyzeDocument(document: ParsedDocument): Promise<RequirementAnalysis> {
    console.log(`Analyzing document: ${document.filename} (${document.metadata.wordCount} words)`);
    
    // 使用AI分析文档内容
    const aiAnalysis = await this.analyzeWithAI(document.content);
    
    // 结合知识库推荐技术栈
    const techStack = await this.recommendTechStack(document.content, aiAnalysis);
    
    // 评估复杂度和风险
    const complexity = this.assessComplexity(document, aiAnalysis);
    const risks = this.identifyRisks(document, aiAnalysis);
    
    // 估算工作量
    const effortEstimation = this.estimateEffort(document, aiAnalysis, complexity);
    
    // 生成分析结果
    const analysis: RequirementAnalysis = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId: document.id,
      analysisDate: new Date().toISOString(),
      
      categories: aiAnalysis.categories || {
        functional: [],
        nonFunctional: [],
        business: [],
      },
      
      techStack: techStack || {
        frontend: [],
        backend: [],
        database: [],
        deployment: [],
      },
      
      complexity: complexity || {
        overall: 5,
        technical: { score: 5, factors: [] },
        business: { score: 5, factors: [] },
        integration: { score: 5, factors: [] },
      },
      
      risks: risks || [],
      
      effortEstimation: effortEstimation || {
        totalHours: 160,
        breakdown: {
          analysis: 20,
          design: 30,
          development: 80,
          testing: 20,
          deployment: 5,
          documentation: 5,
        },
        teamSize: 2,
        timeline: {
          optimistic: 20,
          realistic: 30,
          pessimistic: 45,
        },
      },
      
      dependencies: aiAnalysis.dependencies || [],
      
      recommendations: {
        immediateActions: [
          '明确项目范围和目标',
          '确定关键利益相关者',
          '建立沟通机制',
          '制定详细的项目计划',
        ],
        technicalDecisions: [
          '选择合适的技术栈',
          '设计可扩展的架构',
          '制定代码规范和开发流程',
        ],
        riskMitigations: [
          '建立风险管理计划',
          '定期进行风险评估',
          '准备应急预案',
        ],
        successFactors: [
          '明确的需求定义',
          '有效的沟通协作',
          '合理的资源分配',
          '持续的质量保证',
        ],
      },
    };

    return analysis;
  }

  /**
   * 使用AI分析文档内容
   */
  private async analyzeWithAI(content: string): Promise<any> {
    // 简化实现：使用规则分析
    // 实际实现应该调用Grok API
    
    const truncatedContent = content.substring(0, 8000);
    
    // 检测功能需求关键词
    const functionalKeywords = ['功能', '特性', '模块', '页面', '按钮', '表单', '搜索', '登录', '注册', '支付'];
    const nonFunctionalKeywords = ['性能', '安全', '可用性', '可靠性', '扩展性', '响应时间', '并发', '备份'];
    const businessKeywords = ['业务', '商业', '收入', '成本', '市场', '客户', '竞争', '价值'];
    
    const functionalReqs: Array<{ id: string; description: string; priority: 'high' | 'medium' | 'low'; complexity: 'simple' | 'medium' | 'complex'; estimatedEffort: number }> = [];
    const nonFunctionalReqs: Array<{ id: string; type: 'performance' | 'security' | 'usability' | 'reliability' | 'scalability'; description: string; requirements: string[] }> = [];
    const businessReqs: Array<{ id: string; description: string; businessValue: 'critical' | 'high' | 'medium' | 'low'; stakeholders: string[] }> = [];
    
    // 简单规则分析
    const lines = truncatedContent.split('\n');
    let currentCategory = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('功能需求') || line.includes('Functional Requirements')) {
        currentCategory = 'functional';
      } else if (line.includes('非功能需求') || line.includes('Non-Functional')) {
        currentCategory = 'nonFunctional';
      } else if (line.includes('业务需求') || line.includes('Business Requirements')) {
        currentCategory = 'business';
      }
      
      // 检测需求行
      if (line.match(/^\d+\.\s+/) || line.match(/^-\s+/) || line.match(/^\*\s+/)) {
        const requirementText = line.replace(/^\d+\.\s+/, '').replace(/^-\s+/, '').replace(/^\*\s+/, '');
        
        if (currentCategory === 'functional' && requirementText.length > 10) {
          functionalReqs.push({
            id: `FR${functionalReqs.length + 1}`,
            description: requirementText,
            priority: this.determinePriority(requirementText),
            complexity: this.determineComplexity(requirementText),
            estimatedEffort: this.estimateRequirementEffort(requirementText),
          });
        }
      }
    }
    
    // 如果没有检测到明确的需求，从内容中提取
    if (functionalReqs.length === 0) {
      // 提取前5个可能的功能需求
      const sentences = truncatedContent.split(/[.!?。！？]/).filter(s => s.trim().length > 20);
      for (let i = 0; i < Math.min(5, sentences.length); i++) {
        const sentence = sentences[i].trim();
        if (sentence.length > 10) {
          functionalReqs.push({
            id: `FR${i + 1}`,
            description: sentence,
            priority: 'medium',
            complexity: 'medium',
            estimatedEffort: 8,
          });
        }
      }
    }
    
    return {
      categories: {
        functional: functionalReqs,
        nonFunctional: nonFunctionalReqs,
        business: businessReqs,
      },
      dependencies: [],
    };
  }

  /**
   * 推荐技术栈
   */
  private async recommendTechStack(content: string, aiAnalysis: any): Promise<RequirementAnalysis['techStack']> {
    // 基于内容分析推荐技术栈
    const contentLower = content.toLowerCase();
    
    const isWebApp = contentLower.includes('web') || contentLower.includes('网站') || contentLower.includes('应用');
    const isMobile = contentLower.includes('mobile') || contentLower.includes('手机') || contentLower.includes('app');
    const isApi = contentLower.includes('api') || contentLower.includes('接口') || contentLower.includes('服务');
    const needsRealTime = contentLower.includes('实时') || contentLower.includes('即时') || contentLower.includes('聊天');
    const needsComplexUI = contentLower.includes('复杂') || contentLower.includes('交互') || contentLower.includes('动画');
    
    // 前端推荐
    const frontendRecommendations = [];
    
    if (isWebApp) {
      frontendRecommendations.push({
        framework: 'Next.js',
        recommendation: '适用于需要SEO、服务端渲染的Web应用',
        pros: ['优秀的SEO支持', '服务端渲染', '完整的React生态', 'TypeScript友好'],
        cons: ['学习曲线较陡', '配置相对复杂'],
        suitability: 90,
      });
      
      frontendRecommendations.push({
        framework: 'React + Vite',
        recommendation: '适用于单页应用和快速原型开发',
        pros: ['开发速度快', '热重载优秀', '生态系统丰富'],
        cons: ['SEO需要额外配置', '首屏加载可能较慢'],
        suitability: 85,
      });
    }
    
    if (isMobile) {
      frontendRecommendations.push({
        framework: 'React Native',
        recommendation: '适用于需要跨平台移动应用',
        pros: ['跨平台开发', 'React知识复用', '热重载'],
        cons: ['性能不如原生', '某些原生功能需要桥接'],
        suitability: 80,
      });
    }
    
    // 后端推荐
    const backendRecommendations = [];
    
    backendRecommendations.push({
      framework: 'NestJS',
      recommendation: '适用于企业级应用，需要严格架构',
      pros: ['TypeScript原生支持', '模块化架构', '丰富的生态系统', '易于测试'],
      cons: ['学习曲线较陡', '配置相对复杂'],
      suitability: 85,
    });
    
    backendRecommendations.push({
      framework: 'Express.js',
      recommendation: '适用于快速原型和小型项目',
      pros: ['简单易学', '轻量级', '中间件丰富', '社区活跃'],
      cons: ['架构需要自行设计', 'TypeScript支持需要配置'],
      suitability: 75,
    });
    
    if (needsRealTime) {
      backendRecommendations.push({
        framework: 'Socket.io',
        recommendation: '适用于实时通信需求',
        pros: ['实时双向通信', '自动重连', '房间和命名空间'],
        cons: ['需要WebSocket支持', '可能增加服务器负载'],
        suitability: 95,
      });
    }
    
    // 数据库推荐
    const databaseRecommendations = [];
    
    databaseRecommendations.push({
      type: 'PostgreSQL',
      recommendation: '适用于需要ACID事务和复杂查询的应用',
      pros: ['ACID兼容', 'JSON支持', '强大的查询功能', '扩展性好'],
      cons: ['配置相对复杂', '内存占用较高'],
      suitability: 90,
    });
    
    databaseRecommendations.push({
      type: 'MongoDB',
      recommendation: '适用于文档型数据和快速迭代',
      pros: ['灵活的模式', '水平扩展容易', 'JSON文档存储', '开发速度快'],
      cons: ['不支持事务（旧版本）', '查询性能可能不如关系型'],
      suitability: 80,
    });
    
    // 部署平台推荐
    const deploymentRecommendations = [];
    
    deploymentRecommendations.push({
      platform: 'Azure App Service',
      recommendation: '适用于.NET和Node.js应用，企业级支持',
      pros: ['自动扩展', '集成监控', '.NET优化', '企业级安全'],
      cons: ['成本相对较高', '配置相对复杂'],
      suitability: 85,
    });
    
    deploymentRecommendations.push({
      platform: 'Vercel',
      recommendation: '适用于Next.js前端应用',
      pros: ['Next.js优化', '自动部署', 'CDN集成', '开发体验优秀'],
      cons: ['后端支持有限', '成本随流量增长'],
      suitability: 95,
    });
    
    deploymentRecommendations.push({
      platform: 'AWS EC2/ECS',
      recommendation: '适用于需要完全控制的基础设施',
      pros: ['完全控制', '灵活配置', '丰富的服务集成'],
      cons: ['运维复杂', '需要专业知识'],
      suitability: 70,
    });
    
    return {
      frontend: frontendRecommendations,
      backend: backendRecommendations,
      database: databaseRecommendations,
      deployment: deploymentRecommendations,
    };
  }

  /**
   * 评估复杂度
   */
  private assessComplexity(document: ParsedDocument, aiAnalysis: any): RequirementAnalysis['complexity'] {
    const wordCount = document.metadata.wordCount;
    const sections = document.sections?.length || 1;
    
    // 基于文档大小和结构评估复杂度
    let overall = 5;
    
    if (wordCount > 5000) overall += 2;
    if (wordCount > 10000) overall += 1;
    if (sections > 10) overall += 1;
    
    // 技术复杂度
    const technicalFactors: string[] = [];
    if (wordCount > 3000) technicalFactors.push('需求规模较大');
    if (sections > 5) technicalFactors.push('功能模块较多');
    
    // 业务复杂度
    const businessFactors: string[] = [];
    if (document.content.includes('业务') || document.content.includes('business')) {
      businessFactors.push('涉及复杂业务逻辑');
    }
    
    // 集成复杂度
    const integrationFactors: string[] = [];
    if (document.content.includes('集成') || document.content.includes('integration')) {
      integrationFactors.push('需要系统集成');
    }
    if (document.content.includes('API') || document.content.includes('接口')) {
      integrationFactors.push('涉及API开发');
    }
    
    return {
      overall: Math.min(10, Math.max(1, overall)),
      technical: {
        score: Math.min(10, Math.max(1, overall + (technicalFactors.length > 0 ? 1 : 0))),
        factors: technicalFactors,
      },
      business: {
        score: Math.min(10, Math.max(1, 5 + (businessFactors.length > 0 ? 2 : 0))),
        factors: businessFactors,
      },
      integration: {
        score: Math.min(10, Math.max(1, 5 + (integrationFactors.length > 0 ? 2 : 0))),
        factors: integrationFactors,
      },
    };
  }

  /**
   * 识别风险
   */
  private identifyRisks(document: ParsedDocument, aiAnalysis: any): RequirementAnalysis['risks'] {
    const risks: RequirementAnalysis['risks'] = [];
    const content = document.content.toLowerCase();
    
    // 需求不明确风险
    if (content.includes('待定') || content.includes('tbd') || content.includes('待确认')) {
      risks.push({
        id: 'R1',
        description: '需求不明确，存在待定项',
        probability: 'high',
        impact: 'high',
        mitigation: '与客户确认需求细节，建立需求变更流程',
      });
    }
    
    // 技术复杂度风险
    if (content.includes('复杂') || content.includes('complex') || content.includes('新技术')) {
      risks.push({
        id: 'R2',
        description: '技术复杂度较高，可能存在技术挑战',
        probability: 'medium',
        impact: 'high',
        mitigation: '进行技术验证，准备备用方案，增加技术调研时间',
      });
    }
    
    // 时间风险
    if (document.metadata.wordCount > 5000) {
      risks.push({
        id: 'R3',
        description: '项目规模较大，可能存在时间压力',
        probability: 'medium',
        impact: 'medium',
        mitigation: '制定详细的时间计划，设置里程碑，定期进度检查',
      });
    }
    
    // 集成风险
    if (content.includes('集成') || content.includes('integration') || content.includes('第三方')) {
      risks.push({
        id
        id: `risk-${risks.length}`, title: '集成风险', description: '存在第三方集成风险', severity: 'medium', probability: 'medium', impact: 'medium', mitigation: '评估集成复杂度'
      });
    }
    return risks;
  }
}
