// 混合组件 - 服务器组件获取数据，客户端组件处理交互

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import ClientInteractivePart from './client-part-v2';

// 获取API数据
async function getApiData() {
  try {
    const response = await fetch('http://localhost:3000/api/external-apis', {
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
    const response = await fetch('http://localhost:3000/api/external-apis?action=stats', {
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
    const response = await fetch('http://localhost:3000/api/external-apis?action=alerts&resolved=false&limit=5', {
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

export default async function ExternalApisPage() {
  // 并行获取所有数据
  const [apiData, statsData, alertsData] = await Promise.all([
    getApiData(),
    getStats(),
    getAlerts()
  ]);

  const apis = apiData.success ? apiData.data.apis : [];
  const stats = statsData.success ? statsData.data : null;
  const alerts = alertsData.success ? alertsData.data.alerts : [];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">外部API监控</h1>
          <p className="text-muted-foreground mt-2">
            监控和管理所有外部API服务的连接状态和性能
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            API数量: <span className="font-semibold text-foreground">{apis.length}</span> | 
            加载状态: <span className="font-semibold text-foreground">完成 (服务器端渲染)</span>
          </div>
        </div>
      </div>

      {/* 传递数据到客户端组件 */}
      <ClientInteractivePart 
        initialApis={apis}
        initialStats={stats}
        initialAlerts={alerts}
      />
    </div>
  );
}