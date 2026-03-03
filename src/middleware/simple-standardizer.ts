/**
 * Simplified API standardization middleware
 * Avoids complex response body handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, successResponse, errorResponse } from '@/lib/api-response';

/**
 * Simplified standard API handler
 */
export function simpleApiHandler<T = any>(
  handler: (req: NextRequest, requestId: string) => Promise<ApiResponse<T>>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      const result = await handler(req, requestId);
      const processingTime = Date.now() - startTime;
      
      // Ensure response format is correct
      const apiResponse: ApiResponse = {
        ...result,
        timestamp: result.timestamp || new Date().toISOString(),
        version: result.version || '2.0.0',
        requestId: result.requestId || requestId,
      };
      
      // Determine status code
      const status = apiResponse.success ? 200 : 
                    apiResponse.error?.code === 'ERR_UNAUTHORIZED' ? 401 :
                    apiResponse.error?.code === 'ERR_NOT_FOUND' ? 404 :
                    apiResponse.error?.code === 'ERR_VALIDATION' ? 400 : 500;
      
      // Create response
      const response = NextResponse.json(apiResponse, { status });
      
      // Add header information
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Processing-Time', processingTime.toString());
      
      return response;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`API processing error (${processingTime}ms):`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const apiError = errorResponse(errorMessage, { 
        statusCode: 500,
        requestId 
      });
      
      const response = NextResponse.json(apiError, { status: 500 });
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Processing-Time', processingTime.toString());
      
      return response;
    }
  };
}

/**
 * Basic API handler (without middleware chain)
 */
export function basicApiHandler<T = any>(
  handler: (req: NextRequest) => Promise<ApiResponse<T>>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      const result = await handler(req);
      const processingTime = Date.now() - startTime;
      
      // Ensure response format is correct
      const apiResponse: ApiResponse = {
        ...result,
        timestamp: result.timestamp || new Date().toISOString(),
        version: result.version || '2.0.0',
        requestId: result.requestId || requestId,
      };
      
      // Determine status code
      const status = apiResponse.success ? 200 : 
                    apiResponse.error?.code === 'ERR_UNAUTHORIZED' ? 401 :
                    apiResponse.error?.code === 'ERR_NOT_FOUND' ? 404 :
                    apiResponse.error?.code === 'ERR_VALIDATION' ? 400 : 500;
      
      // Create response
      const response = NextResponse.json(apiResponse, { status });
      
      // Add header information
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Processing-Time', processingTime.toString());
      
      return response;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`API processing error (${processingTime}ms):`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const apiError = errorResponse(errorMessage, { 
        statusCode: 500,
        requestId 
      });
      
      const response = NextResponse.json(apiError, { status: 500 });
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Processing-Time', processingTime.toString());
      
      return response;
    }
  };
}