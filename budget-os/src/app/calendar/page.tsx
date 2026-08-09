"use client";

import { useMemo, useState } from "react";
import { Check, Trash2, Repeat } from "lucide-react";
import { useStore } from "@/lib/store";
import { useMotion } from "@/lib/motion";
import { peso } from "@/lib/currency";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui";
import { FinancialTask, Recurrence, TaskKind } from "@/lib/types";

function nextDate(dueDay: number, ref = new Date()): Date {
  const today = ref.getDate();
  const dim = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  const day = Math.min(dueDay, dim);
  return day >= today
    ? new Date(ref.getFullYear(), ref.getMonth(), day)
    : new Date(ref.getFullYear(), ref.getMonth() + 1, Math.min(dueDay, 28));
}
function daysFromNow(d: Date): number {
  const n = new Date();
  return Math.round((d.getTime() - new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime()) / 86400000);
}
const fmt = (d: Date) => d.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" });

interface Ev {
  date: Date;
  emoji: string;
  label: string;
  sub: string;
  amount?: number;
}

const ROUTINE_ITEMS: { key: string; label: string; kind: TaskKind; emoji: string }[] = [
  { key: "save", label: "Save 20% of income", kind: "savings", emoji: "💰" },
  { key: "debt", label: "Make a debt payment", kind: "debt", emoji: "💳" },
  { key: "travel", label: "Fund travel goal", kind: "travel", emoji: "✈️" },
  { key: "review", label: "Review the budget", kind: "review", emoji: "📊" },
];

export default function CalendarPage() {
  const { data, ready, toggleTask, deleteTask } = useStore();
  const { connected, createTask } = useMotion();
  const [picked, setPicked] = useState<Record<string, boolean>>({
    save: true,
    debt: true,
    travel: true,
    review: true,
  });
  const [routineDone, setRoutineDone] = useState(false);

  const events = useMemo<Ev[]>(() => {
    if (!ready) return [];
    const list: Ev[] = [];
    for (const f of data.fixedExpenses.filter((x) => x.active)) {
      list.push({ date: nextDate(f.dueDay), emoji: "⚡", label: f.name, sub: "Bill", amount: f.amount });
    }
    for (const d of data.debts) {
      list.push({ date: nextDate(d.dueDay), emoji: "💳", label: `${d.name} payment`, sub: "Debt", amount: d.monthlyPayment });
    }
    for (const t of data.tasks.filter((t) => t.dueDate && t.status === "pending")) {
      list.push({ date: new Date(t.dueDate!), emoji: "✅", label: t.title, sub: "Task", amount: t.amount });
    }
    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data, ready]);

  if (!ready) return null;

  const today = events.filter((e) => daysFromNow(e.date) <= 0);
  const week = events.filter((e) => daysFromNow(e.date) > 0 && daysFromNow(e.date) <= 7);
  const month = events.filter((e) => daysFromNow(e.date) > 7 && daysFromNow(e.date) <= 31);

  async function createRoutine() {
    for (const item of ROUTINE_ITEMS) {
      if (!picked[item.key]) continue;
      const spec: Omit<FinancialTask, "id" | "createdAt" | "status"> = {
        title: `Payday: ${item.label}`,
        kind: item.kind,
        recurrence: "payday" as Recurrence,
        source: "routine",
      };
      await createTask(spec);
    }
    setRoutineDone(true);
    setTimeout(() => setRoutineDone(false), 3000);
  }

  const tasks = [...data.tasks].sort((a, b) =>
    a.status === b.status ? 0 : a.status === "pending" ? -1 : 1
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Calendar"
        emoji="📅"
        subtitle="Bills, goals, debt payments and tasks — all in one place."
      />

      {/* Payday routine */}
      <SectionCard
        title="Payday Routine"
        emoji="🔁"
        action={
          connected ? <span className="text-[11px] font-medium text-brand-600">Motion connected</span> : undefined
        }
      >
        <p className="mb-3 text-[13px] text-subtle">
          Turn every payday into a plan. We&apos;ll create recurring tasks
          {connected ? " and sync them to Motion." : " in your app."}
        </p>
        <div className="space-y-2">
          {ROUTINE_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setPicked((p) => ({ ...p, [item.key]: !p[item.key] }))}
              className="flex w-full items-center gap-3 rounded-2xl bg-grouped px-3 py-2.5 text-left transition active:scale-[0.99]"
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                  picked[item.key] ? "border-brand-500 bg-brand-500 text-white" : "border-hairline bg-white"
                }`}
              >
                {picked[item.key] && <Check size={13} />}
              </span>
              <span className="text-lg">{item.emoji}</span>
              <span className="text-[14px] text-ink">{item.label}</span>
            </button>
          ))}
        </div>
        <button className="btn-primary mt-3 w-full" onClick={createRoutine}>
          <Repeat size={16} /> {routineDone ? "Routine created! 🎉" : "Create Payday Routine"}
        </button>
      </SectionCard>

      {/* Timeframes */}
      {[
        { title: "Today", items: today },
        { title: "This Week", items: week },
        { title: "This Month", items: month },
      ].map((group) => (
        <div key={group.title} className="space-y-2">
          <p className="section-title">{group.title}</p>
          <div className="card">
            {group.items.length === 0 ? (
              <p className="px-5 py-6 text-center text-[14px] text-subtle">Nothing scheduled.</p>
            ) : (
              <div className="divide-y divide-hairline">
                {group.items.map((e, i) => (
                  <div key={i} className="flex items-center justify-between p-4">
                    <span className="flex items-center gap-3">
                      <span className="text-xl">{e.emoji}</span>
                      <span>
                        <span className="block text-[15px] font-medium text-ink">{e.label}</span>
                        <span className="text-[12px] text-subtle">
                          {e.sub} · {fmt(e.date)}
                        </span>
                      </span>
                    </span>
                    {e.amount ? (
                      <span className="text-[15px] font-semibold text-ink">{peso(e.amount)}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Task list */}
      <SectionCard title="Your Tasks" emoji="✅">
        {tasks.length === 0 ? (
          <EmptyState
            text="No tasks yet"
            emoji="⚡"
            hint="Create one from the Recommended Actions on your dashboard."
          />
        ) : (
          <div className="divide-y divide-hairline">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <button onClick={() => toggleTask(t.id)} className="flex items-center gap-3 text-left">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                      t.status === "done" ? "border-brand-500 bg-brand-500 text-white" : "border-hairline"
                    }`}
                  >
                    {t.status === "done" && <Check size={14} />}
                  </span>
                  <span>
                    <span
                      className={`block text-[14px] ${
                        t.status === "done" ? "text-subtle line-through" : "font-medium text-ink"
                      }`}
                    >
                      {t.title}
                    </span>
                    <span className="text-[11px] text-subtle">
                      {t.recurrence !== "none" ? `Recurring · ${t.recurrence}` : "One-time"}
                      {t.motionId ? " · Motion" : ""}
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => deleteTask(t.id)}
                  className="text-subtle transition hover:text-danger"
                  aria-label="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
