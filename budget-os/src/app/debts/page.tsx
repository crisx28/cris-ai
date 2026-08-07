"use client";

import { useState } from "react";
import { Trash2, Plus, Snowflake, Mountain } from "lucide-react";
import { useStore } from "@/lib/store";
import { peso, pct } from "@/lib/currency";
import {
  avalancheOrder,
  simulatePayoff,
  snowballOrder,
  totalDebt,
} from "@/lib/finance";
import { PageHeader, StatCard, SectionCard, EmptyState, ProgressBar } from "@/components/ui";

export default function DebtsPage() {
  const { data, ready, addDebt, deleteDebt } = useStore();
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [rate, setRate] = useState("");
  const [payment, setPayment] = useState("");
  const [dueDay, setDueDay] = useState("5");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const bal = parseFloat(balance);
    const pay = parseFloat(payment);
    if (!bal || bal <= 0 || !name.trim() || !pay) return;
    addDebt({
      name: name.trim(),
      balance: bal,
      interestRate: parseFloat(rate) || 0,
      monthlyPayment: pay,
      dueDay: Math.min(31, Math.max(1, parseInt(dueDay, 10) || 1)),
    });
    setName("");
    setBalance("");
    setRate("");
    setPayment("");
  }

  const debts = ready ? data.debts : [];
  const total = totalDebt(debts);
  const snowball = snowballOrder(debts);
  const avalanche = avalancheOrder(debts);
  const payoff = debts.length ? simulatePayoff(avalanche) : null;
  const monthlyPay = debts.reduce((t, d) => t + d.monthlyPayment, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Debt Tracker"
        subtitle="Two proven payoff strategies + your debt-free date."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Debt" value={peso(total)} tone="negative" />
        <StatCard label="Monthly Payments" value={peso(monthlyPay)} />
        <StatCard label="Active Debts" value={String(debts.length)} />
        <StatCard
          label="Debt-Free Date"
          value={payoff ? payoff.debtFreeDate : "—"}
          tone="brand"
        />
      </div>

      {debts.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <div className="mb-1 flex items-center gap-2 text-brand-600">
              <Snowflake size={18} />
              <h2 className="font-semibold text-slate-900">
                Snowball Strategy
              </h2>
            </div>
            <p className="mb-3 text-xs text-slate-400">
              Pay smallest balance first — quick wins keep you motivated.
            </p>
            <ol className="space-y-2">
              {snowball.map((d, i) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {i + 1}
                    </span>
                    {d.name}
                  </span>
                  <span className="font-medium text-slate-700">
                    {peso(d.balance)}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
              👉 Focus extra payments on{" "}
              <b>{snowball[0]?.name}</b> first.
            </p>
          </div>

          <div className="card p-5">
            <div className="mb-1 flex items-center gap-2 text-amber-600">
              <Mountain size={18} />
              <h2 className="font-semibold text-slate-900">
                Avalanche Strategy
              </h2>
            </div>
            <p className="mb-3 text-xs text-slate-400">
              Pay highest interest first — saves the most money overall.
            </p>
            <ol className="space-y-2">
              {avalanche.map((d, i) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                      {i + 1}
                    </span>
                    {d.name}
                  </span>
                  <span className="font-medium text-slate-700">
                    {d.interestRate}%/mo
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              👉 Attack <b>{avalanche[0]?.name}</b> first to save on interest.
              {payoff && (
                <>
                  {" "}
                  Projected interest paid: <b>{peso(payoff.totalInterest)}</b>.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SectionCard title="Add Debt">
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="label">Debt name</label>
                <input
                  className="input"
                  placeholder="e.g. BPI Credit Card"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Current balance (₱)</label>
                <input
                  className="input"
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Interest %/mo</label>
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    placeholder="3.5"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Due day</label>
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
                <label className="label">Monthly payment (₱)</label>
                <input
                  className="input"
                  type="number"
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                />
              </div>
              <button className="btn-primary w-full" type="submit">
                <Plus size={16} /> Add Debt
              </button>
            </form>
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <SectionCard title="Your Debts">
            {debts.length === 0 ? (
              <EmptyState text="No debts recorded. 🎉" />
            ) : (
              <div className="space-y-3">
                {debts.map((d) => {
                  const paidGuess = Math.min(
                    100,
                    Math.max(
                      0,
                      100 -
                        (d.balance / (d.balance + d.monthlyPayment * 6)) * 100
                    )
                  );
                  return (
                    <div key={d.id} className="rounded-xl border border-slate-100 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-800">
                          {d.name}
                        </div>
                        <button
                          onClick={() => deleteDebt(d.id)}
                          className="text-slate-300 hover:text-rose-500"
                          aria-label="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-slate-400">
                        <span>Balance: <b className="text-slate-700">{peso(d.balance)}</b></span>
                        <span>Rate: <b className="text-slate-700">{d.interestRate}%/mo</b></span>
                        <span>Pays: <b className="text-slate-700">{peso(d.monthlyPayment)}/mo</b></span>
                      </div>
                      <div className="mt-2">
                        <ProgressBar value={paidGuess} color="#8b5cf6" height={6} />
                        <div className="mt-1 text-right text-[11px] text-slate-400">
                          ~{pct(paidGuess)} paid off
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
