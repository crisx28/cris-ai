"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Plus, Repeat, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useMotion } from "@/lib/motion";
import { peso } from "@/lib/currency";
import {
  buildCalendarEvents,
  cashFlowForecast,
  paydayPlanner,
  CalEvent,
} from "@/lib/calendar";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui";
import { FinancialTask, Recurrence, TaskKind } from "@/lib/types";

const WD = ["S", "M", "T", "W", "T", "F", "S"];
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const ROUTINE_ITEMS: { key: string; label: string; kind: TaskKind; emoji: string }[] = [
  { key: "save", label: "Save 20% of income", kind: "savings", emoji: "💰" },
  { key: "debt", label: "Make a debt payment", kind: "debt", emoji: "💳" },
  { key: "travel", label: "Fund travel goal", kind: "travel", emoji: "✈️" },
  { key: "review", label: "Review the budget", kind: "review", emoji: "📊" },
];

export default function CalendarPage() {
  const { data, ready, toggleTask, deleteTask } = useStore();
  const { connected, createTask } = useMotion();
  const [offset, setOffset] = useState(0); // months from current
  const [selected, setSelected] = useState<Date | null>(new Date());
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [picked, setPicked] = useState<Record<string, boolean>>({ save: true, debt: true, travel: true, review: true });
  const [routineDone, setRoutineDone] = useState(false);

  const view = useMemo(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
    return { first, last };
  }, [offset]);

  const events = useMemo(
    () => (ready ? buildCalendarEvents(data, view.first, view.last) : []),
    [data, ready, view]
  );
  const forecast = useMemo(() => (ready ? cashFlowForecast(data) : null), [data, ready]);
  const plans = useMemo(() => (ready ? paydayPlanner(data) : []), [data, ready]);

  if (!ready) return null;

  const monthLabel = view.first.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
  const lead = view.first.getDay();
  const daysCount = view.last.getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysCount }, (_, i) => new Date(view.first.getFullYear(), view.first.getMonth(), i + 1)),
  ];
  const eventsOn = (d: Date) => events.filter((e) => sameDay(e.date, d));
  const selectedEvents = selected ? eventsOn(selected) : [];

  async function addFromEvent(key: string, ev: CalEvent) {
    if (!ev.task) return;
    setAdded((a) => ({ ...a, [key]: true }));
    await createTask(ev.task);
  }

  async function createRoutine() {
    for (const item of ROUTINE_ITEMS) {
      if (!picked[item.key]) continue;
      await createTask({
        title: `Payday: ${item.label}`,
        kind: item.kind,
        recurrence: "payday" as Recurrence,
        source: "routine",
      } as Omit<FinancialTask, "id" | "createdAt" | "status">);
    }
    setRoutineDone(true);
    setTimeout(() => setRoutineDone(false), 3000);
  }

  const tasks = [...data.tasks].sort((a, b) => (a.status === b.status ? 0 : a.status === "pending" ? -1 : 1));

  return (
    <div className="space-y-5">
      <PageHeader title="Calendar" emoji="📅" subtitle="Your future cash flow, bills and tasks — at a glance." />

      {/* AI cash-flow forecast */}
      {forecast && (
        <div
          className={`rounded-4xl p-5 ${
            forecast.onTrack ? "bg-brand-50 border border-brand-100" : "bg-warning/10 border border-warning/20"
          }`}
        >
          <p className="text-[13px] font-semibold uppercase tracking-wide text-subtle">🔮 Cash-flow forecast</p>
          <p className="mt-1 text-[15px] leading-relaxed text-ink">{forecast.message}</p>
        </div>
      )}

      {/* Payday planner */}
      {plans.length > 0 && (
        <div className="space-y-2">
          <p className="section-title">💰 Payday Planner</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {plans.map((p, i) => (
              <div key={i} className="card p-4">
                <p className="text-[13px] font-semibold text-ink">
                  Payday · {p.date.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                </p>
                <div className="mt-2 space-y-1 text-[13px]">
                  <Row label="💰 Salary" value={peso(p.salary)} tone="in" />
                  <Row label="🔁 Fixed expenses" value={`−${peso(p.fixed)}`} />
                  <Row label="💳 Debt" value={`−${peso(p.debt)}`} />
                  <Row label="🎯 Goal contributions" value={`−${peso(p.goals)}`} />
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-hairline pt-2">
                  <span className="text-[13px] font-semibold text-ink">Projected balance</span>
                  <span className={`text-[15px] font-bold ${p.remaining >= 0 ? "text-success" : "text-danger"}`}>
                    {peso(p.remaining)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setOffset((o) => o - 1)} className="btn-ghost bg-white shadow-card">
          <ChevronLeft size={18} />
        </button>
        <p className="text-[16px] font-bold text-ink">{monthLabel}</p>
        <button onClick={() => setOffset((o) => o + 1)} className="btn-ghost bg-white shadow-card">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Desktop: month grid */}
      <div className="card hidden p-4 lg:block">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[12px] font-semibold text-subtle">
          {WD.map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const evs = eventsOn(d);
            const isToday = sameDay(d, new Date());
            const isSel = selected && sameDay(d, selected);
            return (
              <button
                key={i}
                onClick={() => setSelected(d)}
                className={`min-h-[72px] rounded-2xl border p-1.5 text-left transition ${
                  isSel ? "border-brand-400 bg-brand-50" : "border-hairline hover:bg-grouped"
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold ${
                    isToday ? "bg-brand-500 text-white" : "text-ink"
                  }`}
                >
                  {d.getDate()}
                </span>
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {evs.slice(0, 4).map((e, j) => (
                    <span key={j} title={e.title} className="text-[13px]">
                      {e.emoji}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: selected-day detail */}
      <div className="hidden lg:block">
        {selected && (
          <SectionCard
            title={selected.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}
            emoji="🗓️"
          >
            <DayEvents events={selectedEvents} connected={connected} added={added} onAdd={addFromEvent} />
          </SectionCard>
        )}
      </div>

      {/* Mobile: agenda */}
      <div className="space-y-3 lg:hidden">
        <p className="section-title">Agenda · {monthLabel}</p>
        {events.length === 0 ? (
          <EmptyState text="Nothing scheduled this month" emoji="🗓️" hint="Add recurring bills so they show up here." />
        ) : (
          groupByDay(events).map(([label, evs]) => (
            <div key={label} className="card p-4">
              <p className="mb-2 text-[13px] font-semibold text-ink">{label}</p>
              <DayEvents events={evs} connected={connected} added={added} onAdd={addFromEvent} />
            </div>
          ))
        )}
      </div>

      {/* Payday routine */}
      <SectionCard
        title="Payday Routine"
        emoji="🔁"
        action={connected ? <span className="text-[11px] font-medium text-brand-600">Motion connected</span> : undefined}
      >
        <p className="mb-3 text-[13px] text-subtle">
          Turn every payday into a plan — we&apos;ll create recurring tasks
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

      {/* Task list */}
      <SectionCard title="Your Tasks" emoji="✅">
        {tasks.length === 0 ? (
          <EmptyState text="No tasks yet" emoji="⚡" hint="Create one from a calendar event or your dashboard." />
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
                    <span className={`block text-[14px] ${t.status === "done" ? "text-subtle line-through" : "font-medium text-ink"}`}>
                      {t.title}
                    </span>
                    <span className="text-[11px] text-subtle">
                      {t.recurrence !== "none" ? `Recurring · ${t.recurrence}` : "One-time"}
                      {t.motionId ? " · Motion" : ""}
                    </span>
                  </span>
                </button>
                <button onClick={() => deleteTask(t.id)} className="text-subtle transition hover:text-danger" aria-label="Delete">
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

function Row({ label, value, tone }: { label: string; value: string; tone?: "in" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-subtle">{label}</span>
      <span className={tone === "in" ? "font-semibold text-success" : "text-ink"}>{value}</span>
    </div>
  );
}

function DayEvents({
  events,
  connected,
  added,
  onAdd,
}: {
  events: CalEvent[];
  connected: boolean;
  added: Record<string, boolean>;
  onAdd: (key: string, e: CalEvent) => void;
}) {
  if (events.length === 0) return <p className="py-2 text-[14px] text-subtle">Nothing scheduled.</p>;
  return (
    <div className="divide-y divide-hairline">
      {events.map((e, i) => {
        const key = `${e.title}-${e.date.toISOString()}-${i}`;
        return (
          <div key={key} className="flex items-center justify-between py-2.5">
            <span className="flex items-center gap-2.5">
              <span className="text-xl">{e.emoji}</span>
              <span>
                <span className="block text-[14px] font-medium text-ink">{e.title}</span>
                <span className="text-[11px] text-subtle">{e.date.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</span>
              </span>
            </span>
            <span className="flex items-center gap-2">
              {e.amount ? (
                <span className={`text-[14px] font-semibold ${e.direction === "in" ? "text-success" : "text-ink"}`}>
                  {e.direction === "in" ? "+" : "−"}
                  {peso(e.amount)}
                </span>
              ) : null}
              {e.task ? (
                added[key] ? (
                  <span className="text-[12px] font-semibold text-brand-600">✓</span>
                ) : (
                  <button
                    onClick={() => onAdd(key, e)}
                    className="rounded-full bg-grouped p-1.5 text-brand-600 transition active:scale-90"
                    aria-label={connected ? "Create Motion task" : "Create task"}
                    title={connected ? "Create Motion Task" : "Create Task"}
                  >
                    <Plus size={15} />
                  </button>
                )
              ) : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function groupByDay(events: CalEvent[]): [string, CalEvent[]][] {
  const map = new Map<string, CalEvent[]>();
  for (const e of events) {
    const label = e.date.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(e);
  }
  return Array.from(map.entries());
}
