// TaskScheduling器 - AutomationTaskExecute管理
import fs from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

export interface ScheduledTask {
  id: string;
  moduleId: string;
  action: string;
  schedule: {
    cron: string;
    timezone?: string;
    enabled: boolean;
  };
  parameters?: Record<string, unknown>;
  metadata: {
    created: string;
    updated: string;
    lastRun?: string;
    nextRun?: string;
    runCount: number;
    successCount: number;
    lastError?: string;
  };
  retryPolicy?: {
    maxRetries: number;
    retryDelay: number; // 毫s
    backoffMultiplier: number;
  };
}

export interface TaskExecution {
  id: string;
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  result?: unknown;
  error?: string;
  logs: string[];
  metadata: {
    retryCount: number;
    duration?: number;
  };
}

export class TaskScheduler {
  private tasksDir: string;
  private executionsDir: string;
  
  constructor(baseDir: string = path.join(process.cwd(), 'data', 'automation')) {
    this.tasksDir = path.join(baseDir, 'tasks');
    this.executionsDir = path.join(baseDir, 'executions');
    
    // 确保目录存in
    if (!fs.existsSync(this.tasksDir)) {
      fs.mkdirSync(this.tasksDir, { recursive: true });
    }
    if (!fs.existsSync(this.executionsDir)) {
      fs.mkdirSync(this.executionsDir, { recursive: true });
    }
  }
  
  // CreateNewTask
  createTask(taskData: Omit<ScheduledTask, 'id' | 'metadata'>): ScheduledTask {
    const task: ScheduledTask = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        runCount: 0,
        successCount: 0
      }
    };
    
    // 计算下 times运行time
    if (task.schedule.enabled) {
      task.metadata.nextRun = this.calculateNextRun(task.schedule.cron);
    }
    
    this.saveTask(task);
    return task;
  }
  
  // Fetch所AllTask
  getAllTasks(): ScheduledTask[] {
    const tasks: ScheduledTask[] = [];
    
    if (!fs.existsSync(this.tasksDir)) {
      return tasks;
    }
    
    const files = fs.readdirSync(this.tasksDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(this.tasksDir, file), 'utf-8');
        const task = JSON.parse(content);
        tasks.push(task);
      } catch (error) {
        logger.error('Error reading task file', error, { module: 'TaskScheduler', file });
      }
    }
    
    return tasks;
  }
  
  // Fetch待ExecuteTask
  getPendingTasks(): ScheduledTask[] {
    const now = new Date();
    const tasks = this.getAllTasks();
    
    return tasks.filter(task => {
      if (!task.schedule.enabled) return false;
      if (!task.metadata.nextRun) return false;
      
      const nextRun = new Date(task.metadata.nextRun);
      return nextRun <= now;
    });
  }
  
  // SaveTask
  private saveTask(task: ScheduledTask): void {
    const taskFile = path.join(this.tasksDir, `${task.id}.json`);
    fs.writeFileSync(taskFile, JSON.stringify(task, null, 2));
  }
  
  // 计算下 times运行time(简化Version, 不依赖cron-parser)
  private calculateNextRun(cronExpression: string): string {
    try {
      // 简化实现: for于常见'scron表达式
      // e.g.: */5 * * * * 表示每5min
      // 这里我们简单返回1Small时后
      const nextDate = new Date(Date.now() + 60 * 60 * 1000);
      return nextDate.toISOString();
    } catch (error) {
      logger.error('Error calculating next run', error, { module: 'TaskScheduler', cronExpression });
      // Default1Small时后
      const nextDate = new Date(Date.now() + 60 * 60 * 1000);
      return nextDate.toISOString();
    }
  }
  
  // UpdateTask下 times运行time
  updateTaskNextRun(taskId: string): boolean {
    const tasks = this.getAllTasks();
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return false;
    
    task.metadata.nextRun = this.calculateNextRun(task.schedule.cron);
    task.metadata.updated = new Date().toISOString();
    
    this.saveTask(task);
    return true;
  }
  
  // enabled/disabledTask
  toggleTask(taskId: string, enabled: boolean): boolean {
    const tasks = this.getAllTasks();
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return false;
    
    task.schedule.enabled = enabled;
    task.metadata.updated = new Date().toISOString();
    
    if (enabled) {
      task.metadata.nextRun = this.calculateNextRun(task.schedule.cron);
    } else {
      delete task.metadata.nextRun;
    }
    
    this.saveTask(task);
    return true;
  }
  
  // On始TaskExecute
  startTaskExecution(taskId: string): TaskExecution {
    const execution: TaskExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      status: 'running',
      startTime: new Date().toISOString(),
      logs: [`Task execution started at ${new Date().toISOString()}`],
      metadata: {
        retryCount: 0
      }
    };
    
    this.saveExecution(execution);
    return execution;
  }
  
  // CompletedTaskExecute
  completeTaskExecution(executionId: string, result: unknown): boolean {
    const execution = this.getExecution(executionId);
    if (!execution) return false;
    
    execution.status = 'completed';
    execution.endTime = new Date().toISOString();
    execution.result = result;
    
    const startTime = new Date(execution.startTime);
    const endTime = new Date(execution.endTime);
    execution.metadata.duration = endTime.getTime() - startTime.getTime();
    
    execution.logs.push(`Task completed successfully at ${execution.endTime}`);
    
    this.saveExecution(execution);
    this.updateTaskStats(execution.taskId, true);
    
    return true;
  }
  
  // TaskExecutefailed
  failTaskExecution(executionId: string, error: string): boolean {
    const execution = this.getExecution(executionId);
    if (!execution) return false;
    
    execution.status = 'failed';
    execution.endTime = new Date().toISOString();
    execution.error = error;
    
    const startTime = new Date(execution.startTime);
    const endTime = new Date(execution.endTime);
    execution.metadata.duration = endTime.getTime() - startTime.getTime();
    
    execution.logs.push(`Task failed at ${execution.endTime}: ${error}`);
    
    this.saveExecution(execution);
    this.updateTaskStats(execution.taskId, false);
    
    return true;
  }
  
  // AddExecuteLogging
  addExecutionLog(executionId: string, log: string): boolean {
    const execution = this.getExecution(executionId);
    if (!execution) return false;
    
    execution.logs.push(`${new Date().toISOString()}: ${log}`);
    this.saveExecution(execution);
    
    return true;
  }
  
  // FetchExecuteLog
  getExecution(executionId: string): TaskExecution | null {
    const executionFile = path.join(this.executionsDir, `${executionId}.json`);
    
    if (!fs.existsSync(executionFile)) {
      return null;
    }
    
    try {
      const content = fs.readFileSync(executionFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      logger.error('Error reading execution', error, { module: 'TaskScheduler', executionId });
      return null;
    }
  }
  
  // FetchTask's所AllExecuteLog
  getTaskExecutions(taskId: string, limit: number = 50): TaskExecution[] {
    const executions: TaskExecution[] = [];
    
    if (!fs.existsSync(this.executionsDir)) {
      return executions;
    }
    
    const files = fs.readdirSync(this.executionsDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, limit);
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(this.executionsDir, file), 'utf-8');
        const execution = JSON.parse(content);
        
        if (execution.taskId === taskId) {
          executions.push(execution);
        }
      } catch (error) {
        logger.error('Error reading execution file', error, { module: 'TaskScheduler', file });
      }
    }
    
    return executions;
  }
  
  // SaveExecuteLog
  private saveExecution(execution: TaskExecution): void {
    const executionFile = path.join(this.executionsDir, `${execution.id}.json`);
    fs.writeFileSync(executionFile, JSON.stringify(execution, null, 2));
  }
  
  // UpdateTaskStatistics
  private updateTaskStats(taskId: string, success: boolean): void {
    const tasks = this.getAllTasks();
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    task.metadata.runCount += 1;
    if (success) {
      task.metadata.successCount += 1;
    }
    task.metadata.updated = new Date().toISOString();
    
    // Update下 times运行time
    if (task.schedule.enabled) {
      task.metadata.nextRun = this.calculateNextRun(task.schedule.cron);
    }
    
    this.saveTask(task);
  }
  
  // FetchTaskStatistics
  getTaskStats(taskId: string): {
    totalRuns: number;
    successRate: number;
    averageDuration: number;
    lastRun: string | null;
    nextRun: string | null;
  } {
    const task = this.getAllTasks().find(t => t.id === taskId);
    
    if (!task) {
      return {
        totalRuns: 0,
        successRate: 0,
        averageDuration: 0,
        lastRun: null,
        nextRun: null
      };
    }
    
    const executions = this.getTaskExecutions(taskId, 100);
    const completedExecutions = executions.filter(e => e.status === 'completed');
    
    const totalDuration = completedExecutions.reduce((sum, exec) => {
      return sum + (exec.metadata.duration || 0);
    }, 0);
    
    const averageDuration = completedExecutions.length > 0 
      ? totalDuration / completedExecutions.length 
      : 0;
    
    const successRate = task.metadata.runCount > 0
      ? Math.round((task.metadata.successCount / task.metadata.runCount) * 100)
      : 0;
    
    return {
      totalRuns: task.metadata.runCount,
      successRate,
      averageDuration,
      lastRun: executions[0]?.endTime || null,
      nextRun: task.metadata.nextRun || null
    };
  }
  
  // 清理OldExecuteLog
  cleanupOldExecutions(daysToKeep: number = 30): {
    deleted: number;
    kept: number;
  } {
    if (!fs.existsSync(this.executionsDir)) {
      return { deleted: 0, kept: 0 };
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const files = fs.readdirSync(this.executionsDir).filter(f => f.endsWith('.json'));
    let deleted = 0;
    let kept = 0;
    
    for (const file of files) {
      try {
        const filePath = path.join(this.executionsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const execution = JSON.parse(content);
        
        const executionDate = new Date(execution.startTime);
        
        if (executionDate < cutoffDate) {
          fs.unlinkSync(filePath);
          deleted++;
        } else {
          kept++;
        }
      } catch (error) {
        logger.error('Error processing execution file', error, { module: 'TaskScheduler', file });
        kept++; // 出错时保留file
      }
    }
    
    return { deleted, kept };
  }
  
  // ExportTaskdata
  exportTaskData(taskId: string): string {
    const task = this.getAllTasks().find(t => t.id === taskId);
    const executions = this.getTaskExecutions(taskId, 100);
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    const exportData = {
      task,
      recentExecutions: executions,
      stats: this.getTaskStats(taskId),
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  }
}