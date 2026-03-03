/**
 * APIstandard化Center间件
 * Ensure all API responses use a unified format
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, successResponse, errorResponse } from '@/lib/api-response';

/**
 * APIstandard化Center间件
 * Wraps API handlers to ensure unified response format
 */
export function withApiStandardizer<T = any>(
  handler: (req: NextRequest) => Promise<ApiResponse<T> | NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const result = await handler(req);
      
      // If already NextResponse, check if it is JSON response
      if (result instanceof NextResponse) {
        const contentType = result.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          // Already a JSON response, ensure correct format
          try {
            const body = await result.json();
            if (!body.success && !body.error) {
              // Missing standard fields, wrap it
              const standardized = successResponse(body);
              return NextResponse.json(standardized, { status: result.status });
            }
            return result;
          } catch {
            // Cannot parse as JSON, return original response
            return result;
          }
        }
        return result;
      }
      
      // If ApiResponse, return directly
      if (result && typeof result === 'object' && 'success' in result) {
        const apiResponse = result as ApiResponse;
        const status = apiResponse.success ? 200 : 
                      apiResponse.error?.code === 'ERR_UNAUTHORIZED' ? 401 :
                      apiResponse.error?.code === 'ERR_NOT_FOUND' ? 404 :
                      apiResponse.error?.code === 'ERR_VALIDATION' ? 400 : 500;
        
        return NextResponse.json(apiResponse, { status });
      }
      
      // Otherwise, wrap as successResponse
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
 * RequestIDCenter间件
 * Generates a unique ID for each request
 */
export function withRequestId(
  handler: (req: NextRequest, requestId: string) => Promise<ApiResponse | NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    
    // Add request ID to request headers
    const headers = new Headers(req.headers);
    headers.set('X-Request-ID', requestId);
    
    const modifiedReq = new NextRequest(req, { headers });
    
    try {
      const result = await handler(modifiedReq, requestId);
      
      if (result instanceof NextResponse) {
        // Add request ID to response headers
        result.headers.set('X-Request-ID', requestId);
        return result;
      }
      
      // If ApiResponse, add request ID
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
 * ProcesstimeCenter间件
 * Records API processing time
 */
export function withProcessingTime(
  handler: (req: NextRequest) => Promise<ApiResponse | NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    
    try {
      const result = await handler(req);
      const processingTime = Date.now() - startTime;
      
      // Add processing time to response headers
      const response = result instanceof NextResponse ? result : NextResponse.json(result);
      response.headers.set('X-Processing-Time', processingTime.toString());
      
      // If ApiResponse, add processing time to data
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
 * combineCenter间件
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
 * standardAPIProcessfunction包装器
 * Combines all middleware
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
 * ValidateCenter间件
 * Validates request parameters
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
 * AuthCenter间件
 */
export function withAuth(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Actual authentication logic should be implemented here
    // Temporarily returns simulated UserID
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const apiError = errorResponse({
        code: 'ERR_UNAUTHORIZED',
        message: 'Authentication required'
      }, { statusCode: 401 });
      
      return NextResponse.json(apiError, { status: 401 });
    }
    
    // Simulated auth, should actually verify token
    const token = authHeader.slice(7);
    const userId = 'user-123'; // Simulated UserID
    
    return await handler(req, userId);
  };
}

/**
 * CacheCenter间件
 */
export function withCache(
  getCacheKey: (req: NextRequest) => string,
  ttl: number = 60 // Default 60 seconds
) {
  return (handler: (req: NextRequest) => Promise<ApiResponse | NextResponse>) => {
    const cache = new Map<string, { data: any; expiry: number }>();
    
    return async (req: NextRequest): Promise<NextResponse> => {
      const cacheKey = getCacheKey(req);
      const now = Date.now();
      
      // Check cache
      const cached = cache.get(cacheKey);
      if (cached && cached.expiry > now) {
        const response = NextResponse.json(cached.data);
        response.headers.set('X-Cache', 'HIT');
        response.headers.set('X-Cache-Expiry', new Date(cached.expiry).toISOString());
        return response;
      }
      
      // Execute handler function
      const result = await handler(req);
      
      if (result instanceof NextResponse) {
        const data = await result.json();
        
        // Cache response
        cache.set(cacheKey, {
          data,
          expiry: now + (ttl * 1000)
        });
        
        // Add cache headers
        result.headers.set('X-Cache', 'MISS');
        result.headers.set('X-Cache-Expiry', new Date(now + (ttl * 1000)).toISOString());
        
        return result;
      }
      
      // If ApiResponse, cache it
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