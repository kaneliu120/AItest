/**
 * 外包系统API - 模拟数据
 * 使用标准化API格式
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api-response';
import { simpleApiHandler } from '@/middleware/simple-standardizer';

// GET请求 - 获取外包数据
export const GET = simpleApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'projects';
    
    if (action === 'projects') {
      const projects = [
        {
          id: 'proj-001',
          title: 'AI技能平台开发',
          description: '为My Skill Shop开发新功能模块',
          status: 'active',
          budget: 50000,
          deadline: '2026-03-15',
          progress: 75,
          client: '内部项目',
          category: 'AI开发',
        },
        {
          id: 'proj-002',
          title: '财务系统优化',
          description: '优化Mission Control财务模块',
          status: 'active',
          budget: 25000,
          deadline: '2026-03-10',
          progress: 60,
          client: '内部项目',
          category: '系统开发',
        },
        {
          id: 'proj-003',
          title: '自动化脚本开发',
          description: '开发社交媒体自动化脚本',
          status: 'pending',
          budget: 30000,
          deadline: '2026-03-20',
          progress: 20,
          client: '外部客户',
          category: '自动化',
        },
        {
          id: 'proj-004',
          title: '数据分析仪表板',
          description: '为电商客户开发数据分析仪表板',
          status: 'completed',
          budget: 40000,
          deadline: '2026-02-15',
          progress: 100,
          client: '电商公司',
          category: '数据分析',
        },
        {
          id: 'proj-005',
          title: '移动应用开发',
          description: '开发React Native移动应用',
          status: 'cancelled',
          budget: 60000,
          deadline: '2026-02-28',
          progress: 30,
          client: '创业公司',
          category: '移动开发',
        },
      ];
      
      return successResponse({ projects }, {
        message: '项目列表获取成功',
        requestId,
      });
    }
    
    if (action === 'proposals') {
      const proposals = [
        {
          id: 'prop-001',
          projectTitle: 'AI聊天机器人开发',
          client: '科技公司',
          submittedDate: '2026-02-20',
          status: 'submitted',
          budget: 45000,
          description: '开发基于GPT的客服聊天机器人',
        },
        {
          id: 'prop-002',
          projectTitle: '网站重构项目',
          client: '教育机构',
          submittedDate: '2026-02-18',
          status: 'accepted',
          budget: 35000,
          description: '将旧网站迁移到Next.js',
        },
        {
          id: 'prop-003',
          projectTitle: '数据库优化',
          client: '金融公司',
          submittedDate: '2026-02-15',
          status: 'rejected',
          budget: 28000,
          description: '优化PostgreSQL数据库性能',
        },
        {
          id: 'prop-004',
          projectTitle: 'API集成开发',
          client: '物流公司',
          submittedDate: '2026-02-10',
          status: 'pending',
          budget: 32000,
          description: '集成多个物流API到统一平台',
        },
        {
          id: 'prop-005',
          projectTitle: 'UI/UX设计',
          client: '设计工作室',
          submittedDate: '2026-02-05',
          status: 'accepted',
          budget: 25000,
          description: '为新产品设计用户界面',
        },
      ];
      
      return successResponse({ proposals }, {
        message: '提案列表获取成功',
        requestId,
      });
    }
    
    if (action === 'clients') {
      const clients = [
        {
          id: 'client-001',
          name: '张三',
          company: '科技公司',
          email: 'zhangsan@tech.com',
          phone: '+63 912 345 6789',
          totalSpent: 120000,
          projectsCount: 3,
          lastProject: '2026-02-15',
        },
        {
          id: 'client-002',
          name: '李四',
          company: '教育机构',
          email: 'lisi@edu.org',
          phone: '+63 912 345 6788',
          totalSpent: 85000,
          projectsCount: 2,
          lastProject: '2026-02-10',
        },
        {
          id: 'client-003',
          name: '王五',
          company: '金融公司',
          email: 'wangwu@finance.com',
          phone: '+63 912 345 6787',
          totalSpent: 60000,
          projectsCount: 1,
          lastProject: '2026-01-20',
        },
        {
          id: 'client-004',
          name: '赵六',
          company: '物流公司',
          email: 'zhaoliu@logistics.com',
          phone: '+63 912 345 6786',
          totalSpent: 45000,
          projectsCount: 1,
          lastProject: '2026-01-15',
        },
        {
          id: 'client-005',
          name: '钱七',
          company: '设计工作室',
          email: 'qianqi@design.com',
          phone: '+63 912 345 6785',
          totalSpent: 30000,
          projectsCount: 1,
          lastProject: '2026-01-10',
        },
      ];
      
      return successResponse({ clients }, {
        message: '客户列表获取成功',
        requestId,
      });
    }
    
    if (action === 'status') {
      const statusData = {
        status: 'running',
        version: '1.0.0',
        totalProjects: 5,
        totalProposals: 5,
        totalClients: 5,
        activeProjects: 2,
        pendingProposals: 1,
        lastUpdate: new Date().toISOString(),
      };
      
      return successResponse(statusData, {
        message: '系统状态获取成功',
        requestId,
      });
    }
    
    // 默认返回项目列表
    const defaultProjects = [
      {
        id: 'proj-001',
        title: 'AI技能平台开发',
        description: '为My Skill Shop开发新功能模块',
        status: 'active',
        budget: 50000,
        deadline: '2026-03-15',
        progress: 75,
      },
    ];
    
    return successResponse({ projects: defaultProjects }, {
      message: '默认项目列表获取成功',
      requestId,
    });
    
  } catch (error) {
    console.error('外包系统API错误:', error);
    
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});

// POST请求 - 创建外包数据
export const POST = simpleApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const body = await request.json();
    const action = body.action || 'add-project';
    
    if (action === 'add-project') {
      const { title, description, budget, deadline, client, category } = body;
      
      if (!title || !description || !budget || !deadline) {
        return errorResponse('缺少必要参数: title, description, budget, deadline', {
          statusCode: 400,
          requestId,
        });
      }
      
      const newProject = {
        id: `proj-${Date.now()}`,
        title,
        description,
        status: 'pending',
        budget: Number(budget),
        deadline,
        progress: 0,
        client: client || '未指定',
        category: category || '其他',
        createdAt: new Date().toISOString(),
        metadata: {
          source: 'mission-control-freelance',
          requestId,
          processingTime: 0,
        }
      };
      
      return successResponse(newProject, {
        message: '项目创建成功',
        requestId,
      });
    }
    
    if (action === 'add-proposal') {
      const { projectTitle, client, budget, description } = body;
      
      if (!projectTitle || !client || !budget || !description) {
        return errorResponse('缺少必要参数: projectTitle, client, budget, description', {
          statusCode: 400,
          requestId,
        });
      }
      
      const newProposal = {
        id: `prop-${Date.now()}`,
        projectTitle,
        client,
        submittedDate: new Date().toISOString().split('T')[0],
        status: 'submitted',
        budget: Number(budget),
        description,
        createdAt: new Date().toISOString(),
        metadata: {
          source: 'mission-control-freelance',
          requestId,
          processingTime: 0,
        }
      };
      
      return successResponse(newProposal, {
        message: '提案创建成功',
        requestId,
      });
    }
    
    if (action === 'add-client') {
      const { name, company, email, phone } = body;
      
      if (!name || !email) {
        return errorResponse('缺少必要参数: name, email', {
          statusCode: 400,
          requestId,
        });
      }
      
      const newClient = {
        id: `client-${Date.now()}`,
        name,
        company: company || '独立客户',
        email,
        phone: phone || '',
        totalSpent: 0,
        projectsCount: 0,
        lastProject: null,
        createdAt: new Date().toISOString(),
        metadata: {
          source: 'mission-control-freelance',
          requestId,
          processingTime: 0,
        }
      };
      
      return successResponse(newClient, {
        message: '客户创建成功',
        requestId,
      });
    }
    
    return errorResponse('不支持的操作', {
      statusCode: 400,
      requestId,
    });
    
  } catch (error) {
    console.error('外包系统API错误:', error);
    
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});