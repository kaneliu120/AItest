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
      title: '修复生态系统UI界面',
      description: '全面检查并修复工具生态系统UI界面问题',
      priority: 'high',
      status: 'in-progress',
      createdAt: '2026-02-22T10:00:00Z',
      updatedAt: '2026-02-23T07:30:00Z',
      dueDate: '2026-02-23T18:00:00Z',
      assignedTo: '小A',
      tags: ['UI', '修复', '优先级'],
    },
    {
      id: 'task-2',
      title: '优化API响应性能',
      description: '优化所有API端点的响应时间和错误处理',
      priority: 'medium',
      status: 'pending',
      createdAt: '2026-02-22T14:30:00Z',
      updatedAt: '2026-02-22T14:30:00Z',
      dueDate: '2026-02-24T12:00:00Z',
      tags: ['API', '性能', '优化'],
    },
    {
      id: 'task-3',
      title: '部署知识管理系统',
      description: '完成知识管理系统的生产环境部署',
      priority: 'critical',
      status: 'completed',
      createdAt: '2026-02-21T09:00:00Z',
      updatedAt: '2026-02-22T17:30:00Z',
      dueDate: '2026-02-22T18:00:00Z',
      assignedTo: '小A',
      tags: ['部署', '生产', '完成'],
    },
    {
      id: 'task-4',
      title: '编写项目文档',
      description: '编写完整的项目技术文档和使用指南',
      priority: 'low',
      status: 'pending',
      createdAt: '2026-02-23T08:00:00Z',
      updatedAt: '2026-02-23T08:00:00Z',
      dueDate: '2026-02-25T17:00:00Z',
      tags: ['文档', '维护'],
    },
    {
      id: 'task-5',
      title: '测试自动化工作流',
      description: '测试和验证自动化工作流的正确性',
      priority: 'medium',
      status: 'in-progress',
      createdAt: '2026-02-22T16:00:00Z',
      updatedAt: '2026-02-23T07:45:00Z',
      dueDate: '2026-02-23T16:00:00Z',
      assignedTo: '系统',
      tags: ['测试', '自动化', '工作流'],
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