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
    const content = `# 需求规格说明书 (SRS)

## 项目概述
基于需求分析自动生成的规格说明书。

## 功能需求
${analysis.categories.functional.map(req => `- **${req.id}**: ${req.description}`).join('\n')}

## 技术架构
- **前端**: ${analysis.techStack.frontend[0]?.framework || 'Next.js'}
- **后端**: ${analysis.techStack.backend[0]?.framework || 'NestJS'}
- **数据库**: ${analysis.techStack.database[0]?.type || 'PostgreSQL'}

## 项目约束
- 预计工期: ${analysis.effortEstimation.timeline.realistic} 天
- 团队规模: ${analysis.effortEstimation.teamSize} 人
- 总工时: ${analysis.effortEstimation.totalHours} 小时

## 风险评估
${analysis.risks.map(risk => `- **${risk.id}**: ${risk.description} (概率: ${risk.probability}, 影响: ${risk.impact})`).join('\n')}

---
*生成时间: ${new Date().toLocaleString()}*`;

    return this.createDocument('srs', '需求规格说明书', content, analysis.id);
  }

  /**
   * 生成技术设计文档
   */
  generateTDD(analysis: RequirementAnalysis): TechnicalDocument {
    const content = `# 技术设计文档 (TDD)

## 系统架构
采用分层架构设计，确保可维护性和可扩展性。

## 技术选型
### 前端
${analysis.techStack.frontend.map(tech => `- **${tech.framework}**: ${tech.recommendation} (适合度: ${tech.suitability}%)`).join('\n')}

### 后端
${analysis.techStack.backend.map(tech => `- **${tech.framework}**: ${tech.recommendation} (适合度: ${tech.suitability}%)`).join('\n')}

### 数据库
${analysis.techStack.database.map(db => `- **${db.type}**: ${db.recommendation} (适合度: ${db.suitability}%)`).join('\n')}

## 数据库设计
\`\`\`sql
-- 核心表结构示例
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
- JWT Token认证
- 版本控制: /api/v1/

## 部署架构
- **计算**: Azure App Service
- **数据库**: Azure Database for PostgreSQL
- **存储**: Azure Blob Storage
- **缓存**: Azure Cache for Redis

---
*生成时间: ${new Date().toLocaleString()}*`;

    return this.createDocument('tdd', '技术设计文档', content, analysis.id);
  }

  /**
   * 生成项目计划
   */
  generateProjectPlan(analysis: RequirementAnalysis): TechnicalDocument {
    const weeks = Math.ceil(analysis.effortEstimation.timeline.realistic / 5);
    
    const content = `# 项目开发计划

## 项目信息
- **项目名称**: ${this.extractProjectName(analysis)}
- **工期**: ${analysis.effortEstimation.timeline.realistic} 天 (${weeks} 周)
- **团队**: ${analysis.effortEstimation.teamSize} 人
- **总工时**: ${analysis.effortEstimation.totalHours} 小时

## 阶段划分
### 阶段1: 基础架构 (第1周)
- 环境搭建
- 数据库设计
- 核心API开发

### 阶段2: 核心功能 (第2-3周)
${analysis.categories.functional.slice(0, 5).map(req => `- ${req.id}: ${req.description}`).join('\n')}

### 阶段3: 前端开发 (第4周)
- 用户界面设计
- 页面开发
- 交互实现

### 阶段4: 测试部署 (第5-6周)
- 单元测试
- 集成测试
- 生产部署

## 资源分配
\`\`\`
分析设计: ${analysis.effortEstimation.breakdown.analysis} 小时
开发实现: ${analysis.effortEstimation.breakdown.development} 小时
测试验证: ${analysis.effortEstimation.breakdown.testing} 小时
部署文档: ${analysis.effortEstimation.breakdown.deployment + analysis.effortEstimation.breakdown.documentation} 小时
\`\`\`

## 里程碑
1. **M1** (第1周): 基础架构完成
2. **M2** (第3周): 核心功能完成
3. **M3** (第4周): 前端完成
4. **M4** (第6周): 生产部署

---
*生成时间: ${new Date().toLocaleString()}*`;

    return this.createDocument('project-plan', '项目开发计划', content, analysis.id);
  }

  /**
   * 生成部署文档
   */
  generateDeploymentDoc(analysis: RequirementAnalysis): TechnicalDocument {
    const projectName = this.extractProjectName(analysis).toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const content = `# Azure部署文档

## 基础设施配置

### 1. 资源组
\`\`\`bash
az group create --name rg-${projectName} --location southeastasia
\`\`\`

### 2. App Service
\`\`\`bash
az appservice plan create --name asp-${projectName} --resource-group rg-${projectName} --sku P1v2 --is-linux
az webapp create --name app-${projectName} --resource-group rg-${projectName} --plan asp-${projectName} --runtime "NODE|18-lts"
\`\`\`

### 3. PostgreSQL数据库
\`\`\`bash
az postgres flexible-server create --name psql-${projectName} --resource-group rg-${projectName} --location southeastasia --admin-user adminuser --admin-password ChangeMe123!
\`\`\`

## Docker配置
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

## GitHub Actions配置
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

## 环境变量
\`\`\`bash
# .env.production
DATABASE_URL=postgresql://adminuser:password@psql-${projectName}.postgres.database.azure.com:5432/${projectName}
REDIS_URL=redis://redis-${projectName}.redis.cache.windows.net:6380
STORAGE_ACCOUNT=st${projectName.replace(/-/g, '')}
\`\`\`

## 监控配置
- **Application Insights**: 应用性能监控
- **Azure Monitor**: 基础设施监控
- **Log Analytics**: 日志分析

---
*生成时间: ${new Date().toLocaleString()}*`;

    return this.createDocument('deployment', 'Azure部署文档', content, analysis.id);
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