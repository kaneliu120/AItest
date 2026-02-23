'use client';

import { Shield } from "lucide-react";

export default function TestSimplePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">简单测试页面</h1>
      <div className="flex items-center gap-4">
        <Shield className="h-8 w-8 text-green-500" />
        <p>Shield图标测试 - 应该显示一个盾牌图标</p>
      </div>
      <div className="mt-8 p-4 border rounded-lg">
        <h2 className="text-xl font-bold mb-2">测试结果</h2>
        <p className="text-green-600">✅ 如果看到盾牌图标，说明导入正常</p>
        <p className="text-red-600">❌ 如果看到错误，说明有编译问题</p>
      </div>
    </div>
  );
}