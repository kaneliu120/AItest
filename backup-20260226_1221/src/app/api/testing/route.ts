import { testingService } from '@/lib/testing-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'stats';
    
    if (action === 'stats') {
      const stats = await testingService.getTestStats();
      return NextResponse.json({ success: true, data: stats });
    }
    
    if (action === 'test-cases') {
      const testCases = await testingService.getTestCases();
      return NextResponse.json({ success: true, data: { testCases } });
    }
    
    // 默认返回统计
    const stats = await testingService.getTestStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('测试API错误:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'run-test';
    
    if (action === 'run-test') {
      const { testId } = body;
      
      if (!testId) {
        return NextResponse.json({ success: false, error: '缺少测试ID' }, { status: 400 });
      }
      
      const result = await testingService.runTest(testId);
      return NextResponse.json({ success: true, data: result });
    }
    
    return NextResponse.json({ success: false, error: '不支持的操作' }, { status: 400 });
  } catch (error) {
    console.error('测试API POST错误:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}
