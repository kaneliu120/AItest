import { NextRequest, NextResponse } from 'next/server';

// 简化的故障诊断API
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
            uptime: Date.now() - 3600000, // 1小时前
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
                name: '高CPU使用率检测',
                description: '检测CPU使用率超过80%的情况',
                severity: 'medium',
                enabled: true,
                tags: ['performance', 'cpu']
              },
              {
                id: 'memory-leak',
                name: '内存泄漏检测',
                description: '检测内存使用持续增长的情况',
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
            message: '故障诊断API运行正常',
            supportedActions: ['status', 'rules']
          },
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
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
            message: '规则添加成功',
            ruleId: `rule-${Date.now()}`
          },
          timestamp: new Date().toISOString()
        });

      case 'remove-rule':
        return NextResponse.json({
          success: true,
          data: {
            message: '规则移除成功'
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `未知操作: ${action}`,
          supportedActions: ['add-rule', 'remove-rule']
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}