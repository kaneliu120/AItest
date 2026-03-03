/**
 * APIResponseFormatstandard化
 * 所AllAPImustusing此Format返回Response
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  
  // 元data
  timestamp: string;
  requestId?: string;
  version: string;
  
  // Pagination支持
  pagination?: PaginationInfo;
  
  // Cacheinformation
  cached?: boolean;
  cacheExpiry?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string; // 仅dev environment
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
 * successResponse
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
 * errorResponse
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

  // ifYes500error, Add堆栈information(仅dev environment)
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
 * PaginationResponse
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
 * nullResponse(用于Delete等操作)
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
 * Validation errorResponse
 */
export function validationErrorResponse(
  errors: Record<string, string[]>,
  message: string = 'Validatefailed'
): ApiResponse {
  return errorResponse({
    code: 'ERR_VALIDATION',
    message,
    details: errors,
  }, { statusCode: 400 });
}

/**
 * UnauthorizedResponse
 */
export function unauthorizedResponse(
  message: string = 'Unauthorized访问'
): ApiResponse {
  return errorResponse({
    code: 'ERR_UNAUTHORIZED',
    message,
  }, { statusCode: 401 });
}

/**
 * Not foundResponse
 */
export function notFoundResponse(
  message: string = 'resourceNot found'
): ApiResponse {
  return errorResponse({
    code: 'ERR_NOT_FOUND',
    message,
  }, { statusCode: 404 });
}

/**
 * serverver errorResponse
 */
export function serverErrorResponse(
  error: Error | string,
  requestId?: string
): ApiResponse {
  const message = typeof error === 'string' ? error : error.message;
  
  return errorResponse({
    code: 'ERR_INTERNAL',
    message: 'servervice器Internalerror',
    details: process.env.NODE_ENV === 'development' ? { originalError: message } : undefined,
  }, { 
    statusCode: 500,
    requestId,
  });
}

/**
 * Center间件: AddRequestID
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
 * Center间件: AddProcesstime
 */
export function withProcessingTime(
  handler: (req: Request) => Promise<ApiResponse>
) {
  return async (req: Request) => {
    const startTime = Date.now();
    
    try {
      const response = await handler(req);
      
      // AddProcesstimetoResponsedataCenter
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
 * Toolfunction: FromRequestCenter提取PaginationParameters
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
 * Toolfunction: FromRequestCenter提取SortParameters
 */
export function extractSortParams(
  searchParams: URLSearchParams
): { sortBy: string; sortOrder: 'asc' | 'desc' } {
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
  
  return { sortBy, sortOrder };
}

/**
 * Toolfunction: FromRequestCenter提取filterParameters
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

/** Generate带 requestId 'ssuccess JSON Response */
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    { success: true, data, requestId: randomUUID(), timestamp: new Date().toISOString() },
    { status }
  );
}

/** Generate带 requestId 'sfailed JSON Response */
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
