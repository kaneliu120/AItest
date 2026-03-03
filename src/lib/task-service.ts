/**
 * 任务服务
 * 提供任务管理功能
 */

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  assignedTo?: string;
  tags: string[];
}

export interface TaskStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  assignedTo?: string;
  tags?: string[];
}

class TaskService {
  private tasks: Task[] = [
    {
      id: 'task-1',
      title: 'Fix Ecosystem UI Interface',
      description: 'Comprehensive check and fix of tool ecosystem UI issues',
      priority: 'high',
      status: 'in-progress',
      createdAt: '2026-02-22T10:00:00Z',
      updatedAt: '2026-02-23T07:30:00Z',
      dueDate: '2026-02-23T18:00:00Z',
      assignedTo: 'Me',
      tags: ['UI', 'fix', 'priority'],
    },
    {
      id: 'task-2',
      title: 'Optimize API Response Performance',
      description: 'Optimize response time and error handling for all API endpoints',
      priority: 'medium',
      status: 'pending',
      createdAt: '2026-02-22T14:30:00Z',
      updatedAt: '2026-02-22T14:30:00Z',
      dueDate: '2026-02-24T12:00:00Z',
      tags: ['API', 'performance', 'optimization'],
    },
    {
      id: 'task-3',
      title: 'Deploy Knowledge Management System',
      description: 'Complete production deployment of the knowledge management system',
      priority: 'critical',
      status: 'completed',
      createdAt: '2026-02-21T09:00:00Z',
      updatedAt: '2026-02-22T17:30:00Z',
      dueDate: '2026-02-22T18:00:00Z',
      assignedTo: 'Me',
      tags: ['deployment', 'production', 'complete'],
    },
    {
      id: 'task-4',
      title: 'Write Project Documentation',
      description: 'Write comprehensive technical documentation and usage guide',
      priority: 'low',
      status: 'pending',
      createdAt: '2026-02-23T08:00:00Z',
      updatedAt: '2026-02-23T08:00:00Z',
      dueDate: '2026-02-25T17:00:00Z',
      tags: ['documentation', 'maintenance'],
    },
    {
      id: 'task-5',
      title: 'Test Automation Workflows',
      description: 'Test and verify the correctness of automation workflows',
      priority: 'medium',
      status: 'in-progress',
      createdAt: '2026-02-22T16:00:00Z',
      updatedAt: '2026-02-23T07:45:00Z',
      dueDate: '2026-02-23T16:00:00Z',
      assignedTo: 'System',
      tags: ['test', 'automation', 'workflow'],
    },
  ];

  /**
   * 获取任务统计
   */
  async getTaskStats(): Promise<TaskStats> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const now = new Date();
    const overdueTasks = this.tasks.filter(task => 
      task.status !== 'completed' && 
      task.dueDate && 
      new Date(task.dueDate) < now
    ).length;

    const completedTasks = this.tasks.filter(task => task.status === 'completed').length;
    const totalTasks = this.tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      pendingTasks: this.tasks.filter(task => task.status === 'pending').length,
      inProgressTasks: this.tasks.filter(task => task.status === 'in-progress').length,
      completedTasks,
      overdueTasks,
      completionRate,
    };
  }

  /**
   * 获取任务列表
   */
  async getTasks(): Promise<Task[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.tasks;
  }

  /**
   * 创建新任务
   */
  async createTask(input: CreateTaskInput): Promise<Task> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: input.title,
      description: input.description || '',
      priority: input.priority || 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: input.dueDate,
      assignedTo: input.assignedTo,
      tags: input.tags || [],
    };

    this.tasks.push(newTask);
    return newTask;
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(taskId: string, status: Task['status']): Promise<Task | null> {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) {
      return null;
    }

    task.status = status;
    task.updatedAt = new Date().toISOString();
    return task;
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(task => task.id !== taskId);
    return this.tasks.length < initialLength;
  }

  /**
   * 获取系统状态
   */
  getSystemStatus() {
    return {
      status: 'operational',
      version: '1.0.0',
      totalTasks: this.tasks.length,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// 导出单例实例
export const taskService = new TaskService();