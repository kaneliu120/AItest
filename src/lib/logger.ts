type LogLevel = 'info' | 'warn' | 'error';

function fmt(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  const ctx = context ? ` ${JSON.stringify(context)}` : '';
  return `[${ts}] [${level.toUpperCase()}] ${message}${ctx}`;
}

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    console.log(fmt('info', message, context));
  },
  warn(message: string, context?: Record<string, unknown>) {
    console.warn(fmt('warn', message, context));
  },
  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    const merged = { ...(context || {}), error: error instanceof Error ? error.message : error };
    console.error(fmt('error', message, merged));
  },
};
