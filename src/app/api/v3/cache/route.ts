import { NextRequest, NextResponse } from 'next/server';
import { makeRequestId, logApiStart, logApiEnd, logApiError } from '@/lib/observability';
import { contextAwareCacheservervice, CacheStrategy } from '@/lib/context-aware-cache-service';
import { unifiedGatewayservervice, UnifiedRequest, UnifiedResponse } from '@/lib/unified-gateway-service';

// GenerateRequestID
function generateRequestId(): string {
  return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const VALID_SYSTEMS = ['mission-control','okms','openclaw','auto'] as const;
const VALID_PRIORITIES = ['low','medium','high','critical'] as const;

function asSystem(v: unknown): UnifiedRequest['system'] {
  return typeof v === 'string' && (VALID_SYSTEMS as readonly string[]).includes(v) ? (v as UnifiedRequest['system']) : undefined;
}
function asPriority(v: unknown): UnifiedRequest['priority'] {
  return typeof v === 'string' && (VALID_PRIORITIES as readonly string[]).includes(v) ? (v as UnifiedRequest['priority']) : 'medium';
}

// GET: FetchCacheinformation和Statistics
export async function GET(request: NextRequest) {
  const requestId = makeRequestId('api');
  logApiStart(request.nextUrl.pathname, requestId, { method: 'GET' });
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'stats';
    
    switch (action) {
      case 'stats':
        // FetchCacheStatistics
        const stats = contextAwareCacheservervice.getStats();
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
        });
        
      case 'items':
        // FetchCache项List
        const limit = parseInt(searchParams.get('limit') || '50');
        const items = contextAwareCacheservervice.getCacheItems(limit);
        return NextResponse.json({
          success: true,
          data: items,
          total: items.length,
          timestamp: new Date().toISOString(),
        });
        
      case 'strategies':
        // FetchCache策略
        const strategies = contextAwareCacheservervice.getAllStrategies();
        return NextResponse.json({
          success: true,
          data: strategies,
          total: strategies.length,
          timestamp: new Date().toISOString(),
        });
        
      case 'health':
        // HealthCheck
        const cacheStats = contextAwareCacheservervice.getStats();
        return NextResponse.json({
          success: true,
          data: {
            status: 'healthy',
            service: 'context-aware-cache',
            timestamp: new Date().toISOString(),
            features: [
              'semantic-matching',
              'context-awareness',
              'multi-strategy',
              'intelligent-eviction',
              'partial-matching',
              'relevance-scoring'
            ],
            stats: {
              cacheSize: cacheStats.cacheSize,
              hitRate: cacheStats.hitRate,
              semanticHitRate: cacheStats.semanticHitRate
            }
          },
          timestamp: new Date().toISOString(),
        });
        
      case 'analyze':
        // Analytics查询'sContext features
        const query = searchParams.get('q');
        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'Missing query parameter q',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        // Create模拟RequestIn ProgressAnalytics
        const mockRequest: UnifiedRequest = {
          id: generateRequestId(),
          query,
          priority: 'medium',
          context: {}
        };
        
        // 这里need to调用特征提取method, 但它YesPrivate's
        // 简化Process: 返回基本Analytics
        const keywords = query.toLowerCase().split(/[\s,, .. !! ?? ;；:: ]+/).filter(w => w.length > 1).slice(0, 10);
        
        return NextResponse.json({
          success: true,
          data: {
            query,
            keywords,
            length: query.length,
            wordCount: query.split(/\s+/).length,
            analysis: 'Context feature analysis requires a complete request object'
          },
          timestamp: new Date().toISOString(),
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown operation: ${action}`,
          timestamp: new Date().toISOString(),
          requestId,
        }, { status: 400 });
    }
  } catch (error) {
    logApiError('api/v3/cache', requestId, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      requestId,
    }, { status: 500 });
  }
}

// POST: Cache操作和管理
export async function POST(request: NextRequest) {
  const requestId = makeRequestId('api');
  logApiStart(request.nextUrl.pathname, requestId, { method: 'POST' });
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = body.action;
    
    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Missing action parameter',
        timestamp: new Date().toISOString(),
        requestId,
      }, { status: 400 });
    }
    
    switch (action) {
      case 'query':
        // Context-aware query
        const query = typeof body.query === 'string' ? body.query : '';
        const priority = body.priority;
        const context = body.context;
        const system = body.system;
        const strategy = typeof body.strategy === 'string' ? body.strategy : undefined;
        
        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'Missing query parameter',
            timestamp: new Date().toISOString(),
            requestId,
          }, { status: 400 });
        }
        
        const cacheRequest: UnifiedRequest = {
          id: generateRequestId(),
          query,
          system: asSystem(system),
          priority: asPriority(priority),
          context: (context && typeof context === 'object' ? context as Record<string, unknown> : {}),
          metadata: {
            source: 'api',
            method: 'POST',
            cacheStrategy: strategy || 'default'
          }
        };
        
        // 1. 尝试From上下文CacheFetch
        const cacheResult = await contextAwareCacheservervice.getWithContext(cacheRequest, strategy);
        
        if (cacheResult.cached && cacheResult.response) {
          // Cache命Center
          return NextResponse.json({
            success: true,
            data: {
              ...cacheResult.response,
              data: {
                ...cacheResult.response.data,
                cached: true,
                cacheMatchType: cacheResult.matchType,
                cacheSimilarity: cacheResult.similarity
              }
            },
            cacheInfo: {
              hit: true,
              matchType: cacheResult.matchType,
              similarity: cacheResult.similarity,
              alternatives: cacheResult.alternatives?.map(alt => ({
                query: alt.item.metadata.query.substring(0, 50),
                similarity: alt.similarity,
                taskType: alt.item.metadata.taskType
              }))
            },
            requestId: cacheRequest.id,
            timestamp: new Date().toISOString()
          });
        }
        
        // 2. Cache未命Center, usingUnified GatewayProcess
        const gatewayResponse = await unifiedGatewayservervice.processRequest(cacheRequest);
        
        // 3. Cacheresult
        if (gatewayResponse.success) {
          await contextAwareCacheservervice.setWithContext(cacheRequest, gatewayResponse, strategy);
        }
        
        return NextResponse.json({
          success: true,
          data: gatewayResponse,
          cacheInfo: {
            hit: false,
            matchType: cacheResult.matchType,
            similarity: cacheResult.similarity
          },
          requestId: cacheRequest.id,
          timestamp: new Date().toISOString()
        });
        
      case 'add-strategy':
        // AddCache策略
        const strategyName = typeof body.strategyName === 'string' ? body.strategyName : '';
        const strategyConfig = body.strategyConfig;
        
        if (!strategyName || !strategyConfig) {
          return NextResponse.json({
            success: false,
            error: 'Missing  strategyName or strategyConfig Parameters',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        if (typeof strategyConfig !== 'object' || strategyConfig === null) {
          return NextResponse.json({ success: false, error: 'strategyConfig mustYesObject', code: 'VALIDATION_ERROR' }, { status: 400 });
        }
        contextAwareCacheservervice.addStrategy(strategyName, strategyConfig as CacheStrategy);
        return NextResponse.json({
          success: true,
          data: contextAwareCacheservervice.getStrategy(strategyName),
          message: 'Cache policy added successfully',
          timestamp: new Date().toISOString(),
        });
        
      case 'update-config':
        // Update相似度Configuration
        const similarityConfig = body.similarityConfig;
        if (!similarityConfig) {
          return NextResponse.json({
            success: false,
            error: 'Missing  similarityConfig Parameters',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        contextAwareCacheservervice.updateSimilarityConfig(similarityConfig);
        return NextResponse.json({
          success: true,
          message: 'Similarity configuration updated successfully',
          timestamp: new Date().toISOString(),
        });
        
      case 'clear':
        // ClearCache
        contextAwareCacheservervice.clearCache();
        return NextResponse.json({
          success: true,
          message: 'Context cache cleared',
          timestamp: new Date().toISOString(),
        });
        
      case 'remove-strategy':
        // removeCache策略
        const removeStrategyName = typeof body.removeStrategyName === 'string' ? body.removeStrategyName : '';
        if (!removeStrategyName) {
          return NextResponse.json({
            success: false,
            error: 'Missing  removeStrategyName Parameters',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        const removed = contextAwareCacheservervice.removeStrategy(removeStrategyName);
        return NextResponse.json({
          success: removed,
          message: removed ? 'Cache policy removed successfully' : 'Cache policy not found',
          timestamp: new Date().toISOString(),
        });
        
      case 'test-similarity':
        // Test相似度计算
        const query1 = typeof body.query1 === 'string' ? body.query1 : '';
        const query2 = typeof body.query2 === 'string' ? body.query2 : '';
        
        if (!query1 || !query2) {
          return NextResponse.json({
            success: false,
            error: 'Missing  query1 or query2 Parameters',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        // Create模拟Request
        const request1: UnifiedRequest = {
          id: generateRequestId(),
          query: query1,
          priority: 'medium',
          context: {}
        };
        
        const request2: UnifiedRequest = {
          id: generateRequestId(),
          query: query2,
          priority: 'medium',
          context: {}
        };
        
        // 这里简化Process, 实际should调用相似度计算method
        // due tomethodYesPrivate's, 我们返回基本Analytics
        
        const keywords1 = query1.toLowerCase().split(/[\s,, .. !! ?? ;；:: ]+/).filter((w: string) => w.length > 1);
        const keywords2 = query2.toLowerCase().split(/[\s,, .. !! ?? ;；:: ]+/).filter((w: string) => w.length > 1);
        
        const intersection = keywords1.filter((k: string) => keywords2.includes(k));
        const union = [...new Set([...keywords1, ...keywords2])];
        const jaccardSimilarity = union.length > 0 ? intersection.length / union.length : 0;
        
        return NextResponse.json({
          success: true,
          data: {
            query1,
            query2,
            keywords1: keywords1.slice(0, 10),
            keywords2: keywords2.slice(0, 10),
            intersection,
            unionSize: union.length,
            jaccardSimilarity: jaccardSimilarity.toFixed(3),
            analysis: 'Jaccard similarity calculation based on keywords'
          },
          timestamp: new Date().toISOString(),
        });
        
      case 'batch-query':
        // batch查询
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
              // 尝试上下文Cache
              const cacheResult = await contextAwareCacheservervice.getWithContext(req);
              
              if (cacheResult.cached && cacheResult.response) {
                return {
                  success: true,
                  data: {
                    ...cacheResult.response.data,
                    cached: true,
                    cacheMatchType: cacheResult.matchType
                  },
                  cacheHit: true,
                  query: q
                };
              }
              
              // Cache未命Center, usingUnified Gateway
              const response = await unifiedGatewayservervice.processRequest(req);
              
              // Cacheresult
              if (response.success) {
                await contextAwareCacheservervice.setWithContext(req, response);
              }
              
              return {
                success: response.success,
                data: response.data,
                cacheHit: false,
                query: q
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                cacheHit: false,
                query: q
              };
            }
          })
        );
        
        // 计算Statistics
        const successful = batchResults.filter(r => r.success).length;
        const cacheHits = batchResults.filter(r => r.cacheHit).length;
        
        return NextResponse.json({
          success: true,
          data: {
            total: batchResults.length,
            successful,
            cacheHits,
            successRate: `${((successful / batchResults.length) * 100).toFixed(1)}%`,
            cacheHitRate: `${((cacheHits / batchResults.length) * 100).toFixed(1)}%`,
            results: batchResults
          },
          timestamp: new Date().toISOString(),
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown operation: ${action}`,
          timestamp: new Date().toISOString(),
          requestId,
        }, { status: 400 });
    }
  } catch (error) {
    logApiError('api/v3/cache', requestId, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      requestId,
    }, { status: 500 });
  }
}
