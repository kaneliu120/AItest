import { NextRequest, NextResponse } from 'next/server';
import { AutomationService } from '@/lib/automation-framework/services/AutomationService';

// 创建单例服务实例
// 注意：在开发环境下，每次文件修改可能会重新创建实例
let automationService: AutomationService;

if (!(global as any).automationService) {
  (global as any).automationService = new AutomationService();
}
automationService = (global as any).automationService;

// 确保模块已初始化
async function ensureInitialized() {
  const modules = automationService.getAllModules();
  if (modules.length === 0) {
    console.log('API: 初始化自动化模块...');
    await automationService.initializeModules();
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureInitialized();
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    switch (action) {
      case 'list':
        const modules = automationService.getAllModules();
        return NextResponse.json({
          success: true,
          data: {
            modules: modules.map(module => ({
              id: module.id,
              name: module.name,
              version: module.version,
              description: module.description,
              enabled: module.enabled,
              category: module.category,
              dependencies: module.dependencies,
              actions: Object.keys(module.actions || {}).map(actionName => ({
                name: actionName,
                ...module.actions[actionName]
              }))
            }))
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
          data: health
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: '未知的 action 参数'
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('模块管理API错误:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
        
        return NextResponse.json(result);
        
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
          data: {
            moduleId,
            enabled: rest.enabled !== false
          }
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: '未知的 action 参数'
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('模块管理API错误:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
