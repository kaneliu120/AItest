/**
 * 基于数据库的财务服务
 * 使用SQLite进行数据持久化
 */

import { getDatabase, dbUtils, TABLE_SCHEMAS } from './database';
import { Transaction, Budget, FinancialSummary } from './finance-service';

export class FinanceDbService {
  private db = getDatabase();

  constructor() {
    // 确保数据库已初始化
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // 数据库会在第一次使用时自动初始化
  }

  // ===== 交易管理 =====

  async addTransaction(data: Omit<Transaction, 'id'>): Promise<Transaction> {
    const transaction: Transaction = {
      id: dbUtils.generateId(),
      ...data,
    };

    this.db.insert('transactions', {
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
    const where: Record<string, any> = {};
    
    if (filters?.type) where.type = filters.type;
    if (filters?.category) where.category = filters.category;
    if (filters?.startDate) where.date = { $gte: filters.startDate };
    if (filters?.endDate) where.date = { $lte: filters.endDate };

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    // 获取总数
    const countResult = this.db.query<{ count: number }>(
      'transactions',
      where,
      { select: ['COUNT(*) as count'] }
    );
    const total = countResult[0]?.count || 0;

    // 获取分页数据
    const rows = this.db.query(
      'transactions',
      where,
      {
        limit: pageSize,
        offset,
        orderBy: 'date',
        orderDirection: 'DESC',
      }
    );

    const transactions = rows.map(row => ({
      id: row.id,
      date: row.date,
      type: row.type,
      category: row.category,
      description: row.description,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      tags: dbUtils.parseJson<string[]>(row.tags, []),
    })) as Transaction[];

    return { transactions, total };
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    const existing = this.db.query('transactions', { id });
    if (existing.length === 0) return null;

    const updateData: Record<string, any> = {
      ...updates,
      updated_at: dbUtils.getTimestamp(),
    };

    if (updates.tags) {
      updateData.tags = dbUtils.serializeJson(updates.tags);
    }

    this.db.update('transactions', updateData, { id });

    const updated = this.db.query('transactions', { id })[0];
    return {
      id: updated.id,
      date: updated.date,
      type: updated.type,
      category: updated.category,
      description: updated.description,
      amount: updated.amount,
      currency: updated.currency,
      status: updated.status,
      tags: dbUtils.parseJson<string[]>(updated.tags, []),
    } as Transaction;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const changes = this.db.delete('transactions', { id });
    return changes > 0;
  }

  // ===== 预算管理 =====

  async addBudget(data: Omit<Budget, 'id'>): Promise<Budget> {
    const budget: Budget = {
      id: dbUtils.generateId(),
      ...data,
    };

    this.db.insert('budgets', {
      ...budget,
      created_at: dbUtils.getTimestamp(),
      updated_at: dbUtils.getTimestamp(),
    });

    return budget;
  }

  async getBudgets(): Promise<Budget[]> {
    const rows = this.db.query('budgets', {}, {
      orderBy: 'name',
      orderDirection: 'ASC',
    });

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      allocated: row.allocated,
      spent: row.spent,
      remaining: row.remaining,
      period: row.period,
      status: row.status,
    })) as Budget[];
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget | null> {
    const existing = this.db.query('budgets', { id });
    if (existing.length === 0) return null;

    const updateData: Record<string, any> = {
      ...updates,
      updated_at: dbUtils.getTimestamp(),
    };

    this.db.update('budgets', updateData, { id });

    const updated = this.db.query('budgets', { id })[0];
    return {
      id: updated.id,
      name: updated.name,
      category: updated.category,
      allocated: updated.allocated,
      spent: updated.spent,
      remaining: updated.remaining,
      period: updated.period,
      status: updated.status,
    } as Budget;
  }

  async deleteBudget(id: string): Promise<boolean> {
    const changes = this.db.delete('budgets', { id });
    return changes > 0;
  }

  // ===== 财务分析 =====

  async getFinancialSummary(): Promise<FinancialSummary> {
    // 获取全量数据（移除 pageSize 限制，避免超过1000条时汇总错误）
    const { transactions: txList } = await this.getTransactions({ page: 1, pageSize: 100000 });

    // 单次遍历同时计算所有聚合指标，替代原来的多次 filter/forEach
    let totalIncome = 0;
    let totalExpenses = 0;
    const monthlyData: Record<string, { income: number; expenses: number; profit: number }> = {};
    const categoryAnalysis: Record<string, { income: number; expense: number }> = {};

    for (const t of txList) {
      const isIncome = t.type === 'income';
      if (isIncome) totalIncome += t.amount; else totalExpenses += t.amount;

      // 月度趋势
      const month = t.date.substring(0, 7);
      const md = monthlyData[month] ?? { income: 0, expenses: 0, profit: 0 };
      if (isIncome) md.income += t.amount; else md.expenses += t.amount;
      md.profit = md.income - md.expenses;
      monthlyData[month] = md;

      // 分类分析
      const ca = categoryAnalysis[t.category] ?? { income: 0, expense: 0 };
      if (isIncome) ca.income += t.amount; else ca.expense += t.amount;
      categoryAnalysis[t.category] = ca;
    }

    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    const monthlyTrend = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, income: data.income, expenses: data.expenses, profit: data.profit }))
      .sort((a, b) => b.month.localeCompare(a.month));

    const topCategories = Object.entries(categoryAnalysis)
      .flatMap(([category, data]) => [
        { category, amount: data.income, type: 'income' as const, percentage: totalIncome > 0 ? (data.income / totalIncome) * 100 : 0 },
        { category, amount: data.expense, type: 'expense' as const, percentage: totalExpenses > 0 ? (data.expense / totalExpenses) * 100 : 0 },
      ])
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return { totalIncome, totalExpenses, netProfit, profitMargin, monthlyTrend, topCategories };
  }

  async getCategories(): Promise<{ income: string[]; expense: string[] }> {
    const transactions = await this.getTransactions({ page: 1, pageSize: 1000 });
    
    const incomeCategories = [...new Set(
      transactions.transactions
        .filter(t => t.type === 'income')
        .map(t => t.category)
    )];
    
    const expenseCategories = [...new Set(
      transactions.transactions
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
    const transactionCount = this.db.query('transactions', {}, { select: ['COUNT(*) as count'] })[0]?.count || 0;
    const budgetCount = this.db.query('budgets', {}, { select: ['COUNT(*) as count'] })[0]?.count || 0;
    const dbStats = this.db.getStats();

    const summary = await this.getFinancialSummary();

    return {
      status: 'running',
      version: '2.0.0',
      totalTransactions: transactionCount,
      totalBudgets: budgetCount,
      netProfit: summary.netProfit,
      profitMargin: summary.profitMargin,
      database: {
        path: dbStats.path,
        size: dbStats.totalSize,
        tables: dbStats.tables,
      },
      lastUpdate: dbUtils.getTimestamp(),
    };
  }

  // ===== 数据迁移 =====

  async migrateFromMemory(memoryTransactions: Transaction[], memoryBudgets: Budget[]): Promise<void> {
    console.log('Starting data migration from memory to database...');

    // 迁移交易数据
    if (memoryTransactions.length > 0) {
      const dbTransactions = memoryTransactions.map(tx => ({
        ...tx,
        tags: dbUtils.serializeJson(tx.tags),
        created_at: dbUtils.getTimestamp(),
        updated_at: dbUtils.getTimestamp(),
      }));

      this.db.batchInsert('transactions', dbTransactions);
      console.log(`Migrated ${memoryTransactions.length} transaction records`);
    }

    // 迁移预算数据
    if (memoryBudgets.length > 0) {
      const dbBudgets = memoryBudgets.map(budget => ({
        ...budget,
        created_at: dbUtils.getTimestamp(),
        updated_at: dbUtils.getTimestamp(),
      }));

      this.db.batchInsert('budgets', dbBudgets);
      console.log(`Migrated ${memoryBudgets.length} budget records`);
    }

    console.log('Data migration complete');
  }

  // ===== 数据备份 =====

  async backupDatabase(backupPath?: string): Promise<string> {
    const defaultPath = `./data/backups/finance-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
    const path = backupPath || defaultPath;

    this.db.backup(path);
    return path;
  }

  // ===== 数据清理 =====

  async cleanupOldData(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const changes = this.db.delete('transactions', {
      date: { $lt: cutoffDateStr },
      status: 'completed',
    });

    console.log(`Cleaned up ${changes} transaction records older than ${daysToKeep} days`);
    return changes;
  }
}

// 全局实例
export const financeDbService = new FinanceDbService();