#!/usr/bin/env node

/**
 * External Notification Worker
 * - Reads queue from data/workflow/notification-queue.json
 * - Sends Telegram/Discord notifications
 * - Retries failed jobs and moves to DLQ after 3 attempts
 */

const fs = require('fs');
const path = require('path');

const queueDir = path.join(process.cwd(), 'data', 'workflow');
const queueFile = path.join(queueDir, 'notification-queue.json');
const dlqFile = path.join(queueDir, 'notification-dlq.json');

function ensure() {
  if (!fs.existsSync(queueDir)) fs.mkdirSync(queueDir, { recursive: true });
  if (!fs.existsSync(queueFile)) fs.writeFileSync(queueFile, JSON.stringify({ queue: [], updatedAt: new Date().toISOString() }, null, 2));
  if (!fs.existsSync(dlqFile)) fs.writeFileSync(dlqFile, JSON.stringify({ deadLetter: [], updatedAt: new Date().toISOString() }, null, 2));
}

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

function classifyError(message = '') {
  const m = String(message).toLowerCase();
  if (m.includes('401') || m.includes('403') || m.includes('unauthorized') || m.includes('forbidden')) return 'auth';
  if (m.includes('timeout') || m.includes('network') || m.includes('fetch failed') || m.includes('econnrefused')) return 'network';
  if (m.includes('429') || m.includes('rate')) return 'rate_limit';
  if (m.includes('missing') || m.includes('undefined') || m.includes('invalid')) return 'config';
  return 'system';
}

async function reportWorkerEvent(event) {
  const baseUrl = process.env.WORKFLOW_API_BASE_URL || 'http://localhost:3001';
  const token = process.env.WORKFLOW_ADMIN_TOKEN || '';

  try {
    await fetch(`${baseUrl}/api/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-workflow-admin-token': token } : {}),
      },
      body: JSON.stringify({ action: 'worker-notification-event', ...event }),
    });
  } catch {}
}

async function withRetry(fn, retries = 2, delayMs = 700) {
  for (let i = 0; i <= retries; i++) {
    try {
      const ok = await fn();
      if (ok) return true;
    } catch {}
    if (i < retries) await new Promise(r => setTimeout(r, delayMs * (i + 1)));
  }
  return false;
}

async function sendJob(job) {
  let discordSent = false;
  let telegramSent = false;

  const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
  if (discordWebhook) {
    discordSent = await withRetry(async () => {
      const resp = await fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `📣 ${job.title}\n${job.message}` }),
      });
      return resp.ok;
    });
  }

  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChatId) {
    telegramSent = await withRetry(async () => {
      const resp = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChatId, text: `📣 ${job.title}\n${job.message}` }),
      });
      return resp.ok;
    });
  }

  const noChannelConfigured = !discordWebhook && !(tgToken && tgChatId);
  const ok = discordSent || telegramSent || noChannelConfigured;
  return { discordSent, telegramSent, ok, noChannelConfigured };
}

async function tick() {
  ensure();
  const q = readJson(queueFile, { queue: [] });
  const d = readJson(dlqFile, { deadLetter: [] });

  const queue = Array.isArray(q.queue) ? q.queue : [];
  const deadLetter = Array.isArray(d.deadLetter) ? d.deadLetter : [];

  if (queue.length === 0) return;

  const job = queue.shift();
  try {
    const startedAt = Date.now();
    const result = await sendJob(job);
    if (!result.ok) {
      const attempts = (job.attempts || 0) + 1;
      const lastError = result.noChannelConfigured ? 'no-channel-configured' : 'all-channels-failed';
      const failed = { ...job, attempts, lastError, errorType: classifyError(lastError) };
      if (attempts >= 3) deadLetter.push(failed);
      else queue.push(failed);

      await reportWorkerEvent({
        executionId: job.executionId,
        workflowId: job.workflowId,
        stepId: job.stepId,
        status: 'failed',
        durationMs: Date.now() - startedAt,
        errorMessage: lastError,
        payload: { attempts, errorType: classifyError(lastError), channelResult: result },
      });
    } else {
      await reportWorkerEvent({
        executionId: job.executionId,
        workflowId: job.workflowId,
        stepId: job.stepId,
        status: 'completed',
        durationMs: Date.now() - startedAt,
        payload: { channelResult: result },
      });
    }
  } catch (e) {
    const attempts = (job.attempts || 0) + 1;
    const msg = e?.message || 'worker-error';
    const failed = { ...job, attempts, lastError: msg, errorType: classifyError(msg) };
    if (attempts >= 3) deadLetter.push(failed);
    else queue.push(failed);

    await reportWorkerEvent({
      executionId: job.executionId,
      workflowId: job.workflowId,
      stepId: job.stepId,
      status: 'failed',
      errorMessage: msg,
      payload: { attempts, errorType: classifyError(msg) },
    });
  }

  writeJson(queueFile, { queue, updatedAt: new Date().toISOString() });
  writeJson(dlqFile, { deadLetter: deadLetter.slice(-200), updatedAt: new Date().toISOString() });
}

async function main() {
  ensure();
  console.log('[workflow-notification-worker] started');
  while (true) {
    await tick();
    await new Promise(r => setTimeout(r, 2000));
  }
}

main().catch((e) => {
  console.error('[workflow-notification-worker] fatal:', e);
  process.exit(1);
});
