import { NextRequest, NextResponse } from 'next/server';
import { intelligentTaskDispatcher } from '@/lib/intelligent-task-dispatcher';
import { enhancedIntelligentDispatcher } from '@/lib/intelligent-task-dispatcher-fix';
import { dispatcherMonitoringService } from '@/lib/dispatcher-monitoring-service';
import { unifiedGatewayService, UnifiedRequest } from '@/lib/unified-gateway-service';
import { logger } from '@/lib/logger';
import { makeRequestId, logApiStart, logApiEnd, logApiError } from '@/lib/observability';

// 生成请求ID
function generateRequestId(): string {
  return `disp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const VALID_SYSTEMS = ['mission-control','okms','openclaw','auto'] as const;
const VALID_PRIORITIES = ['low','medium','high','critical'] as const;

function asSystem(v: unknown): UnifiedRequest['system'] {
  return typeof v === 'string' && (VALID_SYSTEMS as readonly string[]).includes(v) ? (v as UnifiedRequest['system']) : undefined;
}
function asPriority(v: unknown): UnifiedRequest['priority'] {
  return typeof v === 'string' && (VALID_PRIORITIES as readonly string[]).includes(v) ? (v as UnifiedRequest['priority']) : 'medium';
}

// GET: 获取分发统计和状态
export async function GET(request: NextRequest) {
  const requestId = makeRequestId('api');
  logApiStart(request.nextUrl.pathname, requestId, { method: 'GET' });
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
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'performance':
        // 获取系统性能报告
        const performance = intelligentTaskDispatcher.getSystemPerformanceReport();
        return NextResponse.json({
          success: true,
          data: performance,
          total: performance.length,
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'history':
        // 获取任务历史
        const limit = parseInt(searchParams.get('limit') || '50');
        const history = intelligentTaskDispatcher.getTaskHistory(limit);
        return NextResponse.json({
          success: true,
          data: history,
          total: history.length,
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'config':
        // 获取当前配置
        const config = intelligentTaskDispatcher.getConfig();
        return NextResponse.json({
          success: true,
          data: config,
          timestamp: new Date().toISOString(),
          requestId
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
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'cache-stats':
        // 缓存统计
        const detailedCacheStats = enhancedIntelligentDispatcher.getCacheStats();
        return NextResponse.json({
          success: true,
          data: detailedCacheStats,
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'monitoring':
        // 监控数据（以 dispatcher 历史为主，避免不同运行实例导致的内存隔离偏差）
        const dashboardData = dispatcherMonitoringService.getDashboardData();
        const statsFromHistory = intelligentTaskDispatcher.getDispatchStats();
        return NextResponse.json({
          success: true,
          data: {
            ...dashboardData,
            performance: {
              ...dashboardData.performance,
              totalTasks: statsFromHistory.totalTasks,
              successfulTasks: statsFromHistory.successfulTasks,
              errorRate: 1 - (statsFromHistory.successRate || 0),
              avgResponseTime: statsFromHistory.averageExecutionTime || 0,
              cacheHitRate: statsFromHistory.cacheRate || 0,
              systemDistribution: Object.fromEntries(
                Object.entries(statsFromHistory.systemStats || {}).map(([k, v]) => [k, (v as any).total || 0])
              ),
              taskTypeDistribution: Object.fromEntries(
                Object.entries(statsFromHistory.taskTypeStats || {}).map(([k, v]) => [k, (v as any).total || 0])
              ),
            },
          },
          timestamp: new Date().toISOString(),
          requestId
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
          timestamp: new Date().toISOString(),
          requestId
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          timestamp: new Date().toISOString(),
          requestId
        }, { status: 400 });
    }
  } catch (error) {
    logApiError('api/v2/dispatcher', requestId, error);
    logger.error('Intelligent dispatch API error', error, { module: 'api/v2/dispatcher', requestId });
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      requestId
    }, { status: 500 });
  }
}

// POST: 分发任务和管理
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
        requestId
      }, { status: 400 });
    }
    
    switch (action) {
      case 'dispatch':
        // Dispatch task
        const query = typeof body.query === 'string' ? body.query : '';
        const system = body.system;
        const priority = body.priority;
        const context = body.context;
        const userId = body.userId;
        const sessionId = body.sessionId;
        const metadata = body.metadata;
        const useCache = body.useCache !== false;
        
        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'Missing query parameter',
            timestamp: new Date().toISOString(),
            requestId
          }, { status: 400 });
        }
        
        const dispatchRequest: UnifiedRequest = {
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
            error: 'Missing config parameter',
            timestamp: new Date().toISOString(),
            requestId
          }, { status: 400 });
        }
        
        intelligentTaskDispatcher.updateConfig(config);
        return NextResponse.json({
          success: true,
          data: intelligentTaskDispatcher.getConfig(),
          message: 'Configuration updated',
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'clear-history':
        // 清空历史记录
        intelligentTaskDispatcher.clearHistory();
        return NextResponse.json({
          success: true,
          message: 'History cleared',
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'clear-cache':
        // 清空缓存
        enhancedIntelligentDispatcher.clearCache();
        return NextResponse.json({
          success: true,
          message: 'Cache cleared',
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'resolve-alert':
        // 解决警报
        const alertId = typeof body.alertId === 'string' ? body.alertId : '';
        if (!alertId) {
          return NextResponse.json({
            success: false,
            error: 'Missing alertId parameter',
            timestamp: new Date().toISOString(),
            requestId
          }, { status: 400 });
        }
        
        const resolved = dispatcherMonitoringService.resolveAlert(alertId);
        return NextResponse.json({
          success: resolved,
          message: resolved ? 'Alert resolved' : 'Alert not found or already resolved',
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'clear-monitoring':
        // 清空监控数据
        dispatcherMonitoringService.clearAll();
        return NextResponse.json({
          success: true,
          message: 'Monitoring data cleared',
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'compare':
        // 比较智能分发和基础分发的性能
        const compareQuery = typeof body.compareQuery === 'string' ? body.compareQuery : '';
        if (!compareQuery) {
          return NextResponse.json({
            success: false,
            error: 'Missing compareQuery parameter',
            timestamp: new Date().toISOString(),
            requestId
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
              systemMatch: intelligentResult.data.source === 'auto' ? 'Auto-selected' : 'Specified system'
            }
          },
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'batch-dispatch':
        // 批量分发
        const { queries } = body;
        
        if (!Array.isArray(queries) || queries.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Missing valid queries array',
            timestamp: new Date().toISOString(),
            requestId
          }, { status: 400 });
        }
        
        // Limit batch size
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
                error: error instanceof Error ? error.message : 'Unknown error',
                query: q
              };
            }
          })
        );
        
        // 计算批量统计
        const successful = batchResults.filter(r => r.success).length;
        const failed = batchResults.filter(r => !r.success).length;
        const responseTimes = batchResults.filter(r => r.success).map(r => (r as { data?: { responseTime?: number } }).data?.responseTime ?? 0);
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
          timestamp: new Date().toISOString(),
          requestId
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          timestamp: new Date().toISOString(),
          requestId
        }, { status: 400 });
    }
  } catch (error) {
    logApiError('api/v2/dispatcher', requestId, error);
    logger.error('Intelligent dispatch API error', error, { module: 'api/v2/dispatcher', requestId });
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      requestId
    }, { status: 500 });
  }
}
