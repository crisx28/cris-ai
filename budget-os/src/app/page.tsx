"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import {
  currentMonthKey,
  financialHealth,
  goalProjection,
  remainingCash,
  totalDebt,
  totalExpenses,
  totalIncome,
  travelProjection,
} from "@/lib/finance";
import {
  coachMessage,
  generateInsights,
  greeting,
  healthStatus,
} from "@/lib/insights";
import { peso, pct } from "@/lib/currency";
import { CATEGORY_META, goalEmoji } from "@/lib/types";
import { ProgressBar } from "@/components/ui";

export default function HomePage() {
  const { data, ready } = useStore();
  const { name, signOut } = useAuth();
  if (!ready) return <HomeSkeleton />;

  const displayName = name || "Cris";

  const key = currentMonthKey();
  const income = totalIncome(data.incomes, key);
  const expenses = totalExpenses(data.expenses, key);
  const available = remainingCash(data, key);
  const debt = totalDebt(data.debts);
  const health = financialHealth(data);
  const status = healthStatus(health.score);
  const g = greeting();
  const insights = generateInsights(data);

  const emergency = data.goals.find((x) =>
    x.name.toLowerCase().includes("emergency")
  );
  const emergencyP = emergency ? goalProjection(emergency) : null;
  const trip = data.travel[0];
  const tripP = trip ? travelProjection(trip) : null;

  const today = new Date().getDate();
  const upcoming = data.fixedExpenses
    .filter((f) => f.active && f.dueDay >= today)
    .sort((a, b) => a.dueDay - b.dueDay)
    .slice(0, 3);

  const recent = [...data.expenses]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="stagger space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between px-1">
        <div>
          <p className="text-[15px] text-subtle">
            {g.emoji} {g.text}
          </p>
          <h1 className="text-[26px] font-bold tracking-tight text-ink">
            Kumusta, {displayName} 👋
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => {
              if (confirm("Sign out?")) signOut();
            }}
            aria-label="Profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-[15px] font-bold text-white shadow-sm transition active:scale-90"
          >
            {displayName.charAt(0).toUpperCase()}
          </button>
          <span
            className="chip font-semibold"
            style={{ background: status.bg, color: status.color }}
          >
            {status.emoji} {status.label}
          </span>
        </div>
      </div>

      {/* Available Cash hero */}
      <Link href="/expenses" className="block">
        <div className="card-pressable overflow-hidden">
          <div className="bg-gradient-to-br from-brand-500 to-brand-600 p-6 text-white">
            <p className="text-[14px] font-medium text-white/80">
              💰 Available Cash · this month
            </p>
            <p className="mt-1 text-[38px] font-bold tracking-tight">
              {peso(available)}
            </p>
            <div className="mt-4 flex gap-6">
              <div>
                <p className="text-[12px] text-white/70">💵 Income</p>
                <p className="text-[16px] font-semibold">{peso(income)}</p>
              </div>
              <div>
                <p className="text-[12px] text-white/70">💸 Expenses</p>
                <p className="text-[16px] font-semibold">{peso(expenses)}</p>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Emergency + Travel */}
      <div className="grid grid-cols-2 gap-4">
        <MiniGoalCard
          href="/savings"
          emoji="🛡️"
          title="Emergency Fund"
          current={emergency?.current ?? 0}
          target={emergency?.target ?? 0}
          progress={emergencyP?.progress ?? 0}
          color="#34c759"
        />
        <MiniGoalCard
          href="/travel"
          emoji="✈️"
          title={trip ? trip.destination.replace(/[🇨🇳🏝️]/g, "").trim() : "Travel Fund"}
          current={trip?.current ?? 0}
          target={trip?.target ?? 0}
          progress={tripP?.progress ?? 0}
          color="#0a84ff"
        />
      </div>

      {/* Debt progress */}
      <Link href="/debts" className="block">
        <div className="card-pressable p-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              📉 Debt Balance
            </span>
            <span className="text-[13px] font-medium text-ios-blue">Manage ›</span>
          </div>
          <p className="mt-2 text-[26px] font-bold tracking-tight text-ink">
            {peso(debt)}
          </p>
          <p className="mt-0.5 text-[13px] text-subtle">
            {data.debts.length} active debt{data.debts.length === 1 ? "" : "s"} ·
            paying {peso(data.debts.reduce((t, d) => t + d.monthlyPayment, 0))}/mo
          </p>
        </div>
      </Link>

      {/* AI Coach */}
      <Link href="/assistant" className="block">
        <div className="card-pressable p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-2xl">
              🤖
            </span>
            <div>
              <p className="text-[16px] font-bold text-ink">Financial Coach</p>
              <p className="text-[12px] text-subtle">Tap to chat about your money</p>
            </div>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-ink">
            {coachMessage(data)}
          </p>
        </div>
      </Link>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <p className="section-title">🎉 Financial Wins & Insights</p>
          <div className="card divide-y divide-hairline">
            {insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-3 p-4">
                <span className="text-xl">{ins.emoji}</span>
                <p className="text-[15px] leading-snug text-ink">{ins.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming bills */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="section-title">⚡ Upcoming Bills</p>
          <div className="card divide-y divide-hairline">
            {upcoming.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-4">
                <span className="flex items-center gap-3">
                  <span className="text-xl">{CATEGORY_META[f.category].emoji}</span>
                  <span>
                    <span className="block text-[15px] font-medium text-ink">
                      {f.name}
                    </span>
                    <span className="text-[12px] text-subtle">Due day {f.dueDay}</span>
                  </span>
                </span>
                <span className="text-[15px] font-semibold text-ink">
                  {peso(f.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="section-title">📊 Recent Activity</p>
          <Link href="/expenses" className="text-[13px] font-semibold text-ios-blue">
            See all
          </Link>
        </div>
        <div className="card divide-y divide-hairline">
          {recent.length === 0 ? (
            <p className="p-6 text-center text-[15px] text-subtle">
              Nothing yet — tap ➕ to add your first expense.
            </p>
          ) : (
            recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4">
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-grouped text-xl">
                    {CATEGORY_META[t.category].emoji}
                  </span>
                  <span>
                    <span className="block text-[15px] font-medium text-ink">
                      {t.description}
                    </span>
                    <span className="text-[12px] text-subtle">
                      {t.category} ·{" "}
                      {new Date(t.date).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </span>
                </span>
                <span className="text-[15px] font-semibold text-ios-red">
                  −{peso(t.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MiniGoalCard({
  href,
  emoji,
  title,
  current,
  target,
  progress,
  color,
}: {
  href: string;
  emoji: string;
  title: string;
  current: number;
  target: number;
  progress: number;
  color: string;
}) {
  return (
    <Link href={href} className="block">
      <div className="card-pressable h-full p-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <span className="text-[13px] font-semibold text-subtle">{title}</span>
        </div>
        <p className="mt-2 text-[20px] font-bold tracking-tight text-ink">
          {peso(current)}
        </p>
        <p className="text-[12px] text-subtle">of {peso(target)}</p>
        <div className="mt-3">
          <ProgressBar value={progress} color={color} height={8} />
        </div>
        <p className="mt-1 text-right text-[12px] font-semibold" style={{ color }}>
          {pct(progress)}
        </p>
      </div>
    </Link>
  );
}

function HomeSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-40 rounded-full bg-hairline" />
      <div className="h-40 rounded-4xl bg-white/70" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-36 rounded-4xl bg-white/70" />
        <div className="h-36 rounded-4xl bg-white/70" />
      </div>
      <div className="h-28 rounded-4xl bg-white/70" />
    </div>
  );
}
