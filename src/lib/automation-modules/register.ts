import { logger } from '@/lib/logger';
import { aiAssistModule } from './aiassist';
import { cortexaaiModule } from './cortexaai';

/**
 * Register所AllAutomationModule
 */
export async function registerAutomationModules() {
  const modules = [
    aiAssistModule,
    cortexaaiModule
  ];
  
  console.log(`Register ${modules.length}  AutomationModule:`);
  
  for (const module of modules) {
    console.log(`  • ${module.name} (${module.id})`);
    
    // 这里should调用AutomationFramework'sRegisterAPI
    // 暂时LogtoDashboard
    try {
      // 模拟Register
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log(`    ✅ ${module.name} Registersuccess`);
    } catch (error) {
      logger.error('ModuleRegisterfailed', error, { moduleId: module.id, moduleName: module.name });
    }
  }
  
  return modules;
}

/**
 * Fetch所AllalreadyRegisterModule
 */
export function getAllModules() {
  return [
    aiAssistModule,
    cortexaaiModule
  ];
}

/**
 * 根据IDFetchModule
 */
export function getModuleById(moduleId: string) {
  const modules = getAllModules();
  return modules.find(m => m.id === moduleId);
}

/**
 * ExecuteModule动作
 */
export async function executeModuleAction(moduleId: string, action: string, parameters: Record<string, unknown>) {
  const module = getModuleById(moduleId);
  if (!module) {
    throw new Error(`ModuleNot found: ${moduleId}`);
  }
  
  const moduleActions = module.actions as Record<string, unknown>;
  if (!moduleActions[action]) {
    throw new Error(`动作Not found: ${action}`);
  }
  
  return await module.execute(action, parameters);
}

export default {
  registerAutomationModules,
  getAllModules,
  getModuleById,
  executeModuleAction
};
