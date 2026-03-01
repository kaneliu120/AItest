import { NextRequest, NextResponse } from 'next/server';
import { postgresStore } from '@/lib/postgres-store';

export async function GET(request: NextRequest) {
  try {
    // 获取任务统计
    const stats = await postgresStore.getTaskStats();
    
    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
      database: 'postgresql'
    });
  } catch (error) {
    console.error('API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取任务数据失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必要字段
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: '任务标题不能为空' },
        { status: 400 }
      );
    }

    const task = await postgresStore.createTask({
      title: body.title,
      description: body.description || '',
      priority: body.priority || 'medium',
      status: body.status || 'pending',
      source: body.source || 'manual',
      type: body.type || 'general',
      dueDate: body.dueDate,
      assignedTo: body.assignedTo,
      tags: body.tags || [],
      metadata: body.metadata || {}
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: '创建任务失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
      message: '任务创建成功'
    });
  } catch (error) {
    console.error('创建任务API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '创建任务失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
