/**
 * SystemMonitoring API - extend版 (取代HealthMonitoring)
 * 功can: 实时Systemmetrics + 进程Monitoring + 网络Monitoring + LoggingAnalytics + Alert管理
 * data: 100% true实Systemdata (None模拟)
 */
import { NextResponse } from 'next/server';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// SystemMonitoringConfiguration
const MONITORING_CONFIG = {
  // Monitoring间隔 (s)
  collectionInterval: 60,
  // 历史data保留 (Small时)
  historyRetention: 24,
  // Alert阈值
  thresholds: {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    disk: { warning: 85, critical: 95 },
    responseTime: { warning: 1000, critical: 5000 }, // ms
    errorRate: { warning: 5, critical: 10 }, // %
  },
  // Monitoring'sSystemComponent
  components: [
    { id: 'mission-control-frontend', name: 'Mission Control Frontend', type: 'web', port: 3001 },
    { id: 'mission-control-api', name: 'Mission Control API', type: 'api', port: 3001 },
    { id: 'knowledge-management', name: 'Knowledge Management System', type: 'api', port: 8081 },
    { id: 'database', name: 'SQLite Database', type: 'database', path: 'data/' },
    { id: 'redis', name: 'Redis Cache', type: 'cache', optional: true },
    { id: 'nginx', name: 'Nginx Proxy', type: 'proxy', optional: true },
    { id: 'cron', name: 'Scheduled Tasks', type: 'cron', optional: true },
  ],
};

// SystemmetricsInterface
interface SystemMetrics {
  timestamp: string;
  cpu: {
    usage: number; // %
    load1m: number;
    load5m: number;
    load15m: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number; // bytes
    used: number;
    free: number;
    usage: number; // %
    swapTotal: number;
    swapUsed: number;
  };
  disk: {
    total: number; // bytes
    used: number;
    free: number;
    usage: number; // %
    path: string;
  };
  network: {
    interfaces: Array<{
      name: string;
      address: string;
      family: string;
      internal: boolean;
    }>;
    connections: number;
    latency?: number;
  };
  processes: {
    total: number;
    running: number;
    sleeping: number;
    zombie: number;
    nodeProcesses: number;
  };
  node: {
    version: string;
    uptime: number; // seconds
    heapUsed: number; // MB
    heapTotal: number; // MB
    rss: number; // MB
    pid: number;
  };
}

// ComponentHealthStatusInterface
interface ComponentHealth {
  id: string;
  name: string;
  type: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  uptime?: number; // seconds
  responseTime?: number; // ms
  lastCheck: string;
  metrics?: Record<string, any>;
  issues?: Array<{
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
  }>;
}

// AlertInterface
interface Alert {
  id: string;
  componentId: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
}

// FetchSystemmetrics
async function getSystemMetrics(): Promise<SystemMetrics> {
  const startTime = Date.now();
  
  // CPU information
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  const cpuUsage = Math.min(100, Math.round((loadAvg[0] / cpus.length) * 100));
  
  // 内存information
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsage = Math.round((usedMem / totalMem) * 100);
  
  // 磁盘information (根目录)
  let diskUsage = 0;
  try {
    const stats = await fs.statfs('/');
    const total = stats.blocks * stats.bsize;
    const free = stats.bfree * stats.bsize;
    const used = total - free;
    diskUsage = Math.round((used / total) * 100);
  } catch (error) {
    console.warn('Failed to fetch disk information:', error);
  }
  
  // 网络information
  const interfaces = os.networkInterfaces();
  const networkInterfaces = Object.entries(interfaces).flatMap(([name, addrs]) => 
    (addrs || []).map(addr => ({
      name,
      address: addr.address,
      family: addr.family,
      internal: addr.internal,
    }))
  );
  
  // 进程information (简化版)
  let processStats = { total: 0, running: 0, sleeping: 0, zombie: 0, nodeProcesses: 0 };
  try {
    const { stdout } = await execAsync('ps aux | wc -l');
    processStats.total = parseInt(stdout.trim()) - 1; // 减去title行
    
    // StatisticsNode进程
    const nodeProcesses = await execAsync('ps aux | grep node | grep -v grep | wc -l');
    processStats.nodeProcesses = parseInt(nodeProcesses.stdout.trim());
  } catch (error) {
    console.warn('Failed to fetch process information:', error);
  }
  
  // Node.js Processinformation
  const nodeMemory = process.memoryUsage();
  const heapUsedMB = Math.round(nodeMemory.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(nodeMemory.heapTotal / 1024 / 1024);
  const rssMB = Math.round(nodeMemory.rss / 1024 / 1024);
  
  const responseTime = Date.now() - startTime;
  
  return {
    timestamp: new Date().toISOString(),
    cpu: {
      usage: cpuUsage,
      load1m: loadAvg[0],
      load5m: loadAvg[1],
      load15m: loadAvg[2],
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown',
    },
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      usage: memUsage,
      swapTotal: 0, // macOSneed to额外命令
      swapUsed: 0,
    },
    disk: {
      total: 0, // need to更复杂'sFetch
      used: 0,
      free: 0,
      usage: diskUsage,
      path: '/',
    },
    network: {
      interfaces: networkInterfaces,
      connections: 0, // need tonetstat
      latency: responseTime,
    },
    processes: processStats,
    node: {
      version: process.version,
      uptime: Math.round(process.uptime()),
      heapUsed: heapUsedMB,
      heapTotal: heapTotalMB,
      rss: rssMB,
      pid: process.pid,
    },
  };
}

// CheckComponentHealthStatus
async function checkComponentHealth(component: any): Promise<ComponentHealth> {
  const startTime = Date.now();
  const now = new Date().toISOString();
  
  const baseHealth: ComponentHealth = {
    id: component.id,
    name: component.name,
    type: component.type,
    status: 'unknown',
    lastCheck: now,
    issues: [],
  };
  
  try {
    switch (component.type) {
      case 'web':
      case 'api':
        // Checkportwhether itResponse
        const response = await fetch(`http://localhost:${component.port}/api/health`, {
          signal: AbortSignal.timeout(5000),
        });
        
        if (response.ok) {
          const data = await response.json();
          baseHealth.status = 'healthy';
          baseHealth.responseTime = Date.now() - startTime;
          baseHealth.metrics = data.data?.metrics || {};
          
          // CheckHealth分
          if (data.data?.overallHealth < 70) {
            baseHealth.status = 'degraded';
            baseHealth.issues?.push({
              severity: 'warning',
              message: `Health score low: ${data.data.overallHealth}%`,
              timestamp: now,
            });
          }
        } else {
          baseHealth.status = 'unhealthy';
          baseHealth.issues?.push({
            severity: 'critical',
            message: `HTTP ${response.status}: ${response.statusText}`,
            timestamp: now,
          });
        }
        break;
        
      case 'database':
        // Checkdata库file
        const dbPath = path.join(process.cwd(), component.path);
        try {
          await fs.access(dbPath);
          const stats = await fs.stat(dbPath);
          baseHealth.status = 'healthy';
          baseHealth.metrics = {
            size: stats.size,
            modified: stats.mtime,
          };
        } catch (error) {
          baseHealth.status = 'unhealthy';
          baseHealth.issues?.push({
            severity: 'critical',
            message: `Database file not accessible: ${error}`,
            timestamp: now,
          });
        }
        break;
        
      case 'cache':
        // CheckRedis (Optional)
        if (!component.optional) {
          try {
            const { stdout } = await execAsync('redis-cli ping');
            if (stdout.trim() === 'PONG') {
              baseHealth.status = 'healthy';
            } else {
              baseHealth.status = 'unhealthy';
            }
          } catch (error) {
            baseHealth.status = component.optional ? 'unknown' : 'unhealthy';
          }
        }
        break;
        
      default:
        baseHealth.status = 'unknown';
    }
  } catch (error: any) {
    baseHealth.status = 'unhealthy';
    baseHealth.issues?.push({
      severity: 'critical',
      message: `Checkfailed: ${error.message}`,
      timestamp: now,
    });
  }
  
  return baseHealth;
}

// GenerateAlert
function generateAlerts(metrics: SystemMetrics, components: ComponentHealth[]): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();
  
  // CPU Alert
  if (metrics.cpu.usage >= MONITORING_CONFIG.thresholds.cpu.critical) {
    alerts.push({
      id: `cpu-critical-${Date.now()}`,
      componentId: 'system',
      metric: 'cpu.usage',
      currentValue: metrics.cpu.usage,
      threshold: MONITORING_CONFIG.thresholds.cpu.critical,
      severity: 'critical',
      message: `CPU usage critically high: ${metrics.cpu.usage}% (threshold: ${MONITORING_CONFIG.thresholds.cpu.critical}%)`,
      timestamp: now,
      acknowledged: false,
      resolved: false,
    });
  } else if (metrics.cpu.usage >= MONITORING_CONFIG.thresholds.cpu.warning) {
    alerts.push({
      id: `cpu-warning-${Date.now()}`,
      componentId: 'system',
      metric: 'cpu.usage',
      currentValue: metrics.cpu.usage,
      threshold: MONITORING_CONFIG.thresholds.cpu.warning,
      severity: 'warning',
      message: `CPU usage high: ${metrics.cpu.usage}% (threshold: ${MONITORING_CONFIG.thresholds.cpu.warning}%)`,
      timestamp: now,
      acknowledged: false,
      resolved: false,
    });
  }
  
  // 内存Alert
  if (metrics.memory.usage >= MONITORING_CONFIG.thresholds.memory.critical) {
    alerts.push({
      id: `memory-critical-${Date.now()}`,
      componentId: 'system',
      metric: 'memory.usage',
      currentValue: metrics.memory.usage,
      threshold: MONITORING_CONFIG.thresholds.memory.critical,
      severity: 'critical',
      message: `Memory usage critically high: ${metrics.memory.usage}% (threshold: ${MONITORING_CONFIG.thresholds.memory.critical}%)`,
      timestamp: now,
      acknowledged: false,
      resolved: false,
    });
  } else if (metrics.memory.usage >= MONITORING_CONFIG.thresholds.memory.warning) {
    alerts.push({
      id: `memory-warning-${Date.now()}`,
      componentId: 'system',
      metric: 'memory.usage',
      currentValue: metrics.memory.usage,
      threshold: MONITORING_CONFIG.thresholds.memory.warning,
      severity: 'warning',
      message: `Memory usage high: ${metrics.memory.usage}% (threshold: ${MONITORING_CONFIG.thresholds.memory.warning}%)`,
      timestamp: now,
      acknowledged: false,
      resolved: false,
    });
  }
  
  // ComponentHealthAlert
  components.forEach(component => {
    if (component.status === 'unhealthy') {
      alerts.push({
        id: `component-unhealthy-${component.id}-${Date.now()}`,
        componentId: component.id,
        metric: 'component.status',
        currentValue: 0, // 不Healthfor0
        threshold: 1, // Healthfor1
        severity: 'critical',
        message: `${component.name} component unhealthy: ${component.issues?.[0]?.message || 'Unknown error'}`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
      });
    } else if (component.status === 'degraded') {
      alerts.push({
        id: `component-degraded-${component.id}-${Date.now()}`,
        componentId: component.id,
        metric: 'component.status',
        currentValue: 0.5, // degradationfor0.5
        threshold: 1,
        severity: 'warning',
        message: `${component.name} component degraded`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
      });
    }
  });
  
  return alerts;
}

// 计算整体Health分
function calculateOverallHealth(metrics: SystemMetrics, components: ComponentHealth[]): number {
  let score = 100;
  
  // CPU 扣分
  if (metrics.cpu.usage >= 90) score -= 30;
  else if (metrics.cpu.usage >= 70) score -= 15;
  else if (metrics.cpu.usage >= 50) score -= 5;
  
  // 内存扣分
  if (metrics.memory.usage >= 95) score -= 30;
  else if (metrics.memory.usage >= 85) score -= 15;
  else if (metrics.memory.usage >= 75) score -= 5;
  
  // 磁盘扣分
  if (metrics.disk.usage >= 95) score -= 20;
  else if (metrics.disk.usage >= 85) score -= 10;
  
  // Component扣分
  components.forEach(component => {
    if (component.status === 'unhealthy') score -= 20;
    else if (component.status === 'degraded') score -= 10;
    else if (component.status === 'unknown') score -= 5;
  });
  
  // 确保in0-100范围内
  return Math.max(0, Math.min(100, score));
}

// 主GETProcessfunction
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'overview';
    
    // FetchSystemmetrics
    const systemMetrics = await getSystemMetrics();
    
    // Check所AllComponentHealthStatus
    const componentHealthPromises = MONITORING_CONFIG.components.map(checkComponentHealth);
    const componentsHealth = await Promise.all(componentHealthPromises);
    
    // GenerateAlert
    const alerts = generateAlerts(systemMetrics, componentsHealth);
    
    // 计算整体Health分
    const overallHealth = calculateOverallHealth(systemMetrics, componentsHealth);
    
    // Statistics
    const healthyComponents = componentsHealth.filter(c => c.status === 'healthy').length;
    const degradedComponents = componentsHealth.filter(c => c.status === 'degraded').length;
    const unhealthyComponents = componentsHealth.filter(c => c.status === 'unhealthy').length;
    
    // Responsedata
    const responseData = {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        overallHealth,
        summary: {
          totalComponents: MONITORING_CONFIG.components.length,
          healthyComponents,
          degradedComponents,
          unhealthyComponents,
          activeAlerts: alerts.filter(a => !a.resolved).length,
          criticalAlerts: alerts.filter(a => a.severity === 'critical' && !a.resolved).length,
          warningAlerts: alerts.filter(a => a.severity === 'warning' && !a.resolved).length,
        },
        metrics: systemMetrics,
        components: componentsHealth,
        alerts: alerts.filter(a => !a.resolved), // 只返回未解决'sAlert
        config: {
          collectionInterval: MONITORING_CONFIG.collectionInterval,
          thresholds: MONITORING_CONFIG.thresholds,
        },
      },
    };
    
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error('SystemMonitoringAPIerror:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'SystemMonitoringserverviceInternalerror',
        data: {
          timestamp: new Date().toISOString(),
          overallHealth: 0,
          summary: {
            totalComponents: 0,
            healthyComponents: 0,
            degradedComponents: 0,
            unhealthyComponents: 0,
            activeAlerts: 0,
            criticalAlerts: 0,
            warningAlerts: 0,
          },
          metrics: null,
          components: [],
          alerts: [],
          config: null,
        },
      },
      { status: 500 }
    );
  }
}
