import { NextResponse } from 'next/server';

export async function GET() {
  const template = `Goal: Objective Name\n1. Specific Task A\n1.1 Subtask A-1\n1.2 Subtask A-2\n2. Specific Task B\n2.1 Subtask B-1`;
  return NextResponse.json({ success: true, data: { template } });
}
