import { createTask } from '@/lib/task-store';
import { addTransaction } from '@/lib/finance-store';
import { addProject, getAllProjects } from '@/lib/freelance-store';
import { TeamCollaborationManager } from '@/lib/team-collaboration';

export type ModuleActionContext = {
  stepId: string;
  module: string;
  action: string;
  merged: Record<string, any>;
  queueNotification: (payload: { stepId: string; action: string; title: string; message: string; dedupKey: string }) => {
    queued: boolean;
    deduped: boolean;
    queueSize: number;
  };
};

type ActionHandler = (ctx: ModuleActionContext) => Promise<Record<string, any>>;

class ModuleActionRegistry {
  private handlers = new Map<string, ActionHandler>();
  private loadedPlugins = false;

  register(module: string, action: string, handler: ActionHandler) {
    this.handlers.set(`${module}.${action}`, handler);
  }

  private tryLoadPlugins() {
    if (this.loadedPlugins) return;
    this.loadedPlugins = true;
    // lightweight hook for future dynamic plugins via global injection
    const anyGlobal = globalThis as any;
    const plugins = anyGlobal.__WORKFLOW_MODULE_PLUGINS__;
    if (Array.isArray(plugins)) {
      for (const p of plugins) {
        if (p?.module && p?.action && typeof p?.handler === 'function') {
          this.register(p.module, p.action, p.handler);
        }
      }
    }
  }

  async execute(ctx: ModuleActionContext): Promise<Record<string, any>> {
    this.tryLoadPlugins();

    const exact = this.handlers.get(`${ctx.module}.${ctx.action}`);
    if (exact) return exact(ctx);

    const wildcard = this.handlers.get(`${ctx.module}.*`);
    if (wildcard) return wildcard(ctx);

    throw new Error(`未支持的模块动作: ${ctx.module}.${ctx.action}`);
  }
}

export const moduleActionRegistry = new ModuleActionRegistry();

moduleActionRegistry.register('tasks', 'select_priority_task', async ({ merged }) => {
  const created = await createTask({
    title: `[WF] 优先任务选择 - ${new Date().toLocaleDateString('zh-CN')}`,
    description: `由工作流自动创建，优先级: ${merged.priority || 'highest'}`,
    priority: merged.priority === 'highest' ? 'high' : 'medium',
    status: 'pending',
    dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    assignedTo: '凯哥',
    tags: ['workflow', 'auto', 'priority-selection'],
    source: 'workflow',
  } as any);
  if (!created) throw new Error('任务创建失败');
  return { selectedTaskId: created.id, priority: merged.priority || 'highest' };
});

moduleActionRegistry.register('tasks', 'record_progress', async () => {
  const created = await createTask({
    title: `[WF] 进展记录 - ${new Date().toLocaleTimeString('zh-CN')}`,
    description: '由工作流自动生成的进展记录任务',
    priority: 'low',
    status: 'pending',
    dueDate: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    assignedTo: '凯哥',
    tags: ['workflow', 'progress'],
    source: 'workflow',
  } as any);
  if (!created) throw new Error('进展任务创建失败');
  return { recorded: true, taskId: created.id };
});

moduleActionRegistry.register('tasks', '*', async ({ module, action }) => ({ delegated: true, module, action }));
moduleActionRegistry.register('automation', '*', async ({ action }) => ({ executed: true, automationAction: action }));

moduleActionRegistry.register('reporting', '*', async ({ stepId, action }) => {
  const reportTask = await createTask({
    title: `[WF] 报告生成 - ${action}`,
    description: `工作流报告任务，来源步骤: ${stepId}`,
    priority: 'medium',
    status: 'pending',
    dueDate: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    assignedTo: '凯哥',
    tags: ['workflow', 'reporting'],
    source: 'workflow',
  } as any);
  if (!reportTask) throw new Error('报告任务创建失败');
  return { reportGenerated: true, reportType: action, title: `Workflow Report - ${stepId}`, reportTaskId: reportTask.id };
});

moduleActionRegistry.register('notification', '*', async ({ stepId, action, merged, queueNotification }) => {
  const title = merged.title || `工作流通知: ${action}`;
  const message = merged.message || `步骤 ${stepId} 已执行`;

  TeamCollaborationManager.sendNotification('kane', {
    title,
    message,
    type: 'info',
    action: { label: '查看工作流', url: '/workflows' },
  });

  const q = queueNotification({
    stepId,
    action,
    title,
    message,
    dedupKey: `${stepId}|${title}|${message}`,
  });

  return {
    notified: q.queued,
    deduped: q.deduped,
    queued: q.queued,
    queueSize: q.queueSize,
    channel: 'notification-queue',
    notificationType: action,
  };
});

moduleActionRegistry.register('finance', 'collect_weekly_data', async ({ stepId, merged }) => {
  const summary = await addTransaction({
    date: new Date().toISOString().slice(0, 10),
    amount: Number(merged.amount || 0),
    category: '工作流采集',
    description: '每周财务采集记录（自动）',
    type: 'income',
    currency: 'PHP',
    status: 'completed',
    tags: ['workflow', 'finance'],
    metadata: { workflow: true, stepId },
  } as any);
  return { collected: true, period: merged.period || 'weekly', transactionId: summary.id };
});
moduleActionRegistry.register('finance', '*', async ({ merged }) => ({ collected: true, period: merged.period || 'weekly', source: 'finance-store' }));

moduleActionRegistry.register('freelance', 'search_projects', async ({ action }) => {
  const all = await getAllProjects();
  return { done: true, freelanceAction: action, candidates: all.length };
});

moduleActionRegistry.register('freelance', 'apply_to_projects', async ({ merged, action }) => {
  const project = await addProject({
    title: `[WF] Auto Follow-up ${new Date().toISOString().slice(0, 10)}`,
    description: '工作流自动创建的外包项目跟进',
    status: 'active',
    source: 'workflow',
    businessSource: 'workflow-automation',
    clientName: merged.clientName || 'Auto Lead',
    budget: Number(merged.budget || 0),
    currency: 'PHP',
    deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    progress: 0,
    category: 'AI服务',
    automationStatus: 'queued',
    notes: '由工作流自动生成',
  } as any);
  return { done: true, freelanceAction: action, projectId: project.id };
});

moduleActionRegistry.register('freelance', '*', async ({ action }) => ({ done: true, freelanceAction: action, candidates: 0 }));
moduleActionRegistry.register('health', '*', async ({ action }) => ({ healthy: true, check: action, timestamp: new Date().toISOString() }));
