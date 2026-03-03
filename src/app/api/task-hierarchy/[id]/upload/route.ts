import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { addResource } from '@/lib/mission-task-store';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ success: false, error: 'file is required' }, { status: 400 });

    const ALLOWED_MIME = new Set([
      'text/plain',
      'application/pdf',
      'application/json',
      'image/png',
      'image/jpeg',
      'image/webp',
      'video/mp4',
    ]);
    const MAX_BYTES = 20 * 1024 * 1024; // 20MB

    if (!ALLOWED_MIME.has(file.type || '')) {
      return NextResponse.json({ success: false, error: `Unsupported file type: ${file.type || 'unknown'}` }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: `File too large, max 20MB` }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), 'data', 'uploads', 'mission-tasks', id);
    fs.mkdirSync(dir, { recursive: true });
    // 使用 path.basename 去除路径组件，防止路径遍历攻击
    const safeName = `${Date.now()}-${path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const fullPath = path.resolve(dir, safeName);
    // 二次验证最终路径确实在允许目录内
    if (!fullPath.startsWith(path.resolve(dir))) {
      return NextResponse.json({ success: false, error: 'Invalid file path' }, { status: 400 });
    }
    fs.writeFileSync(fullPath, bytes);

    const resource = await addResource(id, {
      name: file.name,
      resourceType: file.type.startsWith('image/') || file.type.startsWith('video/') ? 'media' : 'file',
      filePath: fullPath,
      mimeType: file.type || null,
      fileSize: file.size,
      notes: 'uploaded',
      metadata: { upload: true },
    });

    return NextResponse.json({ success: true, data: resource });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
