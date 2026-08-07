"use client";

import Link from "next/link";
import {
  Wallet,
  Receipt,
  Coins,
  Percent,
  CreditCard,
  Plane,
  ArrowRight,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  currentMonthKey,
  financialHealth,
  monthLabel,
  monthlySeries,
  remainingCash,
  savingsRate,
  totalDebt,
  totalExpenses,
  totalIncome,
  travelProjection,
} from "@/lib/finance";
import { peso, pct } from "@/lib/currency";
import { CATEGORY_META } from "@/lib/types";
import { StatCard, ProgressBar, SectionCard, EmptyState } from "@/components/ui";
import { IncomeExpenseChart } from "@/components/charts";
import { QuickAdd } from "@/components/QuickAdd";
import { HealthRing } from "@/components/HealthRing";

export default function DashboardPage() {
  const { data, ready } = useStore();
  const key = currentMonthKey();

  if (!ready) return <DashboardSkeleton />;

  const income = totalIncome(data.incomes, key);
  const expenses = totalExpenses(data.expenses, key);
  const remaining = remainingCash(data, key);
  const rate = savingsRate(data, key);
  const debt = totalDebt(data.debts);
  const health = financialHealth(data);
  const series = monthlySeries(data, 6);

  const recent = [...data.expenses]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);

  const primaryTravel = data.travel[0];
  const travel = primaryTravel ? travelProjection(primaryTravel) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Kumusta, Cris! 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s your family money for {monthLabel(key)}.
          </p>
        </div>
        <Link href="/assistant" className="btn-primary">
          Ask the AI Assistant <ArrowRight size={16} />
        </Link>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Monthly Income"
          value={peso(income)}
          tone="positive"
          icon={<Wallet size={18} />}
        />
        <StatCard
          label="Monthly Expenses"
          value={peso(expenses)}
          tone="negative"
          icon={<Receipt size={18} />}
        />
        <StatCard
          label="Remaining Cash"
          value={peso(remaining)}
          tone={remaining >= 0 ? "brand" : "negative"}
          icon={<Coins size={18} />}
        />
        <StatCard
          label="Savings Rate"
          value={pct(rate)}
          hint={rate >= 20 ? "Great job! 🎉" : "Aim for 20%+"}
          icon={<Percent size={18} />}
        />
        <StatCard
          label="Total Debt"
          value={peso(debt)}
          tone="negative"
          icon={<CreditCard size={18} />}
        />
        <StatCard
          label="Travel Fund"
          value={travel ? pct(travel.progress) : "—"}
          hint={primaryTravel?.destination}
          icon={<Plane size={18} />}
        />
      </div>

      {/* Health + Income vs Expenses */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900">Financial Health</h2>
          <div className="mt-3 flex flex-col items-center">
            <HealthRing score={health.score} />
            <p className="mt-2 text-sm font-medium text-slate-700">
              {health.grade}
            </p>
          </div>
          <div className="mt-4 space-y-2">
            {health.breakdown.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{b.label}</span>
                  <span className="font-medium text-slate-700">
                    {b.points}/{b.max}
                  </span>
                </div>
                <ProgressBar value={(b.points / b.max) * 100} height={5} />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-2 font-semibold text-slate-900">
            Income vs Expenses
          </h2>
          <IncomeExpenseChart data={series} />
        </div>
      </div>

      {/* Quick add + Travel */}
      <div className="grid gap-6 lg:grid-cols-2">
        <QuickAdd />
        {primaryTravel && travel && (
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">
                {primaryTravel.destination}
              </h2>
              <span className="text-xs text-slate-400">Travel Fund</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {peso(primaryTravel.current)}
                </div>
                <div className="text-xs text-slate-400">
                  of {peso(primaryTravel.target)} goal
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-brand-600">
                  {pct(travel.progress)}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <ProgressBar value={travel.progress} color="#0ea5e9" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs text-slate-400">Still needed</div>
                <div className="font-semibold text-slate-800">
                  {peso(travel.stillNeeded)}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs text-slate-400">Save / month</div>
                <div className="font-semibold text-slate-800">
                  {travel.recommendedMonthly
                    ? peso(travel.recommendedMonthly)
                    : "—"}
                </div>
              </div>
            </div>
            <Link
              href="/travel"
              className="btn-ghost mt-3 w-full justify-center text-brand-600"
            >
              Manage travel funds <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>

      {/* Recent transactions */}
      <SectionCard
        title="Recent Transactions"
        action={
          <Link href="/expenses" className="btn-ghost text-brand-600">
            View all <ArrowRight size={15} />
          </Link>
        }
      >
        {recent.length === 0 ? (
          <EmptyState text="No transactions yet. Use Quick Add above to log your first one." />
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
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
                <div className="font-semibold text-rose-600">
                  −{peso(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded bg-slate-200" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-slate-100" />
    </div>
  );
}
