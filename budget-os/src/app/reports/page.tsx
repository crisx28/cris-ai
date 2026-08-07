"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { peso, pct } from "@/lib/currency";
import {
  categoryBreakdown,
  currentMonthKey,
  financialHealth,
  monthLabel,
  monthlySeries,
  savingsRate,
  totalDebt,
  totalExpenses,
  totalIncome,
} from "@/lib/finance";
import { CATEGORY_META } from "@/lib/types";
import { PageHeader, SectionCard, StatCard, ProgressBar } from "@/components/ui";
import { CategoryDonut, IncomeExpenseChart } from "@/components/charts";

export default function ReportsPage() {
  const { data, ready } = useStore();
  const [busy, setBusy] = useState(false);
  const key = currentMonthKey();

  const income = totalIncome(data.incomes, key);
  const expenses = totalExpenses(data.expenses, key);
  const breakdown = categoryBreakdown(data.expenses, key);
  const series = monthlySeries(data, 6);
  const donutData = breakdown.map((b) => ({
    category: b.category,
    amount: b.amount,
    color: CATEGORY_META[b.category].color,
  }));

  async function exportPDF() {
    setBusy(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.setTextColor("#217048");
      doc.text("Cris Budget OS — Monthly Report", 14, 20);
      doc.setFontSize(11);
      doc.setTextColor("#475569");
      doc.text(`Period: ${monthLabel(key)}`, 14, 28);
      doc.text(
        `Generated: ${new Date().toLocaleDateString("en-PH")}`,
        14,
        34
      );

      const health = financialHealth(data);
      autoTable(doc, {
        startY: 42,
        head: [["Summary", "Value"]],
        body: [
          ["Total Income", peso(income)],
          ["Total Expenses", peso(expenses)],
          ["Remaining Cash", peso(income - expenses)],
          ["Savings Rate", pct(savingsRate(data, key))],
          ["Total Debt", peso(totalDebt(data.debts))],
          ["Financial Health Score", `${health.score}/100 (${health.grade})`],
        ],
        theme: "striped",
        headStyles: { fillColor: [33, 112, 72] },
      });

      autoTable(doc, {
        head: [["Category", "Amount", "% of spending"]],
        body: breakdown.map((b) => [
          b.category,
          peso(b.amount),
          pct(expenses ? (b.amount / expenses) * 100 : 0),
        ]),
        theme: "striped",
        headStyles: { fillColor: [33, 112, 72] },
      });

      if (data.debts.length) {
        autoTable(doc, {
          head: [["Debt", "Balance", "Rate/mo", "Payment"]],
          body: data.debts.map((d) => [
            d.name,
            peso(d.balance),
            `${d.interestRate}%`,
            peso(d.monthlyPayment),
          ]),
          theme: "striped",
          headStyles: { fillColor: [139, 92, 246] },
        });
      }

      if (data.goals.length) {
        autoTable(doc, {
          head: [["Savings Goal", "Saved", "Target", "Progress"]],
          body: data.goals.map((g) => [
            g.name,
            peso(g.current),
            peso(g.target),
            pct((g.current / (g.target || 1)) * 100),
          ]),
          theme: "striped",
          headStyles: { fillColor: [14, 165, 233] },
        });
      }

      doc.save(`cris-budget-report-${key}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle={`Financial summary for ${monthLabel(key)}.`}
        action={
          <button className="btn-primary" onClick={exportPDF} disabled={busy}>
            <FileDown size={16} /> {busy ? "Preparing…" : "Export PDF"}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Income" value={peso(income)} tone="positive" />
        <StatCard label="Expenses" value={peso(expenses)} tone="negative" />
        <StatCard label="Net" value={peso(income - expenses)} tone="brand" />
        <StatCard label="Savings Rate" value={pct(savingsRate(data, key))} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Income vs Expenses (6 months)">
          <IncomeExpenseChart data={series} />
        </SectionCard>
        <SectionCard title="Category Breakdown">
          {donutData.length ? (
            <div className="grid grid-cols-2 items-center gap-4">
              <CategoryDonut data={donutData} />
              <div className="space-y-1.5">
                {donutData.slice(0, 7).map((d) => (
                  <div key={d.category} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: d.color }}
                    />
                    <span className="flex-1 text-slate-600">{d.category}</span>
                    <span className="font-medium text-slate-800">
                      {peso(d.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">
              No spending this month yet.
            </p>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Debt Progress Report">
        {data.debts.length === 0 ? (
          <p className="text-sm text-slate-400">No debts recorded. 🎉</p>
        ) : (
          <div className="space-y-3">
            {data.debts.map((d) => (
              <div key={d.id}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">{d.name}</span>
                  <span className="font-medium text-slate-800">
                    {peso(d.balance)}
                  </span>
                </div>
                <ProgressBar
                  value={Math.min(
                    100,
                    100 - (d.balance / (d.balance + d.monthlyPayment * 6)) * 100
                  )}
                  color="#8b5cf6"
                  height={6}
                />
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Savings Progress Report">
        {data.goals.length === 0 ? (
          <p className="text-sm text-slate-400">No goals yet.</p>
        ) : (
          <div className="space-y-3">
            {data.goals.map((g) => (
              <div key={g.id}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">{g.name}</span>
                  <span className="font-medium text-slate-800">
                    {peso(g.current)} / {peso(g.target)}
                  </span>
                </div>
                <ProgressBar value={(g.current / (g.target || 1)) * 100} />
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
