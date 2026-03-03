import { NextRequest, NextResponse } from 'next/server';
import { PerformanceTestManager, JMeterIntegration } from '@/lib/performance-testing';

// GET: FetchPerformanceTestTool和result
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    if (action === 'tools') {
      // FetchavailablePerformanceTestTool
      const tools = await PerformanceTestManager.getAvailableTools();
      
      return NextResponse.json({
        success: true,
        data: tools
      });
    } else if (action === 'jmeter-status') {
      // CheckJMeterStatus
      const status = await JMeterIntegration.checkJMeterAvailability();
      
      return NextResponse.json({
        success: true,
        data: status
      });
    } else if (action === 'monitor-system') {
      // SystemMonitoring
      const { PerformanceMonitoring } = await import('@/lib/performance-testing');
      const metrics = await PerformanceMonitoring.monitorSystem();
      
      return NextResponse.json({
        success: true,
        data: metrics
      });
    } else {
      // Default返回ToolList
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
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST: ExecutePerformanceTest
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, toolId, target, ...options } = body;
    
    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Missing action parameter'
      }, { status: 400 });
    }
    
    if (action === 'test') {
      // ExecutePerformanceTest
      if (!toolId || !target) {
        return NextResponse.json({
          success: false,
          error: 'Missing toolId or target parameters'
        }, { status: 400 });
      }
      
      const result = await PerformanceTestManager.runPerformanceTest(toolId, target, options);
      
      return NextResponse.json({
        success: result.success,
        data: result,
        message: result.success ? 'PerformanceTestCompleted' : 'PerformanceTestfailed'
      });
      
    } else if (action === 'create-test-plan') {
      // CreateJMeterTest计划
      if (!target) {
        return NextResponse.json({
          success: false,
          error: 'Missing  target Parameters'
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
      // InstallPerformanceTestTool
      if (!toolId) {
        return NextResponse.json({
          success: false,
          error: 'Missing toolId Parameters'
        }, { status: 400 });
      }
      
      const result = await PerformanceTestManager.installTool(toolId);
      
      return NextResponse.json({
        success: result.success,
        data: result,
        message: result.message
      });
      
    } else if (action === 'generate-report') {
      // GeneratePerformanceReport
      const { testResults } = body;
      
      if (!testResults || !Array.isArray(testResults)) {
        return NextResponse.json({
          success: false,
          error: 'Missing  testResults ParametersorFormaterror'
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
      // ApplicationMonitoring
      if (!target) {
        return NextResponse.json({
          success: false,
          error: 'Missing  target Parameters'
        }, { status: 400 });
      }
      
      const { PerformanceMonitoring } = await import('@/lib/performance-testing');
      const metrics = await PerformanceMonitoring.monitorApplication(target);
      
      return NextResponse.json({
        success: true,
        data: metrics,
        message: 'ApplicationMonitoringdataFetchsuccess'
      });
      
    } else {
      return NextResponse.json({
        success: false,
        error: 'Unknown operation type'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Performance API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}