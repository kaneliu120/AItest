import { NextRequest, NextResponse } from 'next/server';
import { SecurityToolManager, OWASPZAPIntegration } from '@/lib/security-testing';

// GET: 获取安全工具和扫描结果
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    if (action === 'tools') {
      // 获取可用安全工具
      const tools = await SecurityToolManager.getAvailableTools();
      
      return NextResponse.json({
        success: true,
        data: tools
      });
    } else if (action === 'zap-status') {
      // 检查ZAP状态
      const status = await OWASPZAPIntegration.checkZAPAvailability();
      
      return NextResponse.json({
        success: true,
        data: status
      });
    } else {
      // 默认返回工具列表
      const tools = await SecurityToolManager.getAvailableTools();
      
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
    console.error('Security API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// POST: 执行安全扫描
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
    
    if (action === 'scan') {
      // 执行安全扫描
      if (!toolId || !target) {
        return NextResponse.json({
          success: false,
          error: '缺少 toolId 或 target 参数'
        }, { status: 400 });
      }
      
      const result = await SecurityToolManager.runSecurityScan(toolId, target, options);
      
      return NextResponse.json({
        success: result.success,
        data: result,
        message: result.success ? '安全扫描完成' : '安全扫描失败'
      });
      
    } else if (action === 'install-zap') {
      // 安装ZAP
      const result = await OWASPZAPIntegration.installZAP();
      
      return NextResponse.json({
        success: result.success,
        data: result,
        message: result.message
      });
      
    } else if (action === 'generate-report') {
      // 生成安全报告
      const { scanResults } = body;
      
      if (!scanResults || !Array.isArray(scanResults)) {
        return NextResponse.json({
          success: false,
          error: '缺少 scanResults 参数或格式错误'
        }, { status: 400 });
      }
      
      const report = await SecurityToolManager.generateSecurityReport(scanResults);
      
      return new NextResponse(report, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="security-scan-report.json"'
        }
      });
      
    } else {
      return NextResponse.json({
        success: false,
        error: '未知的操作类型'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Security API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}