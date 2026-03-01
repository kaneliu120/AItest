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
  const [showTxForm, setShowTxForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [txForm, setTxForm] = useState({
    type: 'income',
    amount: '',
    description: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
  });
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    category: 'Operations',
    period: 'monthly',
    allocated: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch finance summary
      const summaryRes = await fetch('/api/finance?action=summary');
      const summaryData = await summaryRes.json();
      setSummary(summaryData.data);

      // Fetch transactions
      const transactionsRes = await fetch('/api/finance?action=transactions');
      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData.data.transactions || []);

      // Fetch budget info
      const budgetsRes = await fetch('/api/finance?action=budgets');
      const budgetsData = await budgetsRes.json();
      setBudgets(budgetsData.data.budgets || []);
    } catch (error) {
      console.error('Failed to fetch finance data:', error);
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

  const submitTransaction = async () => {
    if (!txForm.amount || !txForm.description.trim()) {
      alert('Please fill in amount and description');
      return;
    }

    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: txForm.type,
        amount: Number(txForm.amount),
        description: txForm.description,
        category: txForm.category,
        date: txForm.date,
        tags: ['manual'],
      }),
    });

    const data = await res.json();
    if (!res.ok || !data?.success) {
      alert(data?.error || 'Failed to add transaction');
      return;
    }

    setShowTxForm(false);
    setTxForm({
      type: 'income',
      amount: '',
      description: '',
      category: 'Other',
      date: new Date().toISOString().split('T')[0],
    });
    fetchData();
  };

  const submitBudget = async () => {
    if (!budgetForm.name.trim() || !budgetForm.allocated) {
      alert('Please fill in budget name and amount');
      return;
    }

    const res = await fetch('/api/finance?action=budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: budgetForm.name,
        category: budgetForm.category,
        period: budgetForm.period,
        allocated: Number(budgetForm.allocated),
      }),
    });

    const data = await res.json();
    if (!res.ok || !data?.success) {
      alert(data?.error || 'Failed to add budget');
      return;
    }

    setShowBudgetForm(false);
    setBudgetForm({ name: '', category: 'Operations', period: 'monthly', allocated: '' });
    fetchData();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading finance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Finance Center</h1>
            <p className="text-muted-foreground">Manage and track your finances</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </Button>
            <Button size="sm" onClick={() => setShowTxForm((v) => !v)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        {showTxForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add Transaction</CardTitle>
              <CardDescription>Record an income or expense transaction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <select className="border rounded px-3 py-2" value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                <input className="border rounded px-3 py-2" placeholder="Amount" type="number" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} />
                <input className="border rounded px-3 py-2" placeholder="Description" value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} />
                <input className="border rounded px-3 py-2" placeholder="Category" value={txForm.category} onChange={(e) => setTxForm({ ...txForm, category: e.target.value })} />
                <input className="border rounded px-3 py-2" type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} />
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={submitTransaction}>Save Transaction</Button>
                <Button variant="outline" onClick={() => setShowTxForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showBudgetForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add Budget</CardTitle>
              <CardDescription>Create a budget entry for tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input className="border rounded px-3 py-2" placeholder="Budget Name" value={budgetForm.name} onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })} />
                <input className="border rounded px-3 py-2" placeholder="Category" value={budgetForm.category} onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })} />
                <select className="border rounded px-3 py-2" value={budgetForm.period} onChange={(e) => setBudgetForm({ ...budgetForm, period: e.target.value })}>
                  <option value="monthly">monthly</option>
                  <option value="quarterly">quarterly</option>
                  <option value="yearly">yearly</option>
                </select>
                <input className="border rounded px-3 py-2" placeholder="BudgetAmount" type="number" value={budgetForm.allocated} onChange={(e) => setBudgetForm({ ...budgetForm, allocated: e.target.value })} />
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={submitBudget}>Save Budget</Button>
                <Button variant="outline" onClick={() => setShowBudgetForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Finance Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                    <p className="text-2xl font-bold">{summary.profitMargin.toFixed(1)}%</p>
                  </div>
                  <PieChart className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Monthly Trend */}
        {summary?.monthlyTrend && summary.monthlyTrend.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trend</CardTitle>
              <CardDescription>Monthly income and expense changes</CardDescription>
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
                          <span className="text-green-600">Income</span>
                          <span>{formatCurrency(month.income)}</span>
                        </div>
                        <Progress value={(month.income / Math.max(...summary.monthlyTrend.map((m: any) => m.income))) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-red-600">Expense</span>
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

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Recent income and expense records</CardDescription>
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
                <p className="text-muted-foreground">No transaction records</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Tracking */}
        {budgets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Budget Tracking</CardTitle>
              <CardDescription>Budget usage and status</CardDescription>
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
                        {budget.status === 'on-track' ? 'On Track' : budget.status === 'over-budget' ? 'Over Budget' : 'Unused'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Used: {formatCurrency(budget.spent)}</span>
                        <span>Remaining: {formatCurrency(budget.remaining)}</span>
                      </div>
                      <Progress value={(budget.spent / budget.allocated) * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>Budget: {formatCurrency(budget.allocated)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-auto py-4" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            Download Finance Report
          </Button>
          <Button variant="outline" className="h-auto py-4" onClick={() => window.location.assign('/analytics')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            View Detailed Analytics
          </Button>
          <Button className="h-auto py-4" onClick={() => setShowBudgetForm((v) => !v)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Budget
          </Button>
        </div>
      </div>
    </div>
  );
}