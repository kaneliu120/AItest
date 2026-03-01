'use client';

import { useState, useEffect } from 'react';

export default function TestExternalApisPage() {
  const [apis, setApis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔧 Test useEffect执行');
    
    const loadData = async () => {
      try {
        console.log('📡 测试加载API数据...');
        setLoading(true);
        
        const response = await fetch('/api/external-apis');
        console.log('📡 响应状态:', response.status, response.ok);
        const data = await response.json();
        console.log('📊 测试API数据:', data.success ? '成功' : '失败', '长度:', data.data?.apis?.length || 0);
        
        if (data.success) {
          const apiList = data.data.apis || [];
          console.log('📋 测试设置API列表:', apiList.length);
          // 使用函数式更新
          setApis(prev => {
            console.log('🔄 setApis函数被调用，新数据:', apiList.length, '旧数据:', prev.length);
            return apiList;
          });
          console.log('✅ 测试setApis调用完成');
        }
        
      } catch (error) {
        console.error('❌ 测试加载失败:', error);
      } finally {
        console.log('🔚 测试加载完成，设置loading=false');
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">测试外部API页面</h1>
      <div className="space-y-4">
        <div>
          <p>加载状态: {loading ? '加载中' : '完成'}</p>
          <p>API数量: {apis.length}</p>
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
      </div>
    </div>
  );
}