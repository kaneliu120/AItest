import { Pool } from 'pg';
import { logger } from '@/lib/logger';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  type: 'income' | 'expense';
  currency?: string;
  status?: string;
  tags?: string[];
  taskId?: string;
  metadata?: Record<string, unknown>;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  balance: number;
}

let pool: Pool | null = null;
function db(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL!,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

function rowToTx(r: any): Transaction {
  return {
    id: r.id,
    date: r.tx_date,
    amount: Number(r.amount || 0),
    category: r.category,
    description: r.description,
    type: r.tx_type,
    currency: r.currency || 'PHP',
    status: r.status || 'completed',
    tags: r.tags || [],
    taskId: r.task_id || undefined,
    metadata: r.metadata || {},
  };
}

export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    const rs = await db().query(
      `SELECT id, tx_date, amount, category, description, tx_type, currency, status, tags, task_id, metadata
       FROM finance_transactions ORDER BY tx_date DESC, created_at DESC`
    );
    return rs.rows.map(rowToTx);
  } catch (e) {
    logger.error('FetchFinance交易failed', e, { module: 'finance-store' });
    return [];
  }
}

export async function getTransactions(): Promise<Transaction[]> {
  return getAllTransactions();
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  try {
    const rs = await db().query(
      `SELECT
         COALESCE(SUM(CASE WHEN tx_type='income' THEN amount ELSE 0 END),0) AS total_income,
         COALESCE(SUM(CASE WHEN tx_type='expense' THEN amount ELSE 0 END),0) AS total_expense
       FROM finance_transactions`
    );
    const totalIncome = Number(rs.rows[0]?.total_income || 0);
    const totalExpense = Number(rs.rows[0]?.total_expense || 0);
    return {
      totalIncome,
      totalExpense,
      netIncome: totalIncome - totalExpense,
      balance: totalIncome - totalExpense,
    };
  } catch (e) {
    logger.error('FetchFinance汇总failed', e, { module: 'finance-store' });
    return { totalIncome: 0, totalExpense: 0, netIncome: 0, balance: 0 };
  }
}

export async function getStats() { return getFinanceSummary(); }

export async function addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
  const id = `tx-${Date.now()}`;
  const tx: Transaction = {
    ...transaction,
    id,
    currency: transaction.currency || 'PHP',
    status: transaction.status || 'completed',
    tags: transaction.tags || [],
  };

  await db().query(
    `INSERT INTO finance_transactions
      (id, tx_date, amount, category, description, tx_type, currency, status, tags, task_id, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      tx.id,
      tx.date,
      tx.amount,
      tx.category,
      tx.description,
      tx.type,
      tx.currency,
      tx.status,
      JSON.stringify(tx.tags || []),
      tx.taskId || null,
      JSON.stringify(tx.metadata || {}),
    ]
  );
  return tx;
}

export interface FinanceStore {
  getRecentTransactions(): Promise<Transaction[]>;
  getFinancialStats(): Promise<FinanceSummary>;
  addTransaction(input: Omit<Transaction, 'id'>): Promise<Transaction>;
}

export const financeStore: FinanceStore = {
  async getRecentTransactions() {
    const tx = await getAllTransactions();
    return tx.slice(0, 20);
  },
  async getFinancialStats() { return getFinanceSummary(); },
  async addTransaction(input) { return addTransaction(input); },
};
