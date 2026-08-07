"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { INCOME_SOURCES, IncomeSource } from "@/lib/types";
import { peso } from "@/lib/currency";
import { currentMonthKey, monthLabel, totalIncome } from "@/lib/finance";
import { PageHeader, StatCard, SectionCard, EmptyState } from "@/components/ui";

export default function IncomePage() {
  const { data, ready, addIncome, deleteIncome } = useStore();
  const [source, setSource] = useState<IncomeSource>("Salary");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const key = currentMonthKey();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    addIncome({ source, amount: amt, date, notes });
    setAmount("");
    setNotes("");
  }

  const list = ready
    ? [...data.incomes].sort((a, b) => (a.date < b.date ? 1 : -1))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Income"
        emoji="💵"
        subtitle="Log salary, freelance, bonuses and side hustles."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={`Income — ${monthLabel(key)}`}
          value={peso(totalIncome(data.incomes, key))}
          tone="positive"
        />
        <StatCard label="Entries" value={String(list.length)} />
        <StatCard
          label="Sources"
          value={String(new Set(list.map((i) => i.source)).size)}
        />
        <StatCard
          label="Largest"
          value={peso(list.reduce((m, i) => Math.max(m, i.amount), 0))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SectionCard title="Add Income">
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="label">Source</label>
                <select
                  className="input"
                  value={source}
                  onChange={(e) => setSource(e.target.value as IncomeSource)}
                >
                  {INCOME_SOURCES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Amount (₱)</label>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  placeholder="22500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  className="input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <input
                  className="input"
                  placeholder="Optional"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <button className="btn-primary w-full" type="submit">
                <Plus size={16} /> Add Income
              </button>
            </form>
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <SectionCard title="Income History">
            {list.length === 0 ? (
              <EmptyState text="No income logged yet." />
            ) : (
              <div className="divide-y divide-slate-100">
                {list.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {i.source}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(i.date).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        {i.notes ? ` · ${i.notes}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-emerald-600">
                        +{peso(i.amount)}
                      </span>
                      <button
                        onClick={() => deleteIncome(i.id)}
                        className="text-slate-300 hover:text-rose-500"
                        aria-label="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
