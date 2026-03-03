/**
 * 技术documentGenerateservervice
 * Generatestandard化技术document: SRS, TDD, Deployment方案等
 */

import { RequirementAnalysis } from './requirements-analyzer';

export interface TechnicalDocument {
  id: string;
  type: 'srs' | 'tdd' | 'add' | 'api' | 'deployment' | 'project-plan';
  title: string;
  content: string;
  format: 'markdown' | 'html' | 'pdf';
  metadata: {
    generatedAt: string;
    version: string;
    basedOnAnalysis: string;
    wordCount: number;
  };
}

export interface AzureDeploymentConfig {
  terraform: string;
  dockerCompose: string;
  githubActions: string;
  azurePipelines: string;
  readme: string;
}

export class TechnicalDocumentGenerator {
  /**
   * Generaterequirements规格说明书 (SRS)
   */
  generateSRS(analysis: RequirementAnalysis): TechnicalDocument {
    const content = this.generateSRSContent(analysis);
    
    return {
      id: `srs_${Date.now()}`,
      type: 'srs',
      title: `requirements规格说明书 - ${analysis.documentId}`,
      content,
      format: 'markdown',
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        basedOnAnalysis: analysis.id,
        wordCount: this.countWords(content),
      },
    };
  }

  /**
   * Generate技术设计document (TDD)
   */
  generateTDD(analysis: RequirementAnalysis): TechnicalDocument {
    const content = this.generateTDDContent(analysis);
    
    return {
      id: `tdd_${Date.now()}`,
      type: 'tdd',
      title: `技术设计document - ${analysis.documentId}`,
      content,
      format: 'markdown',
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        basedOnAnalysis: analysis.id,
        wordCount: this.countWords(content),
      },
    };
  }

  /**
   * GenerateAzureDeploymentConfiguration
   */
  generateAzureDeployment(analysis: RequirementAnalysis): AzureDeploymentConfig {
    const projectName = this.extractProjectName(analysis);
    const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    return {
      terraform: this.generateTerraformConfig(sanitizedName, analysis),
      dockerCompose: this.generateDockerComposeConfig(sanitizedName, analysis),
      githubActions: this.generateGitHubActionsConfig(sanitizedName),
      azurePipelines: this.generateAzurePipelinesConfig(sanitizedName),
      readme: this.generateDeploymentReadme(sanitizedName, analysis),
    };
  }

  /**
   * Generate分StageDevelopment计划
   */
  generateProjectPlan(analysis: RequirementAnalysis): TechnicalDocument {
    const content = this.generateProjectPlanContent(analysis);
    
    return {
      id: `plan_${Date.now()}`,
      type: 'project-plan',
      title: `ProjectDevelopment计划 - ${analysis.documentId}`,
      content,
      format: 'markdown',
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        basedOnAnalysis: analysis.id,
        wordCount: this.countWords(content),
      },
    };
  }

  /**
   * GenerateSRScontent
   */
  private generateSRSContent(analysis: RequirementAnalysis): string {
    const { categories, effortEstimation, complexity, risks } = analysis;
    
    return `# requirements规格说明书 (SRS)

## 1. Project概述

### 1.1 Project背景
基于Requirements Analysis自动Generate's规格说明书. 

### 1.2 Project目标
- 实现requirementsdocumentCenterDescription's核心功can
- 提供High质量'sUser Experience
- 确保System's可extend性和maintainability

## 2. 功canrequirements

### 2.1 核心功can
${categories.functional.map(req => `- **${req.id}**: ${req.description} (Priority: ${req.priority}, complexity: ${req.complexity})`).join('\n')}

### 2.2 非功canrequirements
${categories.nonFunctional.map(req => `- **${req.type}**: ${req.description}`).join('\n')}

## 3. Technical Architecture

### 3.1 recommended技术栈
- **前端**: ${analysis.techStack.frontend[0]?.framework || 'Next.js'}
- **后端**: ${analysis.techStack.backend[0]?.framework || 'NestJS'}
- **data库**: ${analysis.techStack.database[0]?.type || 'PostgreSQL'}
- **DeploymentPlatform**: ${analysis.techStack.deployment[0]?.platform || 'Azure App servervice'}

## 4. Project约束

### 4.1 time约束
- 乐观time: ${effortEstimation.timeline.optimistic} d
- 现实time: ${effortEstimation.timeline.realistic} d  
- 悲观time: ${effortEstimation.timeline.pessimistic} d

### 4.2 resource约束
- 建议Team规模: ${effortEstimation.teamSize} 人
- 总工时: ${effortEstimation.totalHours} Small时

## 5. riskEvaluation

${risks.map(risk => `### ${risk.id}: ${risk.description}
- 概率: ${risk.probability}
- 影响: ${risk.impact}
- 缓解措施: ${risk.mitigation}`).join('\n\n')}

## 6. acceptancestandard

### 6.1 功canacceptancestandard
- 所All核心功canbyrequirements实现
- SystemPerformance满足非功canrequirements
- User界面符合设计规范

### 6.2 技术acceptancestandard
- code质量符合规范
- Test覆盖率 > 80%
- DeploymentProcessAutomation

---
*documentGeneratetime: ${new Date().toLocaleString()}*
*基于AnalyticsID: ${analysis.id}*`;
  }

  /**
   * GenerateTDDcontent
   */
  private generateTDDContent(analysis: RequirementAnalysis): string {
    const { techStack, categories } = analysis;
    
    return `# 技术设计document (TDD)

## 1. System架构

### 1.1 架构概述
采用分层架构设计, Separate concerns, improvemaintainability. 

### 1.2 技术选型
${this.generateTechStackTable(techStack)}

## 2. data库设计

### 2.1 data库选型
- **主data库**: ${techStack.database[0]?.type || 'PostgreSQL'}
- **Cachedata库**: Redis
- **file存储**: Azure Blob Storage

### 2.2 核心表结构
\`\`\`sql
-- User表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project表  
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

## 3. API设计

### 3.1 REST API规范
- usingRESTful设计原then
- Versioncontrol: /api/v1/
- Auth: JWT Token
- ResponseFormat: JSON

### 3.2 核心APIendpoint
\`\`\`
GET    /api/v1/projects          # FetchProjectList
POST   /api/v1/projects          # CreateProject
GET    /api/v1/projects/{id}     # FetchProjectDetails
PUT    /api/v1/projects/{id}     # UpdateProject
DELETE /api/v1/projects/{id}     # DeleteProject
\`\`\`

## 4. 前端架构

### 4.1 Component结构
\`\`\`
src/
├── components/     # 可复用Component
├── pages/         # 页面Component
├── lib/           # Toolfunction
├── styles/        # 样式file
└── types/         # TypeScriptType
\`\`\`

### 4.2 Status管理
- usingReact Context + useReducer
- servervice端StatususingReact Query
- 表单StatususingReact Hook Form

## 5. Deployment架构

### 5.1 Infrastructure
- **计算**: Azure App servervice
- **data库**: Azure Database for PostgreSQL
- **存储**: Azure Blob Storage
- **Cache**: Azure Cache for Redis

### 5.2 CI/CDProcess
1. codeSubmit → GitHub Actions
2. AutomationTest
3. 构建Docker镜像
4. 推送toAzure Container Registry
5. DeploymenttoAzure App servervice

## 6. Security设计

### 6.1 Authauthorize
- JWT TokenAuth
- RBACRolePermissioncontrol
- API速率限制

### 6.2 dataSecurity
- HTTPSforcedEncrypt
- data库ConnectEncrypt
- 敏感dataEncrypt存储

---
*documentGeneratetime: ${new Date().toLocaleString()}*`;
  }

  /**
   * GenerateProject计划content
   */
  private generateProjectPlanContent(analysis: RequirementAnalysis): string {
    const { effortEstimation, categories } = analysis;
    const totalWeeks = Math.ceil(effortEstimation.timeline.realistic / 5); // byWork日计算
    
    return `# ProjectDevelopment计划

## 1. Project概览

### 1.1 Projectinformation
- **ProjectName**: ${this.extractProjectName(analysis)}
- **预计工期**: ${effortEstimation.timeline.realistic} d (${totalWeeks} 周)
- **Team规模**: ${effortEstimation.teamSize} 人
- **总工时**: ${effortEstimation.totalHours} Small时

### 1.2 Stage划分
1. **MVPStage** (第1-2周): 核心功can实现
2. **extendStage** (第3-4周): 功can完善和optimize
3. **TestStage** (第5周): SystemTest和修复
4. **DeploymentStage** (第6周): 生产EnvironmentDeployment

## 2. Detailedtime线

### 2.1 第1周: ProjectStart和basic架构
- ProjectEnvironment搭建
- basic架构设计
- data库设计
- 核心API设计

### 2.2 第2周: 核心功canDevelopment
${categories.functional.slice(0, 3).map((req, i) => `- 实现 ${req.id}: ${req.description}`).join('\n')}

### 2.3 第3周: 功canextend
${categories.functional.slice(3, 6).map((req, i) => `- 实现 ${req.id}: ${req.description}`).join('\n')}

### 2.4 第4周: User界面Development
- 前端页面Development
- User交互设计
- Response式布局实现

### 2.5 第5周: Test和optimize
- 单元Test编写
- 集成TestExecute
- Performanceoptimize
- SecurityTest

### 2.6 第6周: Deployment和delivery
- 生产EnvironmentDeployment
- User培训
- document编写
- Projectdelivery

## 3. resource分配

### 3.1 TeamRole
- **Project经理**: 1人
- **前端Development**: ${effortEstimation.teamSize > 2 ? '2人' : '1人'}
- **后端Development**: 1人
- **Test工程师**: 1人 (第5周加入)

### 3.2 工时分配
\`\`\`
Analytics设计: ${effortEstimation.breakdown.analysis} Small时 (${Math.round(effortEstimation.breakdown.analysis / effortEstimation.totalHours * 100)}%)
Development实现: ${effortEstimation.breakdown.development} Small时 (${Math.round(effortEstimation.breakdown.development / effortEstimation.totalHours * 100)}%)
TestValidate: ${effortEstimation.breakdown.testing} Small时 (${Math.round(effortEstimation.breakdown.testing / effortEstimation.totalHours * 100)}%)
Deploymentdocument: ${effortEstimation.breakdown.deployment + effortEstimation.breakdown.documentation} Small时 (${Math.round((effortEstimation.breakdown.deployment + effortEstimation.breakdown.documentation) / effortEstimation.totalHours * 100)}%)
\`\`\`

## 4. milestone

### 4.1 Off键milestone
1. **M1** (第1周末): basic架构Completed
2. **M2** (第2周末): 核心功canCompleted
3. **M3** (第4周末): User界面Completed
4. **M4** (第5周末): Testthrough
5. **M5** (第6周末): 生产Deployment

### 4.2 delivery物
- 源code仓库
- Deploymentdocument
- User手册
- APIdocument
- TestReport

## 5. risk管理

### 5.1 risk应for计划
- **技术risk**: 每周技术评审, 准备备用方案
- **timerisk**: Settings缓冲time, Priority management
- **requirementsrisk**: 定期clientcommunication, 变更controlProcess

### 5.2 communication计划
- **每日站will**: 15min, syncProgress
- **周will**: 1Small时, 评审和计划
- **clientwill议**: 每2周1 times, 演示和反馈

---
*计划Generatetime: ${new Date().toLocaleString()}*
*基于AnalyticsID: ${analysis.id}*`;
  }

  /**
   * GenerateTerraformConfiguration
   */
  private generateTerraformConfig(projectName: string, analysis: RequirementAnalysis): string {
    return `# TerraformConfiguration - ${projectName}

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# resource组
resource "azurerm_resource_group" "main" {
  name     = "rg-${projectName}"
  location = "Southeast Asia"
  tags = {
    environment = "production"
    project     = "${projectName}"
  }
}

# App servervice Plan
resource "azurerm_service_plan" "main" {
  name                = "asp-${projectName}"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  os_type            = "Linux"
  sku_name           = "P1v2"
}

# Web App
resource "azurerm_linux_web_app" "main" {
  name                = "app-${projectName}"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  service_plan_id    = azurerm_service_plan.main.id

  site_config {
    always_on = true
    application_stack {
      node_version = "18-lts"
    }
  }

  app_settings = {
    "WEBSITE_NODE_DEFAULT_VERSION" = "~18"
    "NODE_ENV" = "production"
  }
}

# PostgreSQLdata库
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "psql-${projectName}"
  resource_group_name    = azurerm_resource_group.main.name
  location              = azurerm_resource_group.main.location
  version               = "13"
  administrator_login    = "adminuser"
  administrator_password = "ChangeMe123!" # in生产EnvironmentCenterusingKey库

  storage_mb = 32768
  sku_name   = "GP_Standard_D2s_v3"
}

# Blob Storage
resource "azurerm_storage_account" "main" {
  name                     = "st${replace(projectName, "-", "")}"
  resource_group_name      = azurerm_resource_group.main.name
  location                = azurerm_resource_group.main.location
  account_tier            = "Standard"
  account_replication_type = "LRS"
}

# RedisCache
resource "azurerm_redis_cache" "main" {
  name                = "redis-${projectName}"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  capacity           = 1
  family             = "C"
  sku_name           = "Basic"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"
}

# 输出
output "web_app_url" {
  value = "https://\${azurerm_linux_web_app.main.default_hostname}"
}

output "database_host" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}

output "storage_account_name" {
  value = azurerm_storage_account.main.name
}`;
  }

  /**
   * GenerateDocker ComposeConfiguration
   */
  private generateDockerComposeConfig(projectName: string, analysis: RequirementAnalysis): string {
    return `# Docker ComposeConfiguration - ${projectName}

version: '3.8'

services:
  # 前端Application
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_APIhttps://api.example.com\`;
  }
}
