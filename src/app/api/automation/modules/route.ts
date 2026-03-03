import { NextRequest, NextResponse } from 'next/server';
import { Automationservervice } from '@/lib/automation-framework/services/Automationservervice';
import { logger } from '@/lib/logger';
import { makeRequestId, logApiStart, logApiEnd, logApiError } from '@/lib/observability';

// Create单例servervice实例
// 注意: indev environment下, 每 timesfilemodify可canwillre-Create实例
type GlobalWithAutomationservervice = typeof globalThis & { __automationservervice?: Automationservervice };
const g = globalThis as GlobalWithAutomationservervice;

let automationservervice: Automationservervice;
if (!g.__automationservervice) {
  g.__automationservervice = new Automationservervice();
}
automationservervice = g.__automationservervice;

// 确保ModulealreadyInitialize
async function ensureInitialized() {
  const modules = automationservervice.getAllModules();
  if (modules.length === 0) {
    logger.info('InitializeAutomationModule', { module: 'api/automation/modules' });
    await automationservervice.initializeModules();
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
        const modules = automationservervice.getAllModules();
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
            error: 'Missing  moduleId Parameters'
          }, { status: 400 });
        }
        
        const health = await automationservervice.checkModuleHealth(moduleId);
        return NextResponse.json({
          success: true,
          requestId,
          data: health
        });
        
      default:
        return NextResponse.json({
          success: false,
          requestId,
          error: 'Unknown's action Parameters'
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
        // CheckParameters: moduleId 和 moduleAction (Module's具体动作)
        if (!moduleId || !moduleAction) {
          return NextResponse.json({
            success: false,
            error: 'Missing  moduleId or moduleAction Parameters'
          }, { status: 400 });
        }
        
        const result = await automationservervice.executeModuleAction(
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
            error: 'Missing  moduleId Parameters'
          }, { status: 400 });
        }
        
        // 这里should实现Moduleenabled/disabled逻辑
        // 暂时只返回模拟success
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
          error: 'Unknown's action Parameters'
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
