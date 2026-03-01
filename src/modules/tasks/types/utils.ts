/**
 * 任务管理工具类型
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

// 部分更新类型
export type PartialTask = Partial<Task>;
export type PartialUser = Partial<User>;
export type PartialProject = Partial<Project>;

// 必需字段类型
export type RequiredTask = Required<Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'creator' | 'createdAt'>>;
export type RequiredUser = Required<Pick<User, 'id' | 'name' | 'email' | 'role' | 'isActive'>>;
export type RequiredProject = Required<Pick<Project, 'id' | 'name' | 'status' | 'owner' | 'progress'>>;

// 只读类型
export type ReadonlyTask = Readonly<Task>;
export type ReadonlyUser = Readonly<User>;
export type ReadonlyProject = Readonly<Project>;

// 选择字段类型
export type TaskPreview = Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'assignee' | 'dueDate'>;
export type UserPreview = Pick<User, 'id' | 'name' | 'email' | 'avatar' | 'role'>;
export type ProjectPreview = Pick<Project, 'id' | 'name' | 'status' | 'progress' | 'endDate'>;

// 排除字段类型
export type TaskWithoutComments = Omit<Task, 'comments'>;
export type TaskWithoutAttachments = Omit<Task, 'attachments'>;
export type UserWithoutSensitive = Omit<User, 'email' | 'department'>;

// 记录类型
export type TaskStatusRecord = Record<TaskStatus, number>;
export type TaskPriorityRecord = Record<TaskPriority, number>;
export type UserRoleRecord = Record<UserRole, number>;
export type ProjectStatusRecord = Record<ProjectStatus, number>;

// 映射类型
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

// 条件类型
export type ActiveTask = Task & { status: Exclude<TaskStatus, TaskStatus.DONE | TaskStatus.CANCELLED> };
export type CompletedTask = Task & { status: TaskStatus.DONE; completedAt: Date };
export type OverdueTask = Task & { dueDate: Date; status: Exclude<TaskStatus, TaskStatus.DONE | TaskStatus.CANCELLED> };

export type AdminUser = User & { role: UserRole.ADMIN };
export type ManagerUser = User & { role: UserRole.MANAGER };
export type TeamMemberUser = User & { role: Exclude<UserRole, UserRole.ADMIN | UserRole.VIEWER> };

export type ActiveProject = Project & { status: Exclude<ProjectStatus, ProjectStatus.COMPLETED | ProjectStatus.CANCELLED> };
export type CompletedProject = Project & { status: ProjectStatus.COMPLETED };

// 实用工具类型
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

// 函数类型
export type TaskFilterFunction = (task: Task) => boolean;
export type TaskComparator = (a: Task, b: Task) => number;
export type TaskTransformer = (task: Task) => any;
export type TaskValidator = (task: Task) => { valid: boolean; errors: string[] };

export type UserFilterFunction = (user: User) => boolean;
export type ProjectFilterFunction = (project: Project) => boolean;

// 事件类型
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

// 响应类型
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

// 配置类型
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
