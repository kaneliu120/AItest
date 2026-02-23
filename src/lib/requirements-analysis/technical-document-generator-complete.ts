/**
 * 技术文档生成服务 - 完整版本
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
   * 生成需求规格说明书 (SRS)
   */
  generateSRS(analysis: RequirementAnalysis): TechnicalDocument {
    const content = this.generateSRSContent(analysis);
    
    return {
      id: `srs_${Date.now()}`,
      type: 'srs',
      title: `需求规格说明书 - ${analysis.documentId}`,
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
   * 生成技术设计文档 (TDD)
   */
  generateTDD(analysis: RequirementAnalysis): TechnicalDocument {
    const content = this.generateTDDContent(analysis);
    
    return {
      id: `tdd_${Date.now()}`,
      type: 'tdd',
      title: `技术设计文档 - ${analysis.documentId}`,
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
   * 生成Azure部署配置
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
   * 生成分阶段开发计划
   */
  generateProjectPlan(analysis: RequirementAnalysis): TechnicalDocument {
    const content = this.generateProjectPlanContent(analysis);
    
    return {
      id: `plan_${Date.now()}`,
      type: 'project-plan',
      title: `项目开发计划 - ${analysis.documentId}`,
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
   * 生成SRS内容
   */
  private generateSRSContent(analysis: RequirementAnalysis): string {
    const { categories, effortEstimation, complexity, risks } = analysis;
    
    return `# 需求规格说明书 (SRS)

## 1. 项目概述

### 1.1 项目背景
基于需求分析自动生成的规格说明书。

### 1.2 项目目标
- 实现需求文档中描述的核心功能
- 提供高质量的用户体验
- 确保系统的可扩展性和可维护性

## 2. 功能需求

### 2.1 核心功能
${categories.functional.map(req => `- **${req.id}**: ${req.description} (优先级: ${req.priority}, 复杂度: ${req.complexity})`).join('\n')}

### 2.2 非功能需求
${categories.nonFunctional.map(req => `- **${req.type}**: ${req.description}`).join('\n')}

## 3. 技术架构

### 3.1 推荐技术栈
- **前端**: ${analysis.techStack.frontend[0]?.framework || 'Next.js'}
- **后端**: ${analysis.techStack.backend[0]?.framework || 'NestJS'}
- **数据库**: ${analysis.techStack.database[0]?.type || 'PostgreSQL'}
- **部署平台**: ${analysis.techStack.deployment[0]?.platform || 'Azure App Service'}

## 4. 项目约束

### 4.1 时间约束
- 乐观时间: ${effortEstimation.timeline.optimistic} 天
- 现实时间: ${effortEstimation.timeline.realistic} 天  
- 悲观时间: ${effortEstimation.timeline.pessimistic} 天

### 4.2 资源约束
- 建议团队规模: ${effortEstimation.teamSize} 人
- 总工时: ${effortEstimation.totalHours} 小时

## 5. 风险评估

${risks.map(risk => `### ${risk.id}: ${risk.description}
- 概率: ${risk.probability}
- 影响: ${risk.impact}
- 缓解措施: ${risk.mitigation}`).join('\n\n')}

## 6. 验收标准

### 6.1 功能验收标准
- 所有核心功能按需求实现
- 系统性能满足非功能需求
- 用户界面符合设计规范

### 6.2 技术验收标准
- 代码质量符合规范
- 测试覆盖率 > 80%
- 部署流程自动化

---
*文档生成时间: ${new Date().toLocaleString()}*
*基于分析ID: ${analysis.id}*`;
  }

  /**
   * 生成TDD内容
   */
  private generateTDDContent(analysis: RequirementAnalysis): string {
    const { techStack, categories } = analysis;
    
    return `# 技术设计文档 (TDD)

## 1. 系统架构

### 1.1 架构概述
采用分层架构设计，分离关注点，提高可维护性。

### 1.2 技术选型
${this.generateTechStackTable(techStack)}

## 2. 数据库设计

### 2.1 数据库选型
- **主数据库**: ${techStack.database[0]?.type || 'PostgreSQL'}
- **缓存数据库**: Redis
- **文件存储**: Azure Blob Storage

### 2.2 核心表结构
\`\`\`sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 项目表  
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
- 使用RESTful设计原则
- 版本控制: /api/v1/
- 认证: JWT Token
- 响应格式: JSON

### 3.2 核心API端点
\`\`\`
GET    /api/v1/projects          # 获取项目列表
POST   /api/v1/projects          # 创建项目
GET    /api/v1/projects/{id}     # 获取项目详情
PUT    /api/v1/projects/{id}     # 更新项目
DELETE /api/v1/projects/{id}     # 删除项目
\`\`\`

## 4. 前端架构

### 4.1 组件结构
\`\`\`
src/
├── components/     # 可复用组件
├── pages/         # 页面组件
├── lib/           # 工具函数
├── styles/        # 样式文件
└── types/         # TypeScript类型
\`\`\`

### 4.2 状态管理
- 使用React Context + useReducer
- 服务端状态使用React Query
- 表单状态使用React Hook Form

## 5. 部署架构

### 5.1 基础设施
- **计算**: Azure App Service
- **数据库**: Azure Database for PostgreSQL
- **存储**: Azure Blob Storage
- **缓存**: Azure Cache for Redis

### 5.2 CI/CD流程
1. 代码提交 → GitHub Actions
2. 自动化测试
3. 构建Docker镜像
4. 推送到Azure Container Registry
5. 部署到Azure App Service

## 6. 安全设计

### 6.1 认证授权
- JWT Token认证
- RBAC角色权限控制
- API速率限制

### 6.2 数据安全
- HTTPS强制加密
- 数据库连接加密
- 敏感数据加密存储

---
*文档生成时间: ${new Date().toLocaleString()}*`;
  }

  /**
   * 生成项目计划内容
   */
  private generateProjectPlanContent(analysis: RequirementAnalysis): string {
    const { effortEstimation, categories } = analysis;
    const totalWeeks = Math.ceil(effortEstimation.timeline.realistic / 5); // 按工作日计算
    
    return `# 项目开发计划

## 1. 项目概览

### 1.1 项目信息
- **项目名称**: ${this.extractProjectName(analysis)}
- **预计工期**: ${effortEstimation.timeline.realistic} 天 (${totalWeeks} 周)
- **团队规模**: ${effortEstimation.teamSize} 人
- **总工时**: ${effortEstimation.totalHours} 小时

### 1.2 阶段划分
1. **MVP阶段** (第1-2周): 核心功能实现
2. **扩展阶段** (第3-4周): 功能完善和优化
3. **测试阶段** (第5周): 系统测试和修复
4. **部署阶段** (第6周): 生产环境部署

## 2. 详细时间线

### 2.1 第1周: 项目启动和基础架构
- 项目环境搭建
- 基础架构设计
- 数据库设计
- 核心API设计

### 2.2 第2周: 核心功能开发
${categories.functional.slice(0, 3).map((req, i) => `- 实现 ${req.id}: ${req.description}`).join('\n')}

### 2.3 第3周: 功能扩展
${categories.functional.slice(3, 6).map((req, i) => `- 实现 ${req.id}: ${req.description}`).join('\n')}

### 2.4 第4周: 用户界面开发
- 前端页面开发
- 用户交互设计
- 响应式布局实现

### 2.5 第5周: 测试和优化
- 单元测试编写
- 集成测试执行
- 性能优化
- 安全测试

### 2.6 第6周: 部署和交付
- 生产环境部署
- 用户培训
- 文档编写
- 项目交付

## 3. 资源分配

### 3.1 团队角色
- **项目经理**: 1人
- **前端开发**: ${effortEstimation.teamSize > 2 ? '2人' : '1人'}
- **后端开发**: 1人
- **测试工程师**: 1人 (第5周加入)

### 3.2 工时分配
\`\`\`
分析设计: ${effortEstimation.breakdown.analysis} 小时 (${Math.round(effortEstimation.breakdown.analysis / effortEstimation.totalHours * 100)}%)
开发实现: ${effortEstimation.breakdown.development} 小时 (${Math.round(effortEstimation.breakdown.development / effortEstimation.totalHours * 100)}%)
测试验证: ${effortEstimation.breakdown.testing} 小时 (${Math.round(effortEstimation.breakdown.testing / effortEstimation.totalHours * 100)}%)
部署文档: ${effortEstimation.breakdown.deployment + effortEstimation.breakdown.documentation} 小时 (${Math.round((effortEstimation.breakdown.deployment + effortEstimation.breakdown.documentation) / effortEstimation.totalHours * 100)}%)
\`\`\`

## 4. 里程碑

### 4.1 关键里程碑
1. **M1** (第1周末): 基础架构完成
2. **M2** (第2周末): 核心功能完成
3. **M3** (第4周末): 用户界面完成
4. **M4** (第5周末): 测试通过
5. **M5** (第6周末): 生产部署

### 4.2 交付物
- 源代码仓库
- 部署文档
- 用户手册
- API文档
- 测试报告

## 5. 风险管理

### 5.1 风险应对计划
- **技术风险**: 每周技术评审，准备备用方案
- **时间风险**: 设置缓冲时间，优先级管理
- **需求风险**: 定期客户沟通，变更控制流程

### 5.2 沟通计划
- **每日站会**: 15分钟，同步进度
- **周会**: 1小时，评审和计划
- **客户会议**: 每2周1次，演示和反馈

---
*计划生成时间: ${new Date().toLocaleString()}*
*基于分析ID: ${analysis.id}*`;
  }

  /**
   * 生成Terraform配置
   */
  private generateTerraformConfig(projectName: string, analysis: RequirementAnalysis): string {
    return `# Terraform配置 - ${projectName}

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

# 资源组
resource "azurerm_resource_group" "main" {
  name     = "rg-${projectName}"
  location = "Southeast Asia"
  tags = {
    environment = "production"
    project     = "${projectName}"
  }
}

# App Service Plan
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

# PostgreSQL数据库
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "psql-${projectName}"
  resource_group_name    = azurerm_resource_group.main.name
  location              = azurerm_resource_group.main.location
  version               = "13"
  administrator_login    = "adminuser"
  administrator_password = "ChangeMe123!" # 在生产环境中使用密钥库

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

# Redis缓存
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
   * 生成Docker Compose配置
   */
  private generateDockerComposeConfig(projectName: string, analysis: RequirementAnalysis): string {
    return `# Docker Compose配置 - ${projectName}

version: '3.8'

services:
  # 前端应用
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://backend:3001
    depends_on:
      - backend
    networks:
