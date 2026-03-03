import { NextRequest, NextResponse } from 'next/server';

// Simple metrics collection
let requestCount = 0;
let errorCount = 0;
const responseTimes: number[] = [];

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Collect basic metrics
    requestCount++;
    
    // Simulate some metrics data
    const metrics = {
      http_requests_total: requestCount,
      http_errors_total: errorCount,
      http_request_duration_seconds: {
        sum: responseTimes.reduce((a, b) => a + b, 0) / 1000,
        count: responseTimes.length,
        bucket: {
          le_01: responseTimes.filter(t => t <= 100).length,
          le_05: responseTimes.filter(t => t <= 500).length,
          le_1: responseTimes.filter(t => t <= 1000).length,
          le_5: responseTimes.filter(t => t <= 5000).length,
          le_inf: responseTimes.length,
        }
      },
      node_memory_usage_bytes: process.memoryUsage().heapUsed,
      node_cpu_usage: process.cpuUsage().user / 1000000, // Convert to seconds
      uptime_seconds: process.uptime(),
    };

    const prometheusFormat = `
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total ${metrics.http_requests_total}

# HELP http_errors_total Total HTTP errors
# TYPE http_errors_total counter
http_errors_total ${metrics.http_errors_total}

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_sum ${metrics.http_request_duration_seconds.sum}
http_request_duration_seconds_count ${metrics.http_request_duration_seconds.count}
http_request_duration_seconds_bucket{le="0.1"} ${metrics.http_request_duration_seconds.bucket.le_01}
http_request_duration_seconds_bucket{le="0.5"} ${metrics.http_request_duration_seconds.bucket.le_05}
http_request_duration_seconds_bucket{le="1"} ${metrics.http_request_duration_seconds.bucket.le_1}
http_request_duration_seconds_bucket{le="5"} ${metrics.http_request_duration_seconds.bucket.le_5}
http_request_duration_seconds_bucket{le="+Inf"} ${metrics.http_request_duration_seconds.bucket.le_inf}

# HELP node_memory_usage_bytes Node.js memory usage in bytes
# TYPE node_memory_usage_bytes gauge
node_memory_usage_bytes ${metrics.node_memory_usage_bytes}

# HELP node_cpu_usage_seconds Node.js CPU usage in seconds
# TYPE node_cpu_usage_seconds gauge
node_cpu_usage_seconds ${metrics.node_cpu_usage}

# HELP uptime_seconds Application uptime in seconds
# TYPE uptime_seconds gauge
uptime_seconds ${metrics.uptime_seconds}
`;

    const responseTime = Date.now() - startTime;
    responseTimes.push(responseTime);
    
    // Keep latest 1000 response times
    if (responseTimes.length > 1000) {
      responseTimes.shift();
    }

    return new NextResponse(prometheusFormat, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
      },
    });
    
  } catch (error) {
    errorCount++;
    const responseTime = Date.now() - startTime;
    responseTimes.push(responseTime);
    
    return NextResponse.json(
      { error: 'Metrics collection failed' },
      { status: 500 }
    );
  }
}