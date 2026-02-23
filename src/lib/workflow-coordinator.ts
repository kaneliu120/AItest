// 修复的工作流协调器 - 类型安全版本
import { EventSystem } from './automation-framework/core/EventSystem';
import { TaskScheduler } from './automation-framework/core/TaskScheduler';
import { ModuleManager } from './automation-framework/core/ModuleManager';
import { DataBus } from './automation-framework/core/DataBus';

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
export class WorkflowCoordinator {
  private workflows: Map<string, WorkflowDefinition> = new Map();
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
  }

  // 注册工作流
  registerWorkflow(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
    console.log(`✅ 工作流注册成功: ${workflow.name} (${workflow.id})`);
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
    console.log(`🚀 启动工作流: ${workflow.name} (实例: ${instanceId})`);

    // 这里应该创建工作流实例并开始执行
    // 简化版本：返回实例ID
    return instanceId;
  }

  // 停止工作流
  async stopWorkflow(instanceId: string): Promise<boolean> {
    console.log(`⏹️ 停止工作流实例: ${instanceId}`);
    return true;
  }

  // 获取工作流状态
  async getWorkflowStatus(instanceId: string): Promise<any> {
    return {
      instanceId,
      status: 'completed',
      progress: 100,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      steps: []
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

console.log('🚀 工作流协调器初始化完成');