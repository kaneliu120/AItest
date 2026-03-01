import { ecosystemService } from '@/lib/ecosystem-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const stats = await ecosystemService.getSchedulerStats();
    
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('任务调度器API错误:', error);
    
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'stats';
    
    if (action === 'stats') {
      const stats = await ecosystemService.getSchedulerStats();
      
      return NextResponse.json({ success: true, data: stats });
    }
    
    if (action === 'simulate-task') {
      // 模拟任务执行
      const taskResult = {
        id: `task-${Date.now()}`,
        name: body.name || '模拟任务',
        status: 'completed',
        result: 'success',
        duration: 0,  // actual duration tracked by task runner
        timestamp: new Date().toISOString(),
      };
      
      return NextResponse.json({ success: true, data: taskResult });
    }
    
    return NextResponse.json({ success: false, error: '不支持的操作' }, { status: 400 });
  } catch (error) {
    console.error('POST API错误:', error);
    
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}
