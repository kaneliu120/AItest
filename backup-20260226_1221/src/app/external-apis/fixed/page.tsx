// 混合组件 - 服务器组件获取数据，客户端组件处理交互

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import ClientInteractivePart from './client-part';

// 获取API数据
async function getApiData() {
  try {
    const response = await fetch('http://localhost:3001/api/external-apis', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取API数据失败:', error);
    return { success: false, data: { apis: [] } };
  }
}

// 获取统计信息
async function getStats() {
  try {
    const response = await fetch('http://localhost:3001/api/external-apis?action=stats', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取统计信息失败:', error);
    return { success: false, data: null };
  }
}

// 获取告警信息
async function getAlerts() {
  try {
    const response = await fetch('http://localhost:3001/api/external-apis?action=alerts&resolved=false&limit=5', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取告警信息失败:', error);
    return { success: false, data: { alerts: [] } };
  }
}

export default async function FixedExternalApisPage() {
  // 并行获取所有数据
  const [apiData, statsData, alertsData] = await Promise.all([
    getApiData(),
    getStats(),
    getAlerts()
  ]);
  
  const apis = apiData.success ? apiData.data.apis || [] : [];
  const stats = statsData.success ? statsData.data : null;
  const alerts = alertsData.success ? alertsData.data.alerts || [] : [];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题和控制栏 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              🌐 外部API监控中心
            </h1>
            <p className="text-muted-foreground">监控和管理所有外部API服务的状态和配置</p>
            <p className="text-xs text-slate-500 mt-1">API数量: {apis.length} | 加载状态: 完成 (服务器端渲染)</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Button variant="outline" size="md">
              🔄 检查所有API
            </Button>
            <Link href="/external-apis/detailed">
              <Button variant="outline" size="md">
                📊 详细列表
              </Button>
            </Link>
            <Button size="md">
              🔑 添加新API
            </Button>
            <Button variant="outline" size="md">
              ⚙️ 设置
            </Button>
          </div>
        </div>
        
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">API总数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apis.length}</div>
              <p className="text-xs text-slate-500">已配置的外部API服务</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">活跃API</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {apis.filter(api => api.status === 'active').length}
              </div>
              <p className="text-xs text-slate-500">当前可用的API服务</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">平均响应时间</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.averageResponseTime ? `${stats.averageResponseTime.toFixed(1)}ms` : 'N/A'}
              </div>
              <p className="text-xs text-slate-500">所有API的平均响应时间</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">成功率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.successRate ? `${(stats.successRate * 100).toFixed(1)}%` : 'N/A'}
              </div>
              <Progress value={stats?.successRate ? stats.successRate * 100 : 0} className="mt-2" />
            </CardContent>
          </Card>
        </div>
        
        {/* 客户端交互部分 */}
        <ClientInteractivePart initialApis={apis} />
        
        {/* 操作指南 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">操作指南</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  🔑 添加新API
                </h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>1. 点击"添加API"按钮</li>
                  <li>2. 填写API基本信息</li>
                  <li>3. 配置认证信息</li>
                  <li>4. 保存并测试连接</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  🔧 故障排除
                </h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• 检查API密钥是否过期</li>
                  <li>• 验证网络连接</li>
                  <li>• 检查API配额限制</li>
                  <li>• 查看错误日志详情</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  🛡️ 安全建议
                </h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• 定期轮换API密钥</li>
                  <li>• 使用最小必要权限</li>
                  <li>• 监控异常调用模式</li>
                  <li>• 启用API使用审计</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-slate-500 pt-4">
          <p>外部API监控数据每60秒自动刷新 • 最后更新: {new Date().toLocaleString()}</p>
          <p className="mt-1">支持: Google APIs • OpenAI • Anthropic • GitHub • Azure • LinkedIn • Brave Search</p>
        </div>
      </div>
    </div>
  );
}