import { NextRequest, NextResponse } from 'next/server';
import { unifiedGatewayService, UnifiedRequest } from '@/lib/unified-gateway-service';

// 生成请求ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET: 处理查询请求
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'process';
    
    switch (action) {
      case 'process':
        // 处理查询
        const query = searchParams.get('q');
        if (!query) {
          return NextResponse.json({
            success: false,
            error: '缺少查询参数 q',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }

        const system = searchParams.get('system') as any;
        const priority = searchParams.get('priority') as any || 'medium';

        const unifiedRequest: UnifiedRequest = {
          id: generateRequestId(),
          query,
          system,
          priority,
          context: {},
          metadata: {
            source: 'api',
            method: 'GET'
          }
        };

        const response = await unifiedGatewayService.processRequest(unifiedRequest);
        
        return NextResponse.json({
          success: true,
          data: response,
          timestamp: new Date().toISOString()
        });

      case 'cache-stats':
        // 获取缓存统计
        const cacheStats = await unifiedGatewayService.getCacheStats();
        return NextResponse.json({
          success: true,
          data: cacheStats,
          timestamp: new Date().toISOString()
        });

      case 'health':
        // 健康检查
        return NextResponse.json({
          success: true,
          data: {
            status: 'healthy',
            service: 'unified-gateway',
            timestamp: new Date().toISOString(),
            features: ['task-classification', 'smart-routing', 'caching', 'monitoring']
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `未知操作: ${action}`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    console.error('统一网关API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST: 处理复杂请求
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({
        success: false,
        error: '缺少 action 参数',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    switch (action) {
      case 'process':
        // 处理统一请求
        const { query, system, priority, context, userId, sessionId, metadata } = body;
        
        if (!query) {
          return NextResponse.json({
            success: false,
            error: '缺少 query 参数',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }

        const unifiedRequest: UnifiedRequest = {
          id: generateRequestId(),
          query,
          system,
          priority: priority || 'medium',
          context: context || {},
          userId,
          sessionId,
          metadata: {
            ...metadata,
            source: 'api',
            method: 'POST'
          }
        };

        const response = await unifiedGatewayService.processRequest(unifiedRequest);
        
        return NextResponse.json({
          success: true,
          data: response,
          timestamp: new Date().toISOString()
        });

      case 'clear-cache':
        // 清空缓存
        const cleared = await unifiedGatewayService.clearCache();
        return NextResponse.json({
          success: true,
          data: { cleared },
          message: cleared ? '缓存已清空' : '缓存清空失败',
          timestamp: new Date().toISOString()
        });

      case 'batch-process':
        // 批量处理
        const { queries } = body;
        
        if (!Array.isArray(queries) || queries.length === 0) {
          return NextResponse.json({
            success: false,
            error: '缺少有效的 queries 数组',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }

        // 限制批量大小
        const limitedQueries = queries.slice(0, 10);
        
        const batchResults = await Promise.all(
          limitedQueries.map(async (q: string, index: number) => {
            const req: UnifiedRequest = {
              id: `${generateRequestId()}_${index}`,
              query: q,
              priority: 'medium',
              context: {},
              metadata: { batchIndex: index }
            };
            
            try {
              return await unifiedGatewayService.processRequest(req);
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : '未知错误',
                query: q
              };
            }
          })
        );

        return NextResponse.json({
          success: true,
          data: {
            total: batchResults.length,
            successful: batchResults.filter(r => r.success).length,
            failed: batchResults.filter(r => !r.success).length,
            results: batchResults
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `未知操作: ${action}`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    console.error('统一网关API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}