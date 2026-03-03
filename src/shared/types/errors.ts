// 错误类型定义

export interface AppError extends Error {
  code: ErrorCode;
  statusCode: HttpStatusCode;
  details?: Record<string, any>;
  timestamp: string;
}

export type ErrorCode = 
  // 认证错误 (1000-1099)
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_TOKEN_INVALID'
  | 'AUTH_INSUFFICIENT_PERMISSIONS'
  | 'AUTH_USER_NOT_FOUND'
  
  // 验证错误 (1100-1199)
  | 'VALIDATION_FAILED'
  | 'VALIDATION_REQUIRED_FIELD'
  | 'VALIDATION_INVALID_FORMAT'
  | 'VALIDATION_OUT_OF_RANGE'
  | 'VALIDATION_UNIQUE_CONSTRAINT'
  
  // 资源错误 (1200-1299)
  | 'RESOURCE_NOT_FOUND'
  | 'RESOURCE_ALREADY_EXISTS'
  | 'RESOURCE_CONFLICT'
  | 'RESOURCE_UNAVAILABLE'
  | 'RESOURCE_LIMIT_EXCEEDED'
  
  // 业务逻辑错误 (1300-1399)
  | 'BUSINESS_RULE_VIOLATION'
  | 'WORKFLOW_INVALID_STATE'
  | 'OPERATION_NOT_ALLOWED'
  | 'DEPENDENCY_NOT_MET'
  
  // 系统错误 (1400-1499)
  | 'INTERNAL_SERVER_ERROR'
  | 'DATABASE_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  
  // 配置错误 (1500-1599)
  | 'CONFIGURATION_ERROR'
  | 'ENVIRONMENT_ERROR'
  | 'FEATURE_DISABLED';

export type HttpStatusCode = 
  | 400  // Bad Request
  | 401  // Unauthorized
  | 403  // Forbidden
  | 404  // Not Found
  | 409  // Conflict
  | 422  // Unprocessable Entity
  | 429  // Too Many Requests
  | 500  // Internal Server Error
  | 502  // Bad Gateway
  | 503  // Service Unavailable
  | 504; // Gateway Timeout

// 错误代码映射到HTTP状态码
export const ERROR_CODE_TO_STATUS: Record<ErrorCode, HttpStatusCode> = {
  // 认证错误
  'AUTH_INVALID_CREDENTIALS': 401,
  'AUTH_TOKEN_EXPIRED': 401,
  'AUTH_TOKEN_INVALID': 401,
  'AUTH_INSUFFICIENT_PERMISSIONS': 403,
  'AUTH_USER_NOT_FOUND': 404,
  
  // 验证错误
  'VALIDATION_FAILED': 400,
  'VALIDATION_REQUIRED_FIELD': 400,
  'VALIDATION_INVALID_FORMAT': 400,
  'VALIDATION_OUT_OF_RANGE': 400,
  'VALIDATION_UNIQUE_CONSTRAINT': 409,
  
  // 资源错误
  'RESOURCE_NOT_FOUND': 404,
  'RESOURCE_ALREADY_EXISTS': 409,
  'RESOURCE_CONFLICT': 409,
  'RESOURCE_UNAVAILABLE': 503,
  'RESOURCE_LIMIT_EXCEEDED': 429,
  
  // 业务逻辑错误
  'BUSINESS_RULE_VIOLATION': 422,
  'WORKFLOW_INVALID_STATE': 422,
  'OPERATION_NOT_ALLOWED': 403,
  'DEPENDENCY_NOT_MET': 422,
  
  // 系统错误
  'INTERNAL_SERVER_ERROR': 500,
  'DATABASE_ERROR': 500,
  'EXTERNAL_SERVICE_ERROR': 502,
  'NETWORK_ERROR': 503,
  'TIMEOUT_ERROR': 504,
  
  // 配置错误
  'CONFIGURATION_ERROR': 500,
  'ENVIRONMENT_ERROR': 500,
  'FEATURE_DISABLED': 403,
};

// 错误消息映射
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // 认证错误
  'AUTH_INVALID_CREDENTIALS': 'Invalid credentials provided',
  'AUTH_TOKEN_EXPIRED': 'Authentication token has expired',
  'AUTH_TOKEN_INVALID': 'Invalid authentication token',
  'AUTH_INSUFFICIENT_PERMISSIONS': 'Insufficient permissions to perform this action',
  'AUTH_USER_NOT_FOUND': 'User not found',
  
  // 验证错误
  'VALIDATION_FAILED': 'Validation failed for one or more fields',
  'VALIDATION_REQUIRED_FIELD': 'This field is required',
  'VALIDATION_INVALID_FORMAT': 'Invalid format for this field',
  'VALIDATION_OUT_OF_RANGE': 'Value is out of acceptable range',
  'VALIDATION_UNIQUE_CONSTRAINT': 'This value must be unique',
  
  // 资源错误
  'RESOURCE_NOT_FOUND': 'The requested resource was not found',
  'RESOURCE_ALREADY_EXISTS': 'A resource with these details already exists',
  'RESOURCE_CONFLICT': 'Resource conflict detected',
  'RESOURCE_UNAVAILABLE': 'The requested resource is currently unavailable',
  'RESOURCE_LIMIT_EXCEEDED': 'Resource limit exceeded',
  
  // 业务逻辑错误
  'BUSINESS_RULE_VIOLATION': 'Business rule violation',
  'WORKFLOW_INVALID_STATE': 'Invalid workflow state for this operation',
  'OPERATION_NOT_ALLOWED': 'This operation is not allowed in the current context',
  'DEPENDENCY_NOT_MET': 'Required dependencies are not met',
  
  // 系统错误
  'INTERNAL_SERVER_ERROR': 'An internal server error occurred',
  'DATABASE_ERROR': 'A database error occurred',
  'EXTERNAL_SERVICE_ERROR': 'An external service error occurred',
  'NETWORK_ERROR': 'A network error occurred',
  'TIMEOUT_ERROR': 'The operation timed out',
  
  // 配置错误
  'CONFIGURATION_ERROR': 'A configuration error occurred',
  'ENVIRONMENT_ERROR': 'An environment error occurred',
  'FEATURE_DISABLED': 'This feature is currently disabled',
};

// 创建应用错误类
export class ApplicationError extends Error implements AppError {
  public readonly code: ErrorCode;
  public readonly statusCode: HttpStatusCode;
  public readonly details?: Record<string, any>;
  public readonly timestamp: string;

  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, any>,
    statusCode?: HttpStatusCode
  ) {
    const errorMessage = message || ERROR_MESSAGES[code];
    super(errorMessage);
    
    this.name = 'ApplicationError';
    this.code = code;
    this.statusCode = statusCode || ERROR_CODE_TO_STATUS[code];
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // 保持正确的原型链
    Object.setPrototypeOf(this, ApplicationError.prototype);
  }

  toJSON(): AppError {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  static fromError(error: unknown): ApplicationError {
    if (error instanceof ApplicationError) {
      return error;
    }

    if (error instanceof Error) {
      return new ApplicationError(
        'INTERNAL_SERVER_ERROR',
        error.message,
        { originalError: error.name },
        500
      );
    }

    return new ApplicationError(
      'INTERNAL_SERVER_ERROR',
      'An unknown error occurred',
      { originalError: String(error) },
      500
    );
  }
}

// 特定错误类
export class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_FAILED', message, details, 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string, details?: Record<string, any>) {
    super('AUTH_INVALID_CREDENTIALS', message, details, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string, details?: Record<string, any>) {
    super('AUTH_INSUFFICIENT_PERMISSIONS', message, details, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, details?: Record<string, any>) {
    super('RESOURCE_NOT_FOUND', `${resource} not found`, details, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string, details?: Record<string, any>) {
    super('RESOURCE_CONFLICT', message, details, 409);
    this.name = 'ConflictError';
  }
}

// 错误工具函数
export function createError(
  code: ErrorCode,
  message?: string,
  details?: Record<string, any>
): ApplicationError {
  return new ApplicationError(code, message, details);
}

export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}

export function getErrorMessage(error: unknown): string {
  if (isApplicationError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
}

export function getErrorCode(error: unknown): ErrorCode {
  if (isApplicationError(error)) {
    return error.code;
  }
  
  return 'INTERNAL_SERVER_ERROR';
}

export function getHttpStatus(error: unknown): HttpStatusCode {
  if (isApplicationError(error)) {
    return error.statusCode;
  }
  
  return 500;
}