/**
 * SystemHealthCheck API - real dataVersion
 * Returns CPU/内存/磁盘/进程 实时metrics
 * Redis Optional(不影响主功can)
 */
import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const startTime = Date.now();

  // ── true实Systemmetrics ─────────────────────────────────────────────────────────
  const totalMem   = os.totalmem();
  const freeMem    = os.freemem();
  const usedMem    = totalMem - freeMem;
  const memPct     = Math.round((usedMem / totalMem) * 100);

  const cpus       = os.cpus();
  const loadAvg    = os.loadavg(); // [1m, 5m, 15m]
  const coreCount  = cpus.length;
  // 估算CPUusage rate: load1m / cores * 100, 上限100
  const cpuUsage   = Math.min(100, Math.round((loadAvg[0] / coreCount) * 100));

  const uptimeSec  = Math.round(process.uptime());
  const nodeMemory = process.memoryUsage();
  const heapUsedMB = Math.round(nodeMemory.heapUsed / 1024 / 1024);
  const heapTotalMB= Math.round(nodeMemory.heapTotal / 1024 / 1024);

  const responseTime = Date.now() - startTime;

  // ── ComponentStatus ──────────────────────────────────────────────────────────────
  const components = [
    {
      name: 'Mission Control Frontend',
      status: 'healthy',
      uptime: `${Math.round(uptimeSec / 3600 * 10) / 10}h`,
      version: '2.0.0',
      lastCheck: new Date().toISOString(),
      description: `Next.js 16 | Port 3001 | Node ${process.version}`,
    },
    {
      name: 'Mission Control API',
      status: 'healthy',
      uptime: `${Math.round(uptimeSec / 3600 * 10) / 10}h`,
      version: '-',
      lastCheck: new Date().toISOString(),
      description: `Port 3001 | Response ${responseTime}ms`,
    },
    {
      name: 'Host Machine (macOS)',
      status: memPct > 90 ? 'warning' : 'healthy',
      uptime: `${Math.round(os.uptime() / 3600 * 10) / 10}h`,
      version: `${os.type()} | ${coreCount} cores`,
      lastCheck: new Date().toISOString(),
      description: `CPU ${cpuUsage}% | Mem ${memPct}% | Load ${loadAvg[0].toFixed(2)}`,
    },
    {
      name: 'Node.js Process',
      status: heapUsedMB > heapTotalMB * 0.9 ? 'warning' : 'healthy',
      uptime: `${Math.round(uptimeSec / 3600 * 10) / 10}h`,
      version: process.version,
      lastCheck: new Date().toISOString(),
      description: `Heap ${heapUsedMB}MB / ${heapTotalMB}MB | PID ${process.pid}`,
    },
  ];

  // ── 整体Health分 (0-100) ────────────────────────────────────────────────────
  let overallHealth = 100;
  if (cpuUsage  > 90) overallHealth -= 30;
  else if (cpuUsage > 70) overallHealth -= 10;
  if (memPct    > 95) overallHealth -= 30;
  else if (memPct > 85) overallHealth -= 15;
  const errorCount = components.filter(c => c.status === 'error').length;
  const warnCount  = components.filter(c => c.status === 'warning').length;
  overallHealth -= errorCount * 20 + warnCount * 5;
  overallHealth = Math.max(0, Math.min(100, overallHealth));

  const result = {
    success: true,
    data: {
      timestamp: new Date().toISOString(),
      overallHealth,
      components,
      metrics: {
        cpuUsage,
        memoryUsage:  memPct,
        diskUsage:    0,   // need to额外Tool, 暂留0
        networkLatency: responseTime,
        responseTime,
        heapUsedMB,
        heapTotalMB,
        uptimeSec,
        loadAvg: { '1m': loadAvg[0], '5m': loadAvg[1], '15m': loadAvg[2] },
      },
    },
  };

  return NextResponse.json(result);
}
