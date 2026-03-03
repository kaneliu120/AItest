import { NextResponse } from 'next/server';

export async function GET() {
  const template = `总任务目标: 目标名称\n1. 具体任务A\n1.1 子任务A-1\n1.2 子任务A-2\n2. 具体任务B\n2.1 子任务B-1`;
  return NextResponse.json({ success: true, data: { template } });
}
