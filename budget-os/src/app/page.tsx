"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import {
  avalancheOrder,
  currentMonthKey,
  dailySafeSpend,
  financialHealth,
  goalProjection,
  monthLabel,
  remainingCash,
  simulatePayoff,
  spendingComparison,
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
import { peso } from "@/lib/currency";
import { CATEGORY_META, goalEmoji } from "@/lib/types";
import { CoachHeroCard } from "@/components/CoachHeroCard";
import { GoalProgressCard } from "@/components/GoalProgressCard";
import { OnboardingCard } from "@/components/OnboardingCard";

export default function HomePage() {
  const { data, ready } = useStore();
  const { name, signOut } = useAuth();
  const [showWhy, setShowWhy] = useState(false);
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
  const safe = dailySafeSpend(data);
  const comparison = spendingComparison(data);

  const emergency = data.goals.find((x) =>
    x.name.toLowerCase().includes("emergency")
  );
  const emergencyP = emergency ? goalProjection(emergency) : null;
  const trip = data.travel[0];
  const tripP = trip ? travelProjection(trip) : null;

  const recommendedDebt = avalancheOrder(data.debts)[0];
  const payoff = data.debts.length ? simulatePayoff(avalancheOrder(data.debts)) : null;

  const recent = [...data.expenses]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="stagger space-y-4">
      {/* Phase 1: Onboarding */}
      <OnboardingCard />

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
            onClick={() => confirm("Sign out?") && signOut()}
            aria-label="Profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-[15px] font-bold text-white shadow-sm transition active:scale-90"
          >
            {displayName.charAt(0).toUpperCase()}
          </button>
          {/* Phase 4: tappable status */}
          <button
            onClick={() => setShowWhy((s) => !s)}
            className="chip font-semibold transition active:scale-95"
            style={{ background: status.bg, color: status.color }}
          >
            {status.emoji} {status.label}
            <ChevronDown
              size={14}
              className={`transition ${showWhy ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Phase 4: Why? detail */}
      {showWhy && (
        <div className="animate-pop-in card p-5">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-subtle">
            Why {status.emoji} {status.label}?
          </p>
          {comparison.increases.length > 0 ? (
            <>
              <ul className="mt-3 space-y-2">
                {comparison.increases.map((i) => (
                  <li
                    key={i.category}
                    className="flex items-center justify-between text-[14px]"
                  >
                    <span className="flex items-center gap-2 text-ink">
                      <span>{CATEGORY_META[i.category].emoji}</span>
                      {i.category} spending is {Math.round(i.pctChange)}% higher
                    </span>
                    <span className="font-semibold text-ios-red">
                      +{peso(i.delta)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[14px] text-ink">
                You&apos;re spending{" "}
                <b>{peso(Math.abs(comparison.totalDelta))}</b>{" "}
                {comparison.totalDelta >= 0 ? "more" : "less"} than last month.
              </p>
              {comparison.recommendation && (
                <p className="mt-3 rounded-2xl bg-brand-50 px-4 py-3 text-[14px] font-medium text-brand-700">
                  💡 {comparison.recommendation}
                </p>
              )}
            </>
          ) : (
            <p className="mt-3 text-[14px] text-ink">
              Your spending is steady vs last month. Keep saving and paying down
              debt to push your score higher. 💪
            </p>
          )}
          <Link
            href="/assistant"
            className="btn-ghost mt-3 w-full justify-center bg-grouped"
          >
            Ask the Coach why 🤖
          </Link>
        </div>
      )}

      {/* Phase 3: Available Cash + Daily Safe Spend */}
      <div className="card-pressable overflow-hidden">
        <Link href="/expenses" className="block">
          <div className="bg-gradient-to-br from-brand-500 to-brand-600 p-6 text-white">
            <p className="text-[14px] font-medium text-white/80">
              💰 Available Cash · {monthLabel(key)}
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
        </Link>
        {/* Daily safe spend strip */}
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-[12px] text-subtle">💡 Daily Safe Spend</p>
            <p className="text-[22px] font-bold tracking-tight text-brand-600">
              {peso(safe.perDay)}
              <span className="text-[13px] font-medium text-subtle">/day</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-subtle">📅 Until payday</p>
            <p className="text-[15px] font-semibold text-ink">
              {safe.days} day{safe.days === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      {/* Phase 5: Emergency Fund */}
      {emergency && emergencyP && (
        <GoalProgressCard
          href="/savings"
          emoji="🛡️"
          title="Emergency Fund"
          current={emergency.current}
          target={emergency.target}
          color="#34c759"
          stats={[
            {
              label: "Need / month",
              value: emergencyP.requiredMonthly
                ? peso(emergencyP.requiredMonthly)
                : "—",
            },
            {
              label: "Target date",
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

      {/* Phase 5: Travel Goal */}
      {trip && tripP && (
        <GoalProgressCard
          href="/travel"
          emoji={goalEmoji(trip.destination)}
          title={trip.destination.replace(/[🇨🇳🏝️]/g, "").trim()}
          current={trip.current}
          target={trip.target}
          color="#0a84ff"
          stats={[
            { label: "Still needed", value: peso(tripP.stillNeeded) },
            {
              label: "Suggested / month",
              value: tripP.recommendedMonthly
                ? peso(tripP.recommendedMonthly)
                : "—",
            },
          ]}
        />
      )}

      {/* Phase 6: Debt + AI recommendation */}
      <div className="card p-5">
        <Link href="/debts" className="block">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              📉 Debt Balance
            </span>
            <span className="text-[13px] font-medium text-ios-blue">Manage ›</span>
          </div>
          <p className="mt-2 text-[26px] font-bold tracking-tight text-ink">
            {peso(debt)}
          </p>
        </Link>
        {recommendedDebt && payoff && (
          <div className="mt-3 rounded-2xl bg-orange-50 p-4">
            <p className="text-[13px] font-semibold text-ios-orange">
              🔥 Recommended next debt
            </p>
            <p className="mt-0.5 text-[17px] font-bold text-ink">
              {recommendedDebt.name}
            </p>
            <p className="mt-0.5 text-[13px] text-subtle">
              Potential debt-free date: <b>{payoff.debtFreeDate}</b>
            </p>
            <Link
              href="/debts"
              className="btn-primary mt-3 w-full bg-ios-orange hover:opacity-90"
            >
              View Plan
            </Link>
          </div>
        )}
      </div>

      {/* Phase 2: AI Coach hero */}
      <CoachHeroCard message={coachMessage(data)} />

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

      {/* Recent activity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="section-title">📊 Recent Activity</p>
          <Link href="/expenses" className="text-[13px] font-semibold text-ios-blue">
            See all
          </Link>
        </div>
        <div className="card">
          {recent.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="text-3xl">💡</div>
              <p className="mt-2 text-[15px] font-semibold text-ink">
                No expenses yet
              </p>
              <p className="mt-1 text-[13px] text-subtle">
                Try adding “Grocery 500” — we&apos;ll categorize it automatically.
              </p>
              <Link href="/add" className="btn-primary mt-4">
                Add your first expense
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-hairline">
              {recent.map((t) => (
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-40 rounded-full bg-hairline" />
      <div className="h-44 rounded-4xl bg-white/70" />
      <div className="h-32 rounded-4xl bg-white/70" />
      <div className="h-32 rounded-4xl bg-white/70" />
      <div className="h-40 rounded-4xl bg-white/70" />
    </div>
  );
}
