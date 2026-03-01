'use client';

import { useState, useEffect } from 'react';

export default function ReactTestPage() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔧 ReactTest useEffect执行');
    
    // 直接设置状态
    setCount(42);
    console.log('✅ setCount(42)调用完成');
    
    setLoading(false);
    console.log('✅ setLoading(false)调用完成');
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">React状态测试页面</h1>
      <div className="space-y-4">
        <div>
          <p>加载状态: {loading ? '加载中' : '完成'}</p>
          <p>计数: {count}</p>
        </div>
        <div>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => {
              console.log('🔄 点击按钮');
              setCount(prev => {
                console.log('📊 setCount函数被调用，新值:', prev + 1);
                return prev + 1;
              });
            }}
          >
            增加计数
          </button>
        </div>
      </div>
    </div>
  );
}