'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, Calendar, PieChart, BarChart3, Download, Plus, Filter } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function FinancePage() {
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 获取财务摘要
      const summaryRes = await fetch('/api/finance?action=summary');
      const summaryData = await summaryRes.json();
      setSummary(summaryData.data);

      // 获取交易记录
      const transactionsRes = await fetch('/api/finance?action=transactions');
      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData.data.transactions || []);

      // 获取预算信息
      const budgetsRes = await fetch('/api/finance?action=budgets');
      const budgetsData = await budgetsRes.json();
      setBudgets(budgetsData.data.budgets || []);
    } catch (error) {
      console.error('获取财务数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getProfitColor = (profit: number) => {
    return profit >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'text-green-600 bg-green-50 border-green-200';
      case 'over-budget': return 'text-red-600 bg-red-50 border-red-200';
      case 'under-budget': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载财务数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">财务中心</h1>
            <p className="text-muted-foreground">管理和跟踪您的财务状况</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              时间范围
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              添加交易
            </Button>
          </div>
        </div>

        {/* 财务摘要卡片 */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">总收入</p>
                    <p className="text-2xl font-bold">{formatCurrency(summary.totalIncome)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">总支出</p>
                    <p className="text-2xl font-bold">{formatCurrency(summary.totalExpenses)}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">净利润</p>
                    <p className={`text-2xl font-bold ${getProfitColor(summary.netProfit)}`}>
                      {formatCurrency(summary.netProfit)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">利润率</p>
                    <p className="text-2xl font-bold">{summary.profitMargin.toFixed(1)}%</p>
                  </div>
                  <PieChart className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 月度趋势 */}
        {summary?.monthlyTrend && summary.monthlyTrend.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>月度趋势</CardTitle>
              <CardDescription>收入和支出月度变化</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.monthlyTrend.map((month: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{month.month}</span>
                      <span className={`font-bold ${getProfitColor(month.profit)}`}>
                        {formatCurrency(month.profit)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-green-600">收入</span>
                          <span>{formatCurrency(month.income)}</span>
                        </div>
                        <Progress value={(month.income / Math.max(...summary.monthlyTrend.map((m: any) => m.income))) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-red-600">支出</span>
                          <span>{formatCurrency(month.expenses)}</span>
                        </div>
                        <Progress value={(month.expenses / Math.max(...summary.monthlyTrend.map((m: any) => m.expenses))) * 100} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 交易记录 */}
        <Card>
          <CardHeader>
            <CardTitle>最近交易</CardTitle>
            <CardDescription>最近的收入和支出记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {transaction.type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{transaction.category} • {transaction.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">{transaction.currency}</p>
                  </div>
                </div>
              ))}
            </div>
            {transactions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">暂无交易记录</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 预算跟踪 */}
        {budgets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>预算跟踪</CardTitle>
              <CardDescription>预算使用情况和状态</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgets.map((budget) => (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{budget.name}</p>
                        <p className="text-sm text-muted-foreground">{budget.category} • {budget.period}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getBudgetStatusColor(budget.status)}`}>
                        {budget.status === 'on-track' ? '正常' : budget.status === 'over-budget' ? '超支' : '未使用'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>已使用: {formatCurrency(budget.spent)}</span>
                        <span>剩余: {formatCurrency(budget.remaining)}</span>
                      </div>
                      <Progress value={(budget.spent / budget.allocated) * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>预算: {formatCurrency(budget.allocated)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 快速操作 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-auto py-4">
            <Download className="h-4 w-4 mr-2" />
            下载财务报告
          </Button>
          <Button variant="outline" className="h-auto py-4">
            <BarChart3 className="h-4 w-4 mr-2" />
            查看详细分析
          </Button>
          <Button className="h-auto py-4">
            <Plus className="h-4 w-4 mr-2" />
            添加新预算
          </Button>
        </div>
      </div>
    </div>
  );
}