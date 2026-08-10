// Financial calendar engine: recurring-expense occurrences, calendar events,
// the monthly fixed-expense summary, payday planner and cash-flow forecast.

import { peso } from "./currency";
import {
  DEFAULT_PAYDAYS,
  currentMonthKey,
  inMonth,
  monthlySeries,
  remainingCash,
} from "./finance";
import {
  BudgetData,
  CATEGORY_META,
  FREQ_PER_YEAR,
  FinancialTask,
  FixedExpense,
  Frequency,
} from "./types";

const MS = 86400000;
const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

function anchorOf(fe: FixedExpense): Date {
  if (fe.anchorDate) return new Date(fe.anchorDate);
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), Math.min(fe.dueDay, daysInMonth(now.getFullYear(), now.getMonth())));
}

// All occurrences of a fixed expense within [from, to].
export function occurrencesInRange(fe: FixedExpense, from: Date, to: Date): Date[] {
  const res: Date[] = [];
  const freq: Frequency = fe.frequency ?? "monthly";
  const anchor = anchorOf(fe);

  if (freq === "monthly" || freq === "quarterly" || freq === "yearly") {
    const stepM = freq === "monthly" ? 1 : freq === "quarterly" ? 3 : 12;
    const cur = new Date(from.getFullYear(), from.getMonth(), 1);
    while (cur <= to) {
      const diff = (cur.getFullYear() - anchor.getFullYear()) * 12 + (cur.getMonth() - anchor.getMonth());
      if (((diff % stepM) + stepM) % stepM === 0) {
        const day = Math.min(anchor.getDate(), daysInMonth(cur.getFullYear(), cur.getMonth()));
        const occ = new Date(cur.getFullYear(), cur.getMonth(), day);
        if (occ >= from && occ <= to) res.push(occ);
      }
      cur.setMonth(cur.getMonth() + 1);
    }
  } else {
    const stepD = freq === "weekly" ? 7 : 14;
    let d = new Date(anchor);
    if (d < from) {
      const k = Math.ceil((from.getTime() - d.getTime()) / (stepD * MS));
      d = new Date(d.getTime() + k * stepD * MS);
    } else {
      while (d.getTime() - stepD * MS >= from.getTime()) d = new Date(d.getTime() - stepD * MS);
    }
    while (d <= to) {
      if (d >= from) res.push(new Date(d));
      d = new Date(d.getTime() + stepD * MS);
    }
  }
  return res;
}

export type EventKind = "salary" | "rent" | "utility" | "internet" | "mobile" | "bill" | "debt" | "goal" | "task";

export interface CalEvent {
  date: Date;
  kind: EventKind;
  emoji: string;
  title: string;
  amount?: number;
  direction: "in" | "out";
  task?: Omit<FinancialTask, "id" | "createdAt" | "status">;
}

function billEmoji(category: string): { emoji: string; kind: EventKind } {
  if (category === "Rent") return { emoji: "🏠", kind: "rent" };
  if (category === "Utilities") return { emoji: "⚡", kind: "utility" };
  if (category === "Internet") return { emoji: "🌐", kind: "internet" };
  if (category === "Mobile") return { emoji: "📱", kind: "mobile" };
  return { emoji: CATEGORY_META[category as keyof typeof CATEGORY_META]?.emoji ?? "💸", kind: "bill" };
}

// Typical salary amounts by day-of-month, from the most recent month recorded.
function salaryByDay(data: BudgetData): Map<number, number> {
  const map = new Map<number, number>();
  const months = monthlySeries(data, 3).map((m) => m.key).reverse();
  for (const key of months) {
    const sal = inMonth(data.incomes, key).filter((i) => i.source === "Salary");
    if (sal.length) {
      for (const s of sal) map.set(new Date(s.date).getDate(), s.amount);
      break;
    }
  }
  return map;
}

export function buildCalendarEvents(data: BudgetData, from: Date, to: Date): CalEvent[] {
  const events: CalEvent[] = [];

  // Salary (income)
  const salMap = salaryByDay(data);
  const paydays = salMap.size ? Array.from(salMap.keys()) : DEFAULT_PAYDAYS;
  const cur = new Date(from.getFullYear(), from.getMonth(), 1);
  while (cur <= to) {
    for (const day of paydays) {
      const d = new Date(cur.getFullYear(), cur.getMonth(), Math.min(day, daysInMonth(cur.getFullYear(), cur.getMonth())));
      if (d >= from && d <= to) {
        events.push({ date: d, kind: "salary", emoji: "💰", title: "Salary", amount: salMap.get(day), direction: "in" });
      }
    }
    cur.setMonth(cur.getMonth() + 1);
  }

  // Fixed expenses (recurring)
  for (const fe of data.fixedExpenses.filter((f) => f.active)) {
    const { emoji, kind } = billEmoji(fe.category);
    for (const d of occurrencesInRange(fe, from, to)) {
      events.push({
        date: d,
        kind,
        emoji,
        title: fe.name,
        amount: fe.amount,
        direction: "out",
        task: { title: `Pay ${fe.name} (${peso(fe.amount)})`, kind: "bill", amount: fe.amount, recurrence: "monthly", source: "ai", dueDate: d.toISOString().slice(0, 10) },
      });
    }
  }

  // Debt payments (monthly)
  for (const debt of data.debts) {
    const cur2 = new Date(from.getFullYear(), from.getMonth(), 1);
    while (cur2 <= to) {
      const d = new Date(cur2.getFullYear(), cur2.getMonth(), Math.min(debt.dueDay, daysInMonth(cur2.getFullYear(), cur2.getMonth())));
      if (d >= from && d <= to) {
        events.push({
          date: d,
          kind: "debt",
          emoji: "💳",
          title: `${debt.name} payment`,
          amount: debt.monthlyPayment,
          direction: "out",
          task: { title: `Pay ${debt.name} (${peso(debt.monthlyPayment)})`, kind: "debt", amount: debt.monthlyPayment, recurrence: "monthly", source: "ai", dueDate: d.toISOString().slice(0, 10) },
        });
      }
      cur2.setMonth(cur2.getMonth() + 1);
    }
  }

  // Tasks — dated one-offs + recurring goal contributions / reviews
  for (const t of data.tasks) {
    if (t.status === "done") continue;
    const emoji = t.kind === "travel" ? "✈️" : t.kind === "savings" ? "🎯" : t.kind === "review" ? "📊" : "🤖";
    if (t.dueDate) {
      const d = new Date(t.dueDate);
      if (d >= from && d <= to) events.push({ date: d, kind: t.kind === "savings" || t.kind === "travel" ? "goal" : "task", emoji, title: t.title, amount: t.amount, direction: "out" });
    } else if (t.recurrence !== "none") {
      // Show recurring contributions on paydays each month in range.
      const days = t.recurrence === "payday" ? paydays : [Math.min(25, 28)];
      const cur3 = new Date(from.getFullYear(), from.getMonth(), 1);
      while (cur3 <= to) {
        for (const day of days) {
          const d = new Date(cur3.getFullYear(), cur3.getMonth(), day);
          if (d >= from && d <= to) events.push({ date: d, kind: "goal", emoji, title: t.title, amount: t.amount, direction: "out" });
        }
        cur3.setMonth(cur3.getMonth() + 1);
      }
    }
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ---- Monthly fixed-expense summary (normalized to a monthly equivalent) ----
export interface FixedSummary {
  items: { name: string; category: string; monthly: number; frequency: Frequency }[];
  total: number;
  pctOfIncome: number;
}

export function monthlyEquivalent(amount: number, freq: Frequency): number {
  return Math.round((amount * FREQ_PER_YEAR[freq]) / 12);
}

export function monthlyFixedSummary(data: BudgetData): FixedSummary {
  const items = data.fixedExpenses
    .filter((f) => f.active)
    .map((f) => ({
      name: f.name,
      category: f.category,
      frequency: f.frequency ?? ("monthly" as Frequency),
      monthly: monthlyEquivalent(f.amount, f.frequency ?? "monthly"),
    }))
    .sort((a, b) => b.monthly - a.monthly);
  const total = items.reduce((t, i) => t + i.monthly, 0);
  const income = monthlySeries(data, 1)[0]?.income || 0;
  return { items, total, pctOfIncome: income > 0 ? (total / income) * 100 : 0 };
}

// ---- Payday planner ----
export interface PaydayPlan {
  date: Date;
  salary: number;
  fixed: number;
  debt: number;
  goals: number;
  remaining: number;
}

export function paydayPlanner(data: BudgetData, ref = new Date()): PaydayPlan[] {
  const from = startOf(ref);
  const to = new Date(ref.getFullYear(), ref.getMonth() + 2, 0);
  const events = buildCalendarEvents(data, from, to);
  const salaries = events.filter((e) => e.kind === "salary").slice(0, 2);

  return salaries.map((sal, idx) => {
    const nextSal = salaries[idx + 1]?.date ?? to;
    const between = events.filter((e) => e.direction === "out" && e.date >= sal.date && e.date < nextSal);
    const sum = (ks: EventKind[]) =>
      between.filter((e) => ks.includes(e.kind)).reduce((t, e) => t + (e.amount || 0), 0);
    const fixed = sum(["rent", "utility", "internet", "mobile", "bill"]);
    const debt = sum(["debt"]);
    const goals = sum(["goal"]);
    const salary = sal.amount || 0;
    return { date: sal.date, salary, fixed, debt, goals, remaining: salary - fixed - debt - goals };
  });
}

// ---- Cash-flow forecast ----
export interface Forecast {
  onTrack: boolean;
  lowBalance: number;
  lowDate: Date | null;
  message: string;
}

export function cashFlowForecast(data: BudgetData, ref = new Date(), threshold = 5000): Forecast {
  const from = startOf(ref);
  const to = new Date(from.getTime() + 60 * MS);
  const events = buildCalendarEvents(data, new Date(from.getTime() + MS), to); // future only
  let balance = remainingCash(data, currentMonthKey(ref));
  let low = balance;
  let lowDate: Date | null = null;

  const byDay = new Map<number, number>();
  for (const e of events) {
    const key = Math.round((startOf(e.date).getTime() - from.getTime()) / MS);
    const delta = (e.direction === "in" ? 1 : -1) * (e.amount || 0);
    byDay.set(key, (byDay.get(key) || 0) + delta);
  }
  for (let day = 1; day <= 60; day++) {
    balance += byDay.get(day) || 0;
    if (balance < low) {
      low = balance;
      lowDate = new Date(from.getTime() + day * MS);
    }
  }

  const onTrack = low >= threshold;
  const message = onTrack
    ? `You're on track this month. Your projected balance stays above ${peso(threshold)}.`
    : `⚠️ Projected balance drops to ${peso(Math.round(low))}${
        lowDate ? ` around ${lowDate.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}` : ""
      }. Consider moving a bill or trimming spending before then.`;

  return { onTrack, lowBalance: Math.round(low), lowDate, message };
}
