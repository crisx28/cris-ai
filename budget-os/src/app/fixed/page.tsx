"use client";

import { useState } from "react";
import { Trash2, Plus, CalendarClock } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  CATEGORY_META,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  FREQUENCIES,
  Frequency,
} from "@/lib/types";
import { peso } from "@/lib/currency";
import { monthlyEquivalent } from "@/lib/calendar";
import { PageHeader, StatCard, SectionCard, EmptyState } from "@/components/ui";

const FREQ_LABEL: Record<Frequency, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export default function FixedExpensesPage() {
  const { data, ready, addFixedExpense, toggleFixedExpense, deleteFixedExpense } =
    useStore();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Utilities");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [frequency, setFrequency] = useState<Frequency>("monthly");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    const day = Math.min(31, Math.max(1, parseInt(dueDay, 10) || 1));
    if (!amt || amt <= 0 || !name.trim()) return;
    const now = new Date();
    const anchorDay = Math.min(day, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
    addFixedExpense({
      name: name.trim(),
      category,
      amount: amt,
      dueDay: day,
      frequency,
      anchorDate: new Date(now.getFullYear(), now.getMonth(), anchorDay).toISOString().slice(0, 10),
      active: true,
    });
    setName("");
    setAmount("");
  }

  const list = ready
    ? [...data.fixedExpenses].sort((a, b) => a.dueDay - b.dueDay)
    : [];
  const activeTotal = list
    .filter((f) => f.active)
    .reduce((t, f) => t + monthlyEquivalent(f.amount, f.frequency ?? "monthly"), 0);

  const today = new Date().getDate();
  const upcoming = list
    .filter((f) => f.active && f.dueDay >= today)
    .sort((a, b) => a.dueDay - b.dueDay)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fixed Expenses"
        emoji="🔁"
        subtitle="Recurring monthly bills. We auto-total your expected monthly outflow."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Expected / month"
          value={peso(activeTotal)}
          tone="negative"
          hint="Monthly-equivalent of all bills"
        />
        <StatCard label="Active bills" value={String(list.filter((f) => f.active).length)} />
        <StatCard label="Total defined" value={String(list.length)} />
        <StatCard
          label="Next due"
          value={upcoming[0] ? `Day ${upcoming[0].dueDay}` : "—"}
          hint={upcoming[0]?.name}
        />
      </div>

      {upcoming.length > 0 && (
        <div className="card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CalendarClock size={16} className="text-brand-600" /> Upcoming bill
            alerts
          </div>
          <div className="flex flex-wrap gap-2">
            {upcoming.map((f) => (
              <span
                key={f.id}
                className="chip bg-amber-50 text-amber-700"
              >
                {CATEGORY_META[f.category].emoji} {f.name} — {peso(f.amount)} · day{" "}
                {f.dueDay}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SectionCard title="Add Fixed Expense">
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  placeholder="e.g. Apartment rent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ExpenseCategory)
                  }
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount (₱)</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="12000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Day of month</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={31}
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">Frequency</label>
                <select
                  className="input"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as Frequency)}
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f}>
                      {FREQ_LABEL[f]}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn-primary w-full" type="submit">
                <Plus size={16} /> Add Fixed Expense
              </button>
            </form>
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <SectionCard title="Recurring Bills">
            {list.length === 0 ? (
              <EmptyState text="No fixed expenses yet." />
            ) : (
              <div className="divide-y divide-slate-100">
                {list.map((f) => (
                  <div
                    key={f.id}
                    className={`flex items-center justify-between py-3 ${
                      f.active ? "" : "opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-lg">
                        {CATEGORY_META[f.category].emoji}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-slate-800">
                          {f.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {f.category} · {FREQ_LABEL[f.frequency ?? "monthly"]} · day {f.dueDay}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-800">
                        {peso(f.amount)}
                      </span>
                      <button
                        onClick={() => toggleFixedExpense(f.id)}
                        className={`chip ${
                          f.active
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {f.active ? "Active" : "Paused"}
                      </button>
                      <button
                        onClick={() => deleteFixedExpense(f.id)}
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
