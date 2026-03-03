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
    recs.push('检查最近失败步骤与模块热点，优先处理失败Top1模块。');
  }
  if (codes.has('DLQ_BACKLOG') || codes.has('DLQ_BACKLOG_HIGH')) {
    recs.push('检查通知渠道配置并执行DLQ重放，必要时清理失效消息。');
  }
  if (codes.has('AVG_EXECUTION_SLOW')) {
    recs.push('排查慢步骤（duration高的module/action），考虑异步化或限流。');
  }
  if (codes.has('MODULE_FAILURE_HOTSPOT')) {
    recs.push('针对失败热点模块增加重试与诊断日志。');
  }

  if (recs.length === 0) {
    recs.push('当前无高优先级风险，保持例行监控。');
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
          return errorResponse('无权访问通知DLQ', 403);
        }
        const limit = Number(url.searchParams.get('limit') || 100);
        const items = workflowCoordinator.getNotificationDlq(limit);
        const stats = workflowCoordinator.getNotificationDlqStats();
        return successResponse({ items, total: items.length, stats });
      }

      case 'diagnostic-history': {
        if (!isWorkflowAdminAuthorized(request)) {
          return errorResponse('无权访问诊断历史', 403);
        }
        const limit = Number(url.searchParams.get('limit') || 50);
        const items = readDiagHistory().slice(-limit).reverse();
        return successResponse({ items, total: items.length });
      }

      default:
        return errorResponse(`未知操作: ${action}`, 400);
    }
  } catch (error) {
    console.error('工作流API错误:', error);
    return errorResponse(error instanceof Error ? error.message : '未知错误');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, workflowId, parameters, instanceId } = body;

    if (!action) {
      return errorResponse('缺少 action 参数', 400);
    }

    switch (action) {
      case 'start':
      case 'execute': {
        if (!workflowId) {
          return errorResponse('缺少 workflowId 参数', 400);
        }
        const id = await workflowCoordinator.startWorkflow(workflowId, parameters || body.input || {});
        return successResponse({
          instanceId: id,
          status: 'running',
          message: `工作流启动成功: ${workflowId}`,
        });
      }

      case 'stop':
      case 'cancel': {
        if (!instanceId) {
          return errorResponse('缺少 instanceId 参数', 400);
        }
        const stopped = await workflowCoordinator.stopWorkflow(instanceId);
        return successResponse({ stopped, message: stopped ? '工作流停止成功' : '工作流停止失败' });
      }

      case 'pause': {
        if (!instanceId) return errorResponse('缺少 instanceId 参数', 400);
        const ok = workflowCoordinator.pauseWorkflow(instanceId);
        return successResponse({ paused: ok, message: ok ? '工作流已暂停' : '暂停失败' });
      }

      case 'resume': {
        if (!instanceId) return errorResponse('缺少 instanceId 参数', 400);
        const ok = workflowCoordinator.resumeWorkflow(instanceId);
        return successResponse({ resumed: ok, message: ok ? '工作流已恢复' : '恢复失败' });
      }

      case 'cleanup': {
        const maxAgeHours = Number(body.maxAgeHours || 24);
        const cleanedCount = workflowCoordinator.cleanup(maxAgeHours);
        return successResponse({ cleanedCount, message: '清理完成' });
      }

      case 'register': {
        const { workflow } = body;
        if (!workflow || !workflow.id || !workflow.name) {
          return errorResponse('缺少工作流定义', 400);
        }
        workflowCoordinator.registerWorkflow(workflow);
        return successResponse({ workflowId: workflow.id, message: '工作流注册成功' });
      }

      case 'replay-notification-dlq': {
        if (!isWorkflowAdminAuthorized(request)) {
          return errorResponse('无权重放通知DLQ', 403);
        }
        const { id, limit } = body;
        const result = workflowCoordinator.replayNotificationDlq({ id, limit });
        return successResponse({ ...result, message: 'DLQ 重放已提交' });
      }

      case 'clear-notification-dlq': {
        if (!isWorkflowAdminAuthorized(request)) {
          return errorResponse('无权清理通知DLQ', 403);
        }
        const { ids, all } = body;
        const result = workflowCoordinator.clearNotificationDlq({ ids, all });
        return successResponse({ ...result, message: 'DLQ 清理完成' });
      }

      case 'run-notification-diagnostic': {
        if (!isWorkflowAdminAuthorized(request)) {
          return errorResponse('无权执行诊断', 403);
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
        return successResponse({ ...result, kind, historyId: historyItem.id, message: '诊断执行完成' });
      }

      case 'worker-notification-event': {
        if (!isWorkflowAdminAuthorized(request)) {
          return errorResponse('无权写入worker通知事件', 403);
        }
        const { executionId, workflowId, stepId, status, durationMs, errorMessage, payload } = body;
        if (!executionId || !workflowId || !stepId || !status) {
          return errorResponse('缺少 executionId/workflowId/stepId/status', 400);
        }
        if (!['completed', 'failed'].includes(status)) {
          return errorResponse('status 仅支持 completed/failed', 400);
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
        return successResponse({ message: 'worker通知事件写入成功' });
      }

      default:
        return errorResponse(`未知操作: ${action}`, 400);
    }
  } catch (error) {
    console.error('工作流API错误:', error);
    return errorResponse(error instanceof Error ? error.message : '未知错误');
  }
}
