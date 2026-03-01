/**
 * 任务管理服务接口定义
 */

import { 
  Task, 
  User, 
  Project,
  TaskFilter,
  TaskStats,
  CreateTaskInput,
  UpdateTaskInput,
  TaskEvent,
  PaginatedResponse,
  ApiResponse
} from '../types';

/**
 * 任务存储接口
 */
export interface ITaskRepository {
  create(task: Task): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  update(id: string, updates: Partial<Task>): Promise<Task | null>;
  delete(id: string): Promise<boolean>;
  findAll(filter?: TaskFilter): Promise<Task[]>;
  count(filter?: TaskFilter): Promise<number>;
  exists(id: string): Promise<boolean>;
}

/**
 * 用户服务接口
 */
export interface IUserService {
  getUser(id: string): Promise<User | null>;
  getUsers(ids: string[]): Promise<User[]>;
  validateUser(id: string): Promise<boolean>;
}

/**
 * 项目服务接口
 */
export interface IProjectService {
  getProject(id: string): Promise<Project | null>;
  validateProject(id: string): Promise<boolean>;
  getProjectMembers(projectId: string): Promise<User[]>;
}

/**
 * 事件发布接口
 */
export interface IEventPublisher {
  publish(event: TaskEvent): Promise<void>;
  subscribe(callback: (event: TaskEvent) => void): () => void;
}

/**
 * 验证服务接口
 */
export interface IValidationService {
  validateCreateTask(input: CreateTaskInput): { isValid: boolean; errors: string[] };
  validateUpdateTask(input: UpdateTaskInput): { isValid: boolean; errors: string[] };
  validateTaskFilter(filter: TaskFilter): { isValid: boolean; errors: string[] };
}

/**
 * 任务服务接口
 */
export interface ITaskService {
  createTask(input: CreateTaskInput, creatorId: string): Promise<ApiResponse<Task>>;
  getTask(taskId: string): Promise<ApiResponse<Task>>;
  updateTask(taskId: string, input: UpdateTaskInput): Promise<ApiResponse<Task>>;
  deleteTask(taskId: string): Promise<ApiResponse<void>>;
  getTasks(filter?: TaskFilter): Promise<ApiResponse<PaginatedResponse<Task>>>;
  getTaskStats(): Promise<ApiResponse<TaskStats>>;
  getTaskEvents(taskId?: string, limit?: number): Promise<ApiResponse<TaskEvent[]>>;
}

/**
 * 任务查询接口
 */
export interface ITaskQueryService {
  getTasksByAssignee(assigneeId: string): Promise<Task[]>;
  getTasksByProject(projectId: string): Promise<Task[]>;
  getOverdueTasks(): Promise<Task[]>;
  getTasksDueSoon(days: number): Promise<Task[]>;
  searchTasks(query: string): Promise<Task[]>;
  getTaskTimeline(taskId: string): Promise<TaskEvent[]>;
}

/**
 * 任务操作接口
 */
export interface ITaskOperationService {
  assignTask(taskId: string, assigneeId: string): Promise<ApiResponse<Task>>;
  changeStatus(taskId: string, status: string): Promise<ApiResponse<Task>>;
  addComment(taskId: string, comment: { content: string; authorId: string }): Promise<ApiResponse<Task>>;
  addAttachment(taskId: string, attachment: { name: string; url: string; type: string; size: number }): Promise<ApiResponse<Task>>;
  updateTimeTracking(taskId: string, hours: number): Promise<ApiResponse<Task>>;
  addDependency(taskId: string, dependencyId: string): Promise<ApiResponse<Task>>;
  removeDependency(taskId: string, dependencyId: string): Promise<ApiResponse<Task>>;
}

/**
 * 任务统计接口
 */
export interface ITaskStatisticsService {
  getTaskStats(): Promise<TaskStats>;
  getUserTaskStats(userId: string): Promise<{
    assigned: number;
    completed: number;
    overdue: number;
    completionRate: number;
    avgCompletionTime: number;
  }>;
  getProjectTaskStats(projectId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    progress: number;
    estimatedHours: number;
    actualHours: number;
  }>;
  getTrendStats(days: number): Promise<{
    created: Array<{ date: string; count: number }>;
    completed: Array<{ date: string; count: number }>;
    overdue: Array<{ date: string; count: number }>;
  }>;
}

/**
 * 任务通知接口
 */
export interface ITaskNotificationService {
  notifyTaskCreated(task: Task): Promise<void>;
  notifyTaskUpdated(oldTask: Task, newTask: Task): Promise<void>;
  notifyTaskAssigned(task: Task, assignee: User): Promise<void>;
  notifyTaskDueSoon(task: Task): Promise<void>;
  notifyTaskOverdue(task: Task): Promise<void>;
  notifyCommentAdded(task: Task, comment: any): Promise<void>;
}

// 注：所有接口已通过 export interface 直接导出