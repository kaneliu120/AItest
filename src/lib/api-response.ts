/**
 * API响应格式标准化
 * 所有API必须使用此格式返回响应
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  
  // 元数据
  timestamp: string;
  requestId?: string;
  version: string;
  
  // 分页支持
  pagination?: PaginationInfo;
  
  // 缓存信息
  cached?: boolean;
  cacheExpiry?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string; // development environment only
}

export interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiMetadata {
  source: string;
  processingTime?: number;
  request?: {
    method: string;
    path: string;
    query?: Record<string, any>;
    body?: any;
  };
}

/**
 * 成功响应
 */
export function successResponse<T>(
  data: T,
  options: {
    message?: string;
    pagination?: PaginationInfo;
    cached?: boolean;
    cacheExpiry?: string;
    requestId?: string;
  } = {}
): ApiResponse<T> {
  const {
    message,
    pagination,
    cached = false,
    cacheExpiry,
    requestId,
  } = options;

  return {
    success: true,
    data,
    message,
    pagination,
    cached,
    cacheExpiry,
    timestamp: new Date().toISOString(),
    requestId,
    version: '2.0.0',
  };
}

/**
 * 错误响应
 */
export function errorResponse(
  error: ApiError | string,
  options: {
    statusCode?: number;
    requestId?: string;
    details?: any;
  } = {}
): ApiResponse {
  const { statusCode = 500, requestId, details } = options;
  
  const apiError: ApiError = typeof error === 'string' 
    ? { 
        code: `ERR_${statusCode}`,
        message: error,
        details,
      }
    : error;

  // 如果是500错误，添加堆栈信息（仅开发环境）
  if (statusCode >= 500 && process.env.NODE_ENV === 'development') {
    apiError.stack = new Error().stack;
  }

  return {
    success: false,
    error: apiError,
    timestamp: new Date().toISOString(),
    requestId,
    version: '2.0.0',
  };
}

/**
 * 分页响应
 */
export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
  options: {
    message?: string;
    cached?: boolean;
    cacheExpiry?: string;
    requestId?: string;
  } = {}
): ApiResponse<T[]> {
  const totalPages = Math.ceil(total / pageSize);
  
  const pagination: PaginationInfo = {
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };

  return successResponse(items, {
    ...options,
    pagination,
  });
}

/**
 * 空响应（用于删除等操作）
 */
export function emptyResponse(
  message: string = 'Operation successful',
  options: {
    requestId?: string;
  } = {}
): ApiResponse {
  return {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    requestId: options.requestId,
    version: '2.0.0',
  };
}

/**
 * 验证错误响应
 */
export function validationErrorResponse(
  errors: Record<string, string[]>,
  message: string = 'Validation failed'
): ApiResponse {
  return errorResponse({
    code: 'ERR_VALIDATION',
    message,
    details: errors,
  }, { statusCode: 400 });
}

/**
 * 未授权响应
 */
export function unauthorizedResponse(
  message: string = 'Unauthorized access'
): ApiResponse {
  return errorResponse({
    code: 'ERR_UNAUTHORIZED',
    message,
  }, { statusCode: 401 });
}

/**
 * 未找到响应
 */
export function notFoundResponse(
  message: string = 'Resource not found'
): ApiResponse {
  return errorResponse({
    code: 'ERR_NOT_FOUND',
    message,
  }, { statusCode: 404 });
}

/**
 * 服务器错误响应
 */
export function serverErrorResponse(
  error: Error | string,
  requestId?: string
): ApiResponse {
  const message = typeof error === 'string' ? error : error.message;
  
  return errorResponse({
    code: 'ERR_INTERNAL',
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? { originalError: message } : undefined,
  }, { 
    statusCode: 500,
    requestId,
  });
}

/**
 * 中间件：添加请求ID
 */
export function withRequestId(
  handler: (req: Request, requestId: string) => Promise<ApiResponse>
) {
  return async (req: Request) => {
    const requestId = crypto.randomUUID();
    
    try {
      const response = await handler(req, requestId);
      response.requestId = requestId;
      return response;
    } catch (error) {
      return serverErrorResponse(error as Error, requestId);
    }
  };
}

/**
 * 中间件：添加处理时间
 */
export function withProcessingTime(
  handler: (req: Request) => Promise<ApiResponse>
) {
  return async (req: Request) => {
    const startTime = Date.now();
    
    try {
      const response = await handler(req);
      
      // 添加处理时间到响应数据中
      if (response.data && typeof response.data === 'object') {
        (response.data as any).metadata = {
          ...(response.data as any).metadata,
          processingTime: Date.now() - startTime,
        };
      }
      
      return response;
    } catch (error) {
      return serverErrorResponse(error as Error);
    }
  };
}

/**
 * 工具函数：从请求中提取分页参数
 */
export function extractPaginationParams(
  searchParams: URLSearchParams,
  defaultPageSize: number = 20
): { page: number; pageSize: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.max(1, Math.min(
    100,
    parseInt(searchParams.get('pageSize') || defaultPageSize.toString())
  ));
  
  return { page, pageSize };
}

/**
 * 工具函数：从请求中提取排序参数
 */
export function extractSortParams(
  searchParams: URLSearchParams
): { sortBy: string; sortOrder: 'asc' | 'desc' } {
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
  
  return { sortBy, sortOrder };
}

/**
 * 工具函数：从请求中提取过滤参数
 */
export function extractFilterParams(
  searchParams: URLSearchParams,
  allowedFilters: string[] = []
): Record<string, any> {
  const filters: Record<string, any> = {};
  
  searchParams.forEach((value, key) => {
    if (key.startsWith('filter[') && key.endsWith(']')) {
      const filterKey = key.slice(7, -1);
      
      if (allowedFilters.length === 0 || allowedFilters.includes(filterKey)) {
        filters[filterKey] = value;
      }
    }
  });
  
  return filters;
}
// ─── NextResponse 快捷输出 ────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/** 生成带 requestId 的成功 JSON 响应 */
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    { success: true, data, requestId: randomUUID(), timestamp: new Date().toISOString() },
    { status }
  );
}

/** 生成带 requestId 的失败 JSON 响应 */
export function fail(
  error: string,
  status = 500,
  code?: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      code: code ?? (status === 400 ? 'BAD_REQUEST' : status === 404 ? 'NOT_FOUND' : status === 401 ? 'UNAUTHORIZED' : 'SERVER_ERROR'),
      requestId: randomUUID(),
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
