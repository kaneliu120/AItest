import { NextRequest, NextResponse } from 'next/server';
import { SecurityToolManager, OWASPZAPIntegration } from '@/lib/security-testing';

// GET: Fetch security tools and scan results
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    if (action === 'tools') {
      // Get available security tools
      const tools = await SecurityToolManager.getAvailableTools();
      
      return NextResponse.json({
        success: true,
        data: tools
      });
    } else if (action === 'zap-status') {
      // Check ZAP status
      const status = await OWASPZAPIntegration.checkZAPAvailability();
      
      return NextResponse.json({
        success: true,
        data: status
      });
    } else {
      // Default: return tool list
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
      error: error instanceof Error ? error.message : 'Unknown error'
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
        error: 'Missing action parameter'
      }, { status: 400 });
    }
    
    if (action === 'scan') {
      // 执行安全扫描
      if (!toolId || !target) {
        return NextResponse.json({
          success: false,
          error: 'Missing toolId or target parameter'
        }, { status: 400 });
      }
      
      const result = await SecurityToolManager.runSecurityScan(toolId, target, options);
      
      return NextResponse.json({
        success: result.success,
        data: result,
        message: result.success ? 'Security scan completed' : 'Security scan failed'
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
          error: 'Missing or invalid scanResults parameter'
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
        error: 'Unknown operation type'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Security API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}