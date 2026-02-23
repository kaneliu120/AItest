import { NextRequest, NextResponse } from 'next/server';
import { TestToolManager, AIAssistIntegration, CortexaAIIntegration } from '@/lib/test-tools-integration';

// GET: 获取可用工具和状态
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    if (action === 'list') {
      // 获取所有可用工具
      const tools = await TestToolManager.getAvailableTools();
      
      return NextResponse.json({
        success: true,
        data: tools
      });
    } else if (action === 'health') {
      // 检查工具健康状态
      const toolId = searchParams.get('toolId');
      
      if (!toolId) {
        return NextResponse.json({
          success: false,
          error: '缺少 toolId 参数'
        }, { status: 400 });
      }
      
      const health = await TestToolManager.checkToolHealth(toolId);
      
      return NextResponse.json({
        success: true,
        data: health
      });
    } else {
      // 默认返回工具列表
      const tools = await TestToolManager.getAvailableTools();
      
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
    console.error('Tools API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// POST: 工具操作
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, toolId, ...params } = body;
    
    if (!action) {
      return NextResponse.json({
        success: false,
        error: '缺少 action 参数'
      }, { status: 400 });
    }
    
    if (action === 'install') {
      // 安装工具
      if (!toolId) {
        return NextResponse.json({
          success: false,
          error: '缺少 toolId 参数'
        }, { status: 400 });
      }
      
      const result = await TestToolManager.installTool(toolId);
      
      return NextResponse.json({
        success: result.success,
        data: result,
        message: result.message
      });
      
    } else if (action === 'diagnose') {
      // AI Assist诊断
      const { issue } = params;
      
      if (!issue) {
        return NextResponse.json({
          success: false,
          error: '缺少 issue 参数'
        }, { status: 400 });
      }
      
      const result = await AIAssistIntegration.runDiagnostic(issue);
      
      return NextResponse.json({
        success: result.success,
        data: result,
        message: result.success ? '诊断完成' : '诊断失败'
      });
      
    } else if (action === 'execute-command') {
      // 执行命令
      const { command } = params;
      
      if (!command) {
        return NextResponse.json({
          success: false,
          error: '缺少 command 参数'
        }, { status: 400 });
      }
      
      const result = await AIAssistIntegration.executeCommand(command);
      
      return NextResponse.json({
        success: result.success,
        data: result,
        message: result.success ? '命令执行成功' : '命令执行失败'
      });
      
    } else if (action === 'run-web-test') {
      // 运行Web测试
      const { url, testType } = params;
      
      if (!url) {
        return NextResponse.json({
          success: false,
          error: '缺少 url 参数'
        }, { status: 400 });
      }
      
      const result = await CortexaAIIntegration.runWebTest(url, testType || 'basic');
      
      return NextResponse.json({
        success: result.success,
        data: result,
        message: result.success ? 'Web测试完成' : 'Web测试失败'
      });
      
    } else if (action === 'take-screenshot') {
      // 截图
      const { url } = params;
      
      if (!url) {
        return NextResponse.json({
          success: false,
          error: '缺少 url 参数'
        }, { status: 400 });
      }
      
      const result = await CortexaAIIntegration.takeScreenshot(url);
      
      return NextResponse.json({
        success: result.success,
        data: result,
        message: result.success ? '截图成功' : '截图失败'
      });
      
    } else {
      return NextResponse.json({
        success: false,
        error: '未知的操作类型'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Tools API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}