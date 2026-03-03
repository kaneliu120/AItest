/**
 * Taskservervice
 * 提供Task管理功can
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

class Taskservervice {
  private tasks: Task[] = [
    {
      id: 'task-1',
      title: 'Fix ecosystem system UI',
      description: 'Comprehensive check and fix of tool ecosystem system UI issues',
      priority: 'high',
      status: 'in-progress',
      createdAt: '2026-02-22T10:00:00Z',
      updatedAt: '2026-02-23T07:30:00Z',
      dueDate: '2026-02-23T18:00:00Z',
      assignedTo: 'SmallA',
      tags: ['UI', 'Fix', 'Priority'],
    },
    {
      id: 'task-2',
      title: 'optimizeAPIResponsePerformance',
      description: 'Optimize all API endpoint response time and error handling',
      priority: 'medium',
      status: 'pending',
      createdAt: '2026-02-22T14:30:00Z',
      updatedAt: '2026-02-22T14:30:00Z',
      dueDate: '2026-02-24T12:00:00Z',
      tags: ['API', 'Performance', 'optimize'],
    },
    {
      id: 'task-3',
      title: 'Deploy Knowledge Management System',
      description: 'Complete knowledge management system production environment deployment',
      priority: 'critical',
      status: 'completed',
      createdAt: '2026-02-21T09:00:00Z',
      updatedAt: '2026-02-22T17:30:00Z',
      dueDate: '2026-02-22T18:00:00Z',
      assignedTo: 'SmallA',
      tags: ['Deployment', 'Production', 'Completed'],
    },
    {
      id: 'task-4',
      title: 'Write Project Documentation',
      description: 'Write complete project technical documentation and usage guide',
      priority: 'low',
      status: 'pending',
      createdAt: '2026-02-23T08:00:00Z',
      updatedAt: '2026-02-23T08:00:00Z',
      dueDate: '2026-02-25T17:00:00Z',
      tags: ['document', 'maintenance'],
    },
    {
      id: 'task-5',
      title: 'TestAutomationWorkflow',
      description: 'Test and validate automation workflow correctness',
      priority: 'medium',
      status: 'in-progress',
      createdAt: '2026-02-22T16:00:00Z',
      updatedAt: '2026-02-23T07:45:00Z',
      dueDate: '2026-02-23T16:00:00Z',
      assignedTo: 'System',
      tags: ['Test', 'Automation', 'Workflow'],
    },
  ];

  /**
   * FetchTaskStatistics
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
   * FetchTaskList
   */
  async getTasks(): Promise<Task[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.tasks;
  }

  /**
   * CreateNewTask
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
   * UpdateTaskStatus
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
   * DeleteTask
   */
  async deleteTask(taskId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(task => task.id !== taskId);
    return this.tasks.length < initialLength;
  }

  /**
   * FetchSystemStatus
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

// Export单例实例
export const taskservervice = new Taskservervice();