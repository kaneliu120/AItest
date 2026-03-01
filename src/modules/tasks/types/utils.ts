/**
 * Task management utility types
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

// Partial update types
export type PartialTask = Partial<Task>;
export type PartialUser = Partial<User>;
export type PartialProject = Partial<Project>;

// Required field types
export type RequiredTask = Required<Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'creator' | 'createdAt'>>;
export type RequiredUser = Required<Pick<User, 'id' | 'name' | 'email' | 'role' | 'isActive'>>;
export type RequiredProject = Required<Pick<Project, 'id' | 'name' | 'status' | 'owner' | 'progress'>>;

// Readonly types
export type ReadonlyTask = Readonly<Task>;
export type ReadonlyUser = Readonly<User>;
export type ReadonlyProject = Readonly<Project>;

// Pick field types
export type TaskPreview = Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'assignee' | 'dueDate'>;
export type UserPreview = Pick<User, 'id' | 'name' | 'email' | 'avatar' | 'role'>;
export type ProjectPreview = Pick<Project, 'id' | 'name' | 'status' | 'progress' | 'endDate'>;

// Omit field types
export type TaskWithoutComments = Omit<Task, 'comments'>;
export type TaskWithoutAttachments = Omit<Task, 'attachments'>;
export type UserWithoutSensitive = Omit<User, 'email' | 'department'>;

// Record types
export type TaskStatusRecord = Record<TaskStatus, number>;
export type TaskPriorityRecord = Record<TaskPriority, number>;
export type UserRoleRecord = Record<UserRole, number>;
export type ProjectStatusRecord = Record<ProjectStatus, number>;

// Mapped types
export type TaskStatusColors = {
  [K in TaskStatus]: string;
};

export type TaskPriorityColors = {
  [K in TaskPriority]: string;
};

export type UserRoleLabels = {
  [K in UserRole]: string;
};

export type ProjectStatusLabels = {
  [K in ProjectStatus]: string;
};

// Conditional types
export type ActiveTask = Task & { status: Exclude<TaskStatus, TaskStatus.DONE | TaskStatus.CANCELLED> };
export type CompletedTask = Task & { status: TaskStatus.DONE; completedAt: Date };
export type OverdueTask = Task & { dueDate: Date; status: Exclude<TaskStatus, TaskStatus.DONE | TaskStatus.CANCELLED> };

export type AdminUser = User & { role: UserRole.ADMIN };
export type ManagerUser = User & { role: UserRole.MANAGER };
export type TeamMemberUser = User & { role: Exclude<UserRole, UserRole.ADMIN | UserRole.VIEWER> };

export type ActiveProject = Project & { status: Exclude<ProjectStatus, ProjectStatus.COMPLETED | ProjectStatus.CANCELLED> };
export type CompletedProject = Project & { status: ProjectStatus.COMPLETED };

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// Function types
export type TaskFilterFunction = (task: Task) => boolean;
export type TaskComparator = (a: Task, b: Task) => number;
export type TaskTransformer = (task: Task) => any;
export type TaskValidator = (task: Task) => { valid: boolean; errors: string[] };

export type UserFilterFunction = (user: User) => boolean;
export type ProjectFilterFunction = (project: Project) => boolean;

// Event types
export type TaskEvent = 
  | { type: 'task_created'; task: Task }
  | { type: 'task_updated'; oldTask: Task; newTask: Task }
  | { type: 'task_deleted'; task: Task }
  | { type: 'task_status_changed'; task: Task; oldStatus: TaskStatus; newStatus: TaskStatus }
  | { type: 'task_assigned'; task: Task; oldAssignee?: User; newAssignee: User }
  | { type: 'task_completed'; task: Task; completedAt: Date };

export type UserEvent =
  | { type: 'user_created'; user: User }
  | { type: 'user_updated'; oldUser: User; newUser: User }
  | { type: 'user_deleted'; user: User }
  | { type: 'user_role_changed'; user: User; oldRole: UserRole; newRole: UserRole };

export type ProjectEvent =
  | { type: 'project_created'; project: Project }
  | { type: 'project_updated'; oldProject: Project; newProject: Project }
  | { type: 'project_deleted'; project: Project }
  | { type: 'project_status_changed'; project: Project; oldStatus: ProjectStatus; newStatus: ProjectStatus };

// Response types
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
};

// Configuration types
export type TaskModuleConfig = {
  features: {
    timeTracking: boolean;
    fileAttachments: boolean;
    comments: boolean;
    dependencies: boolean;
    customFields: boolean;
    notifications: boolean;
    reminders: boolean;
  };
  limits: {
    maxTasksPerProject: number;
    maxAttachmentsPerTask: number;
    maxAttachmentSize: number;
    maxCommentLength: number;
    maxTagsPerTask: number;
  };
  defaults: {
    taskStatus: TaskStatus;
    taskPriority: TaskPriority;
    projectStatus: ProjectStatus;
  };
};
