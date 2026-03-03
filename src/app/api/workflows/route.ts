import { NextRequest, NextResponse } from 'next/server';
import { workflowCoordinator, PredefinedWorkflows } from '@/lib/workflow-coordinator';
import fs from 'fs';
import path from 'path';
import { isWorkflowAdminAuthorized } from '@/lib/auth/workflow-auth';
import { ok, fail } from '@/lib/api-response';

const successResponse = (data: unknown, meta?: unknown) => ok({ data, meta });
const errorResponse = (message: string, status = 500) => fail(message, status);


const diagDir = path.join(process.cwd(), 'data', 'workflow');
const diagHistoryFile = path.join(diagDir, 'diagnostic-history.json');

function ensureDiagStorage() {
  if (!fs.existsSync(diagDir)) fs.mkdirSync(diagDir, { recursive: true });
}

function readDiagHistory(): any[] {
  ensureDiagStorage();
  try {
    if (!fs.existsSync(diagHistoryFile)) return [];
    const data = JSON.parse(fs.readFileSync(diagHistoryFile, 'utf-8'));
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

function appendDiagHistory(item: any) {
  const items = readDiagHistory();
  items.push(item);
  const latest = items.slice(-200);
  fs.writeFileSync(diagHistoryFile, JSON.stringify({ items: latest, updatedAt: new Date().toISOString() }, null, 2));
}

const alertState = new Map<string, number>();

function applyAlertDedupeAndSilence(alerts: Array<{ level: 'info' | 'warning' | 'critical'; code: string; message: string }>, now = Date.now()) {
  const dedupeMs = Number(process.env.WF_ALERT_DEDUPE_MS || 10 * 60 * 1000);
  const silenceMs = Number(process.env.WF_ALERT_SILENCE_MS || 0);
  const out: typeof alerts = [];

  for (const a of alerts) {
    const key = `${a.code}:${a.message}`;
    const last = alertState.get(key) || 0;
    if (silenceMs > 0 && now - last < silenceMs) continue;
    if (now - last < dedupeMs) continue;
    alertState.set(key, now);
    out.push(a);
  }
  return out;
}

function buildHealthRecommendations(alerts: Array<{ level: 'info' | 'warning' | 'critical'; code: string; message: string }> = []) {
  const recs: string[] = [];
  const codes = new Set(alerts.map(a => a.code));

  if (codes.has('LOW_SUCCESS_RATE') || codes.has('SUCCESS_RATE_DROP')) {
    recs.push('Check recent failed steps and module hotspots, prioritize processing the top failed module. ');
  }
  if (codes.has('DLQ_BACKLOG') || codes.has('DLQ_BACKLOG_HIGH')) {
    recs.push('Check notification channel config and execute DLQ replay, clear stale messages if necessary. ');
  }
  if (codes.has('AVG_EXECUTION_SLOW')) {
    recs.push('Investigate slow steps (high duration module/action), consider async or rate limiting. ');
  }
  if (codes.has('MODULE_FAILURE_HOTSPOT')) {
    recs.push('Add retry and diagnostic logging for failed hotspot modules. ');
  }

  if (recs.length === 0) {
    recs.push('No current high priority risks, maintain routine monitoring. ');
  }

  return recs;
}

async function runDiagnostic(kind: string) {
  switch (kind) {
    case 'telegram-env':
      return {
        command: 'env check: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID',
        output: {
          TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? 'set' : 'missing',
          TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID ? 'set' : 'missing',
        },
      };
    case 'discord-env':
      return {
        command: 'env check: DISCORD_WEBHOOK_URL',
        output: {
          DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL ? 'set' : 'missing',
        },
      };
    case 'network-check': {
      const urls = ['https://api.telegram.org', 'https://discord.com'];
      const checks = await Promise.all(
        urls.map(async (url) => {
          try {
            const resp = await fetch(url, {
              method: 'HEAD',
              signal: AbortSignal.timeout(5000),
            });
            return { url, ok: resp.ok, status: resp.status };
          } catch (e) {
            return { url, ok: false, status: 0, error: e instanceof Error ? e.message : 'unknown-error' };
          }
        })
      );
      return { command: 'HEAD https://api.telegram.org && https://discord.com (timeout=5s)', output: checks };
    }
    default:
      return {
        command: 'env check: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID / DISCORD_WEBHOOK_URL',
        output: {
          TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? 'set' : 'missing',
          TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID ? 'set' : 'missing',
          DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL ? 'set' : 'missing',
        },
      };
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'list';

    switch (action) {
      case 'list': {
        const workflows = workflowCoordinator.getAllWorkflows();
        return successResponse({
          workflows,
          total: workflows.length,
          predefined: Object.values(PredefinedWorkflows).length,
        });
      }

      case 'status': {
        const status = (url.searchParams.get('status') || 'all') as any;
        const instances = workflowCoordinator.getInstances(status);
        return successResponse({
          instances,
          total: instances.length,
          running: instances.filter((i) => i.status === 'running').length,
        });
      }

      case 'instances': {
        const status = (url.searchParams.get('status') || 'all') as any;
        const instances = workflowCoordinator.getInstances(status);
        return successResponse({
          instances,
          total: instances.length,
          running: instances.filter((i) => i.status === 'running').length,
        });
      }

      case 'metrics': {
        const window = (url.searchParams.get('window') || '24h') as '1h' | '24h' | '7d';
        return successResponse(await workflowCoordinator.getMetrics(window));
      }

      case 'metrics-trend': {
        const hours = Number(url.searchParams.get('hours') || 24);
        const points = await workflowCoordinator.getMetricsTrend(hours);
        return successResponse({ hours, points, total: points.length });
      }

      case 'health': {
        const metrics = await workflowCoordinator.getMetrics('24h');
        const rawAlerts = Array.isArray((metrics as any).alerts) ? (metrics as any).alerts : [];
        const alerts = applyAlertDedupeAndSilence(rawAlerts);

        let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
        if (rawAlerts.some((a: any) => a.level === 'critical')) status = 'critical';
        else if (rawAlerts.some((a: any) => a.level === 'warning')) status = 'degraded';

        const issues = rawAlerts.map((a: any) => `[${a.code}] ${a.message}`);
        const recommendations = buildHealthRecommendations(rawAlerts);

        const slo = {
          successRate24h: Number((metrics as any).successRate || 0),
          averageExecutionTime24h: Number((metrics as any).averageExecutionTime || 0),
          target: {
            successRateMin: Number(process.env.WF_SLO_SUCCESS_RATE_MIN || 95),
            avgExecutionTimeMaxMs: Number(process.env.WF_SLO_AVG_MS_MAX || 30000),
          },
        };

        return successResponse({
          status,
          issues,
          alerts,
          recommendations,
          slo,
          metrics,
        });
      }

      case 'notification-dlq': {
        if (!isWorkflowAdminAuthorized(request)) {
          return errorResponse('No permission to access Notification DLQ', 403);
        }
        const limit = Number(url.searchParams.get('limit') || 100);
        const items = workflowCoordinator.getNotificationDlq(limit);
        const stats = workflowCoordinator.getNotificationDlqStats();
        return successResponse({ items, total: items.length, stats });
      }

      case 'diagnostic-history': {
        if (!isWorkflowAdminAuthorized(request)) {
          return errorResponse('No permission to access diagnostic history', 403);
        }
        const limit = Number(url.searchParams.get('limit') || 50);
        const items = readDiagHistory().slice(-limit).reverse();
        return successResponse({ items, total: items.length });
      }

      default:
        return errorResponse(`Unknown operation: ${action}`, 400);
    }
  } catch (error) {
    console.error('WorkflowAPIerror:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, workflowId, parameters, instanceId } = body;

    if (!action) {
      return errorResponse('Missing action parameter', 400);
    }

    switch (action) {
      case 'start':
      case 'execute': {
        if (!workflowId) {
          return errorResponse('Missing workflowId parameter', 400);
        }
        const id = await workflowCoordinator.startWorkflow(workflowId, parameters || body.input || {});
        return successResponse({
          instanceId: id,
          status: 'running',
          message: `WorkflowStartsuccess: ${workflowId}`,
        });
      }

      case 'stop':
      case 'cancel': {
        if (!instanceId) {
          return errorResponse('Missing instanceId parameter', 400);
        }
        const stopped = await workflowCoordinator.stopWorkflow(instanceId);
        return successResponse({ stopped, message: stopped ? 'WorkflowStopsuccess' : 'WorkflowStopfailed' });
      }

      case 'pause': {
        if (!instanceId) return errorResponse('Missing instanceId parameter', 400);
        const ok = workflowCoordinator.pauseWorkflow(instanceId);
        return successResponse({ paused: ok, message: ok ? 'WorkflowalreadyOn Hold' : 'On Holdfailed' });
      }

      case 'resume': {
        if (!instanceId) return errorResponse('Missing instanceId parameter', 400);
        const ok = workflowCoordinator.resumeWorkflow(instanceId);
        return successResponse({ resumed: ok, message: ok ? 'WorkflowalreadyResume' : 'Resumefailed' });
      }

      case 'cleanup': {
        const maxAgeHours = Number(body.maxAgeHours || 24);
        const cleanedCount = workflowCoordinator.cleanup(maxAgeHours);
        return successResponse({ cleanedCount, message: 'Cleanup completed' });
      }

      case 'register': {
        const { workflow } = body;
        if (!workflow || !workflow.id || !workflow.name) {
          return errorResponse('Missing workflow definition', 400);
        }
        workflowCoordinator.registerWorkflow(workflow);
        return successResponse({ workflowId: workflow.id, message: 'WorkflowRegistersuccess' });
      }

      case 'replay-notification-dlq': {
        if (!isWorkflowAdminAuthorized(request)) {
          return errorResponse('No permission to replay Notification DLQ', 403);
        }
        const { id, limit } = body;
        const result = workflowCoordinator.replayNotificationDlq({ id, limit });
        return successResponse({ ...result, message: 'DLQ replay submitted' });
      }

      case 'clear-notification-dlq': {
        if (!isWorkflowAdminAuthorized(request)) {
          return errorResponse('No permission to clear Notification DLQ', 403);
        }
        const { ids, all } = body;
        const result = workflowCoordinator.clearNotificationDlq({ ids, all });
        return successResponse({ ...result, message: 'DLQ cleanup completed' });
      }

      case 'run-notification-diagnostic': {
        if (!isWorkflowAdminAuthorized(request)) {
          return errorResponse('No permission to execute diagnostics', 403);
        }
        const kind = body.kind || 'generic-env';
        const result = await runDiagnostic(kind);
        const historyItem = {
          id: `diag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          kind,
          command: result.command,
          output: result.output,
          createdAt: new Date().toISOString(),
        };
        appendDiagHistory(historyItem);
        return successResponse({ ...result, kind, historyId: historyItem.id, message: 'Diagnostics executed' });
      }

      case 'worker-notification-event': {
        if (!isWorkflowAdminAuthorized(request)) {
          return errorResponse('No permission to write worker notification event', 403);
        }
        const { executionId, workflowId, stepId, status, durationMs, errorMessage, payload } = body;
        if (!executionId || !workflowId || !stepId || !status) {
          return errorResponse('Missing  executionId/workflowId/stepId/status', 400);
        }
        if (!['completed', 'failed'].includes(status)) {
          return errorResponse('status only supports completed/failed', 400);
        }
        await workflowCoordinator.recordExternalNotificationEvent({
          executionId,
          workflowId,
          stepId,
          status,
          durationMs,
          errorMessage,
          payload,
        });
        return successResponse({ message: 'Worker notification event written successfully' });
      }

      default:
        return errorResponse(`Unknown operation: ${action}`, 400);
    }
  } catch (error) {
    console.error('WorkflowAPIerror:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
}
