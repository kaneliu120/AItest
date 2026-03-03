/**
 * 技术documentGenerateservervice - 简化Version
 */

import { RequirementAnalysis } from './requirements-analyzer';

export interface TechnicalDocument {
  id: string;
  type: 'srs' | 'tdd' | 'deployment' | 'project-plan';
  title: string;
  content: string;
  format: 'markdown';
  metadata: {
    generatedAt: string;
    version: string;
    basedOnAnalysis: string;
    wordCount: number;
  };
}

export class DocumentGenerator {
  /**
   * Generate所All技术document
   */
  generateAllDocuments(analysis: RequirementAnalysis): {
    srs: TechnicalDocument;
    tdd: TechnicalDocument;
    projectPlan: TechnicalDocument;
    deployment: TechnicalDocument;
  } {
    return {
      srs: this.generateSRS(analysis),
      tdd: this.generateTDD(analysis),
      projectPlan: this.generateProjectPlan(analysis),
      deployment: this.generateDeploymentDoc(analysis),
    };
  }

  /**
   * Generaterequirements规格说明书
   */
  generateSRS(analysis: RequirementAnalysis): TechnicalDocument {
    const content = `# requirements规格说明书 (SRS)

## Project概述
基于Requirements Analysis自动Generate's规格说明书. 

## 功canrequirements
${analysis.categories.functional.map(req => `- **${req.id}**: ${req.description}`).join('\n')}

## Technical Architecture
- **前端**: ${analysis.techStack.frontend[0]?.framework || 'Next.js'}
- **后端**: ${analysis.techStack.backend[0]?.framework || 'NestJS'}
- **data库**: ${analysis.techStack.database[0]?.type || 'PostgreSQL'}

## Project约束
- 预计工期: ${analysis.effortEstimation.timeline.realistic} d
- Team规模: ${analysis.effortEstimation.teamSize} 人
- 总工时: ${analysis.effortEstimation.totalHours} Small时

## riskEvaluation
${analysis.risks.map(risk => `- **${risk.id}**: ${risk.description} (概率: ${risk.probability}, 影响: ${risk.impact})`).join('\n')}

---
*Generatetime: ${new Date().toLocaleString()}*`;

    return this.createDocument('srs', 'requirements规格说明书', content, analysis.id);
  }

  /**
   * Generate技术设计document
   */
  generateTDD(analysis: RequirementAnalysis): TechnicalDocument {
    const content = `# 技术设计document (TDD)

## System架构
采用分层架构设计, 确保maintainability和可extend性. 

## 技术选型
### 前端
${analysis.techStack.frontend.map(tech => `- **${tech.framework}**: ${tech.recommendation} (适合度: ${tech.suitability}%)`).join('\n')}

### 后端
${analysis.techStack.backend.map(tech => `- **${tech.framework}**: ${tech.recommendation} (适合度: ${tech.suitability}%)`).join('\n')}

### data库
${analysis.techStack.database.map(db => `- **${db.type}**: ${db.recommendation} (适合度: ${db.suitability}%)`).join('\n')}

## data库设计
\`\`\`sql
-- 核心表结构Example
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

## API设计
- RESTful API设计
- JWT TokenAuth
- Versioncontrol: /api/v1/

## Deployment架构
- **计算**: Azure App servervice
- **data库**: Azure Database for PostgreSQL
- **存储**: Azure Blob Storage
- **Cache**: Azure Cache for Redis

---
*Generatetime: ${new Date().toLocaleString()}*`;

    return this.createDocument('tdd', '技术设计document', content, analysis.id);
  }

  /**
   * GenerateProject计划
   */
  generateProjectPlan(analysis: RequirementAnalysis): TechnicalDocument {
    const weeks = Math.ceil(analysis.effortEstimation.timeline.realistic / 5);
    
    const content = `# ProjectDevelopment计划

## Projectinformation
- **ProjectName**: ${this.extractProjectName(analysis)}
- **工期**: ${analysis.effortEstimation.timeline.realistic} d (${weeks} 周)
- **Team**: ${analysis.effortEstimation.teamSize} 人
- **总工时**: ${analysis.effortEstimation.totalHours} Small时

## Stage划分
### Stage1: basic架构 (第1周)
- Environment搭建
- data库设计
- 核心APIDevelopment

### Stage2: 核心功can (第2-3周)
${analysis.categories.functional.slice(0, 5).map(req => `- ${req.id}: ${req.description}`).join('\n')}

### Stage3: 前端Develop (第4周)
- User界面设计
- 页面Development
- 交互实现

### Stage4: TestDeployment (第5-6周)
- 单元Test
- 集成Test
- 生产Deployment

## resource分配
\`\`\`
Analytics设计: ${analysis.effortEstimation.breakdown.analysis} Small时
Development实现: ${analysis.effortEstimation.breakdown.development} Small时
TestValidate: ${analysis.effortEstimation.breakdown.testing} Small时
Deploymentdocument: ${analysis.effortEstimation.breakdown.deployment + analysis.effortEstimation.breakdown.documentation} Small时
\`\`\`

## milestone
1. **M1** (第1周): basic架构Completed
2. **M2** (第3周): 核心功canCompleted
3. **M3** (第4周): 前端Completed
4. **M4** (第6周): 生产Deployment

---
*Generatetime: ${new Date().toLocaleString()}*`;

    return this.createDocument('project-plan', 'ProjectDevelopment计划', content, analysis.id);
  }

  /**
   * GenerateDeploymentdocument
   */
  generateDeploymentDoc(analysis: RequirementAnalysis): TechnicalDocument {
    const projectName = this.extractProjectName(analysis).toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const content = `# AzureDeploymentdocument

## InfrastructureConfiguration

### 1. resource组
\`\`\`bash
az group create --name rg-${projectName} --location southeastasia
\`\`\`

### 2. App servervice
\`\`\`bash
az appservice plan create --name asp-${projectName} --resource-group rg-${projectName} --sku P1v2 --is-linux
az webapp create --name app-${projectName} --resource-group rg-${projectName} --plan asp-${projectName} --runtime "NODE|18-lts"
\`\`\`

### 3. PostgreSQLdata库
\`\`\`bash
az postgres flexible-server create --name psql-${projectName} --resource-group rg-${projectName} --location southeastasia --admin-user adminuser --admin-password ChangeMe123!
\`\`\`

## DockerConfiguration
\`\`\`dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## GitHub ActionsConfiguration
\`\`\`yaml
# .github/workflows/deploy.yml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'app-${projectName}'
        publish-profile: \${{ secrets.AZURE_PUBLISH_PROFILE }}
\`\`\`

## Environmentvariable
\`\`\`bash
# .env.production
DATABASE_URL=postgresql://adminuser:password@psql-${projectName}.postgres.database.azure.com:5432/${projectName}
REDIS_URL=redis://redis-${projectName}.redis.cache.windows.net:6380
STORAGE_ACCOUNT=st${projectName.replace(/-/g, '')}
\`\`\`

## MonitoringConfiguration
- **Application Insights**: ApplicationPerformanceMonitoring
- **Azure Monitor**: InfrastructureMonitoring
- **Log Analytics**: LoggingAnalytics

---
*Generatetime: ${new Date().toLocaleString()}*`;

    return this.createDocument('deployment', 'AzureDeploymentdocument', content, analysis.id);
  }

  /**
   * CreatedocumentObject
   */
  private createDocument(
    type: TechnicalDocument['type'],
    title: string,
    content: string,
    analysisId: string
  ): TechnicalDocument {
    return {
      id: `${type}_${Date.now()}`,
      type,
      title: `${title} - ${analysisId}`,
      content,
      format: 'markdown',
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        basedOnAnalysis: analysisId,
        wordCount: this.countWords(content),
      },
    };
  }

  /**
   * 提取ProjectName
   */
  private extractProjectName(analysis: RequirementAnalysis): string {
    // FromAnalyticsCenter提取orGenerateProjectName
    const firstReq = analysis.categories.functional[0];
    if (firstReq) {
      const words = firstReq.description.split(' ').slice(0, 3);
      return words.join(' ').replace(/[^\w\s]/g, '');
    }
    return `Project-${analysis.id.substring(0, 8)}`;
  }

  /**
   * Statistics单词数
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
}