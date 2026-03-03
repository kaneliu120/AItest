// 财务系统服务 - 深度集成到Mission Control

export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'cancelled';
  tags: string[];
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
    profit: number;
  }>;
  topCategories: Array<{
    category: string;
    amount: number;
    type: 'income' | 'expense';
    percentage: number;
  }>;
}

export interface Budget {
  id: string;
  name: string;
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  status: 'on-track' | 'over-budget' | 'under-budget';
}

class FinanceService {
  private transactions: Transaction[] = [
    {
      id: 'txn-001',
      date: '2026-02-21',
      type: 'income',
      category: 'AI Freelance',
      description: 'My Skill Shop development project',
      amount: 50000,
      currency: 'PHP',
      status: 'completed',
      tags: ['project', 'ai', 'development'],
    },
    {
      id: 'txn-002',
      date: '2026-02-20',
      type: 'expense',
      category: 'Server Costs',
      description: 'Azure cloud server monthly fee',
      amount: 15000,
      currency: 'PHP',
      status: 'completed',
      tags: ['infrastructure', 'cloud', 'monthly'],
    },
    {
      id: 'txn-003',
      date: '2026-02-19',
      type: 'income',
      category: 'Skill Sales',
      description: 'AI skills platform revenue share',
      amount: 25000,
      currency: 'PHP',
      status: 'completed',
      tags: ['platform', 'sales', 'commission'],
    },
    {
      id: 'txn-004',
      date: '2026-02-18',
      type: 'expense',
      category: 'Marketing',
      description: 'Google Ads advertising cost',
      amount: 8000,
      currency: 'PHP',
      status: 'completed',
      tags: ['marketing', 'ads', 'promotion'],
    },
    {
      id: 'txn-005',
      date: '2026-02-17',
      type: 'expense',
      category: 'Dev Tools',
      description: 'Development tools and software subscriptions',
      amount: 5000,
      currency: 'PHP',
      status: 'completed',
      tags: ['tools', 'software', 'subscription'],
    },
  ];

  private budgets: Budget[] = [
    {
      id: 'budget-001',
      name: 'Server Cost Budget',
      category: 'Infrastructure',
      allocated: 20000,
      spent: 15000,
      remaining: 5000,
      period: 'monthly',
      status: 'on-track',
    },
    {
      id: 'budget-002',
      name: 'Marketing Budget',
      category: 'Marketing',
      allocated: 10000,
      spent: 8000,
      remaining: 2000,
      period: 'monthly',
      status: 'on-track',
    },
    {
      id: 'budget-003',
      name: 'Development Tools Budget',
      category: 'Tools & Software',
      allocated: 6000,
      spent: 5000,
      remaining: 1000,
      period: 'monthly',
      status: 'on-track',
    },
    {
      id: 'budget-004',
      name: 'AI Model Training Budget',
      category: 'R&D Investment',
      allocated: 30000,
      spent: 0,
      remaining: 30000,
      period: 'quarterly',
      status: 'under-budget',
    },
  ];

  // Get finance summary
  async getFinancialSummary(): Promise<FinancialSummary> {
    const totalIncome = this.transactions
      .filter(t => t.type === 'income' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = this.transactions
      .filter(t => t.type === 'expense' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // 月度趋势数据
    const monthlyTrend = this.generateMonthlyTrend();

    // 分类统计
    const topCategories = this.getTopCategories();

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin,
      monthlyTrend,
      topCategories,
    };
  }

  // 获取交易记录
  async getTransactions(
    filters?: {
      type?: 'income' | 'expense';
      category?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<{ transactions: Transaction[]; total: number }> {
    let filtered = [...this.transactions];

    if (filters?.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters?.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    if (filters?.startDate) {
      filtered = filtered.filter(t => t.date >= filters.startDate!);
    }

    if (filters?.endDate) {
      filtered = filtered.filter(t => t.date <= filters.endDate!);
    }

 // sort
    filtered = filtered.sort((a, b) => b.date.localeCompare(a.date));

 // pagination
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const paginatedTransactions = filtered.slice(startIndex, endIndex);

    return {
      transactions: paginatedTransactions,
      total: filtered.length,
    };
  }

  // 获取预算信息
  async getBudgets(): Promise<Budget[]> {
    return this.budgets;
  }

  // 获取财务统计
  async getFinancialStats(): Promise<any> {
    const totalIncome = this.transactions
      .filter(t => t.type === 'income' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = this.transactions
      .filter(t => t.type === 'expense' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      totalTransactions: this.transactions.length,
      pendingTransactions: this.transactions.filter(t => t.status === 'pending').length,
      currency: 'PHP',
      lastUpdated: new Date().toISOString(),
    };
  }

  // 获取最近交易
  async getRecentTransactions(): Promise<Transaction[]> {
    return this.transactions.slice(0, 10);
  }

  // 添加交易
  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn-${Date.now()}`,
    };

    this.transactions.unshift(newTransaction);
    return newTransaction;
  }

  // 更新交易
  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    const index = this.transactions.findIndex(t => t.id === id);
    
    if (index === -1) {
      return null;
    }

    this.transactions[index] = {
      ...this.transactions[index],
      ...updates,
    };

    return this.transactions[index];
  }

  // 删除交易
  async deleteTransaction(id: string): Promise<boolean> {
    const initialLength = this.transactions.length;
    this.transactions = this.transactions.filter(t => t.id !== id);
    return this.transactions.length < initialLength;
  }

  // 添加预算
  async addBudget(budget: Omit<Budget, 'id'>): Promise<Budget> {
    const newBudget: Budget = {
      ...budget,
      id: `budget-${Date.now()}`,
    };

    this.budgets.push(newBudget);
    return newBudget;
  }

  // 更新预算
  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget | null> {
    const index = this.budgets.findIndex(b => b.id === id);
    
    if (index === -1) {
      return null;
    }

    this.budgets[index] = {
      ...this.budgets[index],
      ...updates,
    };

    return this.budgets[index];
  }

  // 生成月度趋势数据
  private generateMonthlyTrend() {
    const months = ['2026-01', '2026-02'];
    
    return months.map(month => {
      const monthTransactions = this.transactions.filter(t => t.date.startsWith(month));
      
      const income = monthTransactions
        .filter(t => t.type === 'income' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month,
        income,
        expenses,
        profit: income - expenses,
      };
    });
  }

  // 获取分类统计
  private getTopCategories() {
    // 单次遍历同时计算分类汇总和总额，避免额外的 filter/reduce
    const categories = new Map<string, { income: number; expense: number }>();
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const t of this.transactions) {
      const data = categories.get(t.category) ?? { income: 0, expense: 0 };
      if (t.type === 'income') {
        data.income += t.amount;
        totalIncome += t.amount;
      } else {
        data.expense += t.amount;
        totalExpenses += t.amount;
      }
      categories.set(t.category, data);
    }

    const result: Array<{
      category: string;
      amount: number;
      type: 'income' | 'expense';
      percentage: number;
    }> = [];

    categories.forEach((data, category) => {
      if (data.income > 0) {
        result.push({
          category,
          amount: data.income,
          type: 'income',
          percentage: totalIncome > 0 ? (data.income / totalIncome) * 100 : 0,
        });
      }
      if (data.expense > 0) {
        result.push({
          category,
          amount: data.expense,
          type: 'expense',
          percentage: totalExpenses > 0 ? (data.expense / totalExpenses) * 100 : 0,
        });
      }
    });

    return result.sort((a, b) => b.amount - a.amount).slice(0, 10);
  }

  // Fetch system status
  getSystemStatus() {
    const summary = this.calculateQuickSummary();
    
    return {
      status: 'running',
      version: '1.0.0',
      totalTransactions: this.transactions.length,
      totalBudgets: this.budgets.length,
      netProfit: summary.netProfit,
      profitMargin: summary.profitMargin,
      lastUpdate: new Date().toISOString(),
    };
  }

  // 获取分类列表
  async getCategories(): Promise<{ income: string[]; expense: string[] }> {
    const incomeCategories = [...new Set(
      this.transactions
        .filter(t => t.type === 'income')
        .map(t => t.category)
    )];
    
    const expenseCategories = [...new Set(
      this.transactions
        .filter(t => t.type === 'expense')
        .map(t => t.category)
    )];

    return {
      income: incomeCategories,
      expense: expenseCategories,
    };
  }

  // 获取分析数据
  async getAnalytics() {
    const transactions = this.transactions;
    const budgets = this.budgets;

    // 月度趋势分析
    const monthlyData: Record<string, { income: number; expense: number; profit: number }> = {};
    
    transactions.forEach(t => {
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

    const categories = Object.entries(categoryAnalysis).map(([category, data]) => ({
      category,
      totalIncome: data.income,
      totalExpense: data.expense,
      netProfit: data.income - data.expense,
    }));

    // 预算执行情况
    const budgetPerformance = budgets.map(budget => {
      const actualSpent = transactions
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

    return {
      summary: await this.getFinancialSummary(),
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

  // 快速计算摘要
  private calculateQuickSummary() {
    const totalIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    return { totalIncome, totalExpenses, netProfit, profitMargin };
  }
}

export const financeService = new FinanceService();