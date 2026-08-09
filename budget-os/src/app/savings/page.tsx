"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { peso, pct } from "@/lib/currency";
import { goalProjection } from "@/lib/finance";
import { goalEmoji } from "@/lib/types";
import { useMotion } from "@/lib/motion";
import { PageHeader, StatCard, SectionCard, EmptyState, ProgressBar } from "@/components/ui";
import { Confetti } from "@/components/Confetti";

export default function SavingsPage() {
  const { data, ready, addGoal, updateGoal, deleteGoal } = useStore();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [celebrate, setCelebrate] = useState(0);

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

  const { createTask } = useMotion();
  const [planned, setPlanned] = useState<Record<string, boolean>>({});

  async function makePlan(goalId: string, goalName: string, monthly: number) {
    await createTask({
      title: `Save ${peso(monthly)} for ${goalName}`,
      kind: "savings",
      amount: monthly,
      recurrence: "monthly",
      source: "goal",
    });
    setPlanned((p) => ({ ...p, [goalId]: true }));
  }

  function contribute(id: string, currentAmt: number, targetAmt: number) {
    const input = prompt("How much to add to this goal? (₱)");
    if (!input) return;
    const amt = parseFloat(input.replace(/,/g, ""));
    if (!amt) return;
    const next = currentAmt + amt;
    updateGoal(id, { current: next });
    if (currentAmt < targetAmt && next >= targetAmt) {
      setCelebrate((c) => c + 1); // 🎉 goal reached!
    }
  }

  return (
    <div className="space-y-6">
      <Confetti trigger={celebrate} />
      <PageHeader
        title="Savings Goals"
        emoji="🎯"
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
              <EmptyState
                text="No goals yet"
                emoji="🎯"
                hint="Add an Emergency Fund or a dream — I'll tell you exactly how much to save each month."
              />
            </SectionCard>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {goals.map((g) => {
                const p = goalProjection(g);
                return (
                  <div key={g.id} className="card p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-grouped text-2xl">
                          {goalEmoji(g.name)}
                        </span>
                        <h3 className="text-[16px] font-bold text-ink">
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
                      onClick={() => contribute(g.id, g.current, g.target)}
                      className="btn-ghost mt-3 w-full justify-center bg-brand-50 text-brand-600"
                    >
                      <Plus size={15} /> Add money
                    </button>
                    {p.requiredMonthly ? (
                      <button
                        onClick={() => makePlan(g.id, g.name, p.requiredMonthly!)}
                        className="mt-2 w-full rounded-2xl border border-hairline py-2.5 text-[14px] font-semibold text-ink transition active:scale-[0.98]"
                      >
                        {planned[g.id]
                          ? "✓ Action plan created"
                          : `📤 Create Action Plan · ${peso(p.requiredMonthly)}/mo`}
                      </button>
                    ) : null}
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
