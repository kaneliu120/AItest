// 修复的工作流协调器 - 类型安全版本
import { EventSystem } from './automation-framework/core/EventSystem';
import { TaskScheduler } from './automation-framework/core/TaskScheduler';
import { ModuleManager } from './automation-framework/core/ModuleManager';
import { DataBus } from './automation-framework/core/DataBus';
import { TeamCollaborationManager } from './team-collaboration';
import { moduleActionRegistry } from './workflow/module-action-registry';
import fs from 'fs';
import { logger } from './logger';
import path from 'path';
import { buildMetricAlerts } from './workflow/metric-alerts';
import { getCached, setCached, clearCache } from './workflow/workflow-metrics-cache';
import { persistExecutionStart, persistExecutionStatus, persistStepEvent, queryMetricsWindow, queryMetricsTrend } from './workflow/workflow-persistence';

// 工作流步骤定义
export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
  parameters: Record<string, any>;
  timeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  dependencies?: string[];
  onSuccess?: string;
  onFailure?: string;
}

// 工作流触发器定义
export interface WorkflowTrigger {
  type: 'schedule' | 'event' | 'manual' | 'api';
  schedule?: string;
  eventType?: string;
}

// 工作流定义
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  metadata: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
  };
}

// 预定义工作流 - 类型安全版本
export const PredefinedWorkflows: Record<string, WorkflowDefinition> = {
  EVENING_PROACTIVE: {
    id: 'evening-proactive',
    name: '晚间主动性工作流',
    description: '每晚20:00自动推进使命的一件事',
    version: '1.0.0',
    triggers: [
      {
        type: 'schedule',
        schedule: '0 20 * * *' // 每天20:00
      }
    ],
    steps: [
      {
        id: 'select-task',
        name: '选择最高优先级任务',
        description: '从任务库中选择最高优先级的任务',
        module: 'tasks',
        action: 'select_priority_task',
        parameters: { priority: 'highest' },
        timeoutMs: 30000,
        retryAttempts: 3,
        retryDelayMs: 5000,
      },
      {
        id: 'execute-action',
        name: '执行推进行动',
        description: '执行选定的任务行动',
        module: 'automation',
        action: 'execute_task',
        parameters: {},
        timeoutMs: 600000,
        retryAttempts: 2,
        retryDelayMs: 10000,
        dependencies: ['select-task'],
      },
      {
        id: 'record-progress',
        name: '记录进展和问题',
        description: '记录任务执行进展和遇到的问题',
        module: 'tasks',
        action: 'record_progress',
        parameters: {},
        timeoutMs: 30000,
        retryAttempts: 2,
        retryDelayMs: 5000,
        dependencies: ['execute-action'],
      },
      {
        id: 'generate-report',
        name: '生成总结报告',
        description: '生成任务执行总结报告',
        module: 'reporting',
        action: 'generate_summary',
        parameters: {},
        timeoutMs: 30000,
        retryAttempts: 2,
        retryDelayMs: 5000,
        dependencies: ['record-progress'],
      },
      {
        id: 'notify-user',
        name: '向用户汇报',
        description: '向用户发送执行结果汇报',
        module: 'notification',
        action: 'send_report',
        parameters: {},
        timeoutMs: 30000,
        retryAttempts: 3,
        retryDelayMs: 10000,
        dependencies: ['generate-report'],
      }
    ],
    metadata: {
      createdBy: 'workflow-coordinator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['evening', 'proactive', 'automation'],
    },
  },

  FINANCE_WEEKLY_REPORT: {
    id: 'finance-weekly-report',
    name: '财务周报工作流',
    description: '每周一生成财务周报',
    version: '1.0.0',
    triggers: [
      {
        type: 'schedule',
        schedule: '0 9 * * 1' // 每周一9:00
      }
    ],
    steps: [
      {
        id: 'collect-data',
        name: '收集财务数据',
        description: '收集本周财务数据',
        module: 'finance',
        action: 'collect_weekly_data',
        parameters: {},
        timeoutMs: 60000,
        retryAttempts: 3,
        retryDelayMs: 5000,
      },
      {
        id: 'generate-report',
        name: '生成周报',
        description: '生成财务周报',
        module: 'reporting',
        action: 'generate_finance_report',
        parameters: {},
        timeoutMs: 120000,
        retryAttempts: 2,
        retryDelayMs: 10000,
        dependencies: ['collect-data'],
      },
      {
        id: 'send-notification',
        name: '发送通知',
        description: '发送周报完成通知',
        module: 'notification',
        action: 'send_notification',
        parameters: {},
        timeoutMs: 30000,
        retryAttempts: 2,
        retryDelayMs: 5000,
        dependencies: ['generate-report'],
      }
    ],
    metadata: {
      createdBy: 'workflow-coordinator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['finance', 'weekly', 'report'],
    },
  },

  FREELANCE_PROJECT_SEARCH: {
    id: 'freelance-project-search',
    name: '外包项目搜索工作流',
    description: '每日搜索新的外包项目',
    version: '1.0.0',
    triggers: [
      {
        type: 'schedule',
        schedule: '0 10 * * *' // 每天10:00
      }
    ],
    steps: [
      {
        id: 'search-platforms',
        name: '搜索平台',
        description: '在外包平台搜索新项目',
        module: 'freelance',
        action: 'search_projects',
        parameters: {},
        timeoutMs: 180000,
        retryAttempts: 3,
        retryDelayMs: 10000,
      },
      {
        id: 'filter-projects',
        name: '筛选项目',
        description: '筛选符合要求的项目',
        module: 'freelance',
        action: 'filter_projects',
        parameters: {},
        timeoutMs: 60000,
        retryAttempts: 2,
        retryDelayMs: 5000,
        dependencies: ['search-platforms'],
      },
      {
        id: 'apply-projects',
        name: '申请项目',
        description: '申请筛选出的项目',
        module: 'freelance',
        action: 'apply_to_projects',
        parameters: {},
        timeoutMs: 300000,
        retryAttempts: 2,
        retryDelayMs: 15000,
        dependencies: ['filter-projects'],
      }
    ],
    metadata: {
      createdBy: 'workflow-coordinator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['freelance', 'project', 'search'],
    },
  },

  SYSTEM_HEALTH_CHECK: {
    id: 'system-health-check',
    name: '系统健康检查工作流',
    description: '每小时检查系统健康状况',
    version: '1.0.0',
    triggers: [
      {
        type: 'schedule',
        schedule: '0 * * * *' // 每小时
      }
    ],
    steps: [
      {
        id: 'check-services',
        name: '检查服务',
        description: '检查所有系统服务状态',
        module: 'health',
        action: 'check_services',
        parameters: {},
        timeoutMs: 60000,
        retryAttempts: 3,
        retryDelayMs: 5000,
      },
      {
        id: 'check-database',
        name: '检查数据库',
        description: '检查数据库连接和性能',
        module: 'health',
        action: 'check_database',
        parameters: {},
        timeoutMs: 30000,
        retryAttempts: 2,
        retryDelayMs: 5000,
        dependencies: ['check-services'],
      },
      {
        id: 'generate-alert',
        name: '生成告警',
        description: '生成健康检查告警',
        module: 'notification',
        action: 'generate_health_alert',
        parameters: {},
        timeoutMs: 30000,
        retryAttempts: 2,
        retryDelayMs: 5000,
        dependencies: ['check-database'],
      }
    ],
    metadata: {
      createdBy: 'workflow-coordinator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['health', 'monitoring', 'system'],
    },
  }
};

// 工作流协调器类
export interface WorkflowInstance {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  currentStep?: string;
  startedAt: string;
  completedAt?: string;
  errors: string[];
  stepsStatus: Record<string, {
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startedAt?: string;
    completedAt?: string;
    attempts: number;
    error?: string;
  }>;
}

type NotificationJob = {
  id: string;
  executionId?: string;
  workflowId?: string;
  stepId: string;
  action: string;
  title: string;
  message: string;
  dedupKey: string;
  queuedAt: string;
  attempts?: number;
  lastError?: string;
};


export class WorkflowCoordinator {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private instances: Map<string, WorkflowInstance> = new Map();
  /** 实例级互斥锁：key=instanceId, value=当前执行Promise */
  private instanceLocks: Map<string, Promise<void>> = new Map();
  /** 暂停信号量：key=instanceId, value=resume触发函数 */
  private pauseSignals: Map<string, () => void> = new Map();
  private notificationDedup: Map<string, number> = new Map();
  private notificationQueue: NotificationJob[] = [];
  private notificationDeadLetter: NotificationJob[] = [];
  private notificationWorkerRunning = false;
  private queueDir = path.join(process.cwd(), 'data', 'workflow');
  private queueFile = path.join(this.queueDir, 'notification-queue.json');
  private dlqFile = path.join(this.queueDir, 'notification-dlq.json');
  private eventSystem: EventSystem;
  private taskScheduler: TaskScheduler;
  private moduleManager: ModuleManager;
  private dataBus: DataBus;

  constructor(
    eventSystem: EventSystem,
    taskScheduler: TaskScheduler,
    moduleManager: ModuleManager,
    dataBus: DataBus
  ) {
    this.eventSystem = eventSystem;
    this.taskScheduler = taskScheduler;
    this.moduleManager = moduleManager;
    this.dataBus = dataBus;
    this.ensureQueueStorage();
    this.loadQueueState();
    if (!this.isExternalNotificationWorkerEnabled() && this.notificationQueue.length > 0) this.kickNotificationWorker();
  }

  private ensureQueueStorage(): void {
    if (!fs.existsSync(this.queueDir)) fs.mkdirSync(this.queueDir, { recursive: true });
  }

  private persistQueueState(): void {
    fs.writeFileSync(this.queueFile, JSON.stringify({ queue: this.notificationQueue, updatedAt: new Date().toISOString() }, null, 2));
    fs.writeFileSync(this.dlqFile, JSON.stringify({ deadLetter: this.notificationDeadLetter.slice(-200), updatedAt: new Date().toISOString() }, null, 2));
  }

  private loadQueueState(): void {
    try {
      if (fs.existsSync(this.queueFile)) {
        const data = JSON.parse(fs.readFileSync(this.queueFile, 'utf-8'));
        this.notificationQueue = Array.isArray(data.queue) ? data.queue : [];
      }
      if (fs.existsSync(this.dlqFile)) {
        const data = JSON.parse(fs.readFileSync(this.dlqFile, 'utf-8'));
        this.notificationDeadLetter = Array.isArray(data.deadLetter) ? data.deadLetter : [];
      }
    } catch {
      this.notificationQueue = [];
      this.notificationDeadLetter = [];
    }
  }

  private isExternalNotificationWorkerEnabled(): boolean {
    return String(process.env.WORKFLOW_NOTIFICATION_EXTERNAL_WORKER || '').toLowerCase() === 'true';
  }

  private kickNotificationWorker(): void {
    if (this.isExternalNotificationWorkerEnabled()) return;
    if (this.notificationWorkerRunning) return;
    this.notificationWorkerRunning = true;
    void this.processNotificationQueue();
  }

  private async processNotificationQueue(): Promise<void> {
    while (this.notificationQueue.length > 0) {
      const job = this.notificationQueue.shift();
      if (!job) continue;
      this.persistQueueState();

      try {
        let notificationId = '';
        let discordSent = false;
        let telegramSent = false;

        notificationId = TeamCollaborationManager.sendNotification('kane', {
          title: job.title,
          message: job.message,
          type: 'info',
          action: {
            label: '查看工作流',
            url: '/workflows',
          },
        });

        const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
        if (discordWebhook) {
          discordSent = await this.withRetry(async () => {
            const resp = await fetch(discordWebhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: `📣 ${job.title}\n${job.message}` }),
            });
            return resp.ok;
          }, 2, 700);
        }

        const tgToken = process.env.TELEGRAM_BOT_TOKEN;
        const tgChatId = process.env.TELEGRAM_CHAT_ID;
        if (tgToken && tgChatId) {
          telegramSent = await this.withRetry(async () => {
            const resp = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: tgChatId,
                text: `📣 ${job.title}\n${job.message}`,
              }),
            });
            return resp.ok;
          }, 2, 700);
        }

        this.eventSystem.emit({
          type: 'workflow-notification-sent',
          source: 'workflow-coordinator',
          data: {
            stepId: job.stepId,
            action: job.action,
            title: job.title,
            message: job.message,
            notificationId,
            discordSent,
            telegramSent,
            jobId: job.id,
          },
          metadata: { priority: 'normal', tags: ['workflow', 'notification', 'async'] },
        });
      } catch (error) {
        const attempts = (job.attempts || 0) + 1;
        const failedJob: NotificationJob = {
          ...job,
          attempts,
          lastError: error instanceof Error ? error.message : 'unknown-error',
        };

        if (attempts >= 3) {
          this.notificationDeadLetter.push(failedJob);
          this.eventSystem.emit({
            type: 'workflow-notification-dlq',
            source: 'workflow-coordinator',
            data: { ...failedJob },
            metadata: { priority: 'high', tags: ['workflow', 'notification', 'dlq'] },
          });
        } else {
          this.notificationQueue.push(failedJob);
        }
      } finally {
        this.persistQueueState();
      }
    }

    this.notificationWorkerRunning = false;
  }

  // 注册工作流
  registerWorkflow(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
    logger.info(`✅ 工作流注册成功: ${workflow.name} (${workflow.id})`);
  }

  // 获取工作流
  getWorkflow(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  // 获取所有工作流
  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  // 启动工作流
  async startWorkflow(workflowId: string, parameters?: Record<string, any>): Promise<string> {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`工作流未找到: ${workflowId}`);
    }

    const instanceId = `workflow-${workflowId}-${Date.now()}`;
    const now = new Date().toISOString();
    const stepsStatus = Object.fromEntries(
      workflow.steps.map(step => [step.id, { status: 'pending', attempts: 0 }])
    ) as WorkflowInstance['stepsStatus'];

    const instance: WorkflowInstance = {
      id: instanceId,
      workflowId,
      status: 'running',
      currentStep: workflow.steps[0]?.id,
      startedAt: now,
      errors: [],
      stepsStatus,
    };

    this.instances.set(instanceId, instance);
    clearCache('metrics:');
    logger.info(`🚀 启动工作流: ${workflow.name} (实例: ${instanceId})`);

    persistExecutionStart({
      id: instance.id,
      workflowId: instance.workflowId,
      status: instance.status,
      startedAt: instance.startedAt,
      createdBy: (parameters?.createdBy as string) || 'system',
      metadata: { source: 'workflow-coordinator' },
    }).catch((e) => logger.error('[workflow-coordinator] persistExecutionStart failed', e));

    // 用互斥锁追踪实例执行Promise，防止并发竞态
    const runPromise = this.runInstance(instanceId, parameters || {}).finally(() => {
      this.instanceLocks.delete(instanceId);
      this.pauseSignals.delete(instanceId);
    });
    this.instanceLocks.set(instanceId, runPromise);
    return instanceId;
  }

  private async runInstance(instanceId: string, parameters: Record<string, any>): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) return;
    const workflow = this.workflows.get(instance.workflowId);
    if (!workflow) {
      instance.status = 'failed';
      instance.errors.push('工作流定义不存在');
      instance.completedAt = new Date().toISOString();
      persistExecutionStatus({ id: instance.id, status: instance.status, completedAt: instance.completedAt }).catch((e) => logger.error("[workflow-coordinator] persistExecutionStatus failed", e));
      return;
    }

    const runtimeContext: Record<string, any> = { ...parameters };

    for (const step of workflow.steps) {
      const current = this.instances.get(instanceId);
      if (!current) return;
      if (current.status === 'cancelled' || current.status === 'failed') return;

      while (current.status === 'paused') {
        // 等待 resume 信号量，避免 CPU 自旋
        await new Promise<void>(resolve => {
          this.pauseSignals.set(instanceId, resolve);
        });
      }

      current.currentStep = step.id;
      current.stepsStatus[step.id] = {
        ...current.stepsStatus[step.id],
        status: 'running',
        startedAt: new Date().toISOString(),
        attempts: (current.stepsStatus[step.id]?.attempts || 0) + 1,
      };

      try {
        const output = await this.executeStep(instance.id, instance.workflowId, step, runtimeContext);
        runtimeContext[step.id] = output;
        runtimeContext.lastStepOutput = output;

        current.stepsStatus[step.id] = {
          ...current.stepsStatus[step.id],
          status: 'completed',
          completedAt: new Date().toISOString(),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : '步骤执行失败';
        current.stepsStatus[step.id] = {
          ...current.stepsStatus[step.id],
          status: 'failed',
          completedAt: new Date().toISOString(),
          error: message,
        };
        current.errors.push(`${step.id}: ${message}`);
        current.status = 'failed';
        current.completedAt = new Date().toISOString();
        persistExecutionStatus({ id: current.id, status: current.status, completedAt: current.completedAt }).catch((e) => logger.error("[workflow-coordinator] persistExecutionStatus failed", e));
        return;
      }
    }

    instance.status = 'completed';
    instance.currentStep = undefined;
    instance.completedAt = new Date().toISOString();
    persistExecutionStatus({ id: instance.id, status: instance.status, completedAt: instance.completedAt }).catch((e) => logger.error("[workflow-coordinator] persistExecutionStatus failed", e));
  }

  private async executeStep(executionId: string, workflowId: string, step: WorkflowStep, parameters: Record<string, any>): Promise<Record<string, any>> {
    const startedAt = Date.now();

    this.dataBus.sendMessage({
      type: 'workflow.step.started',
      source: 'workflow-coordinator',
      payload: {
        stepId: step.id,
        module: step.module,
        action: step.action,
      },
      metadata: { priority: 'normal' },
    });

    this.eventSystem.emit({
      type: 'workflow-step-started',
      source: 'workflow-coordinator',
      data: { stepId: step.id, module: step.module, action: step.action },
      metadata: { priority: 'normal', tags: ['workflow', step.module] },
    });

    void persistStepEvent({
      executionId,
      workflowId,
      stepId: step.id,
      module: step.module,
      action: step.action,
      status: 'started',
      eventAt: new Date(startedAt).toISOString(),
      payload: { parameters: step.parameters || {} },
    });

    try {
      const result = await this.executeByModuleAction(step, { ...parameters, __executionId: executionId, __workflowId: workflowId });

      const duration = Date.now() - startedAt;
      this.moduleManager.updateModuleStats(step.module, true);

      this.dataBus.sendMessage({
        type: 'workflow.step.completed',
        source: 'workflow-coordinator',
        payload: {
          stepId: step.id,
          module: step.module,
          action: step.action,
          duration,
          result,
        },
        metadata: { priority: 'normal' },
      });

      this.eventSystem.emit({
        type: 'workflow-step-completed',
        source: 'workflow-coordinator',
        data: { stepId: step.id, module: step.module, action: step.action, duration },
        metadata: { priority: 'normal', tags: ['workflow', step.module] },
      });

      void persistStepEvent({
        executionId,
        workflowId,
        stepId: step.id,
        module: step.module,
        action: step.action,
        status: 'completed',
        durationMs: duration,
        payload: { result },
      });

      return {
        ok: true,
        duration,
        ...result,
      };
    } catch (error) {
      this.moduleManager.updateModuleStats(step.module, false);

      const errMsg = error instanceof Error ? error.message : 'unknown-error';

      this.eventSystem.emit({
        type: 'workflow-step-failed',
        source: 'workflow-coordinator',
        data: {
          stepId: step.id,
          module: step.module,
          action: step.action,
          error: errMsg,
        },
        metadata: { priority: 'high', tags: ['workflow', step.module, 'error'] },
      });

      void persistStepEvent({
        executionId,
        workflowId,
        stepId: step.id,
        module: step.module,
        action: step.action,
        status: 'failed',
        durationMs: Date.now() - startedAt,
        errorMessage: errMsg,
      });

      throw error;
    }
  }

  private pruneNotificationDedup(now = Date.now()): void {
    const ttlMs = 10 * 60 * 1000;
    for (const [key, ts] of this.notificationDedup.entries()) {
      if (now - ts > ttlMs) this.notificationDedup.delete(key);
    }
  }

  private async withRetry(fn: () => Promise<boolean>, retries = 2, delayMs = 500): Promise<boolean> {
    for (let i = 0; i <= retries; i++) {
      try {
        const ok = await fn();
        if (ok) return true;
      } catch {
        // ignore and retry
      }
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
    return false;
  }

  private async executeByModuleAction(step: WorkflowStep, parameters: Record<string, any>): Promise<Record<string, any>> {
    const merged = { ...step.parameters, ...parameters };

    const queueNotification = ({ stepId, action, title, message, dedupKey }: { stepId: string; action: string; title: string; message: string; dedupKey: string }) => {
      this.pruneNotificationDedup();
      const now = Date.now();
      const isDuplicate = this.notificationDedup.has(dedupKey) && now - (this.notificationDedup.get(dedupKey) || 0) < 2 * 60 * 1000;

      if (!isDuplicate) {
        this.notificationDedup.set(dedupKey, now);
        this.notificationQueue.push({
          id: `nq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          executionId: merged.__executionId,
          workflowId: merged.__workflowId,
          stepId,
          action,
          title,
          message,
          dedupKey,
          queuedAt: new Date().toISOString(),
          attempts: 0,
        } as any);
        this.persistQueueState();
        this.kickNotificationWorker();
      }

      this.eventSystem.emit({
        type: 'workflow-notification-queued',
        source: 'workflow-coordinator',
        data: { action, title, message, deduped: isDuplicate, queueSize: this.notificationQueue.length },
        metadata: { priority: 'normal', tags: ['workflow', 'notification', 'queued'] },
      });

      return { queued: !isDuplicate, deduped: isDuplicate, queueSize: this.notificationQueue.length };
    };

    return moduleActionRegistry.execute({
      stepId: step.id,
      module: step.module,
      action: step.action,
      merged,
      queueNotification,
    });
  }

  // 停止工作流
  async stopWorkflow(instanceId: string): Promise<boolean> {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;
    if (instance.status === 'completed' || instance.status === 'failed' || instance.status === 'cancelled') return false;
    instance.status = 'cancelled';
    instance.completedAt = new Date().toISOString();
    clearCache('metrics:');
    // 若实例处于暂停，触发信号量让 runInstance 退出
    const signal = this.pauseSignals.get(instanceId);
    if (signal) { this.pauseSignals.delete(instanceId); signal(); }
    persistExecutionStatus({ id: instance.id, status: instance.status, completedAt: instance.completedAt }).catch((e) => logger.error("[workflow-coordinator] persistExecutionStatus failed", e));
    return true;
  }

  pauseWorkflow(instanceId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== 'running') return false;
    instance.status = 'paused';
    return true;
  }

  resumeWorkflow(instanceId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== 'paused') return false;
    instance.status = 'running';
    // 触发暂停信号量，唤醒等待的 runInstance
    const signal = this.pauseSignals.get(instanceId);
    if (signal) {
      this.pauseSignals.delete(instanceId);
      signal();
    }
    return true;
  }

  getInstances(status?: WorkflowInstance['status'] | 'all'): WorkflowInstance[] {
    const all = Array.from(this.instances.values());
    if (!status || status === 'all') return all;
    return all.filter(i => i.status === status);
  }

  private getMetricsFromMemory() {
    const all = this.getInstances('all');
    const completed = all.filter(i => i.status === 'completed').length;
    const failed = all.filter(i => i.status === 'failed').length;
    const running = all.filter(i => i.status === 'running').length;
    const totalFinished = completed + failed;

    const avgMs = totalFinished > 0
      ? all
          .filter(i => i.completedAt)
          .reduce((acc, i) => acc + (new Date(i.completedAt as string).getTime() - new Date(i.startedAt).getTime()), 0) / totalFinished
      : 0;

    // Design usage: 模块在工作流定义中的覆盖使用情况（按实例展开）
    const moduleUsage: Record<string, number> = {};

    // Runtime usage: 模块真实执行次数（仅统计已运行步骤）
    const moduleUsageRuntime: Record<string, number> = {};
    const moduleFailCount: Record<string, number> = {};
    const moduleDurationAgg: Record<string, { totalMs: number; count: number }> = {};

    // Step success: 每个step在运行态的成功率
    const stepAgg: Record<string, { success: number; failed: number }> = {};

    for (const instance of all) {
      const wf = this.workflows.get(instance.workflowId);
      if (!wf) continue;

      const stepToModule: Record<string, string> = {};
      wf.steps.forEach(s => {
        stepToModule[s.id] = s.module;
        moduleUsage[s.module] = (moduleUsage[s.module] || 0) + 1;
      });

      for (const [stepId, statusObj] of Object.entries(instance.stepsStatus || {})) {
        const module = stepToModule[stepId] || 'unknown';
        const st = statusObj.status;

        // 真实执行：排除pending/skipped
        if (st !== 'pending' && st !== 'skipped') {
          moduleUsageRuntime[module] = (moduleUsageRuntime[module] || 0) + 1;
        }

        if (!stepAgg[stepId]) stepAgg[stepId] = { success: 0, failed: 0 };
        if (st === 'completed') stepAgg[stepId].success += 1;
        if (st === 'failed') {
          stepAgg[stepId].failed += 1;
          moduleFailCount[module] = (moduleFailCount[module] || 0) + 1;
        }

        if (statusObj.startedAt && statusObj.completedAt) {
          const d = new Date(statusObj.completedAt).getTime() - new Date(statusObj.startedAt).getTime();
          if (d >= 0) {
            if (!moduleDurationAgg[module]) moduleDurationAgg[module] = { totalMs: 0, count: 0 };
            moduleDurationAgg[module].totalMs += d;
            moduleDurationAgg[module].count += 1;
          }
        }
      }
    }

    const stepSuccessRate: Record<string, number> = {};
    for (const [stepId, agg] of Object.entries(stepAgg)) {
      const den = agg.success + agg.failed;
      stepSuccessRate[stepId] = den > 0 ? (agg.success / den) * 100 : 0;
    }

    const moduleAvgDurationMs: Record<string, number> = {};
    for (const [module, agg] of Object.entries(moduleDurationAgg)) {
      moduleAvgDurationMs[module] = agg.count > 0 ? agg.totalMs / agg.count : 0;
    }

    const moduleFailureTopN = Object.entries(moduleFailCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([module, failures]) => ({ module, failures }));

    return {
      totalWorkflows: all.length,
      runningWorkflows: running,
      completedWorkflows: completed,
      failedWorkflows: failed,
      averageExecutionTime: avgMs,
      successRate: totalFinished > 0 ? (completed / totalFinished) * 100 : 0,
      stepSuccessRate,
      moduleUsage, // 兼容旧UI：Design usage
      moduleUsageRuntime,
      moduleFailCount,
      moduleAvgDurationMs,
      moduleFailureTopN,
    };
  }

  async getMetricsTrend(hours = 24) {
    const key = `metrics:trend:${hours}`;
    const cached = getCached<Record<string,any>[]>(key);
    if (cached) return cached;

    try {
      const rs = await queryMetricsTrend(hours);
      const points = rs.rows.map((r: Record<string, any>) => {
        const completed = Number(r.completed || 0);
        const failed = Number(r.failed || 0);
        const totalFinished = completed + failed;
        return {
          bucket: r.bucket,
          total: Number(r.total || 0),
          completed,
          failed,
          successRate: totalFinished > 0 ? (completed / totalFinished) * 100 : 0,
          averageExecutionTime: Number(r.avg_ms || 0),
        };
      });
      setCached(key, points, Number(process.env.WF_METRICS_CACHE_TTL_MS || 15000));
      return points;
    } catch {
      return [];
    }
  }

  async getMetrics(window: '1h' | '24h' | '7d' = '24h') {
    const cacheKey = `metrics:window:${window}`;
    const cached = getCached<Record<string,any>>(cacheKey);
    if (cached) return cached;

    const intervals: Record<'1h' | '24h' | '7d', string> = {
      '1h': '1 hour',
      '24h': '24 hours',
      '7d': '7 days',
    };

    try {
      const interval = intervals[window] || intervals['24h'];

      const { execRs, stepRs, moduleRs: moduleRuntimeRs } = await queryMetricsWindow(interval);

      const e = execRs.rows[0] || { total: 0, running: 0, completed: 0, failed: 0, avg_ms: 0 };
      const totalFinished = Number(e.completed || 0) + Number(e.failed || 0);

      const stepSuccessRate: Record<string, number> = {};
      stepRs.rows.forEach((r: Record<string, any>) => {
        const s = Number(r.success || 0);
        const f = Number(r.failed || 0);
        stepSuccessRate[r.step_id] = s + f > 0 ? (s / (s + f)) * 100 : 0;
      });

      const moduleUsageRuntime: Record<string, number> = {};
      const moduleFailCount: Record<string, number> = {};
      const moduleAvgDurationMs: Record<string, number> = {};
      moduleRuntimeRs.rows.forEach((r: Record<string, any>) => {
        moduleUsageRuntime[r.module] = Number(r.runtime_count || 0);
        moduleFailCount[r.module] = Number(r.fail_count || 0);
        moduleAvgDurationMs[r.module] = Number(r.avg_duration_ms || 0);
      });

      const moduleFailureTopN = Object.entries(moduleFailCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([module, failures]) => ({ module, failures }));

      const mem = this.getMetricsFromMemory(); // keep design usage compatible
      const successRate = totalFinished > 0 ? (Number(e.completed || 0) / totalFinished) * 100 : 0;
      const averageExecutionTime = Number(e.avg_ms || 0);
      const alerts = buildMetricAlerts({
        successRate,
        totalFinished,
        averageExecutionTime,
        moduleFailureTopN,
        dlqSize: this.notificationDeadLetter.length,
      });

      const out = {
        totalWorkflows: Number(e.total || 0),
        runningWorkflows: Number(e.running || 0),
        completedWorkflows: Number(e.completed || 0),
        failedWorkflows: Number(e.failed || 0),
        averageExecutionTime,
        successRate,
        stepSuccessRate,
        moduleUsage: mem.moduleUsage,
        moduleUsageRuntime,
        moduleFailCount,
        moduleAvgDurationMs,
        moduleFailureTopN,
        alerts,
        window,
        source: 'db',
      };
      setCached(cacheKey, out, Number(process.env.WF_METRICS_CACHE_TTL_MS || 15000));
      return out;
    } catch (err) {
      const mem = this.getMetricsFromMemory();
      const memTotalFinished = Number(mem.completedWorkflows || 0) + Number(mem.failedWorkflows || 0);
      const alerts = buildMetricAlerts({
        successRate: mem.successRate,
        totalFinished: memTotalFinished,
        averageExecutionTime: mem.averageExecutionTime,
        moduleFailureTopN: mem.moduleFailureTopN || [],
        dlqSize: this.notificationDeadLetter.length,
      });
      const out = {
        ...mem,
        alerts,
        window,
        source: 'memory-fallback',
        warning: err instanceof Error ? err.message : 'metrics-db-failed',
      };
      setCached(cacheKey, out, Number(process.env.WF_METRICS_CACHE_TTL_MS || 8000));
      return out;
    }
  }

  cleanup(maxAgeHours = 24): number {
    const cutoff = Date.now() - maxAgeHours * 3600 * 1000;
    let cleaned = 0;
    for (const [id, instance] of this.instances.entries()) {
      const endTs = instance.completedAt ? new Date(instance.completedAt).getTime() : 0;
      if (endTs > 0 && endTs < cutoff) {
        this.instances.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }

  getNotificationDlq(limit = 100): NotificationJob[] {
    return this.notificationDeadLetter.slice(-limit).reverse();
  }

  getNotificationDlqStats() {
    const byError: Record<string, number> = {};
    const byAction: Record<string, number> = {};

    for (const item of this.notificationDeadLetter) {
      const err = (item.lastError || 'unknown-error').slice(0, 120);
      byError[err] = (byError[err] || 0) + 1;
      byAction[item.action] = (byAction[item.action] || 0) + 1;
    }

    const topErrors = Object.entries(byError)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }));

    const topActions = Object.entries(byAction)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    return {
      total: this.notificationDeadLetter.length,
      topErrors,
      topActions,
    };
  }

  replayNotificationDlq(options?: { id?: string; limit?: number }): { queued: number; replayedIds: string[] } {
    const replayedIds: string[] = [];

    if (options?.id) {
      const idx = this.notificationDeadLetter.findIndex(j => j.id === options.id);
      if (idx >= 0) {
        const [job] = this.notificationDeadLetter.splice(idx, 1);
        this.notificationQueue.push({ ...job, attempts: 0, lastError: undefined, queuedAt: new Date().toISOString() });
        replayedIds.push(job.id);
      }
    } else {
      const limit = Math.max(1, Number(options?.limit || 10));
      const items = this.notificationDeadLetter.splice(Math.max(0, this.notificationDeadLetter.length - limit), limit);
      for (const job of items) {
        this.notificationQueue.push({ ...job, attempts: 0, lastError: undefined, queuedAt: new Date().toISOString() });
        replayedIds.push(job.id);
      }
    }

    if (replayedIds.length > 0) {
      this.persistQueueState();
      this.kickNotificationWorker();
    }

    return { queued: replayedIds.length, replayedIds };
  }

  clearNotificationDlq(options?: { ids?: string[]; all?: boolean }): { cleared: number } {
    if (options?.all) {
      const cleared = this.notificationDeadLetter.length;
      this.notificationDeadLetter = [];
      this.persistQueueState();
      return { cleared };
    }

    const ids = new Set(options?.ids || []);
    if (ids.size === 0) return { cleared: 0 };

    const before = this.notificationDeadLetter.length;
    this.notificationDeadLetter = this.notificationDeadLetter.filter(item => !ids.has(item.id));
    const cleared = before - this.notificationDeadLetter.length;
    if (cleared > 0) this.persistQueueState();
    return { cleared };
  }

  async recordExternalNotificationEvent(params: {
    executionId: string;
    workflowId: string;
    stepId: string;
    status: 'completed' | 'failed';
    durationMs?: number;
    errorMessage?: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    clearCache('metrics:');
    await persistStepEvent({
      executionId: params.executionId,
      workflowId: params.workflowId,
      stepId: params.stepId,
      module: 'notification',
      action: 'external-worker-send',
      status: params.status,
      durationMs: params.durationMs,
      errorMessage: params.errorMessage,
      payload: params.payload,
    });
  }

  // 获取工作流状态
  async getWorkflowStatus(instanceId: string): Promise<any> {
    const instance = this.instances.get(instanceId);
    if (!instance) return null;
    const completedSteps = Object.values(instance.stepsStatus).filter(s => s.status === 'completed').length;
    const totalSteps = Object.keys(instance.stepsStatus).length || 1;
    return {
      instanceId,
      status: instance.status,
      progress: Math.round((completedSteps / totalSteps) * 100),
      startedAt: instance.startedAt,
      completedAt: instance.completedAt,
      steps: instance.stepsStatus,
      currentStep: instance.currentStep,
      errors: instance.errors,
    };
  }
}

// 创建并导出工作流协调器实例
export const workflowCoordinator = new WorkflowCoordinator(
  new EventSystem(),
  new TaskScheduler(),
  new ModuleManager(),
  new DataBus()
);

// 注册预定义工作流
Object.values(PredefinedWorkflows).forEach(workflow => {
  workflowCoordinator.registerWorkflow(workflow);
});

logger.info('🚀 工作流协调器初始化完成');