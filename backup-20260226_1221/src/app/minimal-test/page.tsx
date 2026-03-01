'use client';

import { useState, useEffect } from 'react';

export default function MinimalTestPage() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔧 MinimalTest useEffect执行');
    
    // 直接设置状态，不使用异步
    console.log('📊 直接设置状态');
    setCount(42);
    console.log('✅ setCount调用完成');
    setLoading(false);
    console.log('🔚 setLoading调用完成');
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">最小测试页面</h1>
      <div className="space-y-4">
        <div>
          <p>加载状态: {loading ? '加载中' : '完成'}</p>
          <p>计数: {count}</p>
        </div>
      </div>
    </div>
  );
}