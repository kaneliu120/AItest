/**
 * API standardization middleware
 * 确保所有API响应使用统一的格式
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, successResponse, errorResponse } from '@/lib/api-response';

/**
 * API standardization middleware
 * 包装API处理函数，确保响应格式统一
 */
export function withApiStandardizer<T = any>(
  handler: (req: NextRequest) => Promise<ApiResponse<T> | NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const result = await handler(req);
      
      // 如果已经是NextResponse，检查是否是JSON响应
      if (result instanceof NextResponse) {
        const contentType = result.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          // 已经是JSON响应，确保格式正确
          try {
            const body = await result.json();
            if (!body.success && !body.error) {
              // 缺少标准字段，包装它
              const standardized = successResponse(body);
              return NextResponse.json(standardized, { status: result.status });
            }
            return result;
          } catch {
            // 无法解析为JSON，返回原响应
            return result;
          }
        }
        return result;
      }
      
      // 如果是ApiResponse，直接返回
      if (result && typeof result === 'object' && 'success' in result) {
        const apiResponse = result as ApiResponse;
        const status = apiResponse.success ? 200 : 
                      apiResponse.error?.code === 'ERR_UNAUTHORIZED' ? 401 :
                      apiResponse.error?.code === 'ERR_NOT_FOUND' ? 404 :
                      apiResponse.error?.code === 'ERR_VALIDATION' ? 400 : 500;
        
        return NextResponse.json(apiResponse, { status });
      }
      
      // 其他情况，包装为成功响应
      const standardized = successResponse(result);
      return NextResponse.json(standardized);
      
    } catch (error) {
      console.error('API processing error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const apiError = errorResponse(errorMessage, { statusCode: 500 });
      
      return NextResponse.json(apiError, { status: 500 });
    }
  };
}

/**
 * Request ID middleware
 * Generates a unique ID for each request
 */
export function withRequestId(
  handler: (req: NextRequest, requestId: string) => Promise<ApiResponse | NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    
    // 添加请求ID到请求头
    const headers = new Headers(req.headers);
    headers.set('X-Request-ID', requestId);
    
    const modifiedReq = new NextRequest(req, { headers });
    
    try {
      const result = await handler(modifiedReq, requestId);
      
      if (result instanceof NextResponse) {
        // 添加请求ID到响应头
        result.headers.set('X-Request-ID', requestId);
        return result;
      }
      
      // 如果是ApiResponse，添加请求ID
      if (result && typeof result === 'object') {
        (result as any).requestId = requestId;
      }
      
      return NextResponse.json(result);
      
    } catch (error) {
      console.error(`Request ${requestId} processing error:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const apiError = errorResponse(errorMessage, { 
        statusCode: 500,
        requestId 
      });
      
      const response = NextResponse.json(apiError, { status: 500 });
      response.headers.set('X-Request-ID', requestId);
      return response;
    }
  };
}

/**
 * Processing time middleware
 * 记录API处理时间
 */
export function withProcessingTime(
  handler: (req: NextRequest) => Promise<ApiResponse | NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    
    try {
      const result = await handler(req);
      const processingTime = Date.now() - startTime;
      
      // 添加处理时间到响应头
      const response = result instanceof NextResponse ? result : NextResponse.json(result);
      response.headers.set('X-Processing-Time', processingTime.toString());
      
      // 如果是ApiResponse，添加处理时间到数据
      if (!(result instanceof NextResponse) && result && typeof result === 'object') {
        const apiResponse = result as any;
        if (apiResponse.data && typeof apiResponse.data === 'object') {
          apiResponse.data.metadata = {
            ...apiResponse.data.metadata,
            processingTime
          };
        }
      }
      
      return response;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`API processing error (${processingTime}ms):`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const apiError = errorResponse(errorMessage, { statusCode: 500 });
      
      const response = NextResponse.json(apiError, { status: 500 });
      response.headers.set('X-Processing-Time', processingTime.toString());
      return response;
    }
  };
}

/**
 * Combined middleware
 */
export function composeMiddleware<T = any>(
  handler: (req: NextRequest, ...args: any[]) => Promise<ApiResponse<T> | NextResponse>,
  ...middlewares: Array<(next: typeof handler) => typeof handler>
): (req: NextRequest) => Promise<NextResponse> {
  return middlewares.reduceRight(
    (next, middleware) => middleware(next),
    handler
  ) as (req: NextRequest) => Promise<NextResponse>;
}

/**
 * Standard API handler wrapper
 * 组合所有中间件
 */
export function standardApiHandler<T = any>(
  handler: (req: NextRequest, requestId: string) => Promise<ApiResponse<T>>
) {
  return composeMiddleware(
    handler,
    withProcessingTime,
    withApiStandardizer,
    withRequestId
  );
}

/**
 * Validation middleware
 * 验证请求参数
 */
export function withValidation<T>(
  schema: { parse: (data: any) => T },
  getData: (req: NextRequest) => Promise<any>
) {
  return (handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>) => {
    return async (req: NextRequest): Promise<NextResponse> => {
      try {
        const data = await getData(req);
        const validatedData = schema.parse(data);
        return await handler(req, validatedData);
      } catch (error: any) {
        // Validation error
        const validationErrors: Record<string, string[]> = {};
        
        if (error.errors) {
          error.errors.forEach((err: any) => {
            const path = err.path.join('.');
            if (!validationErrors[path]) {
              validationErrors[path] = [];
            }
            validationErrors[path].push(err.message);
          });
        }
        
        const apiError = errorResponse({
          code: 'ERR_VALIDATION',
          message: 'Request parameter validation failed',
          details: validationErrors
        }, { statusCode: 400 });
        
        return NextResponse.json(apiError, { status: 400 });
      }
    };
  };
}

/**
 * Authentication middleware
 */
export function withAuth(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // 这里应该实现实际的认证逻辑
    // 暂时返回模拟的用户ID
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const apiError = errorResponse({
        code: 'ERR_UNAUTHORIZED',
        message: 'Authentication required'
      }, { statusCode: 401 });
      
      return NextResponse.json(apiError, { status: 401 });
    }
    
    // 模拟认证，实际应该验证token
    const token = authHeader.slice(7);
    const userId = 'user-123'; // mock user ID
    
    return await handler(req, userId);
  };
}

/**
 * Cache middleware
 */
export function withCache(
  getCacheKey: (req: NextRequest) => string,
  ttl: number = 60 // default 60 seconds
) {
  return (handler: (req: NextRequest) => Promise<ApiResponse | NextResponse>) => {
    const cache = new Map<string, { data: any; expiry: number }>();
    
    return async (req: NextRequest): Promise<NextResponse> => {
      const cacheKey = getCacheKey(req);
      const now = Date.now();
      
      // 检查缓存
      const cached = cache.get(cacheKey);
      if (cached && cached.expiry > now) {
        const response = NextResponse.json(cached.data);
        response.headers.set('X-Cache', 'HIT');
        response.headers.set('X-Cache-Expiry', new Date(cached.expiry).toISOString());
        return response;
      }
      
      // 执行处理函数
      const result = await handler(req);
      
      if (result instanceof NextResponse) {
        const data = await result.json();
        
        // 缓存响应
        cache.set(cacheKey, {
          data,
          expiry: now + (ttl * 1000)
        });
        
        // 添加缓存头
        result.headers.set('X-Cache', 'MISS');
        result.headers.set('X-Cache-Expiry', new Date(now + (ttl * 1000)).toISOString());
        
        return result;
      }
      
      // 如果是ApiResponse，缓存它
      cache.set(cacheKey, {
        data: result,
        expiry: now + (ttl * 1000)
      });
      
      const response = NextResponse.json(result);
      response.headers.set('X-Cache', 'MISS');
      response.headers.set('X-Cache-Expiry', new Date(now + (ttl * 1000)).toISOString());
      
      return response;
    };
  };
}