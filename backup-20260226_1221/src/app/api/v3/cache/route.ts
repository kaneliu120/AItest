import { NextRequest, NextResponse } from 'next/server';
import { contextAwareCacheService } from '@/lib/context-aware-cache-service';
import { unifiedGatewayService, UnifiedRequest, UnifiedResponse } from '@/lib/unified-gateway-service';

// 生成请求ID
function generateRequestId(): string {
  return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET: 获取缓存信息和统计
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'stats';
    
    switch (action) {
      case 'stats':
        // 获取缓存统计
        const stats = contextAwareCacheService.getStats();
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });
        
      case 'items':
        // 获取缓存项列表
        const limit = parseInt(searchParams.get('limit') || '50');
        const items = contextAwareCacheService.getCacheItems(limit);
        return NextResponse.json({
          success: true,
          data: items,
          total: items.length,
          timestamp: new Date().toISOString()
        });
        
      case 'strategies':
        // 获取缓存策略
        const strategies = contextAwareCacheService.getAllStrategies();
        return NextResponse.json({
          success: true,
          data: strategies,
          total: strategies.length,
          timestamp: new Date().toISOString()
        });
        
      case 'health':
        // 健康检查
        const cacheStats = contextAwareCacheService.getStats();
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
          timestamp: new Date().toISOString()
        });
        
      case 'analyze':
        // 分析查询的上下文特征
        const query = searchParams.get('q');
        if (!query) {
          return NextResponse.json({
            success: false,
            error: '缺少查询参数 q',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        // 创建模拟请求进行分析
        const mockRequest: UnifiedRequest = {
          id: generateRequestId(),
          query,
          priority: 'medium',
          context: {}
        };
        
        // 这里需要调用特征提取方法，但它是私有的
        // 简化处理：返回基本分析
        const keywords = query.toLowerCase().split(/[\s,，.。!！?？;；:：]+/).filter(w => w.length > 1).slice(0, 10);
        
        return NextResponse.json({
          success: true,
          data: {
            query,
            keywords,
            length: query.length,
            wordCount: query.split(/\s+/).length,
            analysis: '上下文特征分析需要完整请求对象'
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
    console.error('上下文缓存API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST: 缓存操作和管理
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
      case 'query':
        // 上下文感知查询
        const { query, priority, context, system, strategy } = body;
        
        if (!query) {
          return NextResponse.json({
            success: false,
            error: '缺少 query 参数',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        const cacheRequest: UnifiedRequest = {
          id: generateRequestId(),
          query,
          system: system as any,
          priority: priority || 'medium',
          context: context || {},
          metadata: {
            source: 'api',
            method: 'POST',
            cacheStrategy: strategy || 'default'
          }
        };
        
        // 1. 尝试从上下文缓存获取
        const cacheResult = await contextAwareCacheService.getWithContext(cacheRequest, strategy);
        
        if (cacheResult.cached && cacheResult.response) {
          // 缓存命中
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
        
        // 2. 缓存未命中，使用统一网关处理
        const gatewayResponse = await unifiedGatewayService.processRequest(cacheRequest);
        
        // 3. 缓存结果
        if (gatewayResponse.success) {
          await contextAwareCacheService.setWithContext(cacheRequest, gatewayResponse, strategy);
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
        // 添加缓存策略
        const { strategyName, strategyConfig } = body;
        
        if (!strategyName || !strategyConfig) {
          return NextResponse.json({
            success: false,
            error: '缺少 strategyName 或 strategyConfig 参数',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        contextAwareCacheService.addStrategy(strategyName, strategyConfig);
        return NextResponse.json({
          success: true,
          data: contextAwareCacheService.getStrategy(strategyName),
          message: '缓存策略添加成功',
          timestamp: new Date().toISOString()
        });
        
      case 'update-config':
        // 更新相似度配置
        const { similarityConfig } = body;
        if (!similarityConfig) {
          return NextResponse.json({
            success: false,
            error: '缺少 similarityConfig 参数',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        contextAwareCacheService.updateSimilarityConfig(similarityConfig);
        return NextResponse.json({
          success: true,
          message: '相似度配置更新成功',
          timestamp: new Date().toISOString()
        });
        
      case 'clear':
        // 清空缓存
        contextAwareCacheService.clearCache();
        return NextResponse.json({
          success: true,
          message: '上下文缓存已清空',
          timestamp: new Date().toISOString()
        });
        
      case 'remove-strategy':
        // 移除缓存策略
        const { removeStrategyName } = body;
        if (!removeStrategyName) {
          return NextResponse.json({
            success: false,
            error: '缺少 removeStrategyName 参数',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        const removed = contextAwareCacheService.removeStrategy(removeStrategyName);
        return NextResponse.json({
          success: removed,
          message: removed ? '缓存策略移除成功' : '缓存策略未找到',
          timestamp: new Date().toISOString()
        });
        
      case 'test-similarity':
        // 测试相似度计算
        const { query1, query2 } = body;
        
        if (!query1 || !query2) {
          return NextResponse.json({
            success: false,
            error: '缺少 query1 或 query2 参数',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        // 创建模拟请求
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
        
        // 这里简化处理，实际应该调用相似度计算方法
        // 由于方法是私有的，我们返回基本分析
        
        const keywords1 = query1.toLowerCase().split(/[\s,，.。!！?？;；:：]+/).filter((w: string) => w.length > 1);
        const keywords2 = query2.toLowerCase().split(/[\s,，.。!！?？;；:：]+/).filter((w: string) => w.length > 1);
        
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
            analysis: '基于关键词的Jaccard相似度计算'
          },
          timestamp: new Date().toISOString()
        });
        
      case 'batch-query':
        // 批量查询
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
              // 尝试上下文缓存
              const cacheResult = await contextAwareCacheService.getWithContext(req);
              
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
              
              // 缓存未命中，使用统一网关
              const response = await unifiedGatewayService.processRequest(req);
              
              // 缓存结果
              if (response.success) {
                await contextAwareCacheService.setWithContext(req, response);
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
                error: error instanceof Error ? error.message : '未知错误',
                cacheHit: false,
                query: q
              };
            }
          })
        );
        
        // 计算统计
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
    console.error('上下文缓存API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}