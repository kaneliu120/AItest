'use client';

import { useState, useEffect } from 'react';

export default function DebugTestPage() {
  const [apis, setApis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔧 DebugTest useEffect执行');
    
    const loadData = async () => {
      try {
        console.log('📡 调试加载API数据...');
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/external-apis');
        console.log('📡 响应状态:', response.status, response.ok);
        
        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 调试API数据:', data);
        
        if (data.success) {
          const apiList = data.data.apis || [];
          console.log('📋 调试设置API列表:', apiList.length);
          
          // 使用函数式更新
          setApis(prev => {
            console.log('🔄 setApis函数被调用，新数据:', apiList.length, '旧数据:', prev.length);
            return apiList;
          });
          
          console.log('✅ 调试setApis调用完成');
        } else {
          throw new Error('API返回失败');
        }
        
      } catch (error) {
        console.error('❌ 调试加载失败:', error);
        setError(error instanceof Error ? error.message : '未知错误');
      } finally {
        console.log('🔚 调试加载完成，设置loading=false');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // 监听状态变化
  useEffect(() => {
    console.log('📊 apis状态变化:', apis.length);
  }, [apis]);

  useEffect(() => {
    console.log('📊 loading状态变化:', loading);
  }, [loading]);

  useEffect(() => {
    console.log('📊 error状态变化:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">调试测试页面</h1>
      <div className="space-y-4">
        <div>
          <p>加载状态: {loading ? '加载中' : '完成'}</p>
          <p>API数量: {apis.length}</p>
          {error && <p className="text-red-500">错误: {error}</p>}
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">API列表 (前5个):</h2>
          {apis.length > 0 ? (
            <ul className="space-y-2">
              {apis.slice(0, 5).map((api, index) => (
                <li key={index} className="p-2 border rounded">
                  {api.name} - {api.provider}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">没有API数据</p>
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">调试信息:</h2>
          <pre className="bg-slate-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({
              apisCount: apis.length,
              loading,
              error,
              sampleApi: apis[0] || null
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}