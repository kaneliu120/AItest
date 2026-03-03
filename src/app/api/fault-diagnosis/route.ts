import { NextRequest, NextResponse } from 'next/server';

// Simplified fault diagnosis API
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: {
            status: 'running',
            uptime: Date.now() - 3600000, // 1 hour ago
            config: {
              enabled: true,
              checkInterval: 30000,
              autoRepair: false,
              notificationEnabled: true,
              severityThreshold: 'medium',
              dataRetentionDays: 30
            },
            stats: {
              totalFaultsDetected: 12,
              autoRepaired: 3,
              manualRepaired: 7,
              pendingFaults: 2,
              averageDetectionTime: 150,
              averageRepairTime: 300
            }
          },
          timestamp: new Date().toISOString()
        });

      case 'rules':
        return NextResponse.json({
          success: true,
          data: {
            rules: [
              {
                id: 'high-cpu-usage',
                name: 'High CPU Usage Detection',
                description: 'Detects CPU usage exceeding 80%',
                severity: 'medium',
                enabled: true,
                tags: ['performance', 'cpu']
              },
              {
                id: 'memory-leak',
                name: 'Memory Leak Detection',
                description: 'Detect sustained memory usage growth',
                severity: 'high',
                enabled: true,
                tags: ['performance', 'memory']
              }
            ]
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: true,
          data: {
            message: 'Fault diagnosis API running normally',
            supportedActions: ['status', 'rules']
          },
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'add-rule':
        return NextResponse.json({
          success: true,
          data: {
            message: 'Rule added successfully',
            ruleId: `rule-${Date.now()}`
          },
          timestamp: new Date().toISOString()
        });

      case 'remove-rule':
        return NextResponse.json({
          success: true,
          data: {
            message: 'Rule removed successfully'
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          supportedActions: ['add-rule', 'remove-rule']
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}