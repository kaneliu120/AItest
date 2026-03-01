/**
 * Task management service
 */

import { 
  Task,
  User,
  Project,
  TaskStatus, 
  TaskPriority,
  UserRole,
  ProjectStatus,
  TaskFilter,
  TaskStats,
  CreateTaskInput,
  UpdateTaskInput,
  ValidationResult,
  TaskEvent,
  PaginatedResponse,
  ApiResponse
} from '../types';
import { ValidationService } from './validation.service';

export class TaskService {
  private tasks: Task[] = [];
  private taskEvents: TaskEvent[] = [];
  private validationService: ValidationService;

  constructor() {
    this.validationService = new ValidationService();
    this.initializeSampleData();
  }

  /**
   * Create a task
   */
  async createTask(input: CreateTaskInput, creatorId: string): Promise<ApiResponse<Task>> {
    try {
      // Validate input
      const validation = this.validationService.validateCreateTask(input);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input validation failed',
            details: validation.errors
          },
          timestamp: new Date()
        };
      }

      // Create task
      const task: Task = {
        id: this.generateId(),
        title: input.title,
        description: input.description,
        status: input.status || TaskStatus.TODO,
        priority: input.priority || TaskPriority.MEDIUM,
        creator: await this.getUser(creatorId),
        assignee: input.assigneeId ? await this.getUser(input.assigneeId) : undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: input.tags || [],
        estimatedHours: input.estimatedHours,
        actualHours: 0,
        project: input.projectId ? await this.getProject(input.projectId) : undefined,
        dependencies: input.dependencies || [],
        attachments: [],
        comments: [],
        customFields: input.customFields || {}
      };

      this.tasks.push(task);

      // Record event
      this.recordEvent({
        type: 'task_created',
        task
      });

      return {
        success: true,
        data: task,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError(error, 'Failed to create task');
    }
  }

  /**
   * Get a task
   */
  async getTask(taskId: string): Promise<ApiResponse<Task>> {
    try {
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Task not found'
          },
          timestamp: new Date()
        };
      }

      return {
        success: true,
        data: task,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get task');
    }
  }

  /**
   * Update a task
   */
  async updateTask(taskId: string, input: UpdateTaskInput): Promise<ApiResponse<Task>> {
    try {
      const taskIndex = this.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Task not found'
          },
          timestamp: new Date()
        };
      }

      const oldTask = { ...this.tasks[taskIndex] };
      const updatedTask = { ...oldTask };

      // Update fields
      if (input.title !== undefined) updatedTask.title = input.title;
      if (input.description !== undefined) updatedTask.description = input.description;
      if (input.status !== undefined) updatedTask.status = input.status;
      if (input.priority !== undefined) updatedTask.priority = input.priority;
      if (input.assigneeId !== undefined) {
        updatedTask.assignee = input.assigneeId ? await this.getUser(input.assigneeId) : undefined;
      }
      if (input.dueDate !== undefined) {
        updatedTask.dueDate = input.dueDate ? new Date(input.dueDate) : undefined;
      }
      if (input.tags !== undefined) updatedTask.tags = input.tags;
      if (input.estimatedHours !== undefined) updatedTask.estimatedHours = input.estimatedHours;
      if (input.actualHours !== undefined) updatedTask.actualHours = input.actualHours;
      if (input.projectId !== undefined) {
        updatedTask.project = input.projectId ? await this.getProject(input.projectId) : undefined;
      }
      if (input.dependencies !== undefined) updatedTask.dependencies = input.dependencies;
      if (input.customFields !== undefined) updatedTask.customFields = input.customFields;

      updatedTask.updatedAt = new Date();

      // If task is completed, record completion time
      if (input.status === TaskStatus.DONE && oldTask.status !== TaskStatus.DONE) {
        updatedTask.completedAt = new Date();
      }

      this.tasks[taskIndex] = updatedTask;

      // Record events
      if (input.status !== undefined && input.status !== oldTask.status) {
        this.recordEvent({
          type: 'task_status_changed',
          task: updatedTask,
          oldStatus: oldTask.status,
          newStatus: input.status
        });
      }

      if (input.assigneeId !== undefined && input.assigneeId !== oldTask.assignee?.id) {
        this.recordEvent({
          type: 'task_assigned',
          task: updatedTask,
          oldAssignee: oldTask.assignee,
          newAssignee: updatedTask.assignee!
        });
      }

      this.recordEvent({
        type: 'task_updated',
        oldTask,
        newTask: updatedTask
      });

      return {
        success: true,
        data: updatedTask,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError(error, 'Failed to update task');
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<ApiResponse<void>> {
    try {
      const taskIndex = this.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Task not found'
          },
          timestamp: new Date()
        };
      }

      const [deletedTask] = this.tasks.splice(taskIndex, 1);

      // Record event
      this.recordEvent({
        type: 'task_deleted',
        task: deletedTask
      });

      return {
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError(error, 'Failed to delete task');
    }
  }

  /**
   * Get task list
   */
  async getTasks(filter: TaskFilter = {}): Promise<ApiResponse<PaginatedResponse<Task>>> {
    try {
      let filteredTasks = [...this.tasks];

      // Apply filters
      if (filter.status && filter.status.length > 0) {
        filteredTasks = filteredTasks.filter(task => filter.status!.includes(task.status));
      }

      if (filter.priority && filter.priority.length > 0) {
        filteredTasks = filteredTasks.filter(task => filter.priority!.includes(task.priority));
      }

      if (filter.assigneeId) {
        filteredTasks = filteredTasks.filter(task => task.assignee?.id === filter.assigneeId);
      }

      if (filter.creatorId) {
        filteredTasks = filteredTasks.filter(task => task.creator.id === filter.creatorId);
      }

      if (filter.projectId) {
        filteredTasks = filteredTasks.filter(task => task.project?.id === filter.projectId);
      }

      if (filter.tags && filter.tags.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filter.tags!.some(tag => task.tags.includes(tag))
        );
      }

      if (filter.dueDateFrom) {
        const fromDate = new Date(filter.dueDateFrom);
        filteredTasks = filteredTasks.filter(task => 
          task.dueDate && task.dueDate >= fromDate
        );
      }

      if (filter.dueDateTo) {
        const toDate = new Date(filter.dueDateTo);
        filteredTasks = filteredTasks.filter(task => 
          task.dueDate && task.dueDate <= toDate
        );
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredTasks = filteredTasks.filter(task => 
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      // Pagination
      const page = filter.page || 1;
      const limit = filter.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
      const total = filteredTasks.length;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          data: paginatedTasks,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        },
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get task list');
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStats(): Promise<ApiResponse<TaskStats>> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const total = this.tasks.length;
      
      const byStatus = Object.values(TaskStatus).reduce((acc, status) => {
        acc[status] = this.tasks.filter(task => task.status === status).length;
        return acc;
      }, {} as Record<TaskStatus, number>);

      const byPriority = Object.values(TaskPriority).reduce((acc, priority) => {
        acc[priority] = this.tasks.filter(task => task.priority === priority).length;
        return acc;
      }, {} as Record<TaskPriority, number>);

      const overdue = this.tasks.filter(task => 
        task.dueDate && 
        task.dueDate < now && 
        task.status !== TaskStatus.DONE && 
        task.status !== TaskStatus.CANCELLED
      ).length;

      const completedToday = this.tasks.filter(task => 
        task.status === TaskStatus.DONE && 
        task.completedAt && 
        task.completedAt >= todayStart && 
        task.completedAt < todayEnd
      ).length;

      const createdToday = this.tasks.filter(task => 
        task.createdAt >= todayStart && 
        task.createdAt < todayEnd
      ).length;

      const completedTasks = this.tasks.filter(task => 
        task.status === TaskStatus.DONE && 
        task.completedAt && 
        task.createdAt
      );

      const avgCompletionTime = completedTasks.length > 0
        ? completedTasks.reduce((sum, task) => {
            const completionTime = task.completedAt!.getTime() - task.createdAt.getTime();
            return sum + (completionTime / (1000 * 60 * 60)); // convert to hours
          }, 0) / completedTasks.length
        : 0;

      const stats: TaskStats = {
        total,
        byStatus,
        byPriority,
        overdue,
        completedToday,
        createdToday,
        avgCompletionTime
      };

      return {
        success: true,
        data: stats,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get task statistics');
    }
  }

  /**
   * Get task events
   */
  async getTaskEvents(taskId?: string, limit: number = 50): Promise<ApiResponse<TaskEvent[]>> {
    try {
      let events = [...this.taskEvents];

      if (taskId) {
        events = events.filter(event => {
          if ('task' in event) {
            return event.task.id === taskId;
          }
          return false;
        });
      }

      events = events.slice(0, limit);

      return {
        success: true,
        data: events,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get task events');
    }
  }

  /**
   * Initialize sample data
   */
  private initializeSampleData(): void {
    // Create sample user
    const sampleUser: User = {
      id: 'user-001',
      name: 'System Admin',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      isActive: true
    };

    // Create sample project
    const sampleProject: Project = {
      id: 'project-001',
      name: 'Mission Control Optimization',
      status: ProjectStatus.ACTIVE,
      owner: sampleUser,
      members: [sampleUser],
      tags: ['optimization', 'refactoring'],
      progress: 65
    };

    // Create sample tasks
    this.tasks = [
      {
        id: 'task-001',
        title: 'Migrate existing code to modular architecture',
        description: 'Migrate existing Mission Control functionality to modular architecture',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        creator: sampleUser,
        assignee: sampleUser,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        tags: ['migration', 'architecture', 'refactoring'],
        estimatedHours: 40,
        actualHours: 25,
        project: sampleProject,
        dependencies: [],
        attachments: [],
        comments: [],
        customFields: {}
      },
      {
        id: 'task-002',
        title: 'Create task management module',
        description: 'Implement full task management functionality',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        creator: sampleUser,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        tags: ['module', 'task-management', 'development'],
        estimatedHours: 30,
        actualHours: 0,
        project: sampleProject,
        dependencies: ['task-001'],
        attachments: [],
        comments: [],
        customFields: {}
      },
      {
        id: 'task-003',
        title: 'Improve CI/CD pipeline',
        description: 'Establish independent testing and deployment pipelines for each module',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        creator: sampleUser,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        tags: ['ci-cd', 'automation', 'testing'],
        estimatedHours: 20,
        actualHours: 0,
        project: sampleProject,
        dependencies: ['task-001', 'task-002'],
        attachments: [],
        comments: [],
        customFields: {}
      },
      {
        id: 'task-004',
        title: 'Implement performance monitoring',
        description: 'Implement production environment performance monitoring and alerting',
        status: TaskStatus.REVIEW,
        priority: TaskPriority.CRITICAL,
        creator: sampleUser,
        assignee: sampleUser,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        tags: ['monitoring', 'performance', 'production'],
        estimatedHours: 15,
        actualHours: 10,
        project: sampleProject,
        dependencies: [],
        attachments: [],
        comments: [],
        customFields: {}
      }
    ];
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user
   */
  private async getUser(userId: string): Promise<any> {
    return {
      id: userId,
      name: 'user_' + userId.slice(-4),
      email: `user_${userId.slice(-4)}@example.com`,
      role: 'developer' as const,
      isActive: true
    };
  }

  /**
   * Get project
   */
  private async getProject(projectId: string): Promise<any> {
    return {
      id: projectId,
      name: 'project_' + projectId.slice(-4),
      status: 'active' as const,
      owner: { id: 'user-001', name: 'Admin', email: 'admin@example.com', role: 'admin' as const, isActive: true },
      members: [],
      tags: [],
      progress: 50
    };
  }

  /**
   * Record event
   */
  private recordEvent(event: any): void {
    this.taskEvents.unshift(event);
    // Keep only the most recent 500 events
    if (this.taskEvents.length > 500) {
      this.taskEvents.pop();
    }
  }

  /**
   * Error handling
   */
  private handleError(error: unknown, message: string): any {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[TaskService] ${message}:`, errorMessage);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message,
        details: errorMessage
      },
      timestamp: new Date()
    };
  }
}

// Export singleton
export const taskService = new TaskService();