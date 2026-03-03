/**
 * 简单测试API - 不使用中间件
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const data = {
      message: 'Simple API test successful',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      success: true,
      data: {
        test: 'This is a simple test',
        number: 123,
        array: [1, 2, 3]
      }
    };
    
    return NextResponse.json(data, { status: 200 });
    
  } catch (error) {
    console.error('Simple API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}