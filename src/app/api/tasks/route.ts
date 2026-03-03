import { NextRequest, NextResponse } from 'next/server';
import { postgresStore } from '@/lib/postgres-store';
import { isApiAuthorized, unauthorizedResponse } from '@/lib/auth/api-auth';

const VALID_STATUS = ['pending', 'in-progress', 'completed', 'cancelled'] as const;

type TaskStatus = (typeof VALID_STATUS)[number];

export async function GET(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get('action') || 'stats';

    if (action === 'list') {
      const tasks = await postgresStore.getAllTasks();
      return NextResponse.json({
        success: true,
        data: { tasks, total: tasks.length },
        timestamp: new Date().toISOString(),
        database: 'postgresql',
      });
    }

    // default: stats
    const stats = await postgresStore.getTaskStats();
    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
      database: 'postgresql',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch task data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isApiAuthorized(request)) return unauthorizedResponse();
  try {
    const body = await request.json();
    const action = body?.action || 'create';

    if (action === 'update-status') {
      const id = body?.id;
      const status = body?.status as TaskStatus;

      if (!id || typeof id !== 'string') {
        return NextResponse.json({ success: false, error: 'Missing valid task ID' }, { status: 400 });
      }
      if (!VALID_STATUS.includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid status value' }, { status: 400 });
      }

      const updated = await postgresStore.updateTask(id, { status });
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Task not found or update failed' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Task status updated successfully',
      });
    }

    // default: create
    if (!body.title) {
      return NextResponse.json({ success: false, error: 'Task title cannot be empty' }, { status: 400 });
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
      metadata: body.metadata || {},
    });

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task creation failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: task,
      message: 'Task created successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Task creation/update failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
