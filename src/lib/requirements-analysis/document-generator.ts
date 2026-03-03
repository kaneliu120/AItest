/**
 * 技术文档生成服务 - 简化版本
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
   * 生成所有技术文档
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
   * 生成需求规格说明书
   */
  generateSRS(analysis: RequirementAnalysis): TechnicalDocument {
    const content = `# Software Requirements Specification (SRS)

## Project Overview
Auto-generated specification based on requirements analysis.

## Functional Requirements
${analysis.categories.functional.map(req => `- **${req.id}**: ${req.description}`).join('\n')}

## Technical Architecture
- **Frontend**: ${analysis.techStack.frontend[0]?.framework || 'Next.js'}
- **Backend**: ${analysis.techStack.backend[0]?.framework || 'NestJS'}
- **Database**: ${analysis.techStack.database[0]?.type || 'PostgreSQL'}

## Project Constraints
- Estimated duration: ${analysis.effortEstimation.timeline.realistic} days
- Team size: ${analysis.effortEstimation.teamSize} person(s)
- Total effort: ${analysis.effortEstimation.totalHours} hours

## Risk Assessment
${analysis.risks.map(risk => `- **${risk.id}**: ${risk.description} (Probability: ${risk.probability}, Impact: ${risk.impact})`).join('\n')}

---
*Generated: ${new Date().toLocaleString()}*`;

    return this.createDocument('srs', 'Software Requirements Specification', content, analysis.id);
  }

  /**
   * 生成技术设计文档
   */
  generateTDD(analysis: RequirementAnalysis): TechnicalDocument {
    const content = `# Technical Design Document (TDD)

## System Architecture
Layered architecture design ensuring maintainability and scalability.

## Tech Stack Selection
### Frontend
${analysis.techStack.frontend.map(tech => `- **${tech.framework}**: ${tech.recommendation} (Suitability: ${tech.suitability}%)`).join('\n')}

### Backend
${analysis.techStack.backend.map(tech => `- **${tech.framework}**: ${tech.recommendation} (Suitability: ${tech.suitability}%)`).join('\n')}

### Database
${analysis.techStack.database.map(db => `- **${db.type}**: ${db.recommendation} (Suitability: ${db.suitability}%)`).join('\n')}

## Database Design
\`\`\`sql
-- Core table structure example
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

## API Design
- RESTful API design
- JWT Token authentication
- Versioning: /api/v1/

## Deployment Architecture
- **Compute**: Azure App Service
- **Database**: Azure Database for PostgreSQL
- **Storage**: Azure Blob Storage
- **Cache**: Azure Cache for Redis

---
*Generated: ${new Date().toLocaleString()}*`;

    return this.createDocument('tdd', 'Technical Design Document', content, analysis.id);
  }

  /**
   * 生成项目计划
   */
  generateProjectPlan(analysis: RequirementAnalysis): TechnicalDocument {
    const weeks = Math.ceil(analysis.effortEstimation.timeline.realistic / 5);
    
    const content = `# Project Development Plan

## Project Information
- **Project Name**: ${this.extractProjectName(analysis)}
- **Duration**: ${analysis.effortEstimation.timeline.realistic} days (${weeks} weeks)
- **Team**: ${analysis.effortEstimation.teamSize} person(s)
- **Total Effort**: ${analysis.effortEstimation.totalHours} hours

## Phases
### Phase 1: Foundation (Week 1)
- Environment setup
- Database design
- Core API development

### Phase 2: Core Features (Weeks 2-3)
${analysis.categories.functional.slice(0, 5).map(req => `- ${req.id}: ${req.description}`).join('\n')}

### Phase 3: Frontend Development (Week 4)
- UI/UX design
- Page development
- Interaction implementation

### Phase 4: Testing & Deployment (Weeks 5-6)
- Unit testing
- Integration testing
- Production deployment

## Resource Allocation
\`\`\`
Analysis & Design: ${analysis.effortEstimation.breakdown.analysis} hours
Development: ${analysis.effortEstimation.breakdown.development} hours
Testing: ${analysis.effortEstimation.breakdown.testing} hours
Deployment & Docs: ${analysis.effortEstimation.breakdown.deployment + analysis.effortEstimation.breakdown.documentation} hours
\`\`\`

## Milestones
1. **M1** (Week 1): Foundation complete
2. **M2** (Week 3): Core features complete
3. **M3** (Week 4): Frontend complete
4. **M4** (Week 6): Production deployment

---
*Generated: ${new Date().toLocaleString()}*`;

    return this.createDocument('project-plan', 'Project Development Plan', content, analysis.id);
  }

  /**
   * 生成部署文档
   */
  generateDeploymentDoc(analysis: RequirementAnalysis): TechnicalDocument {
    const projectName = this.extractProjectName(analysis).toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const content = `# Azure Deployment Document

## Infrastructure Setup

### 1. Resource Group
\`\`\`bash
az group create --name rg-${projectName} --location southeastasia
\`\`\`

### 2. App Service
\`\`\`bash
az appservice plan create --name asp-${projectName} --resource-group rg-${projectName} --sku P1v2 --is-linux
az webapp create --name app-${projectName} --resource-group rg-${projectName} --plan asp-${projectName} --runtime "NODE|18-lts"
\`\`\`

### 3. PostgreSQL Database
\`\`\`bash
az postgres flexible-server create --name psql-${projectName} --resource-group rg-${projectName} --location southeastasia --admin-user adminuser --admin-password ChangeMe123!
\`\`\`

## Docker Configuration
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

## GitHub Actions Configuration
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

## Environment Variables
\`\`\`bash
# .env.production
DATABASE_URL=postgresql://adminuser:password@psql-${projectName}.postgres.database.azure.com:5432/${projectName}
REDIS_URL=redis://redis-${projectName}.redis.cache.windows.net:6380
STORAGE_ACCOUNT=st${projectName.replace(/-/g, '')}
\`\`\`

## Monitoring Setup
- **Application Insights**: App performance monitoring
- **Azure Monitor**: Infrastructure monitoring
- **Log Analytics**: Log analysis

---
*Generated: ${new Date().toLocaleString()}*`;

    return this.createDocument('deployment', 'Azure Deployment Document', content, analysis.id);
  }

  /**
   * 创建文档对象
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
   * 提取项目名称
   */
  private extractProjectName(analysis: RequirementAnalysis): string {
    // 从分析中提取或生成项目名称
    const firstReq = analysis.categories.functional[0];
    if (firstReq) {
      const words = firstReq.description.split(' ').slice(0, 3);
      return words.join(' ').replace(/[^\w\s]/g, '');
    }
    return `Project-${analysis.id.substring(0, 8)}`;
  }

  /**
   * 统计单词数
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
}