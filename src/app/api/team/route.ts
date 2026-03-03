import { NextRequest, NextResponse } from 'next/server';
import { TeamCollaborationManager } from '@/lib/team-collaboration';

// GET: FetchTeamdata
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const teamId = searchParams.get('teamId');
    
    if (action === 'users') {
      // Fetch所AllUser
      const users = TeamCollaborationManager.getUsers();
      
      return NextResponse.json({
        success: true,
        data: users
      });
    } else if (action === 'user') {
      // Fetch特定User
      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'Missing  userId Parameters'
        }, { status: 400 });
      }
      
      const user = TeamCollaborationManager.getUser(userId);
      
      if (!user) {
        return NextResponse.json({
          success: false,
          error: 'Userdoes not exist'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        data: user
      });
    } else if (action === 'teams') {
      // Fetch所AllTeam
      const teams = TeamCollaborationManager.getTeams();
      
      return NextResponse.json({
        success: true,
        data: teams
      });
    } else if (action === 'team') {
      // Fetch特定Team
      if (!teamId) {
        return NextResponse.json({
          success: false,
          error: 'Missing  teamId Parameters'
        }, { status: 400 });
      }
      
      const team = TeamCollaborationManager.getTeam(teamId);
      
      if (!team) {
        return NextResponse.json({
          success: false,
          error: 'Teamdoes not exist'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        data: team
      });
    } else if (action === 'user-teams') {
      // FetchUser所属Team
      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'Missing  userId Parameters'
        }, { status: 400 });
      }
      
      const teams = TeamCollaborationManager.getUserTeams(userId);
      
      return NextResponse.json({
        success: true,
        data: teams
      });
    } else if (action === 'permissions') {
      // FetchPermissionConfiguration
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
      // FetchUserNotification
      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'Missing  userId Parameters'
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
      // CheckUserPermission
      if (!userId || !searchParams.get('action')) {
        return NextResponse.json({
          success: false,
          error: 'Missing  userId or action Parameters'
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
      // Default返回User和TeamStatistics
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

// POST: Team Collaboration操作
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
      // CreateUser
      const { username, email, role = 'viewer', metadata } = params;
      
      if (!username || !email) {
        return NextResponse.json({
          success: false,
          error: 'Missing  username or email Parameters'
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
        message: 'UserCreated successfully'
      });
      
    } else if (action === 'update-user') {
      // UpdateUser
      const { userId, updates } = params;
      
      if (!userId || !updates) {
        return NextResponse.json({
          success: false,
          error: 'Missing  userId or updates Parameters'
        }, { status: 400 });
      }
      
      const updatedUser = TeamCollaborationManager.updateUser(userId, updates);
      
      if (!updatedUser) {
        return NextResponse.json({
          success: false,
          error: 'Userdoes not exist'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        data: updatedUser,
        message: 'UserUpdated successfully'
      });
      
    } else if (action === 'create-team') {
      // CreateTeam
      const { name, description, members = [], projects = [] } = params;
      
      if (!name) {
        return NextResponse.json({
          success: false,
          error: 'Missing  name Parameters'
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
        message: 'TeamCreated successfully'
      });
      
    } else if (action === 'add-team-member') {
      // AddTeam成员
      const { teamId, userId } = params;
      
      if (!teamId || !userId) {
        return NextResponse.json({
          success: false,
          error: 'Missing  teamId or userId Parameters'
        }, { status: 400 });
      }
      
      const success = TeamCollaborationManager.addTeamMember(teamId, userId);
      
      return NextResponse.json({
        success,
        message: success ? 'Member added successfully' : 'Add failed or member already exists'
      });
      
    } else if (action === 'send-notification') {
      // SendNotification
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
        message: 'NotificationSendsuccess'
      });
      
    } else if (action === 'mark-notification-read') {
      // 标记Notificationforalready读
      const { userId, notificationId } = params;
      
      if (!userId || !notificationId) {
        return NextResponse.json({
          success: false,
          error: 'Missing  userId or notificationId Parameters'
        }, { status: 400 });
      }
      
      const success = TeamCollaborationManager.markNotificationAsRead(userId, notificationId);
      
      return NextResponse.json({
        success,
        message: success ? 'Notification marked as read' : 'Notification does not exist'
      });
      
    } else if (action === 'create-session') {
      // Createcollaborationwill话
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
        message: 'Collaboration session created successfully'
      });
      
    } else if (action === 'export-team') {
      // ExportTeamdata
      const { teamId } = params;
      
      if (!teamId) {
        return NextResponse.json({
          success: false,
          error: 'Missing  teamId Parameters'
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
          error: error instanceof Error ? error.message : 'Exportfailed'
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