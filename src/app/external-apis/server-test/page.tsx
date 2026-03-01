// 服务器组件 - 无状态管理问题

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

export default async function ServerTestPage() {
  const apiData = await getApiData();
  const apis = apiData.success ? apiData.data.apis || [] : [];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">服务器组件测试页面</h1>
      <div className="space-y-4">
        <div>
          <p>API数量: {apis.length}</p>
          <p>加载状态: 完成 (服务器端渲染)</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">API列表 (前5个):</h2>
          {apis.length > 0 ? (
            <ul className="space-y-2">
              {apis.slice(0, 5).map((api: any) => (
                <li key={api.id} className="p-2 border rounded">
                  {api.name} - {api.provider}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">没有API数据</p>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>服务器组件优势</CardTitle>
            <CardDescription>无状态管理问题，直接获取数据</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>✅ 无React状态更新问题</li>
              <li>✅ 无hydration错误</li>
              <li>✅ 直接获取数据</li>
              <li>✅ 无客户端JavaScript依赖</li>
              <li>✅ 更好的SEO</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}