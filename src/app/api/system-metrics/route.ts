import { NextRequest, NextResponse } from 'next/server';
import os from 'os';

export async function GET(request: NextRequest) {
  try {
    // 收集系统指标
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    const cpus = os.cpus();
    const cpuUsage = cpus.map(cpu => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return {
        model: cpu.model,
        speed: cpu.speed,
        usage: ((total - idle) / total) * 100,
      };
    });

    const loadAvg = os.loadavg();
    const uptime = os.uptime();
    
    const networkInterfaces = os.networkInterfaces();
    const networkStats = Object.entries(networkInterfaces).map(([name, interfaces]) => ({
      name,
      addresses: interfaces?.map(intf => ({
        address: intf.address,
        family: intf.family,
        internal: intf.internal,
      })) || [],
    }));

    const metrics = {
      node_memory_MemTotal_bytes: totalMem,
      node_memory_MemFree_bytes: freeMem,
      node_memory_MemAvailable_bytes: freeMem,
      node_memory_MemUsed_bytes: usedMem,
      node_memory_MemUsage_percent: (usedMem / totalMem) * 100,
      
      node_cpu_seconds_total: cpuUsage.reduce((sum, cpu) => sum + cpu.usage / 100, 0),
      node_cpu_usage_percent: cpuUsage.reduce((sum, cpu) => sum + cpu.usage, 0) / cpuUsage.length,
      
      node_load1: loadAvg[0],
      node_load5: loadAvg[1],
      node_load15: loadAvg[2],
      
      node_uptime_seconds: uptime,
      node_process_uptime_seconds: process.uptime(),
      
      node_network_interfaces: networkStats.length,
    };

    const prometheusFormat = `
# HELP node_memory_MemTotal_bytes Total memory in bytes
# TYPE node_memory_MemTotal_bytes gauge
node_memory_MemTotal_bytes ${metrics.node_memory_MemTotal_bytes}

# HELP node_memory_MemFree_bytes Free memory in bytes
# TYPE node_memory_MemFree_bytes gauge
node_memory_MemFree_bytes ${metrics.node_memory_MemFree_bytes}

# HELP node_memory_MemAvailable_bytes Available memory in bytes
# TYPE node_memory_MemAvailable_bytes gauge
node_memory_MemAvailable_bytes ${metrics.node_memory_MemAvailable_bytes}

# HELP node_memory_MemUsed_bytes Used memory in bytes
# TYPE node_memory_MemUsed_bytes gauge
node_memory_MemUsed_bytes ${metrics.node_memory_MemUsed_bytes}

# HELP node_memory_MemUsage_percent Memory usage percentage
# TYPE node_memory_MemUsage_percent gauge
node_memory_MemUsage_percent ${metrics.node_memory_MemUsage_percent}

# HELP node_cpu_seconds_total Total CPU time in seconds
# TYPE node_cpu_seconds_total counter
node_cpu_seconds_total ${metrics.node_cpu_seconds_total}

# HELP node_cpu_usage_percent CPU usage percentage
# TYPE node_cpu_usage_percent gauge
node_cpu_usage_percent ${metrics.node_cpu_usage_percent}

# HELP node_load1 1-minute load average
# TYPE node_load1 gauge
node_load1 ${metrics.node_load1}

# HELP node_load5 5-minute load average
# TYPE node_load5 gauge
node_load5 ${metrics.node_load5}

# HELP node_load15 15-minute load average
# TYPE node_load15 gauge
node_load15 ${metrics.node_load15}

# HELP node_uptime_seconds System uptime in seconds
# TYPE node_uptime_seconds gauge
node_uptime_seconds ${metrics.node_uptime_seconds}

# HELP node_process_uptime_seconds Process uptime in seconds
# TYPE node_process_uptime_seconds gauge
node_process_uptime_seconds ${metrics.node_process_uptime_seconds}

# HELP node_network_interfaces Number of network interfaces
# TYPE node_network_interfaces gauge
node_network_interfaces ${metrics.node_network_interfaces}
`;

    return new NextResponse(prometheusFormat, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
      },
    });
    
  } catch (error) {
    console.error('System metrics collection failed:', error);
    return NextResponse.json(
      { error: 'System metrics collection failed' },
      { status: 500 }
    );
  }
}