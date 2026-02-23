import { NextRequest, NextResponse } from 'next/server';

// GET: 获取测试结果和工具状态
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    if (action === 'results') {
      // 获取测试结果
      const results = [
        { id: 'test-1', name: 'API测试', status: 'passed', timestamp: new Date().toISOString() },
        { id: 'test-2', name: '数据库测试', status: 'passed', timestamp: new Date().toISOString() },
        { id: 'test-3', name: 'UI测试', status: 'failed', timestamp: new Date().toISOString() },
      ];
      const limit = parseInt(searchParams.get('limit') || '20');
      const limitedResults = results.slice(0, limit);
      
      return NextResponse.json({
        success: true,
        data: {
          results: limitedResults,
          total: results.length
        }
      });
    } else if (action === 'status') {
      // 获取工具状态
      const toolStatus = {
        totalTools: 20,
        healthyTools: 16,
        warningTools: 2,
        errorTools: 1,
        lastUpdate: new Date().toISOString(),
      };
      
      return NextResponse.json({
        success: true,
        data: toolStatus
      });
    } else if (action === 'summary') {
      // 获取统计摘要
      const summary = {
        totalTests: 25,
        passedTests: 23,
        failedTests: 2,
        successRate: 92,
        lastRun: new Date().toISOString(),
      };
      
      return NextResponse.json({
        success: true,
        data: summary
      });
    } else if (action === 'export') {
      // 导出测试报告
      const report = JSON.stringify({
        summary: {
          totalTests: 25,
          passedTests: 23,
          failedTests: 2,
          successRate: 92,
        },
        tests: [
          { id: 'test-1', name: 'API测试', status: 'passed' },
          { id: 'test-2', name: '数据库测试', status: 'passed' },
          { id: 'test-3', name: 'UI测试', status: 'failed' },
        ],
        timestamp: new Date().toISOString(),
      }, null, 2);
      
      return new NextResponse(report, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="mission-control-test-report.json"'
        }
      });
    } else {
      // 默认返回所有数据
      const results = [
        { id: 'test-1', name: 'API测试', status: 'passed', timestamp: new Date().toISOString() },
        { id: 'test-2', name: '数据库测试', status: 'passed', timestamp: new Date().toISOString() },
        { id: 'test-3', name: 'UI测试', status: 'failed', timestamp: new Date().toISOString() },
      ];
      const toolStatus = {
        totalTools: 20,
        healthyTools: 16,
        warningTools: 2,
        errorTools: 1,
        lastUpdate: new Date().toISOString(),
      };
      const summary = {
        totalTests: 25,
        passedTests: 23,
        failedTests: 2,
        successRate: 92,
        lastRun: new Date().toISOString(),
      };
      
      return NextResponse.json({
        success: true,
        data: {
          summary,
          recentResults: results.slice(0, 10),
          toolStatus
        }
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// POST: 运行测试或更新数据
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, toolId, testCommand } = body;
    
    if (action === 'run-test') {
      if (!toolId) {
        return NextResponse.json({
          success: false,
          error: '缺少 toolId 参数'
        }, { status: 400 });
      }
      
      // 运行测试
      const result = {
        id: `test-result-${Date.now()}`,
        toolId,
        status: 'completed',
        output: `测试 ${toolId} 执行完成`,
        timestamp: new Date().toISOString(),
      };
      
      return NextResponse.json({
        success: true,
        data: result,
        message: '测试已开始执行'
      });
      
    } else if (action === 'update-status') {
      const { toolId, updates } = body;
      
      if (!toolId || !updates) {
        return NextResponse.json({
          success: false,
          error: '缺少必要参数'
        }, { status: 400 });
      }
      
      // 更新工具状态
      const updatedStatus = {
        toolId,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      return NextResponse.json({
        success: true,
        data: updatedStatus,
        message: '工具状态已更新'
      });
      
    } else if (action === 'clear-data') {
      // 清除测试数据
      return NextResponse.json({
        success: true,
        message: '测试数据已清除'
      });
      
    } else {
      return NextResponse.json({
        success: false,
        error: '未知的操作类型'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}