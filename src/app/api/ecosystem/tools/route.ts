import { NextRequest, NextResponse } from 'next/server';
import { ecosystemService } from '@/lib/ecosystem-service';

// GET: 获取所有工具或特定工具
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const toolId = searchParams.get('id');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    
    let tools = await ecosystemService.getToolsStatus();
    
    // 应用过滤器
    if (toolId) {
      tools = tools.filter(t => t.name.toLowerCase().includes(toolId.toLowerCase()));
    }
    if (category) {
      tools = tools.filter(t => t.type === category);
    }
    if (status) {
      tools = tools.filter(t => t.status === status);
    }
    
    return NextResponse.json({
      success: true,
      data: tools,
      total: tools.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('工具API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST: 添加新工具或更新工具状态
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, tool } = body;
    
    if (!action) {
      return NextResponse.json({
        success: false,
        error: '缺少 action 参数',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    if (action === 'add') {
      if (!tool || !tool.id || !tool.name) {
        return NextResponse.json({
          success: false,
          error: '缺少必要的工具信息',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
      
      // 添加新工具（模拟）
      const newTool = {
        ...tool,
        lastChecked: new Date().toISOString(),
        status: tool.status || 'healthy'
      };
      
      return NextResponse.json({
        success: true,
        data: newTool,
        message: '工具添加成功',
        timestamp: new Date().toISOString()
      });
      
    } else if (action === 'update-status') {
      const { toolId, status } = body;
      
      if (!toolId || !status) {
        return NextResponse.json({
          success: false,
          error: '缺少 toolId 或 status 参数',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
      
      // 更新工具状态（模拟）
      return NextResponse.json({
        success: true,
        data: {
          toolId,
          status,
          updatedAt: new Date().toISOString()
        },
        message: '工具状态更新成功',
        timestamp: new Date().toISOString()
      });
      
    } else {
      return NextResponse.json({
        success: false,
        error: `未知操作: ${action}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
  } catch (error) {
    console.error('工具API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}