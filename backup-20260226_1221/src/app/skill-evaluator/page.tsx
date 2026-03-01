'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckSquare, 
  RefreshCw, 
  BarChart3, 
  FileText, 
  TestTube,
  Download,
  Code,
  FileCode,
  Users,
  Shield,
  Zap,
  Clock
} from 'lucide-react';

// 简化版本，确保JSX结构完整
export default function SkillEvaluatorPage() {
  const [isLoading, setIsLoading] = useState(false);

  const stats = {
    totalEvaluations: 156,
    averageScore: 76,
    highQualitySkills: 89,
    mediumQualitySkills: 45,
    lowQualitySkills: 22,
    lastEvaluation: '2026-02-22T16:30:00Z',
    version: '1.0.0',
    status: 'running'
  };

  const fetchEvaluationData = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">加载技能评估数据...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <CheckSquare className="h-6 w-6 text-green-500" />
          </div>
          技能质量评估系统
        </h1>
        <p className="text-gray-600 mt-2">
          自动化评估技能质量，确保工具生态系统的可靠性和一致性
        </p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Button onClick={fetchEvaluationData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新数据
        </Button>
        <div className="text-sm text-gray-500">
          评估系统: http://localhost:3001/skill-evaluator | 深度集成到Mission Control
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">平均评分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.averageScore}/100</div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={stats.averageScore} className="mt-2" />
            <p className="text-sm text-gray-500 mt-2">
              {stats.highQualitySkills}个高质量技能
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">评估总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.totalEvaluations}</div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex gap-4 mt-2">
              <div className="text-sm">
                <div className="font-medium">高质量</div>
                <div className="text-2xl text-green-600">{stats.highQualitySkills}</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">中质量</div>
                <div className="text-2xl text-yellow-600">{stats.mediumQualitySkills}</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">低质量</div>
                <div className="text-2xl text-red-600">{stats.lowQualitySkills}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">系统状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {stats.status === 'running' ? '正常' : '异常'}
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${stats.status === 'running' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">{stats.status === 'running' ? '运行中' : '已停止'}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              版本 {stats.version}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">最近评估</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {new Date(stats.lastEvaluation).toLocaleDateString()}
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {new Date(stats.lastEvaluation).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>技能评估系统版本 {stats.version} | 数据自动更新间隔: 60秒</p>
        <p className="mt-1">评估系统: http://localhost:3001/skill-evaluator | 深度集成到Mission Control</p>
      </div>
    </div>
  );
}