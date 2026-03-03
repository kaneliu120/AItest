import { NextRequest, NextResponse } from 'next/server';
import { AutomationService } from '@/lib/automation-framework/services/AutomationService';
import { logger } from '@/lib/logger';
import { makeRequestId, logApiStart, logApiEnd, logApiError } from '@/lib/observability';

// Create singleton service instance
// Note: In dev mode each file edit may re-create the instance
type GlobalWithAutomationService = typeof globalThis & { __automationService?: AutomationService };
const g = globalThis as GlobalWithAutomationService;

let automationService: AutomationService;
if (!g.__automationService) {
  g.__automationService = new AutomationService();
}
automationService = g.__automationService;

// Ensure module is initialized
async function ensureInitialized() {
  const modules = automationService.getAllModules();
  if (modules.length === 0) {
    logger.info('Initializing automation module', { module: 'api/automation/modules' });
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
            error: 'Missing moduleId parameter'
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
          error: 'Unknown action parameter'
        }, { status: 400 });
    }
  } catch (error: unknown) {
    logApiError('api/automation/modules', requestId, error, { method: 'GET' });
    logger.error('Module management API error', error, { module: 'api/automation/modules', method: 'GET', requestId });
    return NextResponse.json({
      success: false,
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
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
            error: 'Missing moduleId or moduleAction parameter'
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
            error: 'Missing moduleId parameter'
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
          error: 'Unknown action parameter'
        }, { status: 400 });
    }
  } catch (error: unknown) {
    logApiError('api/automation/modules', requestId, error, { method: 'POST' });
    logger.error('Module management API error', error, { module: 'api/automation/modules', method: 'POST', requestId });
    return NextResponse.json({
      success: false,
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
