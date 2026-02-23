/**
 * 基于简单数据库的财务服务
 * 用于测试和开发环境
 */

import { simpleDb, dbUtils } from './simple-db';
import { Transaction, Budget, FinancialSummary } from './finance-service';

export class SimpleFinanceService {
  constructor() {
    // 初始化表
    simpleDb.createTable('transactions');
    simpleDb.createTable('budgets');
    
    // 添加一些测试数据
    this.initializeTestData();
  }

  private initializeTestData(): void {
    // 检查是否已有数据
    const existingTransactions = simpleDb.query('transactions');
    if (existingTransactions.length === 0) {
      // 添加测试交易数据
      const testTransactions: Omit<Transaction, 'id'>[] = [
        {
          date: '2026-02-21',
          type: 'income',
          category: 'AI外包项目',
          description: '客户A的AI集成项目',
          amount: 50000,
          currency: 'PHP',
          status: 'completed',
          tags: ['外包', 'AI', '项目'],
        },
        {
          date: '2026-02-20',
          type: 'income',
          category: '技能销售',
          description: 'My Skill Shop平台销售',
          amount: 25000,
          currency: 'PHP',
          status: 'completed',
          tags: ['平台', '销售', '数字产品'],
        },
        {
          date: '2026-02-19',
          type: 'expense',
          category: '服务器费用',
          description: 'Azure云服务器月费',
          amount: 15000,
          currency: 'PHP',
          status: 'completed',
          tags: ['云服务', '基础设施'],
        },
        {
          date: '2026-02-18',
          type: 'expense',
          category: '营销推广',
          description: 'Google Ads广告费用',
          amount: 8000,
          currency: 'PHP',
          status: 'completed',
          tags: ['营销', '广告', '获客'],
        },
        {
          date: '2026-02-17',
          type: 'expense',
          category: '软件开发工具',
          description: '开发工具和软件订阅',
          amount: 5000,
          currency: 'PHP',
          status: 'completed',
          tags: ['工具', '订阅', '开发'],
        },
      ];

      testTransactions.forEach(tx => {
        this.addTransaction(tx);
      });
    }

    // 检查是否已有预算数据
    const existingBudgets = simpleDb.query('budgets');
    if (existingBudgets.length === 0) {
      // 添加测试预算数据
      const testBudgets: Omit<Budget, 'id'>[] = [
        {
          name: '服务器预算',
          category: '服务器费用',
          allocated: 20000,
          spent: 15000,
          remaining: 5000,
          period: 'monthly',
          status: 'on-track',
        },
        {
          name: '营销预算',
          category: '营销推广',
          allocated: 10000,
          spent: 8000,
          remaining: 2000,
          period: 'monthly',
          status: 'on-track',
        },
        {
          name: '工具预算',
          category: '软件开发工具',
          allocated: 6000,
          spent: 5000,
          remaining: 1000,
          period: 'monthly',
          status: 'on-track',
        },
      ];

      testBudgets.forEach(budget => {
        this.addBudget(budget);
      });
    }
  }

  // ===== 交易管理 =====

  async addTransaction(data: Omit<Transaction, 'id'>): Promise<Transaction> {
    const transaction: Transaction = {
      id: dbUtils.generateId(),
      ...data,
    };

    simpleDb.insert('transactions', {
      ...transaction,
      tags: dbUtils.serializeJson(data.tags),
      created_at: dbUtils.getTimestamp(),
      updated_at: dbUtils.getTimestamp(),
    });

    return transaction;
  }

  async getTransactions(filters?: {
    type?: 'income' | 'expense';
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ transactions: Transaction[]; total: number }> {
    let allTransactions = simpleDb.query<Transaction>('transactions');
    
    // 应用过滤器
    if (filters?.type) {
      allTransactions = allTransactions.filter(t => t.type === filters.type);
    }
    
    if (filters?.category) {
      allTransactions = allTransactions.filter(t => t.category === filters.category);
    }
    
    if (filters?.startDate) {
      allTransactions = allTransactions.filter(t => t.date >= filters.startDate!);
    }
    
    if (filters?.endDate) {
      allTransactions = allTransactions.filter(t => t.date <= filters.endDate!);
    }
    
    // 排序
    allTransactions = allTransactions.sort((a, b) => b.date.localeCompare(a.date));
    
    // 分页
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedTransactions = allTransactions.slice(startIndex, endIndex);
    
    // 解析tags
    const transactions = paginatedTransactions.map(tx => ({
      ...tx,
      tags: dbUtils.parseJson<string[]>(tx.tags as any, []),
    }));
    
    return {
      transactions,
      total: allTransactions.length,
    };
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    const existing = simpleDb.query<Transaction>('transactions', { id });
    if (existing.length === 0) return null;

    const updateData: Record<string, any> = {
      ...updates,
      updated_at: dbUtils.getTimestamp(),
    };

    if (updates.tags) {
      updateData.tags = dbUtils.serializeJson(updates.tags);
    }

    simpleDb.update('transactions', updateData, { id });

    const updated = simpleDb.query<Transaction>('transactions', { id })[0];
    return {
      ...updated,
      tags: dbUtils.parseJson<string[]>(updated.tags as any, []),
    } as Transaction;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const changes = simpleDb.delete('transactions', { id });
    return changes > 0;
  }

  // ===== 预算管理 =====

  async addBudget(data: Omit<Budget, 'id'>): Promise<Budget> {
    const budget: Budget = {
      id: dbUtils.generateId(),
      ...data,
    };

    simpleDb.insert('budgets', {
      ...budget,
      created_at: dbUtils.getTimestamp(),
      updated_at: dbUtils.getTimestamp(),
    });

    return budget;
  }

  async getBudgets(): Promise<Budget[]> {
    return simpleDb.query<Budget>('budgets');
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget | null> {
    const existing = simpleDb.query<Budget>('budgets', { id });
    if (existing.length === 0) return null;

    const updateData: Record<string, any> = {
      ...updates,
      updated_at: dbUtils.getTimestamp(),
    };

    simpleDb.update('budgets', updateData, { id });

    return simpleDb.query<Budget>('budgets', { id })[0];
  }

  async deleteBudget(id: string): Promise<boolean> {
    const changes = simpleDb.delete('budgets', { id });
    return changes > 0;
  }

  // ===== 财务分析 =====

  async getFinancialSummary(): Promise<FinancialSummary> {
    const { transactions } = await this.getTransactions({ page: 1, pageSize: 1000 });
    
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // 月度趋势
    const monthlyData: Record<string, { income: number; expenses: number; profit: number }> = {};
    
    transactions.forEach(t => {
      const month = t.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0, profit: 0 };
      }
      
      if (t.type === 'income') {
        monthlyData[month].income += t.amount;
      } else {
        monthlyData[month].expenses += t.amount;
      }
      monthlyData[month].profit = monthlyData[month].income - monthlyData[month].expenses;
    });

    const monthlyTrend = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        profit: data.profit,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    // 分类分析
    const categoryAnalysis: Record<string, { income: number; expense: number }> = {};
    
    transactions.forEach(t => {
      if (!categoryAnalysis[t.category]) {
        categoryAnalysis[t.category] = { income: 0, expense: 0 };
      }
      
      if (t.type === 'income') {
        categoryAnalysis[t.category].income += t.amount;
      } else {
        categoryAnalysis[t.category].expense += t.amount;
      }
    });

    const totalAll = totalIncome + totalExpenses;
    const topCategories = Object.entries(categoryAnalysis)
      .flatMap(([category, data]) => [
        {
          category,
          amount: data.income,
          type: 'income' as const,
          percentage: totalIncome > 0 ? (data.income / totalIncome) * 100 : 0,
        },
        {
          category,
          amount: data.expense,
          type: 'expense' as const,
          percentage: totalExpenses > 0 ? (data.expense / totalExpenses) * 100 : 0,
        },
      ])
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin,
      monthlyTrend,
      topCategories,
    };
  }

  async getCategories(): Promise<{ income: string[]; expense: string[] }> {
    const { transactions } = await this.getTransactions({ page: 1, pageSize: 1000 });
    
    const incomeCategories = [...new Set(
      transactions
        .filter(t => t.type === 'income')
        .map(t => t.category)
    )];
    
    const expenseCategories = [...new Set(
      transactions
        .filter(t => t.type === 'expense')
        .map(t => t.category)
    )];

    return {
      income: incomeCategories,
      expense: expenseCategories,
    };
  }

  async getAnalytics() {
    const [transactions, budgets] = await Promise.all([
      this.getTransactions({ page: 1, pageSize: 1000 }),
      this.getBudgets(),
    ]);

    // 月度趋势分析
    const monthlyData: Record<string, { income: number; expense: number; profit: number }> = {};
    
    transactions.transactions.forEach(t => {
      const month = t.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0, profit: 0 };
      }
      
      if (t.type === 'income') {
        monthlyData[month].income += t.amount;
      } else {
        monthlyData[month].expense += t.amount;
      }
      monthlyData[month].profit = monthlyData[month].income - monthlyData[month].expense;
    });

    const monthlyTrend = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expense,
        profit: data.profit,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    // 分类分析
    const categoryAnalysis: Record<string, { income: number; expense: number }> = {};
    
    transactions.transactions.forEach(t => {
      if (!categoryAnalysis[t.category]) {
        categoryAnalysis[t.category] = { income: 0, expense: 0 };
      }
      
      if (t.type === 'income') {
        categoryAnalysis[t.category].income += t.amount;
      } else {
        categoryAnalysis[t.category].expense += t.amount;
      }
    });

    const categories = Object.entries(categoryAnalysis).map(([category, data]) => ({
      category,
      totalIncome: data.income,
      totalExpense: data.expense,
      netProfit: data.income - data.expense,
    }));

    // 预算执行情况
    const budgetPerformance = budgets.map(budget => {
      const actualSpent = transactions.transactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const variance = budget.allocated - actualSpent;
      const variancePercentage = (variance / budget.allocated) * 100;

      return {
        budgetName: budget.name,
        category: budget.category,
        allocated: budget.allocated,
        actualSpent,
        variance,
        variancePercentage,
        status: variance >= 0 ? 'under-budget' : 'over-budget',
      };
    });

    const summary = await this.getFinancialSummary();

    return {
      summary,
      monthlyTrend,
      categories,
      budgetPerformance,
      insights: {
        topIncomeCategory: categories.sort((a, b) => b.totalIncome - a.totalIncome)[0]?.category,
        topExpenseCategory: categories.sort((a, b) => b.totalExpense - a.totalExpense)[0]?.category,
        mostProfitableMonth: monthlyTrend.sort((a, b) => b.profit - a.profit)[0]?.month,
        budgetCompliance: budgetPerformance.filter(b => b.status === 'under-budget').length / budgetPerformance.length,
      },
    };
  }

  async getSystemStatus() {
    const transactionStats = simpleDb.getTableStats('transactions');
    const budgetStats = simpleDb.getTableStats('budgets');
    const summary = await this.getFinancialSummary();

    return {
      status: 'running',
      version: '2.0.0',
      totalTransactions: transactionStats.count,
      totalBudgets: budgetStats.count,
      netProfit: summary.netProfit,
      profitMargin: summary.profitMargin,
      database: {
        type: 'memory',
        transactionsSize: transactionStats.size,
        budgetsSize: budgetStats.size,
      },
      lastUpdate: dbUtils.getTimestamp(),
    };
  }
}

// 全局实例
export const simpleFinanceService = new SimpleFinanceService();