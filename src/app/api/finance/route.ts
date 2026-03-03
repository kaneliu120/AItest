import { financeStore } from '@/lib/finance-store';
import { NextRequest, NextResponse } from 'next/server';

type MonthlyTrendItem = {
  month: string;
  income: number;
  expenses: number;
  profit: number;
};

type BudgetItem = {
  id: string;
  name: string;
  category: string;
  period: string;
  allocated: number;
  spent: number;
  remaining: number;
  status: 'on-track' | 'over-budget' | 'under-budget';
};

const budgetStore: BudgetItem[] = [];

function buildMonthlyTrend(transactions: any[]): MonthlyTrendItem[] {
  const grouped = new Map<string, { income: number; expenses: number }>();

  for (const tx of transactions || []) {
    const date = new Date(tx.date);
    if (Number.isNaN(date.getTime())) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const row = grouped.get(key) || { income: 0, expenses: 0 };
    if (tx.type === 'income') row.income += Number(tx.amount || 0);
    else row.expenses += Number(tx.amount || 0);
    grouped.set(key, row);
  }

  return Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, v]) => ({
      month,
      income: v.income,
      expenses: v.expenses,
      profit: v.income - v.expenses,
    }));
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'stats';

    if (action === 'transactions') {
      const transactions = await financeStore.getRecentTransactions();
      return NextResponse.json({ success: true, data: { transactions } });
    }

    if (action === 'budgets') {
      return NextResponse.json({ success: true, data: { budgets: budgetStore } });
    }

    // stats / summary (default)
    const stats = await financeStore.getFinancialStats();
    const transactions = await financeStore.getRecentTransactions();

    const totalIncome = Number(stats.totalIncome || 0);
    const totalExpenses = Number((stats as any).totalExpense || 0);
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    const summary = {
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin,
      monthlyTrend: buildMonthlyTrend(transactions),
    };

    if (action === 'summary') {
      return NextResponse.json({ success: true, data: summary });
    }

    // action=stats kept for backward compatibility
    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error('Finance API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'transactions';
    const body = await request.json();

    if (action === 'budgets') {
      const { name, category, period, allocated } = body;
      if (!name || !allocated) {
        return NextResponse.json({ success: false, error: 'Missing required params: name, allocated' }, { status: 400 });
      }

      const item: BudgetItem = {
        id: `bdg-${Date.now()}`,
        name,
        category: category || 'Operations',
        period: period || 'monthly',
        allocated: Number(allocated),
        spent: 0,
        remaining: Number(allocated),
        status: 'under-budget',
      };
      budgetStore.unshift(item);
      return NextResponse.json({ success: true, data: item });
    }

    const { type, amount, description, category, date, tags } = body;
    if (!type || !amount || !description) {
      return NextResponse.json({ success: false, error: 'Missing required params: type, amount, description' }, { status: 400 });
    }

    const transaction = await financeStore.addTransaction({
      type,
      amount: Number(amount),
      description,
      category: category || 'Other',
      date: date || new Date().toISOString().split('T')[0],
      currency: 'PHP',
      status: 'completed',
      tags: tags || [],
    });

    return NextResponse.json({ success: true, data: transaction });
  } catch (error) {
    console.error('Finance API POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
