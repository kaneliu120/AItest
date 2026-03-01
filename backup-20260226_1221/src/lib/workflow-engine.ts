// 工作流引擎 - 协调整个开发流程

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'input' | 'process' | 'decision' | 'output';
  description: string;
  action: string; // 要执行的动作
  parameters?: Record<string, any>;
  nextSteps?: string[]; // 下一步的ID
  conditions?: {
    [stepId: string]: (context: WorkflowContext) => boolean;
  };
  timeout?: number; // 超时时间（毫秒）
  retryCount?: number; // 重试次数
}

export interface WorkflowContext {
  workflowId: string;
  currentStep: string;
  data: Record<string, any>;
  history: WorkflowHistory[];
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  createdBy: string;
}

export interface WorkflowHistory {
  stepId: string;
  timestamp: string;
  action: string;
  result: 'success' | 'failure' | 'skipped';
  data?: any;
  error?: string;
  duration: number; // 毫秒
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: WorkflowStep[];
  entryPoint: string; // 入口步骤ID
  variables?: Record<string, any>;
  metadata?: {
    created: string;
    updated: string;
    author: string;
    tags: string[];
  };
}

export interface WorkflowExecution {
  id: string;
  definitionId: string;
  context: WorkflowContext;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  activeExecutions: number;
  byWorkflowType: Record<string, number>;
}

export class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private stats: WorkflowStats = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageDuration: 0,
    activeExecutions: 0,
    byWorkflowType: {}
  };

  // 注册工作流定义
  registerWorkflow(definition: WorkflowDefinition): void {
    this.workflows.set(definition.id, definition);
    console.log(`[WorkflowEngine] 工作流注册: ${definition.name} (${definition.id})`);
  }

  // 启动工作流执行
  async startWorkflow(definitionId: string, initialData: Record<string, any> = {}, userId: string = 'system'): Promise<string> {
    const definition = this.workflows.get(definitionId);
    if (!definition) {
      throw new Error(`工作流定义不存在: ${definitionId}`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const context: WorkflowContext = {
      workflowId: definitionId,
      currentStep: definition.entryPoint,
      data: { ...definition.variables, ...initialData },
      history: [],
      status: 'running',
      startTime: new Date().toISOString(),
      createdBy: userId
    };

    const execution: WorkflowExecution = {
      id: executionId,
      definitionId,
      context,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.executions.set(executionId, execution);
    this.stats.totalExecutions++;
    this.stats.activeExecutions++;
    this.stats.byWorkflowType[definitionId] = (this.stats.byWorkflowType[definitionId] || 0) + 1;

    console.log(`[WorkflowEngine] 工作流启动: ${definition.name} (${executionId})`);

    // 开始执行
    this.executeStep(executionId);

    return executionId;
  }

  // 执行单个步骤
  private async executeStep(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution || execution.context.status !== 'running') {
      return;
    }

    const definition = this.workflows.get(execution.context.workflowId);
    if (!definition) {
      execution.context.status = 'failed';
      execution.context.endTime = new Date().toISOString();
      this.stats.activeExecutions--;
      this.stats.failedExecutions++;
      return;
    }

    const step = definition.steps.find(s => s.id === execution.context.currentStep);
    if (!step) {
      execution.context.status = 'failed';
      execution.context.endTime = new Date().toISOString();
      this.stats.activeExecutions--;
      this.stats.failedExecutions++;
      return;
    }

    const stepStartTime = Date.now();
    let result: 'success' | 'failure' | 'skipped' = 'success';
    let error: string | undefined;
    let stepData: any;

    try {
      console.log(`[WorkflowEngine] 执行步骤: ${step.name} (${step.id})`);
      
      // 执行步骤动作
      stepData = await this.executeAction(step.action, execution.context.data, step.parameters);
      
      // 记录成功
      execution.context.history.push({
        stepId: step.id,
        timestamp: new Date().toISOString(),
        action: step.action,
        result: 'success',
        data: stepData,
        duration: Date.now() - stepStartTime
      });

    } catch (err) {
      result = 'failure';
      error = err instanceof Error ? err.message : String(err);
      
      console.error(`[WorkflowEngine] 步骤执行失败: ${step.name}`, error);
      
      // 记录失败
      execution.context.history.push({
        stepId: step.id,
        timestamp: new Date().toISOString(),
        action: step.action,
        result: 'failure',
        error,
        duration: Date.now() - stepStartTime
      });

      // 检查重试逻辑
      const retryCount = step.retryCount || 0;
      const retryHistory = execution.context.history.filter(h => 
        h.stepId === step.id && h.result === 'failure'
      ).length;

      if (retryHistory <= retryCount) {
        console.log(`[WorkflowEngine] 重试步骤: ${step.name} (${retryHistory}/${retryCount})`);
        // 等待后重试
        setTimeout(() => this.executeStep(executionId), 1000);
        return;
      }
    }

    execution.updatedAt = new Date().toISOString();

    // 决定下一步
    if (result === 'success' && step.nextSteps && step.nextSteps.length > 0) {
      // 如果有条件，根据条件选择下一步
      if (step.conditions) {
        for (const nextStepId of step.nextSteps) {
          const condition = step.conditions[nextStepId];
          if (condition && condition(execution.context)) {
            execution.context.currentStep = nextStepId;
            setTimeout(() => this.executeStep(executionId), 100);
            return;
          }
        }
      }
      
      // 默认选择第一个下一步
      execution.context.currentStep = step.nextSteps[0];
      setTimeout(() => this.executeStep(executionId), 100);
      
    } else if (result === 'success' && (!step.nextSteps || step.nextSteps.length === 0)) {
      // 工作流完成
      execution.context.status = 'completed';
      execution.context.endTime = new Date().toISOString();
      this.stats.activeExecutions--;
      this.stats.successfulExecutions++;
      
      const duration = new Date(execution.context.endTime).getTime() - new Date(execution.context.startTime).getTime();
      this.updateAverageDuration(duration);
      
      console.log(`[WorkflowEngine] 工作流完成: ${definition.name} (${executionId})`);
      
    } else if (result === 'failure') {
      // 工作流失败
      execution.context.status = 'failed';
      execution.context.endTime = new Date().toISOString();
      this.stats.activeExecutions--;
      this.stats.failedExecutions++;
      
      console.error(`[WorkflowEngine] 工作流失败: ${definition.name} (${executionId})`);
    }
  }

  // 执行具体动作
  private async executeAction(action: string, context: Record<string, any>, parameters?: Record<string, any>): Promise<any> {
    // 这里应该集成实际的系统动作
    // 目前先实现一些模拟动作
    
    switch (action) {
      case 'log':
        console.log(`[WorkflowAction] ${parameters?.message || 'No message'}`);
        return { logged: true };
        
      case 'delay':
        const delay = parameters?.ms || 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return { delayed: delay };
        
      case 'validate':
        // 简单的验证逻辑
        const required = parameters?.required || [];
        const missing = required.filter((field: string) => !context[field]);
        
        if (missing.length > 0) {
          throw new Error(`缺少必要字段: ${missing.join(', ')}`);
        }
        return { valid: true };
        
      case 'transform':
        // 数据转换
        const mapping = parameters?.mapping || {};
        const result: Record<string, any> = {};
        
        for (const [target, source] of Object.entries(mapping)) {
          if (typeof source === 'string') {
            result[target] = context[source];
          } else if (typeof source === 'function') {
            result[target] = source(context);
          }
        }
        return result;
        
      default:
        throw new Error(`未知的动作: ${action}`);
    }
  }

  // 更新平均持续时间
  private updateAverageDuration(newDuration: number): void {
    const totalCompleted = this.stats.successfulExecutions + this.stats.failedExecutions;
    this.stats.averageDuration = (
      (this.stats.averageDuration * (totalCompleted - 1) + newDuration) / totalCompleted
    );
  }

  // 获取工作流执行状态
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  // 获取所有执行
  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }

  // 获取统计信息
  getStats(): WorkflowStats {
    return { ...this.stats };
  }

  // 获取工作流定义
  getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId);
  }

  // 获取所有工作流定义
  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  // 暂停工作流
  pauseWorkflow(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (execution && execution.context.status === 'running') {
      execution.context.status = 'paused';
      execution.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // 恢复工作流
  resumeWorkflow(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (execution && execution.context.status === 'paused') {
      execution.context.status = 'running';
      execution.updatedAt = new Date().toISOString();
      setTimeout(() => this.executeStep(executionId), 100);
      return true;
    }
    return false;
  }

  // 取消工作流
  cancelWorkflow(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (execution && (execution.context.status === 'running' || execution.context.status === 'paused')) {
      execution.context.status = 'cancelled';
      execution.context.endTime = new Date().toISOString();
      execution.updatedAt = new Date().toISOString();
      this.stats.activeExecutions--;
      return true;
    }
    return false;
  }
}

// 预定义的工作流
export const predefinedWorkflows: WorkflowDefinition[] = [
  {
    id: 'project-development',
    name: '项目开发工作流',
    description: '完整的项目开发流程：需求分析 → 开发 → 测试 → 部署',
    version: '1.0.0',
    entryPoint: 'requirements-analysis',
    steps: [
      {
        id: 'requirements-analysis',
        name: '需求分析',
        type: 'process',
        description: '分析项目需求和技术栈',
        action: 'validate',
        parameters: {
          required: ['projectName', 'techStack', 'timeline']
        },
        nextSteps: ['project-setup']
      },
      {
        id: 'project-setup',
        name: '项目初始化',
        type: 'process',
        description: '创建项目结构和配置',
        action: 'log',
        parameters: {
          message: '正在初始化项目...'
        },
        nextSteps: ['development']
      },
      {
        id: 'development',
        name: '开发阶段',
        type: 'process',
        description: '编写代码和实现功能',
        action: 'delay',
        parameters: { ms: 2000 },
        nextSteps: ['testing']
      },
      {
        id: 'testing',
        name: '测试阶段',
        type: 'process',
        description: '执行单元测试和集成测试',
        action: 'log',
        parameters: {
          message: '正在运行测试...'
        },
        nextSteps: ['deployment']
      },
      {
        id: 'deployment',
        name: '部署上线',
        type: 'process',
        description: '部署应用到生产环境',
        action: 'log',
        parameters: {
          message: '正在部署应用...'
        },
        nextSteps: []
      }
    ],
    variables: {
      environment: 'production'
    },
    metadata: {
      created: '2026-02-21',
      updated: '2026-02-21',
      author: 'system',
      tags: ['development', 'automation']
    }
  },
  {
    id: 'bug-fix',
    name: 'Bug修复工作流',
    description: 'Bug报告 → 分析 → 修复 → 测试 → 部署',
    version: '1.0.0',
    entryPoint: 'bug-report',
    steps: [
      {
        id: 'bug-report',
        name: 'Bug报告',
        type: 'input',
        description: '接收Bug报告',
        action: 'validate',
        parameters: {
          required: ['bugDescription', 'severity', 'reproductionSteps']
        },
        nextSteps: ['bug-analysis']
      },
      {
        id: 'bug-analysis',
        name: 'Bug分析',
        type: 'process',
        description: '分析Bug原因和影响',
        action: 'log',
        parameters: {
          message: '正在分析Bug...'
        },
        nextSteps: ['fix-development']
      },
      {
        id: 'fix-development',
        name: '修复开发',
        type: 'process',
        description: '编写修复代码',
        action: 'delay',
        parameters: { ms: 1500 },
        nextSteps: ['fix-testing']
      },
      {
        id: 'fix-testing',
        name: '修复测试',
        type: 'process',
        description: '测试修复是否有效',
        action: 'log',
        parameters: {
          message: '正在测试修复...'
        },
        nextSteps: ['fix-deployment']
      },
      {
        id: 'fix-deployment',
        name: '修复部署',
        type: 'process',
        description: '部署修复到生产环境',
        action: 'log',
        parameters: {
          message: '正在部署修复...'
        },
        nextSteps: []
      }
    ],
    metadata: {
      created: '2026-02-21',
      updated: '2026-02-21',
      author: 'system',
      tags: ['bug', 'maintenance']
    }
  }];

// 全局实例
export const workflowEngine = new WorkflowEngine();

// 初始化预定义工作流
predefinedWorkflows.forEach(workflow => {
  workflowEngine.registerWorkflow(workflow);
});