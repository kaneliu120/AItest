// 自动化模块管理器 - 核心组件
import fs from 'fs';
import path from 'path';

export interface AutomationModule {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  category: 'testing' | 'deployment' | 'monitoring' | 'security' | 'business' | 'integration';
  dependencies: string[];
  configSchema?: Record<string, any>;
  metadata: {
    installedAt: string;
    updatedAt: string;
    lastRun?: string;
    runCount: number;
    successRate: number;
  };
}

export interface ModuleConfig {
  moduleId: string;
  config: Record<string, any>;
  schedule?: {
    cron: string;
    enabled: boolean;
    lastRun?: string;
    nextRun?: string;
  };
  triggers?: Array<{
    type: 'event' | 'time' | 'condition';
    condition: string;
    actions: string[];
  }>;
}

export class ModuleManager {
  private modulesDir: string;
  private configDir: string;
  
  constructor(baseDir: string = path.join(process.cwd(), 'data', 'automation')) {
    this.modulesDir = path.join(baseDir, 'modules');
    this.configDir = path.join(baseDir, 'config');
    
    // 确保目录存在
    if (!fs.existsSync(this.modulesDir)) {
      fs.mkdirSync(this.modulesDir, { recursive: true });
    }
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }
  
  // 注册新模块
  async registerModule(module: Omit<AutomationModule, 'metadata'>): Promise<AutomationModule> {
    const fullModule: AutomationModule = {
      ...module,
      metadata: {
        installedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        runCount: 0,
        successRate: 100
      }
    };
    
    const moduleFile = path.join(this.modulesDir, `${module.id}.json`);
    fs.writeFileSync(moduleFile, JSON.stringify(fullModule, null, 2));
    
    return fullModule;
  }
  
  // 获取所有模块
  getAllModules(): AutomationModule[] {
    const modules: AutomationModule[] = [];
    
    if (!fs.existsSync(this.modulesDir)) {
      return modules;
    }
    
    const files = fs.readdirSync(this.modulesDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(this.modulesDir, file), 'utf-8');
        const module = JSON.parse(content);
        modules.push(module);
      } catch (error) {
        console.error(`Error reading module ${file}:`, error);
      }
    }
    
    return modules;
  }
  
  // 获取模块配置
  getModuleConfig(moduleId: string): ModuleConfig | null {
    const configFile = path.join(this.configDir, `${moduleId}.json`);
    
    if (!fs.existsSync(configFile)) {
      return null;
    }
    
    try {
      const content = fs.readFileSync(configFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error reading config for ${moduleId}:`, error);
      return null;
    }
  }
  
  // 保存模块配置
  saveModuleConfig(config: ModuleConfig): void {
    const configFile = path.join(this.configDir, `${config.moduleId}.json`);
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
  }
  
  // 启用/禁用模块
  toggleModule(moduleId: string, enabled: boolean): boolean {
    const moduleFile = path.join(this.modulesDir, `${moduleId}.json`);
    
    if (!fs.existsSync(moduleFile)) {
      return false;
    }
    
    try {
      const content = fs.readFileSync(moduleFile, 'utf-8');
      const module = JSON.parse(content);
      module.enabled = enabled;
      module.metadata.updatedAt = new Date().toISOString();
      
      fs.writeFileSync(moduleFile, JSON.stringify(module, null, 2));
      return true;
    } catch (error) {
      console.error(`Error toggling module ${moduleId}:`, error);
      return false;
    }
  }
  
  // 更新模块运行统计
  updateModuleStats(moduleId: string, success: boolean): boolean {
    const moduleFile = path.join(this.modulesDir, `${moduleId}.json`);
    
    if (!fs.existsSync(moduleFile)) {
      return false;
    }
    
    try {
      const content = fs.readFileSync(moduleFile, 'utf-8');
      const module = JSON.parse(content);
      
      module.metadata.lastRun = new Date().toISOString();
      module.metadata.runCount += 1;
      
      // 计算成功率
      if (module.metadata.runCount > 0) {
        const successCount = Math.floor(module.metadata.successRate * module.metadata.runCount / 100);
        const newSuccessCount = success ? successCount + 1 : successCount;
        module.metadata.successRate = Math.round((newSuccessCount / module.metadata.runCount) * 100);
      }
      
      fs.writeFileSync(moduleFile, JSON.stringify(module, null, 2));
      return true;
    } catch (error) {
      console.error(`Error updating stats for ${moduleId}:`, error);
      return false;
    }
  }
  
  // 检查模块依赖
  checkDependencies(moduleId: string): {
    satisfied: boolean;
    missing: string[];
    outdated: string[];
  } {
    const module = this.getAllModules().find(m => m.id === moduleId);
    
    if (!module) {
      return {
        satisfied: false,
        missing: [],
        outdated: []
      };
    }
    
    const allModules = this.getAllModules();
    const missing: string[] = [];
    const outdated: string[] = [];
    
    for (const dep of module.dependencies) {
      const depModule = allModules.find(m => m.id === dep);
      
      if (!depModule) {
        missing.push(dep);
      } else if (!depModule.enabled) {
        outdated.push(`${dep} (disabled)`);
      }
    }
    
    return {
      satisfied: missing.length === 0 && outdated.length === 0,
      missing,
      outdated
    };
  }
  
  // 获取模块健康状态
  getModuleHealth(moduleId: string): {
    status: 'healthy' | 'warning' | 'error' | 'unknown';
    issues: string[];
    lastRun: string | null;
    successRate: number;
  } {
    const module = this.getAllModules().find(m => m.id === moduleId);
    
    if (!module) {
      return {
        status: 'unknown',
        issues: ['Module not found'],
        lastRun: null,
        successRate: 0
      };
    }
    
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'error' | 'unknown' = 'healthy';
    
    // 检查依赖
    const deps = this.checkDependencies(moduleId);
    if (!deps.satisfied) {
      if (deps.missing.length > 0) {
        issues.push(`Missing dependencies: ${deps.missing.join(', ')}`);
        status = 'error';
      }
      if (deps.outdated.length > 0) {
        issues.push(`Outdated dependencies: ${deps.outdated.join(', ')}`);
        status = status === 'error' ? 'error' : 'warning';
      }
    }
    
    // 检查运行状态
    if (module.metadata.runCount > 0 && module.metadata.successRate < 80) {
      issues.push(`Low success rate: ${module.metadata.successRate}%`);
      status = status === 'error' ? 'error' : 'warning';
    }
    
    // 检查最近运行时间
    if (module.metadata.lastRun) {
      const lastRun = new Date(module.metadata.lastRun);
      const now = new Date();
      const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastRun > 24 && module.metadata.runCount > 0) {
        issues.push(`No recent runs (last run: ${Math.round(hoursSinceLastRun)} hours ago)`);
        status = status === 'error' ? 'error' : 'warning';
      }
    }
    
    return {
      status,
      issues,
      lastRun: module.metadata.lastRun || null,
      successRate: module.metadata.successRate
    };
  }
  
  // 导出模块数据
  exportModuleData(moduleId: string): string {
    const module = this.getAllModules().find(m => m.id === moduleId);
    const config = this.getModuleConfig(moduleId);
    
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }
    
    const exportData = {
      module,
      config,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  // 导入模块数据
  async importModuleData(data: string): Promise<{
    success: boolean;
    moduleId?: string;
    errors?: string[];
  }> {
    try {
      const importData = JSON.parse(data);
      
      if (!importData.module || !importData.module.id) {
        return {
          success: false,
          errors: ['Invalid module data format']
        };
      }
      
      // 注册模块
      const module = await this.registerModule(importData.module);
      
      // 保存配置
      if (importData.config) {
        this.saveModuleConfig(importData.config);
      }
      
      return {
        success: true,
        moduleId: module.id
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}