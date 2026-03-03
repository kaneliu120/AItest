import { NextRequest, NextResponse } from 'next/server';
import { deleteMissionTask, getMissionTask, listMissionTasks, updateMissionTask } from '@/lib/mission-task-store';
import { isApiAuthorized, unauthorizedResponse } from '@/lib/auth/api-auth';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getMissionTask(id);
  if (!task) return NextResponse.json({ success: false, error: '未找到任务' }, { status: 404 });
  const all = await listMissionTasks();
  const subtasks = all.filter(t => t.parentId === id);
  return NextResponse.json({ success: true, data: { task, subtasks } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isApiAuthorized(request)) return unauthorizedResponse();
  const { id } = await params;
  const body = await request.json();
  const updated = await updateMissionTask(id, body || {});
  if (!updated) return NextResponse.json({ success: false, error: '无有效可更新字段或任务不存在' }, { status: 400 });
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isApiAuthorized(request)) return unauthorizedResponse();
  const { id } = await params;
  const ok = await deleteMissionTask(id);
  return NextResponse.json({ success: ok });
}
