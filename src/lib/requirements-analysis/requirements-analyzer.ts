/**
 * 智能需求分析服务 - 简化版本
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
      estimatedEffort: number;
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
      suitability: number;
    }>;
    backend: Array<{
      framework: string;
      recommendation: string;
      suitability: number;
    }>;
    database: Array<{
      type: string;
      recommendation: string;
      suitability: number;
    }>;
    deployment: Array<{
      platform: string;
      recommendation: string;
      suitability: number;
    }>;
  };
  
  // 复杂度评估
  complexity: {
    overall: number;
    technical: { score: number; factors: string[] };
    business: { score: number; factors: string[] };
    integration: { score: number; factors: string[] };
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
      optimistic: number;
      realistic: number;
      pessimistic: number;
    };
  };
  
  // 建议
  recommendations: {
    immediateActions: string[];
    technicalDecisions: string[];
    riskMitigations: string[];
    successFactors: string[];
  };
}

export class RequirementsAnalyzer {
  constructor() {}

  async analyzeDocument(document: ParsedDocument): Promise<RequirementAnalysis> {
    console.log(`Analyzing document: ${document.filename}`);
    
    // 提取功能需求
    const functionalReqs = this.extractFunctionalRequirements(document.content);
    const nonFunctionalReqs = this.extractNonFunctionalRequirements(document.content);
    const businessReqs = this.extractBusinessRequirements(document.content);
    
    // 推荐技术栈
    const techStack = this.recommendTechStack(document.content);
    
    // 评估复杂度
    const complexity = this.assessComplexity(document);
    
    // 识别风险
    const risks = this.identifyRisks(document);
    
    // 估算工作量
    const effortEstimation = this.estimateEffort(document, functionalReqs.length);
    
    return {
      id: `analysis_${Date.now()}`,
      documentId: document.id,
      analysisDate: new Date().toISOString(),
      
      categories: {
        functional: functionalReqs,
        nonFunctional: nonFunctionalReqs,
        business: businessReqs,
      },
      
      techStack,
      
      complexity,
      
      risks,
      
      effortEstimation,
      
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
  }

  private extractFunctionalRequirements(content: string): RequirementAnalysis['categories']['functional'] {
    const requirements: RequirementAnalysis['categories']['functional'] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检测需求行
      if (line.match(/^\d+\.\s+/) || line.match(/^-\s+/) || line.match(/^\*\s+/)) {
        const text = line.replace(/^\d+\.\s+/, '').replace(/^-\s+/, '').replace(/^\*\s+/, '');
        
        if (text.length > 10) {
          requirements.push({
            id: `FR${requirements.length + 1}`,
            description: text,
            priority: this.determinePriority(text),
            complexity: this.determineComplexity(text),
            estimatedEffort: this.estimateRequirementEffort(text),
          });
        }
      }
    }
    
    // 如果没有检测到明确的需求，从内容中提取
    if (requirements.length === 0) {
      const sentences = content.split(/[.!?。！？]/).filter(s => s.trim().length > 20);
      for (let i = 0; i < Math.min(5, sentences.length); i++) {
        const sentence = sentences[i].trim();
        if (sentence.length > 10) {
          requirements.push({
            id: `FR${i + 1}`,
            description: sentence,
            priority: 'medium',
            complexity: 'medium',
            estimatedEffort: 8,
          });
        }
      }
    }
    
    return requirements;
  }

  private extractNonFunctionalRequirements(content: string): RequirementAnalysis['categories']['nonFunctional'] {
    const requirements: RequirementAnalysis['categories']['nonFunctional'] = [];
    const contentLower = content.toLowerCase();
    
    // 性能需求
    if (contentLower.includes('性能') || contentLower.includes('performance')) {
      requirements.push({
        id: 'NFR1',
        type: 'performance',
        description: '系统性能要求',
        requirements: ['响应时间 < 2秒', '支持100并发用户', '99.9%可用性'],
      });
    }
    
    // 安全需求
    if (contentLower.includes('安全') || contentLower.includes('security')) {
      requirements.push({
        id: 'NFR2',
        type: 'security',
        description: '系统安全要求',
        requirements: ['用户认证和授权', '数据加密', '防止SQL注入'],
      });
    }
    
    return requirements;
  }

  private extractBusinessRequirements(content: string): RequirementAnalysis['categories']['business'] {
    const requirements: RequirementAnalysis['categories']['business'] = [];
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('业务') || contentLower.includes('business')) {
      requirements.push({
        id: 'BR1',
        description: '业务目标和价值',
        businessValue: 'high',
        stakeholders: ['客户', '用户', '管理团队'],
      });
    }
    
    return requirements;
  }

  private recommendTechStack(content: string): RequirementAnalysis['techStack'] {
    const contentLower = content.toLowerCase();
    const isWebApp = contentLower.includes('web') || contentLower.includes('网站');
    const isMobile = contentLower.includes('mobile') || contentLower.includes('手机');
    
    return {
      frontend: [
        {
          framework: 'Next.js',
          recommendation: '适用于需要SEO、服务端渲染的Web应用',
          suitability: isWebApp ? 90 : 70,
        },
        {
          framework: 'React + Vite',
          recommendation: '适用于单页应用和快速原型开发',
          suitability: isWebApp ? 85 : 75,
        },
      ],
      backend: [
        {
          framework: 'NestJS',
          recommendation: '适用于企业级应用，需要严格架构',
          suitability: 85,
        },
        {
          framework: 'Express.js',
          recommendation: '适用于快速原型和小型项目',
          suitability: 75,
        },
      ],
      database: [
        {
          type: 'PostgreSQL',
          recommendation: '适用于需要ACID事务和复杂查询的应用',
          suitability: 90,
        },
        {
          type: 'MongoDB',
          recommendation: '适用于文档型数据和快速迭代',
          suitability: 80,
        },
      ],
      deployment: [
        {
          platform: 'Azure App Service',
          recommendation: '适用于.NET和Node.js应用，企业级支持',
          suitability: 85,
        },
        {
          platform: 'Vercel',
          recommendation: '适用于Next.js前端应用',
          suitability: 95,
        },
      ],
    };
  }

  private assessComplexity(document: ParsedDocument): RequirementAnalysis['complexity'] {
    const wordCount = document.metadata.wordCount;
    let overall = 5;
    
    if (wordCount > 5000) overall += 2;
    if (wordCount > 10000) overall += 1;
    
    const technicalFactors: string[] = [];
    if (wordCount > 3000) technicalFactors.push('需求规模较大');
    
    const businessFactors: string[] = [];
    if (document.content.includes('业务')) businessFactors.push('涉及业务逻辑');
    
    const integrationFactors: string[] = [];
    if (document.content.includes('集成')) integrationFactors.push('需要系统集成');
    
    return {
      overall: Math.min(10, Math.max(1, overall)),
      technical: { score: overall, factors: technicalFactors },
      business: { score: 5 + (businessFactors.length > 0 ? 2 : 0), factors: businessFactors },
      integration: { score: 5 + (integrationFactors.length > 0 ? 2 : 0), factors: integrationFactors },
    };
  }

  private identifyRisks(document: ParsedDocument): RequirementAnalysis['risks'] {
    const risks: RequirementAnalysis['risks'] = [];
    const content = document.content.toLowerCase();
    
    if (content.includes('待定') || content.includes('tbd')) {
      risks.push({
        id: 'R1',
        description: '需求不明确，存在待定项',
        probability: 'high',
        impact: 'high',
        mitigation: '与客户确认需求细节',
      });
    }
    
    if (content.includes('复杂') || content.includes('complex')) {
      risks.push({
        id: 'R2',
        description: '技术复杂度较高',
        probability: 'medium',
        impact: 'high',
        mitigation: '进行技术验证，准备备用方案',
      });
    }
    
    if (document.metadata.wordCount > 5000) {
      risks.push({
        id: 'R3',
        description: '项目规模较大，时间压力',
        probability: 'medium',
        impact: 'medium',
        mitigation: '制定详细时间计划，设置里程碑',
      });
    }
    
    return risks;
  }

  private estimateEffort(document: ParsedDocument, requirementCount: number): RequirementAnalysis['effortEstimation'] {
    const baseHours = 40 + (requirementCount * 8);
    const totalHours = Math.max(80, Math.min(500, baseHours));
    
    return {
      totalHours,
      breakdown: {
        analysis: Math.round(totalHours * 0.1),
        design: Math.round(totalHours * 0.15),
        development: Math.round(totalHours * 0.5),
        testing: Math.round(totalHours * 0.15),
        deployment: Math.round(totalHours * 0.05),
        documentation: Math.round(totalHours * 0.05),
      },
      teamSize: requirementCount > 10 ? 3 : 2,
      timeline: {
        optimistic: Math.round(totalHours / 8 / 2),
        realistic: Math.round(totalHours / 8),
        pessimistic: Math.round(totalHours / 8 * 1.5),
      },
    };
  }

  private determinePriority(text: string): 'high' | 'medium' | 'low' {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('必须') || lowerText.includes('必要') || lowerText.includes('核心')) return 'high';
    if (lowerText.includes('重要') || lowerText.includes('关键')) return 'medium';
    return 'low';
  }

  private determineComplexity(text: string): 'simple' | 'medium' | 'complex' {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('复杂') || lowerText.includes('困难') || lowerText.includes('挑战')) return 'complex';
    if (lowerText.includes('中等') || lowerText.includes('一般')) return 'medium';
    return 'simple';
  }

  private estimateRequirementEffort(text: string): number {
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 50) return 16;
    if (wordCount > 30) return 12;
    if (wordCount > 15) return 8;
    return 4;
  }
}