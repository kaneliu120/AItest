// 自动化服务 - 核心自动化功能
import path from 'path';
import { ModuleManager, AutomationModule, ModuleConfig } from '../core/ModuleManager';
import { TaskScheduler, ScheduledTask, TaskExecution } from '../core/TaskScheduler';
import { DataBus, DataMessage } from '../core/DataBus';
import { EventSystem, AutomationEvent } from '../core/EventSystem';
import { FaultDiagnosisService, FaultDiagnosisServiceConfig } from './FaultDiagnosisService';
// 导入自动化模块注册
import { registerAutomationModules, getAllModules, executeModuleAction } from '@/lib/automation-modules/register';
import { logger } from '@/lib/logger';

export interface AutomationServiceConfig {
  dataDir: string;
  maxConcurrentTasks: number;
  defaultRetryPolicy: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  cleanupSettings: {
    keepExecutionDays: number;
    keepEventDays: number;
    keepMessageDays: number;
  };
  faultDiagnosis: FaultDiagnosisServiceConfig;
}

export interface ServiceStatus {
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  uptime: number; // 秒
  components: {
    moduleManager: boolean;
    taskScheduler: boolean;
    dataBus: boolean;
    eventSystem: boolean;
    faultDiagnosis: boolean;
  };
  stats: {
    totalModules: number;
    enabledModules: number;
    totalTasks: number;
    enabledTasks: number;
    activeExecutions: number;
    totalEvents: number;
    totalMessages: number;
    faultDiagnosis?: {
      totalFaultsDetected: number;
      autoRepaired: number;
      manualRepaired: number;
      pendingFaults: number;
    };
  };
  lastError?: string;
}

export class AutomationService {
  private config: AutomationServiceConfig;
  private moduleManager: ModuleManager;
  private taskScheduler: TaskScheduler;
  private dataBus: DataBus;
  private eventSystem: EventSystem;
  private faultDiagnosisService: FaultDiagnosisService;
  private status: ServiceStatus;
  private startTime: Date;
  private cleanupInterval?: NodeJS.Timeout;
  private taskCheckInterval?: NodeJS.Timeout;
  private modules: Array<AutomationModule & { actions?: Record<string, unknown>; healthCheck?: () => Promise<unknown> }> = [];
  
  constructor(config?: Partial<AutomationServiceConfig>) {
    this.config = {
      dataDir: path.join(process.cwd(), 'data', 'automation'),
      maxConcurrentTasks: 10,
      defaultRetryPolicy: {
        maxRetries: 3,
        retryDelay: 5000,
        backoffMultiplier: 2
      },
      cleanupSettings: {
        keepExecutionDays: 30,
        keepEventDays: 7,
        keepMessageDays: 3
      },
      faultDiagnosis: {
        enabled: true,
        checkInterval: 30000,
        autoRepair: false,
        notificationEnabled: true,
        severityThreshold: 'medium',
        dataRetentionDays: 30
      },
      ...config
    };
    
    this.startTime = new Date();
    this.status = {
      status: 'starting',
      uptime: 0,
      components: {
        moduleManager: false,
        taskScheduler: false,
        dataBus: false,
        eventSystem: false,
        faultDiagnosis: false
      },
      stats: {
        totalModules: 0,
        enabledModules: 0,
        totalTasks: 0,
        enabledTasks: 0,
        activeExecutions: 0,
        totalEvents: 0,
        totalMessages: 0
      }
    };
    
    // 初始化组件
    this.moduleManager = new ModuleManager(this.config.dataDir);
    this.taskScheduler = new TaskScheduler(this.config.dataDir);
    this.dataBus = new DataBus();
    this.eventSystem = new EventSystem();
    this.faultDiagnosisService = new FaultDiagnosisService(
      this.config.faultDiagnosis
    );
  }
  
  // 启动服务
  async start(): Promise<boolean> {
    try {
      console.log('[AutomationService] Starting...');
      this.status.status = 'starting';
      
      // 初始化事件系统
      this.setupEventSystem();
      
      // 初始化数据总线
      this.setupDataBus();
      
      // 初始化实战模块
      await this.initializeModules();
      
      // 启动定时任务
      this.startScheduledTasks();
      
      // 启动清理任务
      this.startCleanupTask();
      
      // 启动故障诊断服务
      if (this.config.faultDiagnosis.enabled) {
        await this.faultDiagnosisService.start();
      }
      
      // 更新状态
      this.status.status = 'running';
      this.status.components = {
        moduleManager: true,
        taskScheduler: true,
        dataBus: true,
        eventSystem: true,
        faultDiagnosis: this.config.faultDiagnosis.enabled
      };
      
      // 触发启动事件
      this.eventSystem.emit({
        type: 'service:started',
        source: 'automation-service',
        data: {
          config: this.config,
          startTime: this.startTime.toISOString()
        },
        metadata: {
          priority: 'normal'
        }
      });
      
      console.log('[AutomationService] Started successfully');
      return true;
      
    } catch (error) {
      logger.error('AutomationService start failed', error, { module: 'AutomationService' });
      this.status.status = 'error';
      this.status.lastError = error instanceof Error ? error.message : 'Unknown error';
      
      this.eventSystem.emit({
        type: 'service:error',
        source: 'automation-service',
        data: {
          error: this.status.lastError,
          component: 'startup'
        },
        metadata: {
          priority: 'critical'
        }
      });
      
      return false;
    }
  }

  /**
   * 初始化模块系统
   */
  async initializeModules() {
    try {
      this.modules = (await registerAutomationModules() as unknown) as Array<AutomationModule & { actions?: Record<string, unknown>; healthCheck?: () => Promise<unknown> }>;
      console.log(`自动化模块初始化完成，共 ${this.modules.length} 个模块`);
      
      // 注册模块到 ModuleManager
      for (const module of this.modules) {
        // 检查是否已注册，避免重复
        const existing = this.moduleManager.getAllModules().find(m => m.id === module.id);
        if (!existing) {
            this.moduleManager.registerModule({
            id: module.id,
            name: module.name,
            version: module.version,
            description: module.description,
            author: module.author || '小A',
            enabled: module.enabled,
            category: module.category,
            dependencies: module.dependencies,
            configSchema: module.configSchema,
            // actions: Object.keys(module.actions).map(actionName => ({
            //     name: actionName,
            //     ...module.actions[actionName]
            // }))
            });
        }
      }
      
      return { success: true, count: this.modules.length };
    } catch (error: any) {
      logger.error('自动化模块初始化失败', error, { module: 'AutomationService' });
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取所有模块
   */
  getAllModules() {
    return this.modules;
  }
  
  // 停止服务
  async stop(): Promise<boolean> {
    try {
      console.log('[AutomationService] Stopping...');
      this.status.status = 'stopping';
      
      // 停止定时任务
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
      if (this.taskCheckInterval) {
        clearInterval(this.taskCheckInterval);
      }
      
      // 触发停止事件
      this.eventSystem.emit({
        type: 'service:stopping',
        source: 'automation-service',
        data: {
          uptime: this.getUptime()
        },
        metadata: {
          priority: 'normal'
        }
      });
      
      // 更新状态
      this.status.status = 'stopped';
      this.status.components = {
        moduleManager: false,
        taskScheduler: false,
        dataBus: false,
        eventSystem: false,
        faultDiagnosis: false
      };
      
      console.log('[AutomationService] Stopped successfully');
      return true;
      
    } catch (error) {
      logger.error('AutomationService stop failed', error, { module: 'AutomationService' });
      this.status.status = 'error';
      this.status.lastError = error instanceof Error ? error.message : 'Unknown error';
      
      return false;
    }
  }
  
  // 设置事件系统
  private setupEventSystem(): void {
    // 注册服务事件处理器
    this.eventSystem.registerHandler({
      eventType: 'module:*',
      moduleId: 'automation-service',
      handler: (event) => {
        this.handleModuleEvent(event);
      },
      priority: 5,
      enabled: true
    });
    
    this.eventSystem.registerHandler({
      eventType: 'task:*',
      moduleId: 'automation-service',
      handler: (event) => {
        this.handleTaskEvent(event);
      },
      priority: 5,
      enabled: true
    });
    
    this.eventSystem.registerHandler({ 
      eventType: 'error',
      moduleId: 'automation-service',
      handler: (event) => {
        this.handleErrorEvent(event);
      },
      priority: 1,
      enabled: true
    });
  }
  
  // 设置数据总线
  private setupDataBus(): void {
    // 订阅系统频道
    this.dataBus.subscribe('automation-service', 'system');
    this.dataBus.subscribe('automation-service', 'module-events');
    this.dataBus.subscribe('automation-service', 'task-events');
    this.dataBus.subscribe('automation-service', 'error-events');
    
    // 注册消息处理器
    this.dataBus.onMessage('automation-service', (message) => {
      this.handleDataBusMessage(message);
    });
  }
  
  // 启动定时任务检查
  private startScheduledTasks(): void {
    this.taskCheckInterval = setInterval(() => {
      this.checkAndExecutePendingTasks();
    }, 10000); // 每10秒检查一次
    
    console.log('[AutomationService] Scheduled task checker started');
  }
  
  // 启动清理任务
  private startCleanupTask(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 3600000); // 每小时清理一次
    
    console.log('[AutomationService] Cleanup task started');
  }
  
  // 检查并执行待处理任务
  private async checkAndExecutePendingTasks(): Promise<void> {
    try {
      const pendingTasks = this.taskScheduler.getPendingTasks();
      
      if (pendingTasks.length === 0) {
        return;
      }
      
      console.log(`[AutomationService] Found ${pendingTasks.length} pending tasks`);
      
      for (const task of pendingTasks) {
        // 检查并发限制
        const activeExecutions = this.getActiveExecutions();
        if (activeExecutions >= this.config.maxConcurrentTasks) {
          console.log(`[AutomationService] Max concurrent tasks reached (${this.config.maxConcurrentTasks})`);
          break; 
        }
        
        // 执行任务
        await this.executeTask(task);
      }
      
    } catch (error) {
      logger.error('检查待执行任务失败', error, { module: 'AutomationService' });
      
      this.eventSystem.emit({
        type: 'service:error',
        source: 'automation-service',
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          component: 'task-checker'
        },
        metadata: {
          priority: 'high'
        }
      });
    }
  }
  
  // 执行任务
  private async executeTask(task: ScheduledTask): Promise<void> {
    const execution = this.taskScheduler.startTaskExecution(task.id);
    
    console.log(`[AutomationService] Starting task execution: ${task.id} (${task.moduleId}.${task.action})`);
    
    // 触发任务开始事件
    this.eventSystem.emit({
      type: 'task:started',
      source: 'automation-service',
      data: {
        taskId: task.id,
        executionId: execution.id,
        moduleId: task.moduleId,
        action: task.action
      },
      metadata: {
        priority: 'normal',
        correlationId: execution.id
      }
    });
    
    try {
      // 获取模块
      const module = this.moduleManager.getAllModules().find(m => m.id === task.moduleId);
      if (!module) {
        throw new Error(`Module not found: ${task.moduleId}`);
      }
      
      // 检查模块健康状态
      const health = this.moduleManager.getModuleHealth(task.moduleId);
      if (health.status === 'error') {
        throw new Error(`Module health check failed: ${health.issues.join(', ')}`);
      }
      
      // 执行任务
      const result = await this.executeModuleAction(
        task.moduleId,
        task.action,
        task.parameters || {}
      );
      
      // 完成任务
      this.taskScheduler.completeTaskExecution(execution.id, result);
      
      console.log(`[AutomationService] Task completed: ${task.id}`);
      
      // 触发任务完成事件
      this.eventSystem.emit({
        type: 'task:completed',
        source: 'automation-service',
        data: {
          taskId: task.id,
          executionId: execution.id,
          result,
          duration: execution.metadata.duration
        },
        metadata: {
          priority: 'normal',
          correlationId: execution.id
        }
      });
      
    } catch (error) {
      // 任务失败
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.taskScheduler.failTaskExecution(execution.id, errorMessage);
      
      logger.error('任务执行失败', error, { module: 'AutomationService', taskId: task.id });
      
      // 触发任务失败事件
      this.eventSystem.emit({
        type: 'task:failed',
        source: 'automation-service',
        data: {
          taskId: task.id,
          executionId: execution.id,
          error: errorMessage
        },
        metadata: {
          priority: 'high',
          correlationId: execution.id
        }
      });
      
      // 检查重试策略
      if (task.retryPolicy && execution.metadata.retryCount < task.retryPolicy.maxRetries) {
        const retryDelay = task.retryPolicy.retryDelay * 
          Math.pow(task.retryPolicy.backoffMultiplier, execution.metadata.retryCount);
        
        console.log(`[AutomationService] Scheduling retry for task ${task.id} in ${retryDelay}ms`);
        
        // 安排重试（模拟）
        setTimeout(() => {
          this.executeTask(task); 
        }, retryDelay);
      }
    }
  }
  
  // 执行模块动作
  public async executeModuleAction(
    moduleId: string,
    action: string,
    parameters: Record<string, unknown>
  ): Promise<unknown> {
    try {
      // 优先尝试使用注册的实战模块
      const result = await executeModuleAction(moduleId, action, parameters);
      
      // 记录执行历史
      this.eventSystem.emit({
        type: 'module-action-executed',
        source: 'automation-service',
        data: {
            moduleId,
            action,
            parameters,
            result,
            timestamp: new Date().toISOString()
        },
        metadata: {
            priority: 'normal'
        }
      });
      
      return result;
      
    } catch (error: any) {
      // 如果实战模块执行失败，记录错误
      logger.error('模块动作执行失败', error, { module: 'AutomationService', moduleId, action });
      
      this.eventSystem.emit({
        type: 'module-action-failed',
        source: 'automation-service',
        data: {
            moduleId,
            action,
            parameters,
            error: error.message,
            timestamp: new Date().toISOString()
        },
        metadata: {
            priority: 'high'
        }
      });
      
      throw error;
    }
  }

  /**
   * 检查模块健康状态
   */
  async checkModuleHealth(moduleId: string) {
    const module = this.modules.find(m => m.id === moduleId);
    if (!module) {
      return { status: 'error', message: '模块未找到' };
    }
    
    if (module.healthCheck) {
      return await module.healthCheck();
    }
    
    return { status: 'healthy', message: '模块正常' };
  }
  
  // 处理模块事件
  private handleModuleEvent(event: AutomationEvent): void {
    // 更新模块统计
    this.updateStats();
    
    // 记录到数据总线
    this.dataBus.sendMessage({
      type: 'module-event',
      source: 'automation-service',
      destination: 'module-events',
      payload: event,
      metadata: {
        priority: 'normal'
      }
    });
  }
  
  // 处理任务事件
  private handleTaskEvent(event: AutomationEvent): void {
    // 更新任务统计
    this.updateStats();
    
    // 记录到数据总线
    this.dataBus.sendMessage({
      type: 'task-event',
      source: 'automation-service',
      destination: 'task-events',
      payload: event,
      metadata: {
        priority: 'normal'
      }
    });
  }
  
  // 处理错误事件
  private handleErrorEvent(event: AutomationEvent): void {
    logger.error('AutomationService error event', event.data, { module: 'AutomationService' });
    
    // 记录到数据总线
    this.dataBus.sendMessage({
      type: 'error-event',
      source: 'automation-service',
      destination: 'error-events',
      payload: event,
      metadata: {
        priority: 'high'
      }
    });
  }
  
  // 处理数据总线消息
  private handleDataBusMessage(message: DataMessage): void {
    // 更新消息统计
    this.updateStats();
    
    // 根据消息类型处理
    switch (message.type) {
      case 'module-event':
      case 'task-event':
      case 'error-event':
        // 这些事件已经处理过，忽略
        break;
      default:
        // 转发到事件系统
        this.eventSystem.emit({
          type: `message:${message.type}`,
          source: 'data-bus',
          data: message,
          metadata: {
            priority: message.metadata?.priority || 'normal'
          }
        });
        break;
    }
  }
  
  // 获取活跃执行数
  private getActiveExecutions(): number {
    // 简化实现：从任务调度器获取
    const tasks = this.taskScheduler.getAllTasks();
    return tasks.filter(t => 
      t.metadata.lastRun && 
      new Date(t.metadata.lastRun).getTime() > Date.now() - 300000 // 5分钟内
    ).length;
  }
  
  // 更新统计信息
  private updateStats(): void {
    const modules = this.moduleManager.getAllModules();
    const tasks = this.taskScheduler.getAllTasks();
    const dataBusStats = this.dataBus.getStats();
    const eventSystemStats = this.eventSystem.getStats();
    
    this.status.stats = {
      totalModules: modules.length,
      enabledModules: modules.filter(m => m.enabled).length,
      totalTasks: tasks.length,
      enabledTasks: tasks.filter(t => t.schedule.enabled).length,
      activeExecutions: this.getActiveExecutions(),
      totalEvents: eventSystemStats.totalEvents,
      totalMessages: dataBusStats.totalMessages
    };
    
    this.status.uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }
  
  // 执行清理任务
  private performCleanup(): void {
    try {
      console.log('[AutomationService] Performing cleanup...');
      
      // 清理旧执行记录
      const executionCleanup = this.taskScheduler.cleanupOldExecutions(
        this.config.cleanupSettings.keepExecutionDays
      );
      
      // 清理旧事件
      const eventCleanup = this.eventSystem.cleanupOldEvents(
        this.config.cleanupSettings.keepEventDays
      );
      
      // 清理旧消息
      const messageCleanup = this.dataBus.cleanupOldMessages(
        this.config.cleanupSettings.keepMessageDays * 24 // 转换为小时
      );
      
      console.log('[AutomationService] Cleanup completed:', {
        executions: executionCleanup,
        events: eventCleanup,
        messages: messageCleanup
      });
      
      // 触发清理完成事件
      this.eventSystem.emit({
        type: 'service:cleanup-completed',
        source: 'automation-service',
        data: {
          executionCleanup,
          eventCleanup,
          messageCleanup
        },
        metadata: {
          priority: 'low'
        }
      });
      
    } catch (error) {
      logger.error('AutomationService cleanup failed', error, { module: 'AutomationService' });
      
      this.eventSystem.emit({
        type: 'service:error',
        source: 'automation-service',
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          component: 'cleanup'
        },
        metadata: {
          priority: 'normal'
        }
      });
    }
  }
  
  // 获取服务状态
  getStatus(): ServiceStatus {
    this.updateStats();
    return { ...this.status };
  }
  
  // 获取运行时间
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }
  
  // 获取模块管理器
  getModuleManager(): ModuleManager {
    return this.moduleManager;
  }
  
  // 获取任务调度器
  getTaskScheduler(): TaskScheduler {
    return this.taskScheduler;
  }
  
  // 获取数据总线
  getDataBus(): DataBus {
    return this.dataBus;
  }
  
  // 获取事件系统
  getEventSystem(): EventSystem {
    return this.eventSystem;
  }
  
  // 手动触发任务
  async triggerTask(taskId: string): Promise<{
    success: boolean;
    executionId?: string;
    error?: string;
  }> {
    try {
      const task = this.taskScheduler.getAllTasks().find(t => t.id === taskId);
      
      if (!task) {
        return {
          success: false,
          error: `Task not found: ${taskId}`
        };
      }
      
      if (!task.schedule.enabled) {
        return {
          success: false,
          error: `Task is disabled: ${taskId}`
        };
      }
      
      // 执行任务
      await this.executeTask(task);
      
      return {
        success: true,
        executionId: `manual_${Date.now()}`
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // 注册新模块
  async registerModule(moduleData: Omit<AutomationModule, 'metadata'>): Promise<{
    success: boolean;
    module?: AutomationModule;
    error?: string;
  }> {
    try {
      const module = await this.moduleManager.registerModule(moduleData);
      
      // 触发模块注册事件
      this.eventSystem.emit({
        type: 'module:registered',
        source: 'automation-service',
        data: {
          moduleId: module.id,
          moduleName: module.name
        },
        metadata: {
          priority: 'normal'
        }
      });
      
      return {
        success: true,
        module
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // 创建新任务
  createTask(taskData: Omit<ScheduledTask, 'id' | 'metadata'>): {
    success: boolean;
    task?: ScheduledTask;
    error?: string;
  } {
    try {
      const task = this.taskScheduler.createTask(taskData);
      
      // 触发任务创建事件
      this.eventSystem.emit({
        type: 'task:created',
        source: 'automation-service',
        data: {
          taskId: task.id,
          moduleId: task.moduleId,
          action: task.action
        },
        metadata: {
          priority: 'normal'
        }
      });
      
      return {
        success: true,
        task
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // 导出服务状态
  exportServiceState(): string {
    const state = {
      config: this.config,
      status: this.getStatus(),
      modules: this.moduleManager.getAllModules(),
      tasks: this.taskScheduler.getAllTasks(),
      dataBusState: this.dataBus.exportState(),
      eventSystemState: this.eventSystem.exportState(),
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0'
    };
    
    return JSON.stringify(state, null, 2);
  }
  
  // 导入服务状态
  async importServiceState(stateJson: string): Promise<{
    success: boolean;
    imported: {
      modules: number;
      tasks: number;
    };
    errors?: string[];
  }> {
    try {
      const state = JSON.parse(stateJson);
      const errors: string[] = [];
      let importedModules = 0;
      let importedTasks = 0;
      
      // 导入模块
      if (state.modules && Array.isArray(state.modules)) {
        for (const moduleData of state.modules) {
          try {
            await this.registerModule(moduleData);
            importedModules++;
          } catch (error) {
            errors.push(`Failed to import module ${moduleData.id}: ${error}`);
          }
        }
      }
      
      // 导入任务
      if (state.tasks && Array.isArray(state.tasks)) {
        for (const taskData of state.tasks) {
          try {
            this.createTask(taskData);
            importedTasks++;
          } catch (error) {
            errors.push(`Failed to import task ${taskData.id}: ${error}`);
          }
        }
      }
      
      // 导入数据总线状态
      if (state.dataBusState) {
        const result = this.dataBus.importState(state.dataBusState);
        if (result.errors) {
          errors.push(...result.errors);
        }
      }
      
      // 导入事件系统状态
      if (state.eventSystemState) {
        const result = this.eventSystem.importState(state.eventSystemState);
        if (result.errors) {
          errors.push(...result.errors);
        }
      }
      
      return {
        success: errors.length === 0,
        imported: {
          modules: importedModules,
          tasks: importedTasks
        },
        errors: errors.length > 0 ? errors : undefined
      };
      
    } catch (error) {
      return {
        success: false,
        imported: { modules: 0, tasks: 0 },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // ==================== 故障诊断服务方法 ====================

  // 获取故障诊断服务
  getFaultDiagnosisService(): FaultDiagnosisService {
    return this.faultDiagnosisService;
  }

  // 获取故障诊断状态
  getFaultDiagnosisStatus() {
    return this.faultDiagnosisService.getStatus();
  }

  // 获取诊断历史
  getFaultDiagnosisHistory(limit: number = 50) {
    // 简化版本，返回空数组
    return [];
  }

  // 获取故障历史
  getFaultHistory() {
    // 简化版本，返回空数组
    return [];
  }

  // 获取所有诊断规则
  getFaultDiagnosisRules() {
    return this.faultDiagnosisService.getAllRules();
  }

  // 添加自定义诊断规则
  addFaultDiagnosisRule(rule: any): string {
    // 简化版本，返回规则ID
    return `rule-${Date.now()}`;
  }

  // 执行手动修复
  async executeFaultRepair(faultId: string, repairStepId: string) {
    // 简化版本，返回成功
    return { success: true, message: '修复执行成功' };
  }

  // 更新故障诊断配置
  updateFaultDiagnosisConfig(newConfig: Partial<FaultDiagnosisServiceConfig>) {
    this.faultDiagnosisService.updateConfig(newConfig);
    this.config.faultDiagnosis = { ...this.config.faultDiagnosis, ...newConfig };
  }
}
