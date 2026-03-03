import { NextRequest, NextResponse } from 'next/server';
import { intelligentTaskDispatcher } from '@/lib/intelligent-task-dispatcher';
import { enhancedIntelligentDispatcher } from '@/lib/intelligent-task-dispatcher-fix';
import { dispatcherMonitoringservervice } from '@/lib/dispatcher-monitoring-service';
import { unifiedGatewayservervice, UnifiedRequest } from '@/lib/unified-gateway-service';
import { logger } from '@/lib/logger';
import { makeRequestId, logApiStart, logApiEnd, logApiError } from '@/lib/observability';

// GenerateRequestID
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

// GET: FetchDispatchStatistics和Status
export async function GET(request: NextRequest) {
  const requestId = makeRequestId('api');
  logApiStart(request.nextUrl.pathname, requestId, { method: 'GET' });
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'stats';
    
    switch (action) {
      case 'stats':
        // FetchDispatchStatistics
        const stats = intelligentTaskDispatcher.getDispatchStats();
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'performance':
        // FetchSystemPerformanceReport
        const performance = intelligentTaskDispatcher.getSystemPerformanceReport();
        return NextResponse.json({
          success: true,
          data: performance,
          total: performance.length,
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'history':
        // FetchTask历史
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
        // FetchCurrentConfiguration
        const config = intelligentTaskDispatcher.getConfig();
        return NextResponse.json({
          success: true,
          data: config,
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'health':
        // HealthCheck
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
        // CacheStatistics
        const detailedCacheStats = enhancedIntelligentDispatcher.getCacheStats();
        return NextResponse.json({
          success: true,
          data: detailedCacheStats,
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'monitoring':
        // Monitoringdata(以 dispatcher 历史for主, 避免不同运行实例导致's内存隔离偏差)
        const dashboardData = dispatcherMonitoringservervice.getDashboardData();
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
        // Alertdata
        const alertType = searchParams.get('type') || 'active';
        let alerts;
        if (alertType === 'active') {
          alerts = dispatcherMonitoringservervice.getActiveAlerts();
        } else {
          const limit = parseInt(searchParams.get('limit') || '50');
          alerts = dispatcherMonitoringservervice.getAllAlerts(limit);
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
          error: `Unknown operation: ${action}`,
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

// POST: DispatchTask和管理
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
        // DispatchTask
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
          // using带Cache's增强Dispatch器
          response = await enhancedIntelligentDispatcher.dispatchTaskWithCache(dispatchRequest);
        } else {
          // using原始Dispatch器
          response = await intelligentTaskDispatcher.dispatchTask(dispatchRequest);
        }
        
        return NextResponse.json({
          success: true,
          data: response,
          requestId: dispatchRequest.id,
          timestamp: new Date().toISOString()
        });
        
      case 'update-config':
        // UpdateConfiguration
        const { config } = body;
        if (!config) {
          return NextResponse.json({
            success: false,
            error: 'Missing  config Parameters',
            timestamp: new Date().toISOString(),
            requestId
          }, { status: 400 });
        }
        
        intelligentTaskDispatcher.updateConfig(config);
        return NextResponse.json({
          success: true,
          data: intelligentTaskDispatcher.getConfig(),
          message: 'ConfigurationUpdated successfully',
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'clear-history':
        // Clear历史Log
        intelligentTaskDispatcher.clearHistory();
        return NextResponse.json({
          success: true,
          message: 'History log cleared',
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'clear-cache':
        // ClearCache
        enhancedIntelligentDispatcher.clearCache();
        return NextResponse.json({
          success: true,
          message: 'Cache cleared',
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'resolve-alert':
        // 解决Alert
        const alertId = typeof body.alertId === 'string' ? body.alertId : '';
        if (!alertId) {
          return NextResponse.json({
            success: false,
            error: 'Missing alertId parameter',
            timestamp: new Date().toISOString(),
            requestId
          }, { status: 400 });
        }
        
        const resolved = dispatcherMonitoringservervice.resolveAlert(alertId);
        return NextResponse.json({
          success: resolved,
          message: resolved ? 'Alert resolved' : 'Alert not found or already resolved',
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'clear-monitoring':
        // ClearMonitoringdata
        dispatcherMonitoringservervice.clearAll();
        return NextResponse.json({
          success: true,
          message: 'MonitoringdataalreadyClear',
          timestamp: new Date().toISOString(),
          requestId
        });
        
      case 'compare':
        // 比较智canDispatch和basicDispatch'sPerformance
        const compareQuery = typeof body.compareQuery === 'string' ? body.compareQuery : '';
        if (!compareQuery) {
          return NextResponse.json({
            success: false,
            error: 'Missing  compareQuery Parameters',
            timestamp: new Date().toISOString(),
            requestId
          }, { status: 400 });
        }
        
        // Create相同'sRequest
        const compareRequest: UnifiedRequest = {
          id: generateRequestId(),
          query: compareQuery,
          priority: 'medium',
          context: {},
          metadata: { source: 'compare-test' }
        };
        
        // and行Execute两种Dispatch方式
        const [intelligentResult, basicResult] = await Promise.all([
          intelligentTaskDispatcher.dispatchTask(compareRequest),
          unifiedGatewayservervice.processRequest(compareRequest)
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
        // batchDispatch
        const { queries } = body;
        
        if (!Array.isArray(queries) || queries.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Missing valid queries array',
            timestamp: new Date().toISOString(),
            requestId
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
        
        // 计算batchStatistics
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
          error: `Unknown operation: ${action}`,
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
