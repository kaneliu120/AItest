/**
 * 任务管理验证类型
 */

import { 
  Task, 
  User, 
  Project, 
  TaskStatus, 
  TaskPriority, 
  UserRole, 
  ProjectStatus 
} from './core';

// 创建任务的验证类型
export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: Date | string;
  tags?: string[];
  estimatedHours?: number;
  projectId?: string;
  dependencies?: string[];
  customFields?: Record<string, any>;
}

// 更新任务的验证类型
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null; // null表示取消分配
  dueDate?: Date | string | null; // null表示清除截止日期
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
  projectId?: string | null;
  dependencies?: string[];
  customFields?: Record<string, any>;
}

// 创建用户的验证类型
export interface CreateUserInput {
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
}

// 更新用户的验证类型
export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  department?: string | null;
  avatar?: string | null;
  isActive?: boolean;
}

// 创建项目的验证类型
export interface CreateProjectInput {
  name: string;
  description?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  ownerId: string;
  memberIds?: string[];
  tags?: string[];
  budget?: number;
}

// 更新项目的验证类型
export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  ownerId?: string;
  memberIds?: string[];
  tags?: string[];
  budget?: number;
  actualCost?: number;
  progress?: number;
}

// 添加附件的验证类型
export interface AddAttachmentInput {
  taskId: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

// 添加评论的验证类型
export interface AddCommentInput {
  taskId: string;
  content: string;
  mentionIds?: string[];
}

// 更新评论的验证类型
export interface UpdateCommentInput {
  content: string;
}

// 任务过滤验证类型
export interface ValidateTaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: string;
  creatorId?: string;
  projectId?: string;
  tags?: string[];
  dueDateFrom?: Date | string;
  dueDateTo?: Date | string;
  createdAtFrom?: Date | string;
  createdAtTo?: Date | string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 验证结果类型
export interface ValidationResult<T = any> {
  isValid: boolean;
  data?: T;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// 验证规则类型
export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean;
  message?: string;
}
