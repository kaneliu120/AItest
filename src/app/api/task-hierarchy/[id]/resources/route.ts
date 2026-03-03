import { NextRequest, NextResponse } from 'next/server';
import { addResource, listResources } from '@/lib/mission-task-store';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const resources = await listResources(id);
    return NextResponse.json({ success: true, data: resources });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body?.name) return NextResponse.json({ success: false, error: 'name Required' }, { status: 400 });
    const resource = await addResource(id, {
      name: body.name,
      resourceType: body.resourceType || 'file',
      url: body.url || null,
      filePath: body.filePath || null,
      mimeType: body.mimeType || null,
      fileSize: body.fileSize != null ? Number(body.fileSize) : null,
      notes: body.notes || null,
      metadata: body.metadata || {},
    });
    return NextResponse.json({ success: true, data: resource });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
