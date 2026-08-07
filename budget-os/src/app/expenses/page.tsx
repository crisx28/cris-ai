"use client";

import { useMemo, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  CATEGORY_META,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
} from "@/lib/types";
import { peso } from "@/lib/currency";
import { currentMonthKey, monthLabel, totalExpenses } from "@/lib/finance";
import { PageHeader, StatCard, SectionCard, EmptyState } from "@/components/ui";
import { QuickAdd } from "@/components/QuickAdd";

export default function ExpensesPage() {
  const { data, ready, addExpense, deleteExpense } = useStore();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Food");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [filter, setFilter] = useState<ExpenseCategory | "All">("All");

  const key = currentMonthKey();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !description.trim()) return;
    addExpense({ description: description.trim(), category, amount: amt, date });
    setDescription("");
    setAmount("");
  }

  const list = useMemo(() => {
    if (!ready) return [];
    return [...data.expenses]
      .filter((e) => filter === "All" || e.category === filter)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [data.expenses, filter, ready]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        emoji="💸"
        subtitle="Every peso, categorized. Filter to see where your money goes."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={`Spent — ${monthLabel(key)}`}
          value={peso(totalExpenses(data.expenses, key))}
          tone="negative"
        />
        <StatCard label="Transactions" value={String(data.expenses.length)} />
        <StatCard
          label="Categories used"
          value={String(new Set(data.expenses.map((e) => e.category)).size)}
        />
        <StatCard
          label="Avg. transaction"
          value={peso(
            data.expenses.length
              ? data.expenses.reduce((t, e) => t + e.amount, 0) /
                  data.expenses.length
              : 0
          )}
        />
      </div>

      <QuickAdd />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SectionCard title="Add Expense (detailed)">
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="label">Description</label>
                <input
                  className="input"
                  placeholder="e.g. SM grocery run"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
              <div>
                <label className="label">Amount (₱)</label>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  placeholder="1250"
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
              <button className="btn-primary w-full" type="submit">
                <Plus size={16} /> Add Expense
              </button>
            </form>
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <SectionCard
            title="Transactions"
            action={
              <select
                className="input max-w-[160px] py-1.5 text-xs"
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as ExpenseCategory | "All")
                }
              >
                <option value="All">All categories</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            }
          >
            {list.length === 0 ? (
              <EmptyState text="No expenses match this filter." />
            ) : (
              <div className="max-h-[520px] divide-y divide-slate-100 overflow-y-auto">
                {list.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-lg">
                        {CATEGORY_META[t.category].emoji}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-slate-800">
                          {t.description}
                        </div>
                        <div className="text-xs text-slate-400">
                          {t.category} ·{" "}
                          {new Date(t.date).toLocaleDateString("en-PH", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-rose-600">
                        −{peso(t.amount)}
                      </span>
                      <button
                        onClick={() => deleteExpense(t.id)}
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
