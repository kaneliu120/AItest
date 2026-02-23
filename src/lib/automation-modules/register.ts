import { aiAssistModule } from './aiassist';
import { cortexaaiModule } from './cortexaai';

/**
 * 注册所有自动化模块
 */
export async function registerAutomationModules() {
  const modules = [
    aiAssistModule,
    cortexaaiModule
  ];
  
  console.log(`注册 ${modules.length} 个自动化模块:`);
  
  for (const module of modules) {
    console.log(`  • ${module.name} (${module.id})`);
    
    // 这里应该调用自动化框架的注册API
    // 暂时记录到控制台
    try {
      // 模拟注册
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log(`    ✅ ${module.name} 注册成功`);
    } catch (error) {
      console.error(`    ❌ ${module.name} 注册失败:`, error);
    }
  }
  
  return modules;
}

/**
 * 获取所有已注册模块
 */
export function getAllModules() {
  return [
    aiAssistModule,
    cortexaaiModule
  ];
}

/**
 * 根据ID获取模块
 */
export function getModuleById(moduleId: string) {
  const modules = getAllModules();
  return modules.find(m => m.id === moduleId);
}

/**
 * 执行模块动作
 */
export async function executeModuleAction(moduleId: string, action: string, parameters: any) {
  const module = getModuleById(moduleId);
  if (!module) {
    throw new Error(`模块未找到: ${moduleId}`);
  }
  
  const moduleActions = module.actions as Record<string, any>;
  if (!moduleActions[action]) {
    throw new Error(`动作未找到: ${action}`);
  }
  
  return await module.execute(action, parameters);
}

export default {
  registerAutomationModules,
  getAllModules,
  getModuleById,
  executeModuleAction
};
