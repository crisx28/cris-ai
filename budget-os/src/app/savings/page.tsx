"use client";

import { useState } from "react";
import { Trash2, Plus, PiggyBank } from "lucide-react";
import { useStore } from "@/lib/store";
import { peso, pct } from "@/lib/currency";
import { goalProjection } from "@/lib/finance";
import { PageHeader, StatCard, SectionCard, EmptyState, ProgressBar } from "@/components/ui";

export default function SavingsPage() {
  const { data, ready, addGoal, updateGoal, deleteGoal } = useStore();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = parseFloat(target);
    if (!t || t <= 0 || !name.trim()) return;
    addGoal({
      name: name.trim(),
      target: t,
      current: parseFloat(current) || 0,
      deadline: deadline || undefined,
    });
    setName("");
    setTarget("");
    setCurrent("");
    setDeadline("");
  }

  const goals = ready ? data.goals : [];
  const totalSaved = goals.reduce((t, g) => t + g.current, 0);
  const totalTarget = goals.reduce((t, g) => t + g.target, 0);

  function contribute(id: string, currentAmt: number) {
    const input = prompt("How much to add to this goal? (₱)");
    if (!input) return;
    const amt = parseFloat(input.replace(/,/g, ""));
    if (!amt) return;
    updateGoal(id, { current: currentAmt + amt });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings Goals"
        subtitle="Emergency fund, school fund, gadgets — track every dream."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Saved" value={peso(totalSaved)} tone="brand" />
        <StatCard label="Total Target" value={peso(totalTarget)} />
        <StatCard
          label="Overall Progress"
          value={pct(totalTarget ? (totalSaved / totalTarget) * 100 : 0)}
        />
        <StatCard label="Active Goals" value={String(goals.length)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SectionCard title="New Goal">
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="label">Goal name</label>
                <input
                  className="input"
                  placeholder="e.g. Emergency Fund"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Target amount (₱)</label>
                <input
                  className="input"
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Already saved (₱)</label>
                <input
                  className="input"
                  type="number"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Deadline (optional)</label>
                <input
                  className="input"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <button className="btn-primary w-full" type="submit">
                <Plus size={16} /> Create Goal
              </button>
            </form>
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          {goals.length === 0 ? (
            <SectionCard title="Goals">
              <EmptyState text="No goals yet. Create your first one!" />
            </SectionCard>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {goals.map((g) => {
                const p = goalProjection(g);
                return (
                  <div key={g.id} className="card p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                          <PiggyBank size={18} />
                        </span>
                        <h3 className="font-semibold text-slate-900">
                          {g.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => deleteGoal(g.id)}
                        className="text-slate-300 hover:text-rose-500"
                        aria-label="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-end justify-between">
                      <div className="text-xl font-bold text-slate-900">
                        {peso(g.current)}
                      </div>
                      <div className="text-xs text-slate-400">
                        of {peso(g.target)}
                      </div>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={p.progress} />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-slate-400">
                      <span>{pct(p.progress)} complete</span>
                      <span>{peso(p.remaining)} to go</span>
                    </div>

                    {p.requiredMonthly !== null && (
                      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        Save <b>{peso(p.requiredMonthly)}/mo</b> for{" "}
                        {p.monthsToDeadline} month
                        {p.monthsToDeadline === 1 ? "" : "s"} to hit your
                        deadline.
                      </div>
                    )}

                    <button
                      onClick={() => contribute(g.id, g.current)}
                      className="btn-ghost mt-3 w-full justify-center bg-brand-50 text-brand-700"
                    >
                      <Plus size={15} /> Add money
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
