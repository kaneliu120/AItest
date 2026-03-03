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
        description: 'System performance requirements',
        requirements: ['Response time < 2s', 'Support 100 concurrent users', '99.9% availability'],
      });
    }
    
    // 安全需求
    if (contentLower.includes('安全') || contentLower.includes('security')) {
      requirements.push({
        id: 'NFR2',
        type: 'security',
        description: 'System security requirements',
        requirements: ['User authentication and authorization', 'Data encryption', 'Prevent SQL injection'],
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
        stakeholders: ['Clients', 'Users', 'Management team'],
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
          recommendation: 'Ideal for SEO and server-side rendering web apps',
          suitability: isWebApp ? 90 : 70,
        },
        {
          framework: 'React + Vite',
          recommendation: 'Ideal for single-page apps and rapid prototyping',
          suitability: isWebApp ? 85 : 75,
        },
      ],
      backend: [
        {
          framework: 'NestJS',
          recommendation: 'Ideal for enterprise-grade apps requiring strict architecture',
          suitability: 85,
        },
        {
          framework: 'Express.js',
          recommendation: 'Ideal for rapid prototyping and small projects',
          suitability: 75,
        },
      ],
      database: [
        {
          type: 'PostgreSQL',
          recommendation: 'Ideal for apps requiring ACID transactions and complex queries',
          suitability: 90,
        },
        {
          type: 'MongoDB',
          recommendation: 'Ideal for document data and rapid iteration',
          suitability: 80,
        },
      ],
      deployment: [
        {
          platform: 'Azure App Service',
          recommendation: 'Ideal for .NET and Node.js apps, enterprise-grade support',
          suitability: 85,
        },
        {
          platform: 'Vercel',
          recommendation: 'Ideal for Next.js frontend applications',
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
    if (wordCount > 3000) technicalFactors.push('Large requirement scope');
    
    const businessFactors: string[] = [];
    if (document.content.includes('业务')) businessFactors.push('涉及业务逻辑');
    
    const integrationFactors: string[] = [];
    if (document.content.includes('集成')) integrationFactors.push('Requires system integration');
    
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
        description: 'Requirements unclear, pending items exist',
        probability: 'high',
        impact: 'high',
        mitigation: 'Confirm requirements details with the client',
      });
    }
    
    if (content.includes('复杂') || content.includes('complex')) {
      risks.push({
        id: 'R2',
        description: 'High technical complexity',
        probability: 'medium',
        impact: 'high',
        mitigation: 'Conduct technical validation and prepare fallback plans',
      });
    }
    
    if (document.metadata.wordCount > 5000) {
      risks.push({
        id: 'R3',
        description: 'Large project scope, time pressure',
        probability: 'medium',
        impact: 'medium',
        mitigation: 'Create detailed schedule and set milestones',
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