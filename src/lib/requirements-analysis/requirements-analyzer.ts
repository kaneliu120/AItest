/**
 * 智canRequirements Analysisservervice - 简化Version
 */

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
  
  // 技术栈recommended
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
  
  // complexityEvaluation
  complexity: {
    overall: number;
    technical: { score: number; factors: string[] };
    business: { score: number; factors: string[] };
    integration: { score: number; factors: string[] };
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
    
    // 提取功canrequirements
    const functionalReqs = this.extractFunctionalRequirements(document.content);
    const nonFunctionalReqs = this.extractNonFunctionalRequirements(document.content);
    const businessReqs = this.extractBusinessRequirements(document.content);
    
    // recommended技术栈
    const techStack = this.recommendTechStack(document.content);
    
    // Evaluationcomplexity
    const complexity = this.assessComplexity(document);
    
    // 识别risk
    const risks = this.identifyRisks(document);
    
    // 估算Work量
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
  }

  private extractFunctionalRequirements(content: string): RequirementAnalysis['categories']['functional'] {
    const requirements: RequirementAnalysis['categories']['functional'] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检测requirements行
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
    
    // if没All检测to明确'srequirements, FromcontentCenter提取
    if (requirements.length === 0) {
      const sentences = content.split(/[.!?. ! ? ]/).filter(s => s.trim().length > 20);
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
    
    // Performancerequirements
    if (contentLower.includes('Performance') || contentLower.includes('performance')) {
      requirements.push({
        id: 'NFR1',
        type: 'performance',
        description: 'SystemPerformanceneed to求',
        requirements: ['Responsetime < 2s', '支持100and发User', '99.9%available性'],
      });
    }
    
    // Securityrequirements
    if (contentLower.includes('Security') || contentLower.includes('security')) {
      requirements.push({
        id: 'NFR2',
        type: 'security',
        description: 'SystemSecurityneed to求',
        requirements: ['UserAuth和authorize', 'dataEncrypt', '防止SQL injection'],
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
        description: 'Business goals and value',
        businessValue: 'high',
        stakeholders: ['client', 'User', '管理Team'],
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
          recommendation: '适用于need toSEO, servervice端渲染'sWebApplication',
          suitability: isWebApp ? 90 : 70,
        },
        {
          framework: 'React + Vite',
          recommendation: '适用于单页Application和快速原型Development',
          suitability: isWebApp ? 85 : 75,
        },
      ],
      backend: [
        {
          framework: 'NestJS',
          recommendation: '适用于enterprise级Application, need to严格架构',
          suitability: 85,
        },
        {
          framework: 'Express.js',
          recommendation: '适用于快速原型和Small型Project',
          suitability: 75,
        },
      ],
      database: [
        {
          type: 'PostgreSQL',
          recommendation: '适用于need toACID事务和复杂查询'sApplication',
          suitability: 90,
        },
        {
          type: 'MongoDB',
          recommendation: '适用于document型data和快速iterate',
          suitability: 80,
        },
      ],
      deployment: [
        {
          platform: 'Azure App servervice',
          recommendation: '适用于.NET和Node.jsApplication, enterprise级支持',
          suitability: 85,
        },
        {
          platform: 'Vercel',
          recommendation: '适用于Next.js前端Application',
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
    if (wordCount > 3000) technicalFactors.push('requirements规模较Large');
    
    const businessFactors: string[] = [];
    if (document.content.includes('业务')) businessFactors.push('涉及业务逻辑');
    
    const integrationFactors: string[] = [];
    if (document.content.includes('集成')) integrationFactors.push('need toSystem集成');
    
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
        description: 'requirements不明确, 存in待定项',
        probability: 'high',
        impact: 'high',
        mitigation: 'andclientConfirmrequirements细节',
      });
    }
    
    if (content.includes('复杂') || content.includes('complex')) {
      risks.push({
        id: 'R2',
        description: '技术complexity较High',
        probability: 'medium',
        impact: 'high',
        mitigation: 'In Progress技术Validate, 准备备用方案',
      });
    }
    
    if (document.metadata.wordCount > 5000) {
      risks.push({
        id: 'R3',
        description: 'Project规模较Large, time压力',
        probability: 'medium',
        impact: 'medium',
        mitigation: '制定Detailedtime计划, Settingsmilestone',
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
    if (lowerText.includes('must') || lowerText.includes('必need to') || lowerText.includes('核心')) return 'high';
    if (lowerText.includes('重need to') || lowerText.includes('Off键')) return 'medium';
    return 'low';
  }

  private determineComplexity(text: string): 'simple' | 'medium' | 'complex' {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('复杂') || lowerText.includes('困难') || lowerText.includes('挑战')) return 'complex';
    if (lowerText.includes('Center等') || lowerText.includes('Normal')) return 'medium';
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