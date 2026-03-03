import { NextRequest, NextResponse } from 'next/server';
import { ecosystemservervice } from '@/lib/ecosystem-service';

// GET: Fetch所AllToolor特定Tool
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const toolId = searchParams.get('id');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    
    let tools = await ecosystemservervice.getToolsStatus();
    
    // Applicationfilter器
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
    console.error('Tool API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST: AddNewToolorUpdateToolStatus
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, tool } = body;
    
    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Missing action parameter',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    if (action === 'add') {
      if (!tool || !tool.id || !tool.name) {
        return NextResponse.json({
          success: false,
          error: 'Missing required tool information',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
      
      // AddNewTool(模拟)
      const newTool = {
        ...tool,
        lastChecked: new Date().toISOString(),
        status: tool.status || 'healthy'
      };
      
      return NextResponse.json({
        success: true,
        data: newTool,
        message: 'Tool added successfully',
        timestamp: new Date().toISOString()
      });
      
    } else if (action === 'update-status') {
      const { toolId, status } = body;
      
      if (!toolId || !status) {
        return NextResponse.json({
          success: false,
          error: 'Missing toolId or status parameter',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
      
      // UpdateToolStatus(模拟)
      return NextResponse.json({
        success: true,
        data: {
          toolId,
          status,
          updatedAt: new Date().toISOString()
        },
        message: 'Tool status updated successfully',
        timestamp: new Date().toISOString()
      });
      
    } else {
      return NextResponse.json({
        success: false,
        error: `Unknown operation: ${action}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Tool API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}