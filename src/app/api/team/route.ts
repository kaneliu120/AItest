import { NextRequest, NextResponse } from 'next/server';
import { TeamCollaborationManager } from '@/lib/team-collaboration';

// GET: 获取团队数据
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const teamId = searchParams.get('teamId');
    
    if (action === 'users') {
      // 获取所有用户
      const users = TeamCollaborationManager.getUsers();
      
      return NextResponse.json({
        success: true,
        data: users
      });
    } else if (action === 'user') {
      // 获取特定用户
      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'Missing userId parameter'
        }, { status: 400 });
      }
      
      const user = TeamCollaborationManager.getUser(userId);
      
      if (!user) {
        return NextResponse.json({
          success: false,
          error: 'User not found'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        data: user
      });
    } else if (action === 'teams') {
      // 获取所有团队
      const teams = TeamCollaborationManager.getTeams();
      
      return NextResponse.json({
        success: true,
        data: teams
      });
    } else if (action === 'team') {
      // 获取特定团队
      if (!teamId) {
        return NextResponse.json({
          success: false,
          error: 'Missing teamId parameter'
        }, { status: 400 });
      }
      
      const team = TeamCollaborationManager.getTeam(teamId);
      
      if (!team) {
        return NextResponse.json({
          success: false,
          error: 'Team not found'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        data: team
      });
    } else if (action === 'user-teams') {
      // 获取用户所属团队
      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'Missing userId parameter'
        }, { status: 400 });
      }
      
      const teams = TeamCollaborationManager.getUserTeams(userId);
      
      return NextResponse.json({
        success: true,
        data: teams
      });
    } else if (action === 'permissions') {
      // 获取权限配置
      const role = searchParams.get('role');
      
      if (role) {
        const permissions = TeamCollaborationManager.getUserPermissions(role);
        return NextResponse.json({
          success: true,
          data: permissions
        });
      } else {
        const allPermissions = TeamCollaborationManager.getPermissions();
        return NextResponse.json({
          success: true,
          data: allPermissions
        });
      }
    } else if (action === 'notifications') {
      // 获取用户通知
      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'Missing userId parameter'
        }, { status: 400 });
      }
      
      const notifications = TeamCollaborationManager.getUserNotifications(userId);
      const unreadCount = notifications.filter(n => !n.read).length;
      
      return NextResponse.json({
        success: true,
        data: {
          notifications,
          unreadCount,
          total: notifications.length
        }
      });
    } else if (action === 'check-permission') {
      // 检查用户权限
      if (!userId || !searchParams.get('action')) {
        return NextResponse.json({
          success: false,
          error: 'Missing userId or action parameter'
        }, { status: 400 });
      }
      
      const canPerform = TeamCollaborationManager.canUserPerformAction(
        userId, 
        searchParams.get('action') as any
      );
      
      return NextResponse.json({
        success: true,
        data: { canPerform }
      });
    } else {
      // 默认返回用户和团队统计
      const users = TeamCollaborationManager.getUsers();
      const teams = TeamCollaborationManager.getTeams();
      
      return NextResponse.json({
        success: true,
        data: {
          users: {
            total: users.length,
            active: users.filter(u => u.status === 'active').length,
            byRole: users.reduce((acc, user) => {
              acc[user.role] = (acc[user.role] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          },
          teams: {
            total: teams.length,
            withProjects: teams.filter(t => t.projects.length > 0).length,
            averageMembers: teams.reduce((sum, team) => sum + team.members.length, 0) / teams.length
          }
        }
      });
    }
  } catch (error) {
    console.error('Team API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST: 团队协作操作
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    
    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Missing action parameter'
      }, { status: 400 });
    }
    
    if (action === 'create-user') {
      // 创建用户
      const { username, email, role = 'viewer', metadata } = params;
      
      if (!username || !email) {
        return NextResponse.json({
          success: false,
          error: 'Missing username or email parameter'
        }, { status: 400 });
      }
      
      const user = TeamCollaborationManager.createUser({
        username,
        email,
        role,
        status: 'active',
        metadata
      });
      
      return NextResponse.json({
        success: true,
        data: user,
        message: 'User created successfully'
      });
      
    } else if (action === 'update-user') {
      // 更新用户
      const { userId, updates } = params;
      
      if (!userId || !updates) {
        return NextResponse.json({
          success: false,
          error: 'Missing userId or updates parameter'
        }, { status: 400 });
      }
      
      const updatedUser = TeamCollaborationManager.updateUser(userId, updates);
      
      if (!updatedUser) {
        return NextResponse.json({
          success: false,
          error: 'User not found'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      });
      
    } else if (action === 'create-team') {
      // 创建团队
      const { name, description, members = [], projects = [] } = params;
      
      if (!name) {
        return NextResponse.json({
          success: false,
          error: 'Missing name parameter'
        }, { status: 400 });
      }
      
      const team = TeamCollaborationManager.createTeam({
        name,
        description,
        members,
        projects
      });
      
      return NextResponse.json({
        success: true,
        data: team,
        message: 'Team created successfully'
      });
      
    } else if (action === 'add-team-member') {
      // Add team member
      const { teamId, userId } = params;
      
      if (!teamId || !userId) {
        return NextResponse.json({
          success: false,
          error: 'Missing teamId or userId parameter'
        }, { status: 400 });
      }
      
      const success = TeamCollaborationManager.addTeamMember(teamId, userId);
      
      return NextResponse.json({
        success,
        message: success ? 'Member added' : 'Add failed or member already exists'
      });
      
    } else if (action === 'send-notification') {
      // 发送通知
      const { userId, title, message, type = 'info', action: notificationAction } = params;
      
      if (!userId || !title || !message) {
        return NextResponse.json({
          success: false,
          error: 'Missing required parameters'
        }, { status: 400 });
      }
      
      const notificationId = TeamCollaborationManager.sendNotification(userId, {
        title,
        message,
        type,
        action: notificationAction
      });
      
      return NextResponse.json({
        success: true,
        data: { notificationId },
        message: 'Notification sent'
      });
      
    } else if (action === 'mark-notification-read') {
      // 标记通知为已读
      const { userId, notificationId } = params;
      
      if (!userId || !notificationId) {
        return NextResponse.json({
          success: false,
          error: 'Missing userId or notificationId parameter'
        }, { status: 400 });
      }
      
      const success = TeamCollaborationManager.markNotificationAsRead(userId, notificationId);
      
      return NextResponse.json({
        success,
        message: success ? 'Notification marked as read' : 'Notification not found'
      });
      
    } else if (action === 'create-session') {
      // 创建协作会话
      const { projectId, creatorId, title, description, type, participants } = params;
      
      if (!projectId || !creatorId || !title || !type) {
        return NextResponse.json({
          success: false,
          error: 'Missing required parameters'
        }, { status: 400 });
      }
      
      const session = TeamCollaborationManager.createCollaborationSession(
        projectId,
        creatorId,
        { title, description, type, participants: participants || [] }
      );
      
      return NextResponse.json({
        success: true,
        data: session,
        message: 'Collaboration session created'
      });
      
    } else if (action === 'export-team') {
      // 导出团队数据
      const { teamId } = params;
      
      if (!teamId) {
        return NextResponse.json({
          success: false,
          error: 'Missing teamId parameter'
        }, { status: 400 });
      }
      
      try {
        const exportData = TeamCollaborationManager.exportTeamData(teamId);
        
        return new NextResponse(exportData, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="team-${teamId}-export.json"`
          }
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Export failed'
        }, { status: 404 });
      }
      
    } else {
      return NextResponse.json({
        success: false,
        error: 'Unknown operation type'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Team API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}