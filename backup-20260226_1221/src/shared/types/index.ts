// 全局类型定义

// 基础类型
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// API 响应类型
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// 用户相关类型
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'user' | 'guest';

// 系统状态类型
export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: ComponentStatus[];
  metrics: SystemMetrics;
  lastChecked: string;
}

export interface ComponentStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime?: string;
  message?: string;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  requestCount: number;
  errorRate: number;
}

// 工具类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>> }[Keys];

// 事件类型
export interface Event<T = any> {
  type: string;
  payload: T;
  timestamp: string;
  source: string;
}

// 配置类型
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  features: {
    analytics: boolean;
    notifications: boolean;
    darkMode: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    fontSize: number;
  };
}

// 通用工具类型
export type ValueOf<T> = T[keyof T];
export type ArrayElement<ArrayType extends readonly unknown[]> = 
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

// 类型守卫
export function isApiError(error: any): error is ApiError {
  return error && typeof error === 'object' && 'code' in error && 'message' in error;
}

export function isUser(user: any): user is User {
  return user && typeof user === 'object' && 'id' in user && 'email' in user && 'role' in user;
}

export function isSystemStatus(status: any): status is SystemStatus {
  return status && typeof status === 'object' && 'status' in status && 'components' in status;
}

// 枚举类型
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

// 时间相关类型
export type DateRange = {
  start: Date | string;
  end: Date | string;
};

export type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

// 导出所有类型
export * from './errors';
export * from './forms';
export * from './validation';