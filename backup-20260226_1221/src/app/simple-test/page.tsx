'use client';

import { useState, useEffect } from 'react';

export default function SimpleTestPage() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔧 SimpleTest useEffect执行');
    
    const loadData = async () => {
      try {
        console.log('📡 简单测试加载数据...');
        setLoading(true);
        
        // 模拟API调用
        setTimeout(() => {
          console.log('📊 简单测试数据加载完成');
          setCount(11); // 模拟11个API
          console.log('✅ 简单测试setCount调用完成');
          setLoading(false);
          console.log('🔚 简单测试设置loading=false');
        }, 100);
        
      } catch (error) {
        console.error('❌ 简单测试加载失败:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">简单测试页面</h1>
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