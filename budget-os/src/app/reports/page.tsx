"use client";

import { useState } from "react";
import { FileText, FileSpreadsheet, FileDown, TrendingUp, TrendingDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { peso, pct } from "@/lib/currency";
import {
  categoryComparisonFull,
  categoryMonthlySeries,
  currentMonthKey,
  debtPayoffProjection,
  monthLabel,
  monthlySeries,
  paydayCycleAnalysis,
  savingsGrowthSeries,
  savingsRate,
  totalExpenses,
  totalIncome,
  trailingMonths,
} from "@/lib/finance";
import { reviewInsights } from "@/lib/insights";
import { exportCSV, exportPDF, exportXLSX } from "@/lib/exporters";
import { CATEGORY_META } from "@/lib/types";
import { PageHeader, SectionCard, StatCard, ProgressBar } from "@/components/ui";
import {
  CategoryCompareBar,
  CategoryDonut,
  DebtPayoffChart,
  IncomeExpenseChart,
  ParentSpendChart,
  SavingsGrowthChart,
} from "@/components/charts";

export default function ReportsPage() {
  const { data, ready } = useStore();
  const [busy, setBusy] = useState<string | null>(null);

  if (!ready) return null;

  const [lastKey, thisKey] = trailingMonths(new Date(), 2);
  const key = currentMonthKey();
  const income = totalIncome(data.incomes, key);
  const expenses = totalExpenses(data.expenses, key);
  const prevExpenses = totalExpenses(data.expenses, lastKey);
  const expChangePct =
    prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;

  const cats = categoryComparisonFull(data);
  const cycle = paydayCycleAnalysis(data);
  const series = monthlySeries(data, 6);
  const growth = savingsGrowthSeries(data, 6);
  const payoff = debtPayoffProjection(data.debts);
  const insights = reviewInsights(data);

  const donut = cats
    .filter((c) => c.thisAmt > 0)
    .map((c) => ({
      category: c.category,
      amount: c.thisAmt,
      color: CATEGORY_META[c.category].color,
    }));
  const compareBar = cats
    .filter((c) => c.thisAmt > 0 || c.lastAmt > 0)
    .slice(0, 8)
    .map((c) => ({ category: c.category, thisAmt: c.thisAmt, lastAmt: c.lastAmt }));

  // Parent dashboard series
  const child = categoryMonthlySeries(data, "Child Expenses", 6);
  const school = categoryMonthlySeries(data, "School", 6);
  const food = categoryMonthlySeries(data, "Food", 6);
  const parentData = child.map((c, i) => ({
    label: c.label,
    child: c.amount,
    school: school[i].amount,
    food: food[i].amount,
  }));
  const childThis = child[child.length - 1]?.amount ?? 0;
  const schoolThis = school[school.length - 1]?.amount ?? 0;
  const foodThis = food[food.length - 1]?.amount ?? 0;

  async function run(fmt: string, fn: () => void | Promise<void>) {
    setBusy(fmt);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        emoji="📊"
        subtitle={`Where your money went in ${monthLabel(key)} — and how to improve.`}
      />

      {/* Export row */}
      <div className="card p-4">
        <p className="mb-3 text-[13px] font-semibold text-subtle">
          📥 Download your Monthly Financial Review
        </p>
        <div className="grid grid-cols-3 gap-2">
          <ExportBtn
            label="PDF"
            icon={<FileText size={18} />}
            busy={busy === "pdf"}
            onClick={() => run("pdf", () => exportPDF(data))}
          />
          <ExportBtn
            label="Excel"
            icon={<FileSpreadsheet size={18} />}
            busy={busy === "xlsx"}
            onClick={() => run("xlsx", () => exportXLSX(data))}
          />
          <ExportBtn
            label="CSV"
            icon={<FileDown size={18} />}
            busy={busy === "csv"}
            onClick={() => run("csv", () => exportCSV(data))}
          />
        </div>
      </div>

      {/* 1. Monthly Comparison */}
      <SectionCard title="Monthly Comparison" emoji="📅">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-grouped p-4">
            <p className="text-[12px] text-subtle">{monthLabel(thisKey)}</p>
            <p className="text-[22px] font-bold text-ink">{peso(expenses)}</p>
          </div>
          <div className="rounded-2xl bg-grouped p-4">
            <p className="text-[12px] text-subtle">{monthLabel(lastKey)}</p>
            <p className="text-[22px] font-bold text-ink">{peso(prevExpenses)}</p>
          </div>
        </div>
        <div
          className={`mt-3 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[15px] font-semibold ${
            expChangePct > 0
              ? "bg-ios-red/10 text-ios-red"
              : "bg-brand-50 text-brand-600"
          }`}
        >
          {expChangePct > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          {expChangePct >= 0 ? "+" : ""}
          {Math.round(expChangePct)}% vs last month ({peso(Math.abs(expenses - prevExpenses))}{" "}
          {expChangePct >= 0 ? "more" : "less"})
        </div>
        <div className="mt-4">
          <IncomeExpenseChart data={series} />
        </div>
      </SectionCard>

      {/* 2. Payday Cycle Analysis */}
      <SectionCard title="Payday Cycle Analysis" emoji="💸">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="🔥 Daily burn rate" value={peso(Math.round(cycle.burnRate))} hint="avg. spend/day this cycle" />
          <StatCard
            label="💰 Left before payday"
            value={peso(cycle.remainingBeforePayday)}
            tone="brand"
            hint={`${cycle.daysUntil} day${cycle.daysUntil === 1 ? "" : "s"} to go`}
          />
          <StatCard label="This cycle" value={peso(cycle.spentThisCycle)} tone="negative" />
          <StatCard label="Previous cycle" value={peso(cycle.spentPrevCycle)} />
        </div>
        <div
          className={`mt-3 rounded-2xl px-4 py-3 text-[14px] font-medium ${
            cycle.cycleDeltaPct > 0 ? "bg-ios-orange/10 text-ios-orange" : "bg-brand-50 text-brand-600"
          }`}
        >
          {cycle.cycleDeltaPct >= 0 ? "⚠️" : "✅"} You&apos;re spending{" "}
          {Math.abs(Math.round(cycle.cycleDeltaPct))}%{" "}
          {cycle.cycleDeltaPct >= 0 ? "more" : "less"} than your last salary period.
          At this pace you&apos;ll spend about {peso(cycle.projectedCycleSpend)} by payday.
        </div>
      </SectionCard>

      {/* 3. Category Comparison */}
      <SectionCard title="Category Comparison" emoji="🔍">
        <CategoryCompareBar data={compareBar} />
        <div className="mt-3 divide-y divide-hairline">
          {cats.filter((c) => c.thisAmt > 0).slice(0, 8).map((c) => (
            <div key={c.category} className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2 text-[14px] text-ink">
                <span className="text-lg">{CATEGORY_META[c.category].emoji}</span>
                {c.category}
              </span>
              <span className="flex items-center gap-3">
                <span className="text-[14px] font-semibold text-ink">{peso(c.thisAmt)}</span>
                {c.lastAmt > 0 && (
                  <span
                    className={`chip ${
                      c.delta > 0 ? "bg-ios-red/10 text-ios-red" : "bg-brand-50 text-brand-600"
                    }`}
                  >
                    {c.delta >= 0 ? "+" : ""}
                    {Math.round(c.pctChange)}%
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 4. AI Insights */}
      <div className="space-y-2">
        <p className="section-title">🤖 AI Review</p>
        <div className="space-y-3">
          {insights.map((ins, i) => (
            <div key={i} className="card p-4">
              <p className="flex items-center gap-2 text-[15px] font-bold text-ink">
                <span className="text-xl">{ins.emoji}</span>
                {ins.title}
              </p>
              <p className="mt-1 text-[14px] leading-relaxed text-ink/80">{ins.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Visualizations */}
      <SectionCard title="Spending Breakdown" emoji="🥧">
        {donut.length ? (
          <div className="grid grid-cols-2 items-center gap-3">
            <CategoryDonut data={donut} />
            <div className="space-y-1.5">
              {donut.slice(0, 6).map((d) => (
                <div key={d.category} className="flex items-center gap-2 text-[12px]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="flex-1 text-ink/70">{d.category}</span>
                  <span className="font-semibold text-ink">{peso(d.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-[14px] text-subtle">No spending yet this month.</p>
        )}
      </SectionCard>

      <SectionCard title="Savings Growth" emoji="📈">
        <SavingsGrowthChart data={growth} />
      </SectionCard>

      {data.debts.length > 0 && (
        <SectionCard title="Debt Payoff Projection" emoji="📉">
          <DebtPayoffChart data={payoff} />
          <p className="mt-2 text-[12px] text-subtle">
            Projected balance if you keep your current payments (avalanche order).
          </p>
        </SectionCard>
      )}

      {/* 8. Parent Dashboard */}
      <SectionCard title="Parent Dashboard" emoji="👶">
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="👶 Child" value={peso(childThis)} />
          <StatCard label="📚 School" value={peso(schoolThis)} />
          <StatCard label="🍔 Food" value={peso(foodThis)} />
        </div>
        <div className="mt-4">
          <ParentSpendChart data={parentData} />
        </div>
        <p className="mt-2 text-[12px] text-subtle">
          Family spending on the kids, month by month — so nothing sneaks up on you.
        </p>
      </SectionCard>

      {/* Savings progress recap */}
      <SectionCard title="Savings & Goals Progress" emoji="🎯">
        <div className="mb-3 flex items-center justify-between text-[14px]">
          <span className="text-subtle">Savings rate this month</span>
          <span className="font-bold text-brand-600">{pct(savingsRate(data, key))}</span>
        </div>
        {data.goals.length === 0 ? (
          <p className="text-[14px] text-subtle">No goals yet.</p>
        ) : (
          <div className="space-y-3">
            {data.goals.map((g) => (
              <div key={g.id}>
                <div className="flex justify-between text-[14px]">
                  <span className="text-ink">{g.name}</span>
                  <span className="font-medium text-ink">
                    {peso(g.current)} / {peso(g.target)}
                  </span>
                </div>
                <div className="mt-1">
                  <ProgressBar value={(g.current / (g.target || 1)) * 100} height={8} />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function ExportBtn({
  label,
  icon,
  busy,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="flex flex-col items-center gap-1 rounded-2xl bg-grouped py-3 text-[13px] font-semibold text-ink transition active:scale-95 hover:bg-hairline disabled:opacity-50"
    >
      <span className="text-brand-600">{icon}</span>
      {busy ? "…" : label}
    </button>
  );
}
