import { NextRequest, NextResponse } from 'next/server';
import { ecosystemService } from '@/lib/ecosystem-service';

// GET: 获取生态系统状态
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';
    
    // 获取生态系统数据
    const tools = await ecosystemService.getToolsStatus();
    const monitoringStats = await ecosystemService.getMonitoringStats();
    const schedulerStats = await ecosystemService.getSchedulerStats();
    
    const data = {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        monitoring: monitoringStats,
        scheduler: schedulerStats,
        tools: tools,
        summary: {
          totalTools: tools.length,
          healthyTools: tools.filter(t => t.status === 'healthy').length,
          warningTools: tools.filter(t => t.status === 'warning').length,
          errorTools: tools.filter(t => t.status === 'error').length,
          connectionRate: Math.round((tools.filter(t => t.status === 'healthy').length / tools.length) * 100),
          lastUpdate: new Date().toISOString()
        }
      }
    };
    
    if (format === 'json') {
      return NextResponse.json(data);
    } else {
      // 返回HTML格式（用于直接浏览器访问）
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Mission Control - 生态系统状态</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .stat-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .stat-value { font-size: 2.5rem; font-weight: bold; margin: 10px 0; }
            .stat-label { color: #666; font-size: 0.9rem; }
            .healthy { color: #10b981; }
            .warning { color: #f59e0b; }
            .error { color: #ef4444; }
            .tools-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .tools-table th, .tools-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            .tools-table th { background: #f9fafb; font-weight: 600; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 500; }
            .status-healthy { background: #d1fae5; color: #065f46; }
            .status-warning { background: #fef3c7; color: #92400e; }
            .status-error { background: #fee2e2; color: #991b1b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Mission Control - 生态系统状态</h1>
              <p>工具连接状态监控中心</p>
              <p>更新时间: ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">总工具数</div>
                <div class="stat-value">${tools.length}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">健康工具</div>
                <div class="stat-value healthy">${tools.filter(t => t.status === 'healthy').length}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">警告工具</div>
                <div class="stat-value warning">${tools.filter(t => t.status === 'warning').length}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">错误工具</div>
                <div class="stat-value error">${tools.filter(t => t.status === 'error').length}</div>
              </div>
            </div>
            
            <h2>工具列表</h2>
            <table class="tools-table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>类别</th>
                  <th>状态</th>
                  <th>描述</th>
                  <th>最后检查</th>
                </tr>
              </thead>
              <tbody>
                ${tools.map(tool => `
                  <tr>
                    <td><strong>${tool.name}</strong></td>
                    <td>${tool.type}</td>
                    <td>
                      <span class="status-badge status-${tool.status}">
                        ${tool.status === 'healthy' ? '✅ 健康' : tool.status === 'warning' ? '⚠️ 警告' : '❌ 错误'}
                      </span>
                    </td>
                    <td>${tool.details || tool.name}</td>
                    <td>${new Date(tool.lastChecked).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 8px;">
              <h3>API 信息</h3>
              <p>JSON 格式: <a href="/api/ecosystem/status?format=json">/api/ecosystem/status?format=json</a></p>
              <pre style="background: white; padding: 15px; border-radius: 6px; overflow: auto;">
${JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
  } catch (error) {
    console.error('生态系统状态API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}