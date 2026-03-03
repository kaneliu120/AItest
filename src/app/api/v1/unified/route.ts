import { NextRequest, NextResponse } from 'next/server';
import { unifiedGatewayservervice, UnifiedRequest } from '@/lib/unified-gateway-service';

// GenerateRequestID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const VALID_SYSTEMS = ['mission-control','okms','openclaw','auto'] as const;
const VALID_PRIORITIES = ['low','medium','high','critical'] as const;

function asSystem(v: unknown): UnifiedRequest['system'] {
  return typeof v === 'string' && (VALID_SYSTEMS as readonly string[]).includes(v) ? (v as UnifiedRequest['system']) : undefined;
}
function asPriority(v: unknown): UnifiedRequest['priority'] {
  return typeof v === 'string' && (VALID_PRIORITIES as readonly string[]).includes(v) ? (v as UnifiedRequest['priority']) : 'medium';
}

// GET: Process查询Request
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'process';
    
    switch (action) {
      case 'process':
        // Process查询
        const query = searchParams.get('q');
        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'Missing query parameter q',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }

        const system = asSystem(searchParams.get('system'));
        const priority = asPriority(searchParams.get('priority'));

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

        const response = await unifiedGatewayservervice.processRequest(unifiedRequest);
        
        return NextResponse.json({
          success: true,
          data: response,
          timestamp: new Date().toISOString()
        });

      case 'cache-stats':
        // FetchCacheStatistics
        const cacheStats = await unifiedGatewayservervice.getCacheStats();
        return NextResponse.json({
          success: true,
          data: cacheStats,
          timestamp: new Date().toISOString()
        });

      case 'health':
        // HealthCheck
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
          error: `Unknown operation: ${action}`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Unified gateway API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST: Process复杂Request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Missing action parameter',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    switch (action) {
      case 'process':
        // Process统一Request
        const b = body as Record<string, unknown>;
        const query = typeof b.query === 'string' ? b.query : '';
        const system = b.system;
        const priority = b.priority;
        const context = b.context;
        const userId = b.userId;
        const sessionId = b.sessionId;
        const metadata = b.metadata;
        
        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'Missing query parameter',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }

        const unifiedRequest: UnifiedRequest = {
          id: generateRequestId(),
          query,
          system: asSystem(system),
          priority: asPriority(priority),
          context: (context && typeof context === 'object' ? context as Record<string, unknown> : {}),
          userId: typeof userId === 'string' ? userId : undefined,
          sessionId: typeof sessionId === 'string' ? sessionId : undefined,
          metadata: {
            ...(metadata && typeof metadata === 'object' ? metadata as Record<string, unknown> : {}),
            source: 'api',
            method: 'POST'
          }
        };

        const response = await unifiedGatewayservervice.processRequest(unifiedRequest);
        
        return NextResponse.json({
          success: true,
          data: response,
          timestamp: new Date().toISOString()
        });

      case 'clear-cache':
        // ClearCache
        const cleared = await unifiedGatewayservervice.clearCache();
        return NextResponse.json({
          success: true,
          data: { cleared },
          message: cleared ? 'Cache cleared' : 'Cache clear failed',
          timestamp: new Date().toISOString()
        });

      case 'batch-process':
        // batchProcess
        const { queries } = body;
        
        if (!Array.isArray(queries) || queries.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Missing valid queries array',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }

        // 限制batchLargeSmall
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
              return await unifiedGatewayservervice.processRequest(req);
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
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
          error: `Unknown operation: ${action}`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Unified gateway API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}