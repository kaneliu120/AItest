'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, DollarSign, Clock, PieChart, LineChart, Download, Filter } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">数据分析中心 📊</h1>
            <p className="text-muted-foreground">系统数据和业务指标分析</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              导出数据
            </Button>
            <Button size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              刷新数据
            </Button>
          </div>
        </div>

        {/* 关键指标 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">活跃用户</p>
                  <p className="text-2xl font-bold">1,248</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% 本月
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总收入</p>
                  <p className="text-2xl font-bold">₱125,430</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +18% 本月
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">平均响应时间</p>
                  <p className="text-2xl font-bold">142ms</p>
                  <p className="text-xs text-red-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +5% 本月
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">成功率</p>
                  <p className="text-2xl font-bold">98.7%</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +0.3% 本月
                  </p>
                </div>
                <PieChart className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>用户增长趋势</CardTitle>
              <CardDescription>过去30天用户活跃度</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border rounded-lg bg-gray-50">
                <div className="text-center">
                  <LineChart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">用户增长图表</p>
                  <p className="text-sm text-gray-400">图表组件待集成</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>收入分布</CardTitle>
              <CardDescription>各业务线收入占比</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border rounded-lg bg-gray-50">
                <div className="text-center">
                  <PieChart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">收入分布图表</p>
                  <p className="text-sm text-gray-400">图表组件待集成</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 数据表格 */}
        <Card>
          <CardHeader>
            <CardTitle>详细数据</CardTitle>
            <CardDescription>系统各项指标详细数据</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">指标</th>
                    <th className="text-left py-3 px-4 font-medium">今日</th>
                    <th className="text-left py-3 px-4 font-medium">昨日</th>
                    <th className="text-left py-3 px-4 font-medium">本周</th>
                    <th className="text-left py-3 px-4 font-medium">变化率</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { metric: 'API调用次数', today: '12,458', yesterday: '11,892', week: '85,234', change: '+4.8%' },
                    { metric: '页面浏览量', today: '8,942', yesterday: '8,523', week: '59,834', change: '+4.9%' },
                    { metric: '新用户注册', today: '124', yesterday: '118', week: '842', change: '+5.1%' },
                    { metric: '任务完成数', today: '856', yesterday: '812', week: '5,892', change: '+5.4%' },
                    { metric: '错误率', today: '0.8%', yesterday: '0.9%', week: '0.85%', change: '-11.1%' },
                    { metric: '平均会话时长', today: '8m 24s', yesterday: '8m 12s', week: '8m 18s', change: '+2.4%' },
                  ].map((row, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{row.metric}</td>
                      <td className="py-3 px-4 font-medium">{row.today}</td>
                      <td className="py-3 px-4">{row.yesterday}</td>
                      <td className="py-3 px-4">{row.week}</td>
                      <td className={`py-3 px-4 font-medium ${
                        row.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {row.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 分析报告 */}
        <Card>
          <CardHeader>
            <CardTitle>分析报告</CardTitle>
            <CardDescription>自动生成的数据分析报告</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: '用户行为分析报告',
                  description: '分析用户使用模式和偏好',
                  date: '2026-02-21',
                  insights: ['移动端使用率增长25%', '晚间活跃度最高', '新功能接受度良好'],
                },
                {
                  title: '性能优化报告',
                  description: '系统性能分析和优化建议',
                  date: '2026-02-20',
                  insights: ['API响应时间优化15%', '数据库查询效率提升', '缓存命中率改善'],
                },
                {
                  title: '业务增长报告',
                  description: '业务指标增长趋势分析',
                  date: '2026-02-19',
                  insights: ['收入环比增长18%', '用户留存率提升', '新市场拓展顺利'],
                },
              ].map((report, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold">{report.title}</h3>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                    <span className="text-sm text-gray-500">{report.date}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">关键发现:</p>
                    <ul className="space-y-1">
                      {report.insights.map((insight, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start">
                          <span className="mr-2">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline">查看详情</Button>
                    <Button size="sm">下载报告</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}