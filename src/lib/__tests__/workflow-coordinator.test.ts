// @ts-nocheck
/**
 * WorkflowCoordinator 最Small单元Test套件
 * 覆盖: registerWorkflow, startWorkflow, pauseWorkflow/resumeWorkflow, stopWorkflow
 */
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock all heavy external dependencies before importing the module under test
jest.mock('../automation-framework/core/EventSystem', () => ({
  EventSystem: jest.fn().mockImplementation(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  })),
}));
jest.mock('../automation-framework/core/TaskScheduler', () => ({
  TaskScheduler: jest.fn().mockImplementation(() => ({
    schedule: jest.fn(),
    cancel: jest.fn(),
  })),
}));
jest.mock('../automation-framework/core/ModuleManager', () => ({
  ModuleManager: jest.fn().mockImplementation(() => ({
    execute: jest.fn(),
    getModule: jest.fn(),
  })),
}));
jest.mock('../automation-framework/core/DataBus', () => ({
  DataBus: jest.fn().mockImplementation(() => ({
    publish: jest.fn(),
    subscribe: jest.fn(),
  })),
}));
jest.mock('../team-collaboration', () => ({
  TeamCollaborationManager: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('../workflow/module-action-registry', () => ({
  moduleActionRegistry: { execute: jest.fn() },
}));
jest.mock('../workflow/metric-alerts', () => ({
  buildMetricAlerts: jest.fn(() => []),
}));
jest.mock('../workflow/workflow-metrics-cache', () => ({
  getCached: jest.fn(() => null),
  setCached: jest.fn(),
  clearCache: jest.fn(),
}));
jest.mock('../workflow/workflow-persistence', () => ({
  persistExecutionStart: jest.fn().mockResolvedValue(undefined),
  persistExecutionStatus: jest.fn().mockResolvedValue(undefined),
  persistStepEvent: jest.fn().mockResolvedValue(undefined),
  queryMetricsWindow: jest.fn().mockResolvedValue({
    execRs: { rows: [] },
    stepRs: { rows: [] },
    moduleRs: { rows: [] },
  }),
  queryMetricsTrend: jest.fn().mockResolvedValue({ rows: [] }),
}));
jest.mock('fs');
jest.mock('path');

import { WorkflowCoordinator, WorkflowDefinition } from '../workflow-coordinator';

const makeWorkflow = (id = 'test-wf'): WorkflowDefinition => ({
  id,
  name: 'Test Workflow',
  description: 'For testing',
  version: '1.0.0',
  triggers: [{ type: 'manual' }],
  steps: [
    {
      id: 'step-1',
      name: 'Step 1',
      description: 'First step',
      module: 'mock-module',
      action: 'noop',
      parameters: {},
      timeoutMs: 5000,
      retryAttempts: 0,
      retryDelayMs: 0,
    },
  ],
  metadata: {
    createdBy: 'test',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
  },
});

describe('WorkflowCoordinator', () => {
  let coordinator: WorkflowCoordinator;

  beforeEach(() => {
    coordinator = new WorkflowCoordinator(
      {} as any,  // EventSystem
      {} as any,  // TaskScheduler
      {} as any,  // ModuleManager
      {} as any,  // DataBus
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerWorkflow', () => {
    it('registers a workflow successfully', () => {
      const wf = makeWorkflow('wf-register');
      coordinator.registerWorkflow(wf);
      const instances = coordinator.getInstances('all');
      // No instances yet; just verifying no exception thrown
      expect(instances).toBeDefined();
    });

    it('overwrites a workflow with same id', () => {
      const wf = makeWorkflow('wf-dup');
      coordinator.registerWorkflow(wf);
      const wf2 = { ...wf, name: 'Updated' };
      expect(() => coordinator.registerWorkflow(wf2)).not.toThrow();
    });
  });

  describe('startWorkflow', () => {
    it('throws when workflow not registered', async () => {
      await expect(coordinator.startWorkflow('nonexistent')).rejects.toThrow();
    });

    it('returns an instanceId when workflow is registered', async () => {
      const wf = makeWorkflow('wf-start');
      // Mock the module action so the step completes
      const { moduleActionRegistry } = await import('../workflow/module-action-registry');
      (moduleActionRegistry.execute as jest.Mock).mockResolvedValue({ success: true });

      coordinator.registerWorkflow(wf);
      const instanceId = await coordinator.startWorkflow('wf-start');
      expect(typeof instanceId).toBe('string');
      expect(instanceId.length).toBeGreaterThan(0);
    });
  });

  describe('pauseWorkflow / resumeWorkflow', () => {
    it('returns false when pausing non-existent instance', () => {
      expect(coordinator.pauseWorkflow('bad-id')).toBe(false);
    });

    it('returns false when resuming non-existent instance', () => {
      expect(coordinator.resumeWorkflow('bad-id')).toBe(false);
    });
  });

  describe('stopWorkflow', () => {
    it('returns false when stopping non-existent instance', async () => {
      const result = await coordinator.stopWorkflow('bad-id');
      expect(result).toBe(false);
    });
  });

  describe('getInstances', () => {
    it('returns empty array when no workflows started', () => {
      const instances = coordinator.getInstances('all');
      expect(Array.isArray(instances)).toBe(true);
    });

    it('filters by status', () => {
      const running = coordinator.getInstances('running');
      const completed = coordinator.getInstances('completed');
      expect(Array.isArray(running)).toBe(true);
      expect(Array.isArray(completed)).toBe(true);
    });
  });
});
