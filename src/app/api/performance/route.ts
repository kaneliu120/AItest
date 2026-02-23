import { NextRequest, NextResponse } from 'next/server';
import { PerformanceTestManager, JMeterIntegration } from '@/lib/performance-testing';

// GET: 获取性能测试工具和结果
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    if (action === 'tools') {
      // 获取可用性能测试工具
      const tools = await PerformanceTestManager.getAvailableTools();
      
      return NextResponse.json({
        success: true,
        data: tools
      });
    } else if (action === 'jmeter-status') {
      // 检查JMeter状态
      const status = await JMeterIntegration.checkJMeterAvailability();
      
      return NextResponse.json({
        success: true,
        data: status
      });
    } else if (action === 'monitor-system') {
      // 系统监控
      const { PerformanceMonitoring } = await import('@/lib/performance-testing');
      const metrics = await PerformanceMonitoring.monitorSystem();
      
      return NextResponse.json({
        success: true,
        data: metrics
      });
    } else {
      // 默认返回工具列表
      const tools = await PerformanceTestManager.getAvailableTools();
      
      return NextResponse.json({
        success: true,
        data: {
          tools,
          total: tools.length,
          installed: tools.filter(t => t.installed).length
        }
      });
    }
  } catch (error) {
    console.error('Performance API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// POST: 执行性能测试
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, toolId, target, ...options } = body;
    
    if (!action) {
      return NextResponse.json({
        success: false,
        error: '缺少 action 参数'
      }, { status: 400 });
    }
    
    if (action === 'test') {
      // 执行性能测试
      if (!toolId || !target) {
        return NextResponse.json({
          success: false,
          error: '缺少 toolId 或 target 参数'
        }, { status: 400 });
      }
      
      const result = await PerformanceTestManager.runPerformanceTest(toolId, target, options);
      
      return NextResponse.json({
        success: result.success,
        data: result,
        message: result.success ? '性能测试完成' : '性能测试失败'
      });
      
    } else if (action === 'create-test-plan') {
      // 创建JMeter测试计划
      if (!target) {
        return NextResponse.json({
          success: false,
          error: '缺少 target 参数'
        }, { status: 400 });
      }
      
      const testPlan = await JMeterIntegration.createTestPlan(target, options);
      
      return new NextResponse(testPlan, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': 'attachment; filename="jmeter-test-plan.jmx"'
        }
      });
      
    } else if (action === 'install-tool') {
      // 安装性能测试工具
      if (!toolId) {
        return NextResponse.json({
          success: false,
          error: '缺少 toolId 参数'
        }, { status: 400 });
      }
      
      const result = await PerformanceTestManager.installTool(toolId);
      
      return NextResponse.json({
        success: result.success,
        data: result,
        message: result.message
      });
      
    } else if (action === 'generate-report') {
      // 生成性能报告
      const { testResults } = body;
      
      if (!testResults || !Array.isArray(testResults)) {
        return NextResponse.json({
          success: false,
          error: '缺少 testResults 参数或格式错误'
        }, { status: 400 });
      }
      
      const report = await PerformanceTestManager.generatePerformanceReport(testResults);
      
      return new NextResponse(report, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="performance-test-report.json"'
        }
      });
      
    } else if (action === 'monitor-application') {
      // 应用监控
      if (!target) {
        return NextResponse.json({
          success: false,
          error: '缺少 target 参数'
        }, { status: 400 });
      }
      
      const { PerformanceMonitoring } = await import('@/lib/performance-testing');
      const metrics = await PerformanceMonitoring.monitorApplication(target);
      
      return NextResponse.json({
        success: true,
        data: metrics,
        message: '应用监控数据获取成功'
      });
      
    } else {
      return NextResponse.json({
        success: false,
        error: '未知的操作类型'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Performance API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}