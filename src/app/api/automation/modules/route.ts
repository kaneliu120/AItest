import { NextRequest, NextResponse } from 'next/server';
import { AutomationService } from '@/lib/automation-framework/services/AutomationService';
import { logger } from '@/lib/logger';
import { makeRequestId, logApiStart, logApiEnd, logApiError } from '@/lib/observability';

// 创建单例服务实例
// 注意：在开发环境下，每次文件修改可能会重新创建实例
type GlobalWithAutomationService = typeof globalThis & { __automationService?: AutomationService };
const g = globalThis as GlobalWithAutomationService;

let automationService: AutomationService;
if (!g.__automationService) {
  g.__automationService = new AutomationService();
}
automationService = g.__automationService;

// 确保模块已初始化
async function ensureInitialized() {
  const modules = automationService.getAllModules();
  if (modules.length === 0) {
    logger.info('初始化自动化模块', { module: 'api/automation/modules' });
    await automationService.initializeModules();
  }
}

export async function GET(request: NextRequest) {
  const requestId = makeRequestId('api');
  logApiStart(request.nextUrl.pathname, requestId, { method: 'GET' });
  try {
    await ensureInitialized();
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    switch (action) {
      case 'list':
        const modules = automationService.getAllModules();
        return NextResponse.json({
          success: true,
          requestId,
          data: {
            modules: modules.map(module => {
              const m = module as Record<string, any>;
              const actions = (m.actions || {}) as Record<string, any>;
              return {
                id: m.id,
                name: m.name,
                version: m.version,
                description: m.description,
                enabled: m.enabled,
                category: m.category,
                dependencies: m.dependencies,
                actions: Object.keys(actions).map(actionName => ({
                  name: actionName,
                  ...actions[actionName]
                }))
              };
            })
          }
        });
        
      case 'health':
        const moduleId = searchParams.get('moduleId');
        if (!moduleId) {
          return NextResponse.json({
            success: false,
            error: '缺少 moduleId 参数'
          }, { status: 400 });
        }
        
        const health = await automationService.checkModuleHealth(moduleId);
        return NextResponse.json({
          success: true,
          requestId,
          data: health
        });
        
      default:
        return NextResponse.json({
          success: false,
          requestId,
          error: '未知的 action 参数'
        }, { status: 400 });
    }
  } catch (error: unknown) {
    logApiError('api/automation/modules', requestId, error, { method: 'GET' });
    logger.error('模块管理API错误', error, { module: 'api/automation/modules', method: 'GET', requestId });
    return NextResponse.json({
      success: false,
      requestId,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const requestId = makeRequestId('api');
  logApiStart(request.nextUrl.pathname, requestId, { method: 'POST' });
  try {
    await ensureInitialized();
    
    const body = await request.json();
    const { action, moduleId, moduleAction, parameters, ...rest } = body;
    
    switch (action) {
      case 'execute':
        // 检查参数: moduleId 和 moduleAction (模块的具体动作)
        if (!moduleId || !moduleAction) {
          return NextResponse.json({
            success: false,
            error: '缺少 moduleId 或 moduleAction 参数'
          }, { status: 400 });
        }
        
        const result = await automationService.executeModuleAction(
          moduleId,
          moduleAction,
          parameters || {}
        );
        
        const resultPayload = (result && typeof result === 'object')
          ? (result as Record<string, unknown>)
          : { success: true, data: result };
        return NextResponse.json({ ...resultPayload, requestId });
        
      case 'toggle':
        if (!moduleId) {
          return NextResponse.json({
            success: false,
            error: '缺少 moduleId 参数'
          }, { status: 400 });
        }
        
        // 这里应该实现模块启用/禁用逻辑
        // 暂时只返回模拟成功
        return NextResponse.json({
          success: true,
          requestId,
          data: {
            moduleId,
            enabled: rest.enabled !== false
          }
        });
        
      default:
        return NextResponse.json({
          success: false,
          requestId,
          error: '未知的 action 参数'
        }, { status: 400 });
    }
  } catch (error: unknown) {
    logApiError('api/automation/modules', requestId, error, { method: 'POST' });
    logger.error('模块管理API错误', error, { module: 'api/automation/modules', method: 'POST', requestId });
    return NextResponse.json({
      success: false,
      requestId,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
