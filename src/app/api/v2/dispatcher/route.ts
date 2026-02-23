import { NextRequest, NextResponse } from 'next/server';
import { intelligentTaskDispatcher } from '@/lib/intelligent-task-dispatcher';
import { enhancedIntelligentDispatcher } from '@/lib/intelligent-task-dispatcher-fix';
import { dispatcherMonitoringService } from '@/lib/dispatcher-monitoring-service';
import { unifiedGatewayService, UnifiedRequest } from '@/lib/unified-gateway-service';

// 生成请求ID
function generateRequestId(): string {
  return `disp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET: 获取分发统计和状态
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'stats';
    
    switch (action) {
      case 'stats':
        // 获取分发统计
        const stats = intelligentTaskDispatcher.getDispatchStats();
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });
        
      case 'performance':
        // 获取系统性能报告
        const performance = intelligentTaskDispatcher.getSystemPerformanceReport();
        return NextResponse.json({
          success: true,
          data: performance,
          total: performance.length,
          timestamp: new Date().toISOString()
        });
        
      case 'history':
        // 获取任务历史
        const limit = parseInt(searchParams.get('limit') || '50');
        const history = intelligentTaskDispatcher.getTaskHistory(limit);
        return NextResponse.json({
          success: true,
          data: history,
          total: history.length,
          timestamp: new Date().toISOString()
        });
        
      case 'config':
        // 获取当前配置
        const config = intelligentTaskDispatcher.getConfig();
        return NextResponse.json({
          success: true,
          data: config,
          timestamp: new Date().toISOString()
        });
        
      case 'health':
        // 健康检查
        const cacheStats = enhancedIntelligentDispatcher.getCacheStats();
        return NextResponse.json({
          success: true,
          data: {
            status: 'healthy',
            service: 'intelligent-task-dispatcher',
            timestamp: new Date().toISOString(),
            features: [
              'task-analysis',
              'intelligent-routing',
              'performance-learning',
              'multiple-strategies',
              'cost-optimization',
              'enhanced-caching'
            ],
            cache: {
              enabled: true,
              size: cacheStats.size,
              hitRate: cacheStats.hitRate
            }
          },
          timestamp: new Date().toISOString()
        });
        
      case 'cache-stats':
        // 缓存统计
        const detailedCacheStats = enhancedIntelligentDispatcher.getCacheStats();
        return NextResponse.json({
          success: true,
          data: detailedCacheStats,
          timestamp: new Date().toISOString()
        });
        
      case 'monitoring':
        // 监控数据
        const dashboardData = dispatcherMonitoringService.getDashboardData();
        return NextResponse.json({
          success: true,
          data: dashboardData,
          timestamp: new Date().toISOString()
        });
        
      case 'alerts':
        // 警报数据
        const alertType = searchParams.get('type') || 'active';
        let alerts;
        if (alertType === 'active') {
          alerts = dispatcherMonitoringService.getActiveAlerts();
        } else {
          const limit = parseInt(searchParams.get('limit') || '50');
          alerts = dispatcherMonitoringService.getAllAlerts(limit);
        }
        return NextResponse.json({
          success: true,
          data: alerts,
          total: alerts.length,
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
    console.error('智能分发API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST: 分发任务和管理
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
      case 'dispatch':
        // 分发任务
        const { query, system, priority, context, userId, sessionId, metadata, useCache = true } = body;
        
        if (!query) {
          return NextResponse.json({
            success: false,
            error: '缺少 query 参数',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        const dispatchRequest: UnifiedRequest = {
          id: generateRequestId(),
          query,
          system: system as any,
          priority: priority || 'medium',
          context: context || {},
          userId,
          sessionId,
          metadata: {
            ...metadata,
            source: 'api',
            method: 'POST',
            dispatcher: 'intelligent',
            useCache
          }
        };
        
        let response;
        if (useCache) {
          // 使用带缓存的增强分发器
          response = await enhancedIntelligentDispatcher.dispatchTaskWithCache(dispatchRequest);
        } else {
          // 使用原始分发器
          response = await intelligentTaskDispatcher.dispatchTask(dispatchRequest);
        }
        
        return NextResponse.json({
          success: true,
          data: response,
          requestId: dispatchRequest.id,
          timestamp: new Date().toISOString()
        });
        
      case 'update-config':
        // 更新配置
        const { config } = body;
        if (!config) {
          return NextResponse.json({
            success: false,
            error: '缺少 config 参数',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        intelligentTaskDispatcher.updateConfig(config);
        return NextResponse.json({
          success: true,
          data: intelligentTaskDispatcher.getConfig(),
          message: '配置更新成功',
          timestamp: new Date().toISOString()
        });
        
      case 'clear-history':
        // 清空历史记录
        intelligentTaskDispatcher.clearHistory();
        return NextResponse.json({
          success: true,
          message: '历史记录已清空',
          timestamp: new Date().toISOString()
        });
        
      case 'clear-cache':
        // 清空缓存
        enhancedIntelligentDispatcher.clearCache();
        return NextResponse.json({
          success: true,
          message: '缓存已清空',
          timestamp: new Date().toISOString()
        });
        
      case 'resolve-alert':
        // 解决警报
        const { alertId } = body;
        if (!alertId) {
          return NextResponse.json({
            success: false,
            error: '缺少 alertId 参数',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        const resolved = dispatcherMonitoringService.resolveAlert(alertId);
        return NextResponse.json({
          success: resolved,
          message: resolved ? '警报已解决' : '警报未找到或已解决',
          timestamp: new Date().toISOString()
        });
        
      case 'clear-monitoring':
        // 清空监控数据
        dispatcherMonitoringService.clearAll();
        return NextResponse.json({
          success: true,
          message: '监控数据已清空',
          timestamp: new Date().toISOString()
        });
        
      case 'compare':
        // 比较智能分发和基础分发的性能
        const { compareQuery } = body;
        if (!compareQuery) {
          return NextResponse.json({
            success: false,
            error: '缺少 compareQuery 参数',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        // 创建相同的请求
        const compareRequest: UnifiedRequest = {
          id: generateRequestId(),
          query: compareQuery,
          priority: 'medium',
          context: {},
          metadata: { source: 'compare-test' }
        };
        
        // 并行执行两种分发方式
        const [intelligentResult, basicResult] = await Promise.all([
          intelligentTaskDispatcher.dispatchTask(compareRequest),
          unifiedGatewayService.processRequest(compareRequest)
        ]);
        
        return NextResponse.json({
          success: true,
          data: {
            intelligent: {
              success: intelligentResult.success,
              responseTime: intelligentResult.data.responseTime,
              system: intelligentResult.data.source,
              taskType: intelligentResult.data.taskType,
              cached: intelligentResult.data.cached
            },
            basic: {
              success: basicResult.success,
              responseTime: basicResult.data.responseTime,
              system: basicResult.data.source,
              taskType: basicResult.data.taskType,
              cached: basicResult.data.cached
            },
            improvement: {
              timeImprovement: `${((basicResult.data.responseTime - intelligentResult.data.responseTime) / basicResult.data.responseTime * 100).toFixed(1)}%`,
              systemMatch: intelligentResult.data.source === 'auto' ? '智能选择' : '指定系统'
            }
          },
          timestamp: new Date().toISOString()
        });
        
      case 'batch-dispatch':
        // 批量分发
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
              metadata: { batchIndex: index, batchSize: limitedQueries.length }
            };
            
            try {
              return await intelligentTaskDispatcher.dispatchTask(req);
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : '未知错误',
                query: q
              };
            }
          })
        );
        
        // 计算批量统计
        const successful = batchResults.filter(r => r.success).length;
        const failed = batchResults.filter(r => !r.success).length;
        const responseTimes = batchResults.filter(r => r.success).map(r => r.data.responseTime);
        const avgResponseTime = responseTimes.length > 0 ? 
          responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;
        
        return NextResponse.json({
          success: true,
          data: {
            total: batchResults.length,
            successful,
            failed,
            successRate: `${((successful / batchResults.length) * 100).toFixed(1)}%`,
            averageResponseTime: avgResponseTime.toFixed(1),
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
    console.error('智能分发API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}