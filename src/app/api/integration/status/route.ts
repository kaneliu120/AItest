import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'business-integration.json');

export async function GET(request: NextRequest) {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json({
        success: false,
        error: 'Integration config file not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }
    
    let config: any;
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch {
      return NextResponse.json({ success: false, error: 'Config file format error or unreadable' }, { status: 500 });
    }
    
    // 实时CheckSystemStatus
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
    console.error('Business integration status API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}