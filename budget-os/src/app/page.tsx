"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import {
  currentMonthKey,
  dailySafeSpend,
  financialHealth,
  goalProjection,
  monthLabel,
  monthlySeries,
  remainingCash,
  spendingComparison,
  totalDebt,
  totalExpenses,
  totalIncome,
  travelProjection,
} from "@/lib/finance";
import { coachMessage, generateInsights, greeting, healthStatus } from "@/lib/insights";
import { peso, pct } from "@/lib/currency";
import { CATEGORY_META, goalEmoji } from "@/lib/types";
import { StatCard, ProgressBar } from "@/components/ui";
import { GoalProgressCard } from "@/components/GoalProgressCard";
import { CoachHeroCard } from "@/components/CoachHeroCard";
import { OnboardingHero } from "@/components/OnboardingHero";
import { QuickStart } from "@/components/QuickStart";
import { HealthRing } from "@/components/HealthRing";
import { IncomeExpenseChart } from "@/components/charts";

export default function DashboardPage() {
  const { data, ready, demoMode, enterDemo } = useStore();
  const { name } = useAuth();
  const [showWhy, setShowWhy] = useState(false);
  if (!ready) return <Skeleton />;

  const displayName = name || "Cris";
  const key = currentMonthKey();
  const income = totalIncome(data.incomes, key);
  const expenses = totalExpenses(data.expenses, key);
  const available = remainingCash(data, key);
  const debt = totalDebt(data.debts);
  const health = financialHealth(data);
  const status = healthStatus(health.score);
  const g = greeting();
  const safe = dailySafeSpend(data);
  const comparison = spendingComparison(data);
  const insights = generateInsights(data);
  const series = monthlySeries(data, 6);

  const emergency = data.goals.find((x) => x.name.toLowerCase().includes("emergency"));
  const emergencyP = emergency ? goalProjection(emergency) : null;
  const trip = data.travel[0];
  const tripP = trip ? travelProjection(trip) : null;

  const today = new Date().getDate();
  const upcoming = data.fixedExpenses
    .filter((f) => f.active && f.dueDay >= today)
    .sort((a, b) => a.dueDay - b.dueDay)
    .slice(0, 4);

  const recent = [...data.expenses].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);

  return (
    <div className="stagger space-y-5">
      <OnboardingHero />

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[14px] text-subtle">
            {g.emoji} {g.text}
          </p>
          <h1 className="text-[28px] font-bold tracking-tight text-ink">
            Kumusta, {displayName}
          </h1>
        </div>
        <button
          onClick={() => setShowWhy((s) => !s)}
          className="chip font-semibold transition active:scale-95"
          style={{ background: status.bg, color: status.color }}
        >
          {status.emoji} {status.label}
          <ChevronDown size={14} className={`transition ${showWhy ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Quick Start + demo */}
      <QuickStart />
      <div className="flex flex-wrap gap-2">
        <Link
          href="/assistant"
          className="rounded-full border border-hairline bg-white px-4 py-2 text-[13px] font-semibold text-ink transition hover:border-brand-300 active:scale-95"
        >
          🤖 Show Me Around
        </Link>
        {!demoMode && (
          <button
            onClick={enterDemo}
            className="rounded-full border border-hairline bg-white px-4 py-2 text-[13px] font-semibold text-ink transition hover:border-brand-300 active:scale-95"
          >
            ✨ Explore Sample Data
          </button>
        )}
      </div>

      {showWhy && (
        <div className="animate-pop-in card p-5">
          <p className="section-title">Why {status.label}?</p>
          {comparison.increases.length > 0 ? (
            <>
              <ul className="mt-3 space-y-2">
                {comparison.increases.map((i) => (
                  <li key={i.category} className="flex items-center justify-between text-[14px]">
                    <span className="flex items-center gap-2 text-ink">
                      <span>{CATEGORY_META[i.category].emoji}</span>
                      {i.category} up {Math.round(i.pctChange)}%
                    </span>
                    <span className="font-semibold text-danger">+{peso(i.delta)}</span>
                  </li>
                ))}
              </ul>
              {comparison.recommendation && (
                <p className="mt-3 rounded-2xl bg-brand-50 px-4 py-3 text-[14px] font-medium text-brand-700">
                  💡 {comparison.recommendation}
                </p>
              )}
            </>
          ) : (
            <p className="mt-3 text-[14px] text-ink">
              Spending is steady vs last month. Keep saving and paying down debt to push your score
              higher. 💪
            </p>
          )}
        </div>
      )}

      {/* Top row — 4 key stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div data-tour="available-cash">
          <StatCard
            label="Available Cash"
            emoji="💰"
            value={peso(available)}
            tone={available >= 0 ? "positive" : "negative"}
          />
        </div>
        <StatCard label="Monthly Income" emoji="💵" value={peso(income)} />
        <StatCard label="Monthly Expenses" emoji="💸" value={peso(expenses)} />
        <div data-tour="debt">
          <StatCard label="Debt Balance" emoji="📉" value={peso(debt)} />
        </div>
      </div>

      {/* Daily Safe Spend — signature coaching stat */}
      <div className="flex items-center justify-between rounded-4xl border border-brand-100 bg-brand-50/60 p-5">
        <div>
          <p className="text-[13px] font-medium text-brand-700">💡 Daily Safe Spend</p>
          <p className="mt-0.5 text-[30px] font-bold tracking-tight text-brand-700">
            {peso(safe.perDay)}
            <span className="text-[14px] font-medium text-brand-600/70">/day</span>
          </p>
          <p className="text-[12px] text-brand-600/80">
            Based on your cash, upcoming bills & {safe.days} days to payday
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-[12px] text-subtle">📅 Until payday</p>
          <p className="text-[18px] font-bold text-ink">{safe.days} days</p>
        </div>
      </div>

      {/* Middle row — goals + health */}
      <div data-tour="goals" className="grid gap-4 lg:grid-cols-3">
        {emergency && emergencyP && (
          <GoalProgressCard
            href="/savings"
            emoji="🛡️"
            title="Emergency Fund"
            current={emergency.current}
            target={emergency.target}
            color="#22c55e"
            stats={[
              {
                label: "Need / month",
                value: emergencyP.requiredMonthly ? peso(emergencyP.requiredMonthly) : "—",
              },
              {
                label: "Target",
                value: emergency.deadline
                  ? new Date(emergency.deadline).toLocaleDateString("en-PH", {
                      month: "short",
                      year: "numeric",
                    })
                  : "Set a date",
              },
            ]}
          />
        )}
        {trip && tripP && (
          <GoalProgressCard
            href="/travel"
            emoji={goalEmoji(trip.destination)}
            title={trip.destination.replace(/[🇨🇳🏝️]/g, "").trim()}
            current={trip.current}
            target={trip.target}
            color="#6366f1"
            stats={[
              { label: "Still needed", value: peso(tripP.stillNeeded) },
              {
                label: "Suggested / mo",
                value: tripP.recommendedMonthly ? peso(tripP.recommendedMonthly) : "—",
              },
            ]}
          />
        )}

        {/* Financial Health */}
        <div className="card p-5">
          <p className="text-[15px] font-semibold text-ink">Financial Health</p>
          <div className="mt-2 flex flex-col items-center">
            <HealthRing score={health.score} />
            <p className="mt-2 text-[14px] font-semibold" style={{ color: status.color }}>
              {status.emoji} {health.grade}
            </p>
          </div>
          <div className="mt-4 space-y-2">
            {health.breakdown.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-[12px] text-subtle">
                  <span>{b.label}</span>
                  <span className="font-medium text-ink">
                    {b.points}/{b.max}
                  </span>
                </div>
                <ProgressBar value={(b.points / b.max) * 100} height={5} color="#6366f1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coach (mobile / tablet only — desktop has the right panel) */}
      <div data-tour="ai-coach" className="space-y-5 xl:hidden">
        <CoachHeroCard message={coachMessage(data)} />
        {insights.length > 0 && (
          <div className="space-y-2">
            <p className="section-title">🎉 Insights</p>
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
      </div>

      {/* Bottom row — activity, trends, bills */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[15px] font-semibold text-ink">📊 Recent Activity</p>
            <Link href="/expenses" className="text-[13px] font-semibold text-brand-600">
              See all
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-3xl bg-grouped px-6 py-8 text-center">
              <div className="text-3xl">🎥</div>
              <p className="mt-2 text-[15px] font-semibold text-ink">New here?</p>
              <p className="mt-1 text-[13px] text-subtle">
                Add your first expense to bring your dashboard to life.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link href="/add" className="btn-primary">
                  ➕ Add expense
                </Link>
                <Link
                  href="/add?receipt=1"
                  className="rounded-2xl bg-white px-4 py-3 text-[15px] font-semibold text-ink shadow-sm transition active:scale-[0.97]"
                >
                  📸 Upload a receipt
                </Link>
              </div>
              <Link
                href="/learn"
                className="mt-3 inline-block text-[13px] font-semibold text-brand-600"
              >
                🎥 Watch: How to add expenses
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-hairline">
              {recent.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-grouped text-xl">
                      {CATEGORY_META[t.category].emoji}
                    </span>
                    <span>
                      <span className="block text-[15px] font-medium text-ink">{t.description}</span>
                      <span className="text-[12px] text-subtle">
                        {t.category} ·{" "}
                        {new Date(t.date).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </span>
                  </span>
                  <span className="text-[15px] font-semibold text-ink">−{peso(t.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <p className="mb-2 text-[15px] font-semibold text-ink">📈 Spending Trends</p>
            <IncomeExpenseChart data={series} />
          </div>

          <div className="card p-5">
            <p className="mb-3 text-[15px] font-semibold text-ink">⚡ Upcoming Bills</p>
            {upcoming.length === 0 ? (
              <p className="rounded-2xl bg-grouped px-4 py-6 text-center text-[14px] text-subtle">
                No bills due for the rest of the month. 🎉
              </p>
            ) : (
              <div className="divide-y divide-hairline">
                {upcoming.map((f) => (
                  <div key={f.id} className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2.5">
                      <span className="text-lg">{CATEGORY_META[f.category].emoji}</span>
                      <span>
                        <span className="block text-[14px] font-medium text-ink">{f.name}</span>
                        <span className="text-[12px] text-subtle">Due day {f.dueDay}</span>
                      </span>
                    </span>
                    <span className="text-[14px] font-semibold text-ink">{peso(f.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-8 w-44 rounded-full bg-hairline" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-4xl bg-white/70" />
        ))}
      </div>
      <div className="h-28 rounded-4xl bg-white/70" />
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-52 rounded-4xl bg-white/70" />
        ))}
      </div>
    </div>
  );
}
