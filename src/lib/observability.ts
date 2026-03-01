import { logger } from '@/lib/logger';

export function makeRequestId(prefix = 'req'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function logApiStart(route: string, requestId: string, extra?: Record<string, unknown>) {
  logger.info('api_request_start', { route, requestId, ...(extra || {}) });
}

export function logApiEnd(route: string, requestId: string, status: number, extra?: Record<string, unknown>) {
  logger.info('api_request_end', { route, requestId, status, ...(extra || {}) });
}

export function logApiError(route: string, requestId: string, error: unknown, extra?: Record<string, unknown>) {
  logger.error('api_request_error', error, { route, requestId, ...(extra || {}) });
}
