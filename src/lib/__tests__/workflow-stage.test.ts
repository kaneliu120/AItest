// @ts-nocheck
/**
 * workflow-stage.ts Status机Edge界Test
 * 覆盖: canMove() 所All合法/非法转移, moveStage() 事务逻辑
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// jest.mock is hoisted - define helpers inside the factory
jest.mock('@/shared/db/client', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(mockClient),
    _client: mockClient,
  };
  return mockPool;
});

import { canMove, moveStage, getStage } from '../workflow-stage';
import type { WorkflowStage } from '../workflow-constants';
import pool from '@/shared/db/client';

// Access mock helpers through the module reference after import
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPool = pool as any;
const mockClient = mockPool._client;

// All valid one-step transitions from the state machine definition
const VALID_TRANSITIONS: [WorkflowStage, WorkflowStage][] = [
  ['draft', 'accepted'],
  ['accepted', 'outsource_confirmed'],
  ['outsource_confirmed', 'analysis_done'],
  ['analysis_done', 'automation_done'],
  ['automation_done', 'test_passed'],
  ['automation_done', 'test_failed'],
  ['test_failed', 'troubleshooting'],
  ['troubleshooting', 'test_passed'],
  ['troubleshooting', 'test_failed'],
  ['test_passed', 'deploy_ready'],
  ['deploy_ready', 'deployed'],
  ['deployed', 'invoiced'],
  ['invoiced', 'closed'],
];

// Invalid: skip a stage or go backwards
const INVALID_TRANSITIONS: [WorkflowStage, WorkflowStage][] = [
  ['draft', 'analysis_done'],       // skip stages
  ['closed', 'draft'],              // backwards
  ['test_passed', 'test_failed'],   // parallel branch cannot reverse
  ['deployed', 'draft'],            // far backwards
  ['invoiced', 'accepted'],         // backwards multi-step
];

describe('canMove()', () => {
  describe('valid transitions', () => {
    VALID_TRANSITIONS.forEach(([from, to]) => {
      it(`${from} → ${to}`, () => {
        expect(canMove(from, to)).toBe(true);
      });
    });
  });

  describe('invalid transitions', () => {
    INVALID_TRANSITIONS.forEach(([from, to]) => {
      it(`${from} → ${to} is rejected`, () => {
        expect(canMove(from, to)).toBe(false);
      });
    });
  });

  it('closed stage has no valid exits', () => {
    const allStages: WorkflowStage[] = [
      'draft','accepted','outsource_confirmed','analysis_done',
      'automation_done','test_failed','troubleshooting','test_passed',
      'deploy_ready','deployed','invoiced','closed',
    ];
    allStages.forEach(target => {
      expect(canMove('closed', target)).toBe(false);
    });
  });
});

describe('getStage()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the stage from db row', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ workflow_stage: 'accepted' }] });
    const stage = await getStage('task-1');
    expect(stage).toBe('accepted');
  });

  it('returns null when task not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    const stage = await getStage('nonexistent');
    expect(stage).toBeNull();
  });
});

describe('moveStage()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: all client.query calls resolve to empty success
    mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  it('throws when task does not exist', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [] }); // SELECT ... FOR UPDATE (no row)

    await expect(moveStage('bad-id', 'accepted', 'test')).rejects.toThrow('Taskdoes not exist');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('throws and rolls back on illegal transition', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ workflow_stage: 'draft' }] }); // SELECT

    await expect(moveStage('task-1', 'analysis_done', 'skip')).rejects.toThrow('非法Statusmigration');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('commits and returns event on valid transition (draft → accepted)', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ workflow_stage: 'draft' }] }) // SELECT FOR UPDATE
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // UPDATE mission_tasks (no ts col for draft→accepted? check: accepted_at exists)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // INSERT event
      .mockResolvedValueOnce(undefined); // COMMIT

    const result = await moveStage('task-1', 'accepted', 'manual-accept', 'user-1');
    expect(result.from).toBe('draft');
    expect(result.to).toBe('accepted');
    expect(typeof result.eventId).toBe('string');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  });

  it('auto-creates test plan subtask when moving to analysis_done', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ workflow_stage: 'outsource_confirmed' }] }) // SELECT FOR UPDATE
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // UPDATE workflow_stage
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // INSERT event
      // runPostStageActions calls:
      .mockResolvedValueOnce({ rows: [{ id: 't1', level: 1, title: 'My Task' }] }) // SELECT task info
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // SELECT exists check
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // INSERT subtask
      .mockResolvedValueOnce(undefined); // COMMIT

    const result = await moveStage('task-1', 'analysis_done', 'analysis-complete');
    expect(result.to).toBe('analysis_done');
    // Verify INSERT into mission_tasks was called (the auto-trigger subtask)
    const insertCalls = (mockClient.query as jest.Mock).mock.calls.filter(
      (call: unknown[]) => typeof call[0] === 'string' && (call[0] as string).includes('INSERT INTO mission_tasks')
    );
    expect(insertCalls.length).toBeGreaterThan(0);
  });

  it('releases client even when error occurs mid-transaction', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockRejectedValueOnce(new Error('db error')); // SELECT throws

    await expect(moveStage('task-1', 'accepted', 'evt')).rejects.toThrow('db error');
    expect(mockClient.release).toHaveBeenCalled();
  });
});
