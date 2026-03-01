/**
 * Task management validation types
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

// Validation type for creating tasks
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

// Validation type for updating tasks
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null; // null means unassign
  dueDate?: Date | string | null; // null means clear due date
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
  projectId?: string | null;
  dependencies?: string[];
  customFields?: Record<string, any>;
}

// Validation type for creating users
export interface CreateUserInput {
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
}

// Validation type for updating users
export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  department?: string | null;
  avatar?: string | null;
  isActive?: boolean;
}

// Validation type for creating projects
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

// Validation type for updating projects
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

// Validation type for adding attachments
export interface AddAttachmentInput {
  taskId: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

// Validation type for adding comments
export interface AddCommentInput {
  taskId: string;
  content: string;
  mentionIds?: string[];
}

// Validation type for updating comments
export interface UpdateCommentInput {
  content: string;
}

// Task filter validation type
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

// Validation result type
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

// Validation rule type
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
