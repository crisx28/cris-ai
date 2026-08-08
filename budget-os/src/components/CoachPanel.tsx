"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import {
  avalancheOrder,
  dailySafeSpend,
  goalProjection,
  simulatePayoff,
  travelProjection,
} from "@/lib/finance";
import { generateInsights } from "@/lib/insights";
import { peso, pct } from "@/lib/currency";

// A persistent financial advisor panel — not a floating chatbot.
// Rendered in the desktop right sidebar and reused on the AI Coach screen.
const ACTIONS: { label: string; q: string }[] = [
  { label: "Can I afford this?", q: "How much can I safely spend today?" },
  { label: "Analyze spending", q: "Why am I overspending?" },
  { label: "Recommend debt strategy", q: "Which debt should I pay first?" },
  { label: "Review my budget", q: "How am I doing this month?" },
];

export function CoachPanel() {
  const { data, ready } = useStore();
  if (!ready) return null;

  const safe = dailySafeSpend(data);
  const insights = generateInsights(data).slice(0, 3);
  const recDebt = avalancheOrder(data.debts)[0];
  const payoff = data.debts.length ? simulatePayoff(avalancheOrder(data.debts)) : null;
  const emergency = data.goals.find((g) =>
    g.name.toLowerCase().includes("emergency")
  );
  const emergencyP = emergency ? goalProjection(emergency) : null;
  const trip = data.travel[0];
  const tripP = trip ? travelProjection(trip) : null;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xl">
          🤖
        </span>
        <div>
          <p className="text-[15px] font-bold text-ink">Financial Coach</p>
          <p className="text-[11px] text-subtle">Here to help, anytime</p>
        </div>
      </div>

      {/* Daily Safe Spend */}
      <div className="rounded-3xl border border-brand-100 bg-brand-50/60 p-4">
        <p className="text-[12px] font-medium text-brand-700">💡 Daily Safe Spend</p>
        <p className="mt-0.5 text-[26px] font-bold tracking-tight text-brand-700">
          {peso(safe.perDay)}
          <span className="text-[13px] font-medium text-brand-600/70">/day</span>
        </p>
        <p className="text-[12px] text-brand-600/80">
          {safe.days} day{safe.days === 1 ? "" : "s"} until payday · {peso(safe.upcomingBills)} in bills left
        </p>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <p className="mb-1.5 section-title">Spending insights</p>
          <div className="space-y-1.5">
            {insights.map((ins, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-2xl bg-grouped px-3 py-2.5 text-[13px] leading-snug text-ink"
              >
                <span>{ins.emoji}</span>
                <span>{ins.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debt recommendation */}
      {recDebt && payoff && (
        <div>
          <p className="mb-1.5 section-title">Debt recommendation</p>
          <div className="rounded-2xl border border-hairline bg-white px-3 py-2.5">
            <p className="text-[13px] text-ink">
              🔥 Pay <b>{recDebt.name}</b> first
            </p>
            <p className="text-[12px] text-subtle">Debt-free by {payoff.debtFreeDate}</p>
          </div>
        </div>
      )}

      {/* Goal progress */}
      {(emergencyP || tripP) && (
        <div>
          <p className="mb-1.5 section-title">Goal progress</p>
          <div className="space-y-2">
            {emergencyP && (
              <MiniProgress label="🛡️ Emergency Fund" value={emergencyP.progress} color="#22c55e" />
            )}
            {tripP && trip && (
              <MiniProgress
                label={`✈️ ${trip.destination.replace(/[^\w\s,.'-]/g, "").trim()}`}
                value={tripP.progress}
                color="#6366f1"
              />
            )}
          </div>
        </div>
      )}

      {/* Suggested actions */}
      <div className="mt-auto">
        <p className="mb-1.5 section-title">Ask your coach</p>
        <div className="grid grid-cols-1 gap-2">
          {ACTIONS.map((a) => (
            <Link
              key={a.label}
              href={`/assistant?q=${encodeURIComponent(a.q)}`}
              className="rounded-2xl border border-hairline bg-white px-3 py-2.5 text-[13px] font-medium text-ink transition hover:border-brand-300 hover:bg-brand-50/50 active:scale-[0.98]"
            >
              {a.label}
            </Link>
          ))}
        </div>
        <Link href="/assistant" className="btn-primary mt-2 w-full text-[14px]">
          Open full chat 🤖
        </Link>
      </div>
    </div>
  );
}

function MiniProgress({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="mb-1 flex justify-between text-[12px]">
        <span className="text-ink">{label}</span>
        <span className="font-semibold" style={{ color }}>
          {pct(v)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-grouped">
        <div className="h-full rounded-full bar-fill" style={{ width: `${v}%`, background: color }} />
      </div>
    </div>
  );
}
