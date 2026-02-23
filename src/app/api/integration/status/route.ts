import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'business-integration.json');

export async function GET(request: NextRequest) {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json({
        success: false,
        error: '集成配置文件不存在',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }
    
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    
    // 实时检查系统状态
    const systems = Object.entries(config.systems).map(([name, sys]: [string, any]) => ({
      name,
      path: sys.path,
      api: sys.api,
      status: sys.status,
      apiStatus: sys.apiStatus
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        config,
        systems,
        integrationEndpoints: config.integrationEndpoints,
        businessWorkflows: config.businessWorkflows,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('业务集成状态API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}