/**
 * 简单测试API - 不使用中间件
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const data = {
      message: '简单API测试成功',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      success: true,
      data: {
        test: '这是一个简单的测试',
        number: 123,
        array: [1, 2, 3]
      }
    };
    
    return NextResponse.json(data, { status: 200 });
    
  } catch (error) {
    console.error('简单API错误:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}