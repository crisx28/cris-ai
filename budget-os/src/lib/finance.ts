// All the financial calculations live here, separate from the UI, so the
// dashboard, reports, analytics and AI assistant all share one source of truth.

import {
  BudgetData,
  Debt,
  Expense,
  ExpenseCategory,
  Income,
  SavingsGoal,
  TravelFund,
} from "./types";

export function monthKey(dateISO: string): string {
  return dateISO.slice(0, 7); // yyyy-mm
}

export function currentMonthKey(ref = new Date()): string {
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-PH", {
    month: "short",
    year: "numeric",
  });
}

export function inMonth<T extends { date: string }>(items: T[], key: string): T[] {
  return items.filter((i) => monthKey(i.date) === key);
}

export function sum(items: { amount: number }[]): number {
  return items.reduce((t, i) => t + (i.amount || 0), 0);
}

export function totalIncome(incomes: Income[], key: string): number {
  return sum(inMonth(incomes, key));
}

export function totalExpenses(expenses: Expense[], key: string): number {
  return sum(inMonth(expenses, key));
}

export function remainingCash(data: BudgetData, key: string): number {
  return totalIncome(data.incomes, key) - totalExpenses(data.expenses, key);
}

export function savingsRate(data: BudgetData, key: string): number {
  const income = totalIncome(data.incomes, key);
  if (income <= 0) return 0;
  const saved = income - totalExpenses(data.expenses, key);
  return (saved / income) * 100;
}

export function totalDebt(debts: Debt[]): number {
  return sum(debts.map((d) => ({ amount: d.balance })));
}

export function categoryBreakdown(
  expenses: Expense[],
  key: string
): { category: ExpenseCategory; amount: number }[] {
  const map = new Map<ExpenseCategory, number>();
  for (const e of inMonth(expenses, key)) {
    map.set(e.category, (map.get(e.category) || 0) + e.amount);
  }
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

// Average of the last `n` months (excluding the current partial month) —
// used for forecasting.
export function trailingMonths(ref = new Date(), n = 6): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    keys.push(currentMonthKey(d));
  }
  return keys;
}

export interface MonthlyPoint {
  key: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
}

export function monthlySeries(data: BudgetData, n = 6): MonthlyPoint[] {
  return trailingMonths(new Date(), n).map((key) => {
    const income = totalIncome(data.incomes, key);
    const expenses = totalExpenses(data.expenses, key);
    return { key, label: monthLabel(key), income, expenses, net: income - expenses };
  });
}

// ---- Financial Health Score (0-100) -------------------------------------
// A friendly, explainable score built from four pillars.
export interface HealthScore {
  score: number;
  grade: string;
  breakdown: { label: string; points: number; max: number; note: string }[];
}

export function financialHealth(data: BudgetData): HealthScore {
  const key = currentMonthKey();
  const income = totalIncome(data.incomes, key);
  const rate = savingsRate(data, key);

  // 1. Savings rate — up to 35 pts (20% savings = full marks).
  const savingsPts = Math.max(0, Math.min(35, (rate / 20) * 35));

  // 2. Emergency fund coverage — up to 30 pts (3 months of expenses = full).
  const avgExpenses =
    monthlySeries(data, 3).reduce((t, p) => t + p.expenses, 0) / 3 || 1;
  const emergency = data.goals.find((g) =>
    g.name.toLowerCase().includes("emergency")
  );
  const monthsCovered = (emergency?.current ?? 0) / avgExpenses;
  const emergencyPts = Math.max(0, Math.min(30, (monthsCovered / 3) * 30));

  // 3. Debt load — up to 20 pts (debt payments < 20% of income = full).
  const debtPayments = sum(data.debts.map((d) => ({ amount: d.monthlyPayment })));
  const debtRatio = income > 0 ? debtPayments / income : 1;
  const debtPts = Math.max(0, Math.min(20, (1 - debtRatio / 0.4) * 20));

  // 4. Goal momentum — up to 15 pts (average goal progress).
  const goalProgress =
    data.goals.length > 0
      ? data.goals.reduce(
          (t, g) => t + Math.min(1, g.current / (g.target || 1)),
          0
        ) / data.goals.length
      : 0;
  const goalPts = goalProgress * 15;

  const score = Math.round(savingsPts + emergencyPts + debtPts + goalPts);
  const grade =
    score >= 85
      ? "Excellent"
      : score >= 70
      ? "Healthy"
      : score >= 55
      ? "Getting there"
      : score >= 40
      ? "Needs work"
      : "At risk";

  return {
    score,
    grade,
    breakdown: [
      {
        label: "Savings rate",
        points: Math.round(savingsPts),
        max: 35,
        note: `${Math.round(rate)}% saved this month`,
      },
      {
        label: "Emergency fund",
        points: Math.round(emergencyPts),
        max: 30,
        note: `${monthsCovered.toFixed(1)} months covered`,
      },
      {
        label: "Debt load",
        points: Math.round(debtPts),
        max: 20,
        note: `${Math.round(debtRatio * 100)}% of income to debt`,
      },
      {
        label: "Goal momentum",
        points: Math.round(goalPts),
        max: 15,
        note: `${Math.round(goalProgress * 100)}% avg. goal progress`,
      },
    ],
  };
}

// ---- Debt strategies -----------------------------------------------------
// Snowball = smallest balance first (motivation).
// Avalanche = highest interest first (cheapest).
export function snowballOrder(debts: Debt[]): Debt[] {
  return [...debts].sort((a, b) => a.balance - b.balance);
}

export function avalancheOrder(debts: Debt[]): Debt[] {
  return [...debts].sort((a, b) => b.interestRate - a.interestRate);
}

// Simulate paying debts off in the given order, rolling freed-up payments
// into the next debt (the core of both snowball & avalanche).
export interface PayoffResult {
  months: number;
  totalInterest: number;
  debtFreeDate: string;
  perDebt: { name: string; monthsToClear: number }[];
}

export function simulatePayoff(order: Debt[]): PayoffResult {
  const debts = order.map((d) => ({ ...d }));
  const basePayment = debts.reduce((t, d) => t + d.monthlyPayment, 0);
  let months = 0;
  let totalInterest = 0;
  const perDebt: { name: string; monthsToClear: number }[] = [];
  const cleared = new Set<string>();

  // Safety cap to avoid infinite loops on impossible payment plans.
  const CAP = 600;

  while (debts.some((d) => d.balance > 0) && months < CAP) {
    months++;
    let pool = basePayment;

    // Accrue interest first.
    for (const d of debts) {
      if (d.balance > 0) {
        const monthlyInterest = d.balance * (d.interestRate / 100);
        d.balance += monthlyInterest;
        totalInterest += monthlyInterest;
      }
    }

    // Pay in priority order, cascading leftover payment down the line.
    for (const d of debts) {
      if (d.balance <= 0 || pool <= 0) continue;
      const pay = Math.min(pool, d.balance);
      d.balance -= pay;
      pool -= pay;
      if (d.balance <= 0.5 && !cleared.has(d.id)) {
        d.balance = 0;
        cleared.add(d.id);
        perDebt.push({ name: d.name, monthsToClear: months });
      }
    }
  }

  const dateFree = new Date();
  dateFree.setMonth(dateFree.getMonth() + months);

  return {
    months,
    totalInterest: Math.round(totalInterest),
    debtFreeDate: dateFree.toLocaleDateString("en-PH", {
      month: "long",
      year: "numeric",
    }),
    perDebt,
  };
}

// ---- Goal & travel projections ------------------------------------------
export function monthsBetween(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth())
  );
}

export interface GoalProjection {
  progress: number; // 0-100
  remaining: number;
  monthsToDeadline: number | null;
  requiredMonthly: number | null;
  onTrack: boolean | null;
}

// Estimate the household's typical monthly surplus (what can go to goals).
export function typicalMonthlySurplus(data: BudgetData): number {
  const series = monthlySeries(data, 3);
  const avg = series.reduce((t, p) => t + p.net, 0) / (series.length || 1);
  return Math.max(0, Math.round(avg));
}

export function goalProjection(goal: SavingsGoal): GoalProjection {
  const remaining = Math.max(0, goal.target - goal.current);
  const progress = Math.min(100, (goal.current / (goal.target || 1)) * 100);
  let monthsToDeadline: number | null = null;
  let requiredMonthly: number | null = null;
  if (goal.deadline) {
    monthsToDeadline = Math.max(
      0,
      monthsBetween(new Date(), new Date(goal.deadline))
    );
    requiredMonthly =
      monthsToDeadline > 0 ? Math.ceil(remaining / monthsToDeadline) : remaining;
  }
  return {
    progress,
    remaining,
    monthsToDeadline,
    requiredMonthly,
    onTrack: null,
  };
}

export interface TravelProjection {
  progress: number;
  stillNeeded: number;
  monthsLeft: number | null;
  recommendedMonthly: number | null;
}

export function travelProjection(fund: TravelFund): TravelProjection {
  const stillNeeded = Math.max(0, fund.target - fund.current);
  const progress = Math.min(100, (fund.current / (fund.target || 1)) * 100);
  let monthsLeft: number | null = null;
  let recommendedMonthly: number | null = null;
  if (fund.travelDate) {
    monthsLeft = Math.max(0, monthsBetween(new Date(), new Date(fund.travelDate)));
    recommendedMonthly =
      monthsLeft > 0 ? Math.ceil(stillNeeded / monthsLeft) : stillNeeded;
  }
  return { progress, stillNeeded, monthsLeft, recommendedMonthly };
}
