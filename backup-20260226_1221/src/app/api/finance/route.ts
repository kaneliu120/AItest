import { financeStore } from '@/lib/finance-store';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'stats';

    if (action === 'transactions') {
      const transactions = await financeStore.getRecentTransactions();
      return NextResponse.json({ success: true, data: { transactions } });
    }

    // stats / summary (default)
    const stats = await financeStore.getFinancialStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('财务API错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, amount, description, category, date, tags } = body;

    if (!type || !amount || !description) {
      return NextResponse.json({ success: false, error: '缺少必要参数: type, amount, description' }, { status: 400 });
    }

    const transaction = await financeStore.addTransaction({
      type,
      amount: Number(amount),
      description,
      category: category || '其他',
      date: date || new Date().toISOString().split('T')[0],
      currency: 'PHP',
      status: 'completed',
      tags: tags || [],
    });

    return NextResponse.json({ success: true, data: transaction });
  } catch (error) {
    console.error('财务API POST错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
