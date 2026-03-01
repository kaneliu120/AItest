"use client";

import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, Calendar, AlertCircle } from "lucide-react";
import type { DashboardData } from "@/app/api/dashboard/route";

type Finance = DashboardData["finance"];

// ── 骨架屏 ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-slate-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ── 无数据提示 ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-slate-400" />
      </div>
      <p className="font-medium text-slate-600">暂无财务数据</p>
      <p className="text-sm text-slate-400">
        前往财务系统录入收支数据后，图表将自动更新
      </p>
    </div>
  );
}

export default function RevenueChart() {
  const [finance, setFinance] = useState<Finance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setFinance(json.data.finance);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  // 没有真实数据且月度趋势为空 → 显示空状态
  const hasData = finance?.available && finance.monthlyTrend.length > 0;

  const current = finance
    ? { income: finance.currentMonthIncome, expenses: finance.currentMonthExpenses, profit: finance.currentMonthProfit }
    : { income: 0, expenses: 0, profit: 0 };

  const growthRate = finance?.monthlyGrowthRate ?? 0;
  const trend = finance?.monthlyTrend ?? [];

  // 月份格式化
  const fmt = (m: string) => {
    const [, month] = m.split("-");
    const names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return names[parseInt(month)] ?? m;
  };

  return (
    <div className="space-y-8">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <DollarSign className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold gradient-text">收入趋势分析</h2>
            <p className="text-muted-foreground">
              {hasData ? "真实财务数据（来自财务系统）" : "2026年收入、支出和利润"}
            </p>
          </div>
        </div>
        {hasData && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="font-semibold text-green-400">
              {growthRate >= 0 ? "+" : ""}{growthRate}% 增长
            </span>
          </div>
        )}
      </div>

      {/* 本月卡片 - 即使无历史数据也显示当月 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 收入 */}
        <div className="data-card card-hover p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30 text-sm font-semibold">
              收入
            </span>
          </div>
          <h3 className="text-lg font-semibold mb-2">本月收入</h3>
          {finance?.available ? (
            <>
              <div className="text-3xl font-bold mb-1">₱{current.income.toLocaleString()}</div>
              <p className="text-sm text-green-400">
                {growthRate >= 0 ? "+" : ""}{growthRate}% 较上月
              </p>
            </>
          ) : (
            <div className="text-sm text-slate-400 italic mt-2">暂无数据</div>
          )}
        </div>

        {/* 支出 */}
        <div className="data-card card-hover p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
              <Calendar className="h-6 w-6 text-blue-400" />
            </div>
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30 text-sm font-semibold">
              支出
            </span>
          </div>
          <h3 className="text-lg font-semibold mb-2">本月支出</h3>
          {finance?.available ? (
            <>
              <div className="text-3xl font-bold mb-1">₱{current.expenses.toLocaleString()}</div>
              <p className="text-sm text-blue-400">运营成本</p>
            </>
          ) : (
            <div className="text-sm text-slate-400 italic mt-2">暂无数据</div>
          )}
        </div>

        {/* 利润 */}
        <div className="data-card card-hover p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10">
              <DollarSign className="h-6 w-6 text-purple-400" />
            </div>
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30 text-sm font-semibold">
              利润
            </span>
          </div>
          <h3 className="text-lg font-semibold mb-2">本月利润</h3>
          {finance?.available ? (
            <>
              <div className="text-3xl font-bold mb-1">₱{current.profit.toLocaleString()}</div>
              <p className="text-sm text-purple-400">
                {current.income > 0
                  ? `利润率 ${((current.profit / current.income) * 100).toFixed(1)}%`
                  : "暂无数据"}
              </p>
            </>
          ) : (
            <div className="text-sm text-slate-400 italic mt-2">暂无数据</div>
          )}
        </div>
      </div>

      {/* 月度趋势图 */}
      {hasData ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">月度趋势分析</h3>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
                <span className="font-medium">收入</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                <span className="font-medium">支出</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                <span className="font-medium">利润</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {trend.map((item, index) => {
              const maxValue = Math.max(...trend.map((d) => d.income), 1);
              const incomeWidth = (item.income / maxValue) * 100;
              const expensesWidth = (item.expenses / maxValue) * 100;
              const profitWidth = Math.max((item.profit / maxValue) * 100, 0);

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-16">
                      <span className="font-medium">{fmt(item.month)}</span>
                    </div>
                    <div className="flex-1 ml-6">
                      <div className="relative h-8 rounded-full overflow-hidden bg-accent/30">
                        <div
                          className="absolute h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${incomeWidth}%` }}
                        />
                        <div
                          className="absolute h-full bg-gradient-to-r from-blue-500 to-cyan-500 opacity-70 transition-all duration-500"
                          style={{ width: `${expensesWidth}%`, left: `${incomeWidth}%` }}
                        />
                        <div
                          className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-60 transition-all duration-500"
                          style={{ width: `${profitWidth}%`, left: `${incomeWidth + expensesWidth}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-32 text-right">
                      <div className="font-semibold text-green-400">
                        ₱{item.income.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        利润:{" "}
                        <span className="text-purple-400">₱{item.profit.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
