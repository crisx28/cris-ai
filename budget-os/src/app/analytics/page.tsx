"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { peso } from "@/lib/currency";
import {
  monthlySeries,
  typicalMonthlySurplus,
  totalExpenses,
  currentMonthKey,
  monthLabel,
} from "@/lib/finance";
import { PageHeader, SectionCard, StatCard } from "@/components/ui";
import { TrendArea, SavingsLine } from "@/components/charts";

export default function AnalyticsPage() {
  const { data, ready } = useStore();
  if (!ready) return null;

  const series = monthlySeries(data, 6);
  const surplus = typicalMonthlySurplus(data);
  const key = currentMonthKey();

  // Simple forecast: next 3 months at trailing average net.
  const avgIncome =
    series.reduce((t, p) => t + p.income, 0) / (series.length || 1);
  const avgExpenses =
    series.reduce((t, p) => t + p.expenses, 0) / (series.length || 1);
  const forecast = [1, 2, 3].map((i) => {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    return {
      label: d.toLocaleDateString("en-PH", { month: "short" }),
      income: Math.round(avgIncome),
      expenses: Math.round(avgExpenses),
      net: Math.round(avgIncome - avgExpenses),
    };
  });

  const combined = [...series, ...forecast];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        emoji="📈"
        subtitle="Trends, comparisons and a simple 3-month forecast."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Avg. income / mo" value={peso(avgIncome)} tone="positive" />
        <StatCard label="Avg. expenses / mo" value={peso(avgExpenses)} tone="negative" />
        <StatCard label="Typical surplus" value={peso(surplus)} tone="brand" />
        <StatCard
          label={`This month — ${monthLabel(key)}`}
          value={peso(totalExpenses(data.expenses, key))}
          hint="spent so far"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Spending Trend">
          <TrendArea data={series} dataKey="expenses" name="Expenses" color="#f97316" />
        </SectionCard>
        <SectionCard title="Income Trend">
          <TrendArea data={series} dataKey="income" name="Income" color="#217048" />
        </SectionCard>
      </div>

      <SectionCard title="Net Savings Trend + 3-Month Forecast">
        <SavingsLine data={combined} />
        <p className="mt-2 text-xs text-slate-400">
          Forecast assumes your 6-month average income and spending continue.
          Actual results depend on your choices — small changes compound! 🌱
        </p>
      </SectionCard>

      <Calculators surplus={surplus} avgExpenses={avgExpenses} />
    </div>
  );
}

function Calculators({
  surplus,
  avgExpenses,
}: {
  surplus: number;
  avgExpenses: number;
}) {
  const [months, setMonths] = useState("6");
  const [age, setAge] = useState("35");
  const [retireAge, setRetireAge] = useState("60");
  const [monthlySave, setMonthlySave] = useState(String(Math.max(1000, Math.round(surplus * 0.5))));

  const emergencyTarget = avgExpenses * (parseFloat(months) || 0);
  const monthsToBuild =
    surplus > 0 ? Math.ceil(emergencyTarget / surplus) : Infinity;

  const yearsToRetire = Math.max(0, (parseInt(retireAge) || 0) - (parseInt(age) || 0));
  // Future value of a monthly contribution at a conservative 5% annual return.
  const r = 0.05 / 12;
  const n = yearsToRetire * 12;
  const m = parseFloat(monthlySave) || 0;
  const nestEgg = r > 0 ? m * ((Math.pow(1 + r, n) - 1) / r) : m * n;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard title="🛟 Emergency Fund Calculator">
        <div className="space-y-3">
          <div>
            <label className="label">Months of expenses to cover</label>
            <input
              className="input"
              type="number"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
            />
          </div>
          <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-800">
            <p>
              Target fund:{" "}
              <b className="text-lg">{peso(emergencyTarget)}</b>
            </p>
            <p className="mt-1 text-brand-600">
              {isFinite(monthsToBuild)
                ? `At your ~${peso(surplus)}/month surplus, that's about ${monthsToBuild} months to build.`
                : "Increase your monthly surplus to start building this fund."}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="🌴 Retirement Calculator">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label">Age now</label>
              <input
                className="input"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Retire at</label>
              <input
                className="input"
                type="number"
                value={retireAge}
                onChange={(e) => setRetireAge(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Save/mo</label>
              <input
                className="input"
                type="number"
                value={monthlySave}
                onChange={(e) => setMonthlySave(e.target.value)}
              />
            </div>
          </div>
          <div className="rounded-xl bg-sky-50 p-4 text-sm text-sky-800">
            <p>
              In {yearsToRetire} years you could have:{" "}
              <b className="text-lg">{peso(nestEgg)}</b>
            </p>
            <p className="mt-1 text-sky-600">
              Assumes a conservative 5% annual return, compounded monthly.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
