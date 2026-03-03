// Team Collaboration - MoreUser和Permission管理
import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const TEAMS_FILE = path.join(DB_DIR, 'teams.json');
const PERMISSIONS_FILE = path.join(DB_DIR, 'permissions.json');

// 确保data目录存in
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initializedata库file
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({
    users: [
      {
        id: 'user_1',
        username: 'kaneliu',
        email: 'kaneliu10@gmail.com',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: null
      }
    ],
    lastUpdated: new Date().toISOString()
  }, null, 2));
}

if (!fs.existsSync(TEAMS_FILE)) {
  fs.writeFileSync(TEAMS_FILE, JSON.stringify({
    teams: [
      {
        id: 'team_1',
        name: '核心DevelopmentTeam',
        description: '主need toProductDevelopment和maintenanceTeam',
        members: ['user_1'],
        projects: ['mission-control', 'my-skill-store'],
        createdAt: new Date().toISOString()
      }
    ],
    lastUpdated: new Date().toISOString()
  }, null, 2));
}

if (!fs.existsSync(PERMISSIONS_FILE)) {
  fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify({
    permissions: {
      admin: {
        canViewAll: true,
        canEditAll: true,
        canDeleteAll: true,
        canManageUsers: true,
        canManageTeams: true,
        canManageProjects: true
      },
      manager: {
        canViewAll: true,
        canEditAll: true,
        canDeleteAll: false,
        canManageUsers: false,
        canManageTeams: true,
        canManageProjects: true
      },
      developer: {
        canViewAll: true,
        canEditOwn: true,
        canDeleteOwn: true,
        canManageUsers: false,
        canManageTeams: false,
        canManageProjects: false
      },
      viewer: {
        canViewAll: true,
        canEditOwn: false,
        canDeleteOwn: false,
        canManageUsers: false,
        canManageTeams: false,
        canManageProjects: false
      }
    },
    lastUpdated: new Date().toISOString()
  }, null, 2));
}

// UserInterface
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'developer' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin: string | null;
  metadata?: {
    avatar?: string;
    bio?: string;
    skills?: string[];
  };
}

// TeamInterface
export interface Team {
  id: string;
  name: string;
  description: string;
  members: string[]; // UserIDArray
  projects: string[];
  createdAt: string;
  updatedAt?: string;
}

// PermissionInterface
export interface PermissionSet {
  canViewAll: boolean;
  canEditAll: boolean;
  canDeleteAll: boolean;
  canManageUsers: boolean;
  canManageTeams: boolean;
  canManageProjects: boolean;
  canEditOwn: boolean;
  canDeleteOwn: boolean;
}

// Team Collaboration管理器
export class TeamCollaborationManager {
  // User管理
  static getUsers(): User[] {
    try {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      return data.users || [];
    } catch (error) {
      console.error('Error reading users:', error);
      return [];
    }
  }
  
  static getUser(userId: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.id === userId) || null;
  }
  
  static createUser(userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    
    users.push(newUser);
    
    fs.writeFileSync(USERS_FILE, JSON.stringify({
      users,
      lastUpdated: new Date().toISOString()
    }, null, 2));
    
    return newUser;
  }
  
  static updateUser(userId: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const index = users.findIndex(user => user.id === userId);
    
    if (index === -1) return null;
    
    users[index] = { ...users[index], ...updates };
    
    fs.writeFileSync(USERS_FILE, JSON.stringify({
      users,
      lastUpdated: new Date().toISOString()
    }, null, 2));
    
    return users[index];
  }
  
  static deleteUser(userId: string): boolean {
    const users = this.getUsers();
    const filteredUsers = users.filter(user => user.id !== userId);
    
    if (filteredUsers.length === users.length) return false;
    
    fs.writeFileSync(USERS_FILE, JSON.stringify({
      users: filteredUsers,
      lastUpdated: new Date().toISOString()
    }, null, 2));
    
    return true;
  }
  
  // Team管理
  static getTeams(): Team[] {
    try {
      const data = JSON.parse(fs.readFileSync(TEAMS_FILE, 'utf-8'));
      return data.teams || [];
    } catch (error) {
      console.error('Error reading teams:', error);
      return [];
    }
  }
  
  static getTeam(teamId: string): Team | null {
    const teams = this.getTeams();
    return teams.find(team => team.id === teamId) || null;
  }
  
  static createTeam(teamData: Omit<Team, 'id' | 'createdAt'>): Team {
    const teams = this.getTeams();
    const newTeam: Team = {
      ...teamData,
      id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    
    teams.push(newTeam);
    
    fs.writeFileSync(TEAMS_FILE, JSON.stringify({
      teams,
      lastUpdated: new Date().toISOString()
    }, null, 2));
    
    return newTeam;
  }
  
  static updateTeam(teamId: string, updates: Partial<Team>): Team | null {
    const teams = this.getTeams();
    const index = teams.findIndex(team => team.id === teamId);
    
    if (index === -1) return null;
    
    teams[index] = { 
      ...teams[index], 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(TEAMS_FILE, JSON.stringify({
      teams,
      lastUpdated: new Date().toISOString()
    }, null, 2));
    
    return teams[index];
  }
  
  static addTeamMember(teamId: string, userId: string): boolean {
    const team = this.getTeam(teamId);
    if (!team) return false;
    
    if (!team.members.includes(userId)) {
      team.members.push(userId);
      this.updateTeam(teamId, { members: team.members });
      return true;
    }
    
    return false;
  }
  
  static removeTeamMember(teamId: string, userId: string): boolean {
    const team = this.getTeam(teamId);
    if (!team) return false;
    
    const index = team.members.indexOf(userId);
    if (index !== -1) {
      team.members.splice(index, 1);
      this.updateTeam(teamId, { members: team.members });
      return true;
    }
    
    return false;
  }
  
  // Permission管理
  static getPermissions(): Record<string, PermissionSet> {
    try {
      const data = JSON.parse(fs.readFileSync(PERMISSIONS_FILE, 'utf-8'));
      return data.permissions || {};
    } catch (error) {
      console.error('Error reading permissions:', error);
      return {};
    }
  }
  
  static getUserPermissions(role: string): PermissionSet {
    const permissions = this.getPermissions();
    return permissions[role] || permissions.viewer;
  }
  
  static canUserPerformAction(userId: string, action: keyof PermissionSet): boolean {
    const user = this.getUser(userId);
    if (!user) return false;
    
    const permissions = this.getUserPermissions(user.role);
    return permissions[action] || false;
  }
  
  // Projectcollaboration
  static assignProjectToTeam(projectId: string, teamId: string): boolean {
    const team = this.getTeam(teamId);
    if (!team) return false;
    
    if (!team.projects.includes(projectId)) {
      team.projects.push(projectId);
      this.updateTeam(teamId, { projects: team.projects });
      return true;
    }
    
    return false;
  }
  
  static getTeamProjects(teamId: string): string[] {
    const team = this.getTeam(teamId);
    return team?.projects || [];
  }
  
  static getUserTeams(userId: string): Team[] {
    const teams = this.getTeams();
    return teams.filter(team => team.members.includes(userId));
  }
  
  // collaboration功can
  static createCollaborationSession(
    projectId: string,
    creatorId: string,
    sessionData: {
      title: string;
      description: string;
      type: 'code-review' | 'planning' | 'testing' | 'debugging';
      participants: string[];
    }
  ): {
    id: string;
    projectId: string;
    creatorId: string;
    title: string;
    description: string;
    type: string;
    participants: string[];
    createdAt: string;
    status: 'active' | 'completed' | 'cancelled';
  } {
    const session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      creatorId,
      ...sessionData,
      createdAt: new Date().toISOString(),
      status: 'active' as const
    };
    
    // Savewill话tofile
    const sessionsFile = path.join(DB_DIR, `collaboration-${projectId}.json`);
    let sessions = [];
    
    try {
      if (fs.existsSync(sessionsFile)) {
        sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf-8')).sessions || [];
      }
    } catch {
      // iffile损坏, CreateNew's
    }
    
    sessions.push(session);
    
    fs.writeFileSync(sessionsFile, JSON.stringify({
      sessions,
      lastUpdated: new Date().toISOString()
    }, null, 2));
    
    return session;
  }
  
  // Notification System
  static sendNotification(
    userId: string,
    notification: {
      title: string;
      message: string;
      type: 'info' | 'warning' | 'error' | 'success';
      action?: {
        label: string;
        url: string;
      };
    }
  ): string {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const notificationsFile = path.join(DB_DIR, `notifications-${userId}.json`);
    let notifications = [];
    
    try {
      if (fs.existsSync(notificationsFile)) {
        notifications = JSON.parse(fs.readFileSync(notificationsFile, 'utf-8')).notifications || [];
      }
    } catch {
      // iffile损坏, CreateNew's
    }
    
    notifications.push({
      id: notificationId,
      ...notification,
      read: false,
      createdAt: new Date().toISOString()
    });
    
    // 只保留最近's100 Notification
    const limitedNotifications = notifications.slice(-100);
    
    fs.writeFileSync(notificationsFile, JSON.stringify({
      notifications: limitedNotifications,
      lastUpdated: new Date().toISOString()
    }, null, 2));
    
    return notificationId;
  }
  
  static getUserNotifications(userId: string): Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
    action?: {
      label: string;
      url: string;
    };
  }> {
    const notificationsFile = path.join(DB_DIR, `notifications-${userId}.json`);
    
    try {
      if (fs.existsSync(notificationsFile)) {
        const data = JSON.parse(fs.readFileSync(notificationsFile, 'utf-8'));
        return data.notifications || [];
      }
    } catch (error) {
      console.error('Error reading notifications:', error);
    }
    
    return [];
  }
  
  static markNotificationAsRead(userId: string, notificationId: string): boolean {
    const notifications = this.getUserNotifications(userId);
    const index = notifications.findIndex(n => n.id === notificationId);
    
    if (index === -1) return false;
    
    notifications[index].read = true;
    
    const notificationsFile = path.join(DB_DIR, `notifications-${userId}.json`);
    fs.writeFileSync(notificationsFile, JSON.stringify({
      notifications,
      lastUpdated: new Date().toISOString()
    }, null, 2));
    
    return true;
  }
  
  // ExportTeamdata
  static exportTeamData(teamId: string): string {
    const team = this.getTeam(teamId);
    if (!team) throw new Error('Team not found');
    
    const members = team.members.map(userId => this.getUser(userId)).filter(Boolean);
    
    const data = {
      team,
      members,
      exportedAt: new Date().toISOString(),
      exportedBy: 'system'
    };
    
    return JSON.stringify(data, null, 2);
  }
}