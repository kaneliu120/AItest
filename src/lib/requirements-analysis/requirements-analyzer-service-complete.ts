/**
 * 智能需求分析服务
 * 使用AI分析需求文档，提取关键信息
 */

/**
 * 安全解析日期字符串
 */
const parseDate = (dateString: string): Date => {
  const timestamp = Date.parse(dateString);
  if (isNaN(timestamp)) {
    console.warn('Invalid date string:', dateString);
    return new Date();
  }
  return new Date(timestamp);
};


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
      estimatedEffort: number; // hours
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
      optimistic: number; // days
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
          'Clarify project scope and objectives',
          'Identify key stakeholders',
          'Establish communication channels',
          'Create a detailed project plan',
        ],
        technicalDecisions: [
          'Select the appropriate tech stack',
          'Design a scalable architecture',
          'Define code standards and development processes',
        ],
        riskMitigations: [
          'Establish a risk management plan',
          'Conduct regular risk assessments',
          'Prepare contingency plans',
        ],
        successFactors: [
          'Clear requirements definition',
          'Effective communication and collaboration',
          'Reasonable resource allocation',
          'Continuous quality assurance',
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
    const needsRealTime = contentLower.includes('实时') || contentLower.includes('即时') || contentLower.includes('聊天') || contentLower.includes('realtime') || contentLower.includes('chat');
    const needsComplexUI = contentLower.includes('复杂') || contentLower.includes('交互') || contentLower.includes('动画');
    
    // 前端推荐
    const frontendRecommendations = [];
    
    if (isWebApp) {
      frontendRecommendations.push({
        framework: 'Next.js',
        recommendation: 'Ideal for SEO and server-side rendering web apps',
        pros: ['Excellent SEO support', 'Server-side rendering', 'Full React ecosystem', 'TypeScript-friendly'],
        cons: ['Steeper learning curve', 'More complex configuration'],
        suitability: 90,
      });
      
      frontendRecommendations.push({
        framework: 'React + Vite',
        recommendation: 'Ideal for single-page apps and rapid prototyping',
        pros: ['Fast development', 'Excellent hot reload', 'Rich ecosystem'],
        cons: ['SEO requires extra configuration', 'First-screen load may be slower'],
        suitability: 85,
      });
    }
    
    if (isMobile) {
      frontendRecommendations.push({
        framework: 'React Native',
        recommendation: 'Ideal for cross-platform mobile applications',
        pros: ['Cross-platform development', 'Reusable React knowledge', 'Hot reload'],
        cons: ['Performance inferior to native', 'Some native features require bridging'],
        suitability: 80,
      });
    }
    
    // 后端推荐
    const backendRecommendations = [];
    
    backendRecommendations.push({
      framework: 'NestJS',
      recommendation: 'Ideal for enterprise-grade apps requiring strict architecture',
      pros: ['Native TypeScript support', 'Modular architecture', 'Rich ecosystem', 'Easy to test'],
      cons: ['Steeper learning curve', 'More complex configuration'],
      suitability: 85,
    });
    
    backendRecommendations.push({
      framework: 'Express.js',
      recommendation: 'Ideal for rapid prototyping and small projects',
      pros: ['Easy to learn', 'Lightweight', 'Rich middleware', 'Active community'],
      cons: ['Architecture must be self-designed', 'TypeScript support requires configuration'],
      suitability: 75,
    });
    
    if (needsRealTime) {
      backendRecommendations.push({
        framework: 'Socket.io',
        recommendation: 'Ideal for real-time communication requirements',
        pros: ['Real-time bidirectional communication', 'Auto-reconnect', 'Rooms and namespaces'],
        cons: ['Requires WebSocket support', 'May increase server load'],
        suitability: 95,
      });
    }
    
    // 数据库推荐
    const databaseRecommendations = [];
    
    databaseRecommendations.push({
      type: 'PostgreSQL',
      recommendation: 'Ideal for apps requiring ACID transactions and complex queries',
      pros: ['ACID compliant', 'JSON support', 'Powerful query capabilities', 'Good extensibility'],
      cons: ['More complex configuration', 'Higher memory usage'],
      suitability: 90,
    });
    
    databaseRecommendations.push({
      type: 'MongoDB',
      recommendation: 'Ideal for document data and rapid iteration',
      pros: ['Flexible schema', 'Easy horizontal scaling', 'JSON document storage', 'Fast development'],
      cons: ['No transaction support (older versions)', 'Query performance may be lower than relational'],
      suitability: 80,
    });
    
    // 部署平台推荐
    const deploymentRecommendations = [];
    
    deploymentRecommendations.push({
      platform: 'Azure App Service',
      recommendation: 'Ideal for .NET and Node.js apps, enterprise-grade support',
      pros: ['Auto-scaling', 'Integrated monitoring', '.NET optimized', 'Enterprise security'],
      cons: ['Relatively higher cost', 'More complex configuration'],
      suitability: 85,
    });
    
    deploymentRecommendations.push({
      platform: 'Vercel',
      recommendation: 'Ideal for Next.js frontend applications',
      pros: ['Next.js optimized', 'Auto deployment', 'CDN integration', 'Excellent developer experience'],
      cons: ['Limited backend support', 'Cost grows with traffic'],
      suitability: 95,
    });
    
    deploymentRecommendations.push({
      platform: 'AWS EC2/ECS',
      recommendation: 'Ideal for infrastructure requiring full control',
      pros: ['Full control', 'Flexible configuration', 'Rich service integrations'],
      cons: ['Complex operations', 'Requires specialized knowledge'],
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
    if (wordCount > 3000) technicalFactors.push('Large requirement scope');
    if (sections > 5) technicalFactors.push('Multiple functional modules');
    
    // 业务复杂度
    const businessFactors: string[] = [];
    if (document.content.includes('业务') || document.content.includes('business')) {
      businessFactors.push('Contains complex business logic');
    }
    
    // 集成复杂度
    const integrationFactors: string[] = [];
    if (document.content.includes('集成') || document.content.includes('integration')) {
      integrationFactors.push('Requires system integration');
    }
    if (document.content.includes('API') || document.content.includes('接口')) {
      integrationFactors.push('Involves API development');
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
        description: 'Requirements unclear, pending items exist',
        probability: 'high',
        impact: 'high',
        mitigation: 'Confirm requirement details with client, establish change management process',
      });
    }
    
    // 技术复杂度风险
    if (content.includes('复杂') || content.includes('complex') || content.includes('新技术')) {
      risks.push({
        id: 'R2',
        description: 'High technical complexity with potential technical challenges',
        probability: 'medium',
        impact: 'high',
        mitigation: 'Conduct technical validation, prepare fallback plans, add research time',
      });
    }
    
    // 时间风险
    if (document.metadata.wordCount > 5000) {
      risks.push({
        id: 'R3',
        description: 'Large project scale with potential time pressure',
        probability: 'medium',
        impact: 'medium',
        mitigation: 'Create detailed schedule, set milestones, perform regular progress reviews',
      });
    }
    
    // 集成风险
    if (content.includes('集成') || content.includes('integration') || content.includes('第三方')) {
      risks.push({
        id:
        id: `risk-${risks.length}`, title: 'Integration Risk', description: 'Third-party integration risk exists', severity: 'medium', probability: 'medium', impact: 'medium', mitigation: 'Assess integration complexity'
      });
    }
    return risks;
  }
}
