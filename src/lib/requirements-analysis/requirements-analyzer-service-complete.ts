/**
 * 智canRequirements Analysisservervice
 * usingAIAnalyticsrequirementsdocument, 提取Off键information
 */

/**
 * SecurityParsedateString
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
  
  // requirementsCategory
  categories: {
    functional: Array<{
      id: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      complexity: 'simple' | 'medium' | 'complex';
      estimatedEffort: number; // Small时
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
  
  // 技术栈recommended
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
  
  // complexityEvaluation
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
  
  // riskEvaluation
  risks: Array<{
    id: string;
    description: string;
    probability: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
  
  // Work量估算
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
      optimistic: number; // d
      realistic: number;
      pessimistic: number;
    };
  };
  
  // 依赖Off系
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

export class RequirementsAnalyzerservervice {
  private grokApiKey: string;
  private knowledgeBaseUrl: string;

  constructor() {
    this.grokApiKey = process.env.GROK_API_KEY || '';
    this.knowledgeBaseUrl = process.env.KNOWLEDGE_BASE_URL || 'http://localhost:8000/api/v1';
  }

  /**
   * Analyticsrequirementsdocument
   */
  async analyzeDocument(document: ParsedDocument): Promise<RequirementAnalysis> {
    console.log(`Analyzing document: ${document.filename} (${document.metadata.wordCount} words)`);
    
    // usingAIAnalyticsdocumentcontent
    const aiAnalysis = await this.analyzeWithAI(document.content);
    
    // 结合Knowledge Baserecommended技术栈
    const techStack = await this.recommendTechStack(document.content, aiAnalysis);
    
    // Evaluationcomplexity和risk
    const complexity = this.assessComplexity(document, aiAnalysis);
    const risks = this.identifyRisks(document, aiAnalysis);
    
    // 估算Work量
    const effortEstimation = this.estimateEffort(document, aiAnalysis, complexity);
    
    // GenerateAnalyticsresult
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
          '明确Project范围和目标',
          '确定Off键利益相Off者',
          '建立communication机制',
          '制定Detailed'sProject计划',
        ],
        technicalDecisions: [
          '选择合适's技术栈',
          '设计可extend's架构',
          '制定code规范和DevelopmentProcess',
        ],
        riskMitigations: [
          '建立risk管理计划',
          '定期In ProgressriskEvaluation',
          '准备应急预案',
        ],
        successFactors: [
          '明确'srequirements定义',
          'All效'scommunicationcollaboration',
          '合理'sresource分配',
          '持续's质量保证',
        ],
      },
    };

    return analysis;
  }

  /**
   * usingAIAnalyticsdocumentcontent
   */
  private async analyzeWithAI(content: string): Promise<any> {
    // 简化实现: using规thenAnalytics
    // 实际实现should调用Grok API
    
    const truncatedContent = content.substring(0, 8000);
    
    // 检测功canrequirementsOff键词
    const functionalKeywords = ['功can', '特性', 'Module', '页面', 'by钮', '表单', 'Search', '登录', 'Register', '支付'];
    const nonFunctionalKeywords = ['Performance', 'Security', 'available性', 'reliability', 'extend性', 'Responsetime', 'and发', 'Backup'];
    const businessKeywords = ['业务', '商业', 'Income', '成本', '市场', 'client', '竞争', '价值'];
    
    const functionalReqs: Array<{ id: string; description: string; priority: 'high' | 'medium' | 'low'; complexity: 'simple' | 'medium' | 'complex'; estimatedEffort: number }> = [];
    const nonFunctionalReqs: Array<{ id: string; type: 'performance' | 'security' | 'usability' | 'reliability' | 'scalability'; description: string; requirements: string[] }> = [];
    const businessReqs: Array<{ id: string; description: string; businessValue: 'critical' | 'high' | 'medium' | 'low'; stakeholders: string[] }> = [];
    
    // 简单规thenAnalytics
    const lines = truncatedContent.split('\n');
    let currentCategory = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('功canrequirements') || line.includes('Functional Requirements')) {
        currentCategory = 'functional';
      } else if (line.includes('非功canrequirements') || line.includes('Non-Functional')) {
        currentCategory = 'nonFunctional';
      } else if (line.includes('Business requirements') || line.includes('Business Requirements')) {
        currentCategory = 'business';
      }
      
      // 检测requirements行
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
    
    // if没All检测to明确'srequirements, FromcontentCenter提取
    if (functionalReqs.length === 0) {
      // 提取前5potential functional requirements
      const sentences = truncatedContent.split(/[.!?. ! ? ]/).filter(s => s.trim().length > 20);
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
   * recommended技术栈
   */
  private async recommendTechStack(content: string, aiAnalysis: any): Promise<RequirementAnalysis['techStack']> {
    // 基于contentAnalyticsrecommended技术栈
    const contentLower = content.toLowerCase();
    
    const isWebApp = contentLower.includes('web') || contentLower.includes('网站') || contentLower.includes('Application');
    const isMobile = contentLower.includes('mobile') || contentLower.includes('手机') || contentLower.includes('app');
    const isApi = contentLower.includes('api') || contentLower.includes('Interface') || contentLower.includes('servervice');
    const needsRealTime = contentLower.includes('实时') || contentLower.includes('i.e.时') || contentLower.includes('聊d');
    const needsComplexUI = contentLower.includes('复杂') || contentLower.includes('交互') || contentLower.includes('动画');
    
    // 前端recommended
    const frontendRecommendations = [];
    
    if (isWebApp) {
      frontendRecommendations.push({
        framework: 'Next.js',
        recommendation: '适用于need toSEO, servervice端渲染'sWebApplication',
        pros: ['Excellent'sSEO支持', 'servervice端渲染', '完整'sReact生态', 'TypeScript友好'],
        cons: ['学习曲线较陡', 'Configuration相for复杂'],
        suitability: 90,
      });
      
      frontendRecommendations.push({
        framework: 'React + Vite',
        recommendation: '适用于单页Application和快速原型Development',
        pros: ['Development速度快', '热重载Excellent', '生态System丰富'],
        cons: ['SEOneed to额外Configuration', '首屏Load可canSlow'],
        suitability: 85,
      });
    }
    
    if (isMobile) {
      frontendRecommendations.push({
        framework: 'React Native',
        recommendation: '适用于need to跨PlatformmoveApplication',
        pros: ['跨PlatformDevelopment', 'React知识复用', '热重载'],
        cons: ['Performance不如原生', '某些原生功canneed to桥接'],
        suitability: 80,
      });
    }
    
    // 后端recommended
    const backendRecommendations = [];
    
    backendRecommendations.push({
      framework: 'NestJS',
      recommendation: '适用于enterprise级Application, need to严格架构',
      pros: ['TypeScript原生支持', 'Module化架构', '丰富's生态System', '易于Test'],
      cons: ['学习曲线较陡', 'Configuration相for复杂'],
      suitability: 85,
    });
    
    backendRecommendations.push({
      framework: 'Express.js',
      recommendation: '适用于快速原型和Small型Project',
      pros: ['简单易学', '轻量级', 'Center间件丰富', '社区Active'],
      cons: ['架构need to自行设计', 'TypeScript支持need toConfiguration'],
      suitability: 75,
    });
    
    if (needsRealTime) {
      backendRecommendations.push({
        framework: 'Socket.io',
        recommendation: '适用于实时通信requirements',
        pros: ['实时双to通信', '自动重连', '房间和命名null间'],
        cons: ['need toWebSocket支持', '可canincreaseservervice器负载'],
        suitability: 95,
      });
    }
    
    // data库recommended
    const databaseRecommendations = [];
    
    databaseRecommendations.push({
      type: 'PostgreSQL',
      recommendation: '适用于need toACID事务和复杂查询'sApplication',
      pros: ['ACID兼容', 'JSON支持', '强Large's查询功can', 'extend性好'],
      cons: ['Configuration相for复杂', '内存占用较High'],
      suitability: 90,
    });
    
    databaseRecommendations.push({
      type: 'MongoDB',
      recommendation: '适用于document型data和快速iterate',
      pros: ['灵活's模式', '水平extend容易', 'JSONdocument存储', 'Development速度快'],
      cons: ['Transactions not supported (legacy version)', '查询Performance可can不如Off系型'],
      suitability: 80,
    });
    
    // DeploymentPlatformrecommended
    const deploymentRecommendations = [];
    
    deploymentRecommendations.push({
      platform: 'Azure App servervice',
      recommendation: '适用于.NET和Node.jsApplication, enterprise级支持',
      pros: ['自动extend', '集成Monitoring', '.NEToptimize', 'enterprise级Security'],
      cons: ['成本相for较High', 'Configuration相for复杂'],
      suitability: 85,
    });
    
    deploymentRecommendations.push({
      platform: 'Vercel',
      recommendation: '适用于Next.js前端Application',
      pros: ['Next.jsoptimize', '自动Deployment', 'CDN集成', 'Development体验Excellent'],
      cons: ['后端支持All限', '成本随流量growth'],
      suitability: 95,
    });
    
    deploymentRecommendations.push({
      platform: 'AWS EC2/ECS',
      recommendation: '适用于need to完Allcontrol'sInfrastructure',
      pros: ['完Allcontrol', '灵活Configuration', '丰富'sservervice集成'],
      cons: ['运维复杂', 'need to专业知识'],
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
   * Evaluationcomplexity
   */
  private assessComplexity(document: ParsedDocument, aiAnalysis: any): RequirementAnalysis['complexity'] {
    const wordCount = document.metadata.wordCount;
    const sections = document.sections?.length || 1;
    
    // 基于documentLargeSmall和结构Evaluationcomplexity
    let overall = 5;
    
    if (wordCount > 5000) overall += 2;
    if (wordCount > 10000) overall += 1;
    if (sections > 10) overall += 1;
    
    // 技术complexity
    const technicalFactors: string[] = [];
    if (wordCount > 3000) technicalFactors.push('requirements规模较Large');
    if (sections > 5) technicalFactors.push('功canModule较More');
    
    // Business complexity
    const businessFactors: string[] = [];
    if (document.content.includes('业务') || document.content.includes('business')) {
      businessFactors.push('涉及复杂业务逻辑');
    }
    
    // 集成complexity
    const integrationFactors: string[] = [];
    if (document.content.includes('集成') || document.content.includes('integration')) {
      integrationFactors.push('need toSystem集成');
    }
    if (document.content.includes('API') || document.content.includes('Interface')) {
      integrationFactors.push('涉及APIDevelopment');
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
   * 识别risk
   */
  private identifyRisks(document: ParsedDocument, aiAnalysis: any): RequirementAnalysis['risks'] {
    const risks: RequirementAnalysis['risks'] = [];
    const content = document.content.toLowerCase();
    
    // requirements不明确risk
    if (content.includes('待定') || content.includes('tbd') || content.includes('待Confirm')) {
      risks.push({
        id: 'R1',
        description: 'requirements不明确, 存in待定项',
        probability: 'high',
        impact: 'high',
        mitigation: 'andclientConfirmrequirements细节, 建立requirements变更Process',
      });
    }
    
    // 技术complexityrisk
    if (content.includes('复杂') || content.includes('complex') || content.includes('New技术')) {
      risks.push({
        id: 'R2',
        description: '技术complexity较High, 可can存in技术挑战',
        probability: 'medium',
        impact: 'high',
        mitigation: 'In Progress技术Validate, 准备备用方案, increase技术调研time',
      });
    }
    
    // timerisk
    if (document.metadata.wordCount > 5000) {
      risks.push({
        id: 'R3',
        description: 'Project规模较Large, 可can存intime压力',
        probability: 'medium',
        impact: 'medium',
        mitigation: '制定Detailed'stime计划, Settingsmilestone, 定期ProgressCheck',
      });
    }
    
    // 集成risk
    if (content.includes('集成') || content.includes('integration') || content.includes('第三方')) {
      risks.push({
        id:
        id: `risk-${risks.length}`, title: '集成risk', description: '存in第三方集成risk', severity: 'medium', probability: 'medium', impact: 'medium', mitigation: 'Evaluation集成complexity'
      });
    }
    return risks;
  }
}
