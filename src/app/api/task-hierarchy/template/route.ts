import { NextResponse } from 'next/server';

export async function GET() {
  const template = `Overall task goal: Goal Name\n1. Specific Task A\n1.1 Sub-task A-1\n1.2 Sub-task A-2\n2. Specific Task B\n2.1 Sub-task B-1`;
  return NextResponse.json({ success: true, data: { template } });
}
