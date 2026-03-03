/**
 * API Exampleroute
 * 展示standard NextResponse ResponseFormat
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

    const items = Array.from({ length: pageSize }, (_, i) => ({
      id: `item-${(page - 1) * pageSize + i + 1}`,
      name: `Project ${(page - 1) * pageSize + i + 1}`,
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: { items, total: 100, page, pageSize },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, data: { received: body } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
