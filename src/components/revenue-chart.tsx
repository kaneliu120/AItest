"use client";

import { TrendingUp, DollarSign, Calendar } from "lucide-react";

export default function RevenueChart() {
  const revenueData = [
    { month: "Jan", income: 0, expenses: 1500, profit: -1500 },
    { month: "Feb", income: 5000, expenses: 2000, profit: 3000 },
    { month: "Mar", income: 8000, expenses: 2500, profit: 5500 },
    { month: "Apr", income: 12000, expenses: 3000, profit: 9000 },
    { month: "May", income: 18000, expenses: 3500, profit: 14500 },
    { month: "Jun", income: 25000, expenses: 4000, profit: 21000 },
  ];

  const currentMonth = revenueData[revenueData.length - 1];
  const totalIncome = revenueData.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = revenueData.reduce((sum, item) => sum + item.expenses, 0);
  const totalProfit = revenueData.reduce((sum, item) => sum + item.profit, 0);
  const previousMonthIncome = revenueData[revenueData.length - 2].income;
  const growthRate = previousMonthIncome > 0 
    ? ((currentMonth.income - previousMonthIncome) / previousMonthIncome * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-8">
      {/* 标题区域 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <DollarSign className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold gradient-text">收入趋势分析</h2>
            <p className="text-muted-foreground">2026年收入、支出和利润趋势分析</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <TrendingUp className="h-4 w-4 text-green-400" />
          <span className="font-semibold text-green-400">+{growthRate}% 增长</span>
        </div>
      </div>

      <div className="space-y-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div className="text-3xl font-bold mb-1">₱{currentMonth.income.toLocaleString()}</div>
            <p className="text-sm text-green-400">+{growthRate}% 较上月</p>
          </div>

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
            <div className="text-3xl font-bold mb-1">₱{currentMonth.expenses.toLocaleString()}</div>
            <p className="text-sm text-blue-400">运营成本</p>
          </div>

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
            <div className="text-3xl font-bold mb-1">₱{currentMonth.profit.toLocaleString()}</div>
            <p className="text-sm text-purple-400">
              利润率 {(currentMonth.profit / currentMonth.income * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* 图表区域 */}
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

          {/* 增强条形图 */}
          <div className="space-y-4">
            {revenueData.map((item, index) => {
              const maxValue = Math.max(...revenueData.map(d => d.income));
              const incomeWidth = (item.income / maxValue) * 100;
              const expensesWidth = (item.expenses / maxValue) * 100;
              const profitWidth = (item.profit / maxValue) * 100;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-16">
                      <span className="font-medium">{item.month}</span>
                    </div>
                    <div className="flex-1 ml-6">
                      <div className="relative h-8 rounded-full overflow-hidden bg-accent/30">
                        {/* 收入条 */}
                        <div 
                          className="absolute h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${incomeWidth}%` }}
                        />
                        {/* 支出条 */}
                        <div 
                          className="absolute h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                          style={{ 
                            width: `${expensesWidth}%`,
                            left: `${incomeWidth}%`
                          }}
                        />
                        {/* 利润条 */}
                        <div 
                          className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                          style={{ 
                            width: `${profitWidth}%`,
                            left: `${incomeWidth + expensesWidth}%`
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-32 text-right">
                      <div className="font-semibold text-green-400">₱{item.income.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        利润: <span className="text-purple-400">₱{item.profit.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 总计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-border/50">
            <div className="data-card p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                  <DollarSign className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">₱{totalIncome.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">总收入</div>
                </div>
              </div>
            </div>

            <div className="data-card p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">₱{totalExpenses.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">总支出</div>
                </div>
              </div>
            </div>

            <div className="data-card p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">₱{totalProfit.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">总利润</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}