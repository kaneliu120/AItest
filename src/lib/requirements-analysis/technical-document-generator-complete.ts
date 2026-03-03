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
      title: `Software Requirements Specification - ${analysis.documentId}`,
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
      title: `Technical Design Document - ${analysis.documentId}`,
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
      title: `Project Development Plan - ${analysis.documentId}`,
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
    
    return `# Software Requirements Specification (SRS)

## 1. Project Overview

### 1.1 Project Background
Auto-generated specification based on requirements analysis.

### 1.2 Project Objectives
- Implement the core features described in the requirements
- Deliver a high-quality user experience
- Ensure system scalability and maintainability

## 2. Functional Requirements

### 2.1 Core Features
${categories.functional.map(req => `- **${req.id}**: ${req.description} (Priority: ${req.priority}, Complexity: ${req.complexity})`).join('\n')}

### 2.2 Non-Functional Requirements
${categories.nonFunctional.map(req => `- **${req.type}**: ${req.description}`).join('\n')}

## 3. Technical Architecture

### 3.1 Recommended Tech Stack
- **Frontend**: ${analysis.techStack.frontend[0]?.framework || 'Next.js'}
- **Backend**: ${analysis.techStack.backend[0]?.framework || 'NestJS'}
- **Database**: ${analysis.techStack.database[0]?.type || 'PostgreSQL'}
- **Deployment Platform**: ${analysis.techStack.deployment[0]?.platform || 'Azure App Service'}

## 4. Project Constraints

### 4.1 Timeline Constraints
- Optimistic timeline: ${effortEstimation.timeline.optimistic} days
- Realistic timeline: ${effortEstimation.timeline.realistic} days  
- Pessimistic timeline: ${effortEstimation.timeline.pessimistic} days

### 4.2 Resource Constraints
- Recommended team size: ${effortEstimation.teamSize} person(s)
- Total effort: ${effortEstimation.totalHours} hours

## 5. Risk Assessment

${risks.map(risk => `### ${risk.id}: ${risk.description}
- Probability: ${risk.probability}
- Impact: ${risk.impact}
- Mitigation: ${risk.mitigation}`).join('\n\n')}

## 6. Acceptance Criteria

### 6.1 Functional Acceptance Criteria
- All core features implemented per requirements
- System performance meets non-functional requirements
- UI conforms to design specifications

### 6.2 Technical Acceptance Criteria
- Code quality meets standards
- Test coverage > 80%
- Deployment process automated

---
*Document generated: ${new Date().toLocaleString()}*
*Based on analysis ID: ${analysis.id}*`;
  }

  /**
   * 生成TDD内容
   */
  private generateTDDContent(analysis: RequirementAnalysis): string {
    const { techStack, categories } = analysis;
    
    return `# Technical Design Document (TDD)

## 1. System Architecture

### 1.1 Architecture Overview
Layered architecture design, separating concerns for maintainability.

### 1.2 Technology Selection
${this.generateTechStackTable(techStack)}

## 2. Database Design

### 2.1 Database Selection
- **Primary Database**: ${techStack.database[0]?.type || 'PostgreSQL'}
- **Cache Database**: Redis
- **File Storage**: Azure Blob Storage

### 2.2 Core Table Structure
\`\`\`sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table  
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

## 3. API Design

### 3.1 REST API Specifications
- Follow RESTful design principles
- Versioning: /api/v1/
- Authentication: JWT Token
- Response format: JSON

### 3.2 Core API Endpoints
\`\`\`
GET    /api/v1/projects          # Get project list
POST   /api/v1/projects          # Create project
GET    /api/v1/projects/{id}     # Get project details
PUT    /api/v1/projects/{id}     # Update project
DELETE /api/v1/projects/{id}     # Delete project
\`\`\`

## 4. Frontend Architecture

### 4.1 Component Structure
\`\`\`
src/
├── components/     # Reusable components
├── pages/         # Page components
├── lib/           # Utility functions
├── styles/        # Style files
└── types/         # TypeScript types
\`\`\`

### 4.2 State Management
- Using React Context + useReducer
- Server state using React Query
- Form state using React Hook Form

## 5. Deployment Architecture

### 5.1 Infrastructure
- **Compute**: Azure App Service
- **Database**: Azure Database for PostgreSQL
- **Storage**: Azure Blob Storage
- **Cache**: Azure Cache for Redis

### 5.2 CI/CD Pipeline
1. Code commit → GitHub Actions
2. Automated tests
3. Build Docker image
4. Push to Azure Container Registry
5. Deploy to Azure App Service

## 6. Security Design

### 6.1 Authentication & Authorization
- JWT Token authentication
- RBAC role-based access control
- API rate limiting

### 6.2 Data Security
- HTTPS mandatory encryption
- Database connection encryption
- Sensitive data encrypted storage

---
*Document generated: ${new Date().toLocaleString()}*`;
  }

  /**
   * 生成项目计划内容
   */
  private generateProjectPlanContent(analysis: RequirementAnalysis): string {
    const { effortEstimation, categories } = analysis;
    const totalWeeks = Math.ceil(effortEstimation.timeline.realistic / 5); // based on working days
    
    return `# Project Development Plan

## 1. Project Overview

### 1.1 Project Information
- **Project Name**: ${this.extractProjectName(analysis)}
- **Estimated Duration**: ${effortEstimation.timeline.realistic} days (${totalWeeks} weeks)
- **Team Size**: ${effortEstimation.teamSize} person(s)
- **Total Effort**: ${effortEstimation.totalHours} hours

### 1.2 Phase Breakdown
1. **MVP Phase** (Weeks 1-2): Core feature implementation
2. **Expansion Phase** (Weeks 3-4): Feature completion and optimization
3. **Testing Phase** (Week 5): System testing and fixes
4. **Deployment Phase** (Week 6): Production deployment

## 2. Detailed Timeline

### 2.1 Week 1: Project Kickoff & Infrastructure
- Set up project environment
- Infrastructure design
- Database design
- Core API design

### 2.2 Week 2: Core Feature Development
${categories.functional.slice(0, 3).map((req, i) => `- Implement ${req.id}: ${req.description}`).join('\n')}

### 2.3 Week 3: Feature Expansion
${categories.functional.slice(3, 6).map((req, i) => `- Implement ${req.id}: ${req.description}`).join('\n')}

### 2.4 Week 4: UI Development
- Frontend page development
- User interaction design
- Responsive layout implementation

### 2.5 Week 5: Testing & Optimization
- Write unit tests
- Integration testing execution
- Performance optimization
- Security testing

### 2.6 Week 6: Deployment and Delivery
- Production deployment
- User training
- Documentation writing
- Project delivery

## 3. Resource Allocation

### 3.1 Team Roles
- **Project Manager**: 1 person
- **Frontend Developer**: ${effortEstimation.teamSize > 2 ? '2 persons' : '1 person'}
- **Backend Developer**: 1 person
- **QA Engineer**: 1 person (joining Week 5)

### 3.2 Effort Allocation
\`\`\`
Analysis & Design: ${effortEstimation.breakdown.analysis} hours (${Math.round(effortEstimation.breakdown.analysis / effortEstimation.totalHours * 100)}%)
Development: ${effortEstimation.breakdown.development} hours (${Math.round(effortEstimation.breakdown.development / effortEstimation.totalHours * 100)}%)
Testing: ${effortEstimation.breakdown.testing} hours (${Math.round(effortEstimation.breakdown.testing / effortEstimation.totalHours * 100)}%)
Deployment & Docs: ${effortEstimation.breakdown.deployment + effortEstimation.breakdown.documentation} hours (${Math.round((effortEstimation.breakdown.deployment + effortEstimation.breakdown.documentation) / effortEstimation.totalHours * 100)}%)
\`\`\`

## 4. Milestones

### 4.1 Key Milestones
1. **M1** (End of Week 1): Foundation complete
2. **M2** (End of Week 2): Core features complete
3. **M3** (End of Week 4): UI complete
4. **M4** (End of Week 5): Testing passed
5. **M5** (End of Week 6): Production deployment

### 4.2 Deliverables
- Source code repository
- Deployment documentation
- User manual
- API documentation
- Test report

## 5. Risk Management

### 5.1 Risk Response Plan
- **Technical Risk**: Weekly tech review, prepare fallback plans
- **Schedule Risk**: Buffer time, priority management
- **Requirement Risk**: Regular client sync, change control process

### 5.2 Communication Plan
- **Daily Standup**: 15 minutes, sync progress
- **Weekly Meeting**: 1 hour, review and planning
- **Client Meeting**: Bi-weekly, demo and feedback

---
*计划生成时间: ${new Date().toLocaleString()}*
*Based on analysis ID: ${analysis.id}*`;
  }

  /**
   * 生成Terraform配置
   */
  private generateTerraformConfig(projectName: string, analysis: RequirementAnalysis): string {
    return `# Terraform Configuration - ${projectName}

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

# Resource Group
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

# PostgreSQL Database
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "psql-${projectName}"
  resource_group_name    = azurerm_resource_group.main.name
  location              = azurerm_resource_group.main.location
  version               = "13"
  administrator_login    = "adminuser"
  administrator_password = "ChangeMe123!" # use key vault in production

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

# Redis Cache
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

# Outputs
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
    return `# Docker Compose Configuration - ${projectName}

version: '3.8'

services:
  # Frontend app
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

      backend:
        condition: service_healthy\`;
  }
}
