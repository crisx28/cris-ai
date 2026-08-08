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

// ---- Payday & Daily Safe Spend ------------------------------------------
// Working parents are usually paid on fixed days (default: 15th & end of
// month). These power the "how much can I safely spend today?" coaching.
export const DEFAULT_PAYDAYS = [15, 30];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function nextPayday(paydays = DEFAULT_PAYDAYS, ref = new Date()): Date {
  const today = ref.getDate();
  const dim = daysInMonth(ref.getFullYear(), ref.getMonth());
  const thisMonth = [...paydays]
    .map((d) => Math.min(d, dim))
    .sort((a, b) => a - b);
  for (const d of thisMonth) {
    if (d >= today)
      return new Date(ref.getFullYear(), ref.getMonth(), d);
  }
  // First payday of next month.
  const y = ref.getMonth() === 11 ? ref.getFullYear() + 1 : ref.getFullYear();
  const m = (ref.getMonth() + 1) % 12;
  const nextDim = daysInMonth(y, m);
  const first = Math.min([...paydays].sort((a, b) => a - b)[0], nextDim);
  return new Date(y, m, first);
}

export function daysUntilPayday(paydays = DEFAULT_PAYDAYS, ref = new Date()): number {
  const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const target = nextPayday(paydays, ref);
  return Math.max(0, Math.round((target.getTime() - start.getTime()) / 86400000));
}

export interface SafeSpend {
  perDay: number;
  days: number;
  upcomingBills: number;
  available: number;
  payday: string;
}

export function dailySafeSpend(data: BudgetData, ref = new Date()): SafeSpend {
  const key = currentMonthKey(ref);
  const available = remainingCash(data, key);
  const days = Math.max(1, daysUntilPayday(DEFAULT_PAYDAYS, ref));
  const today = ref.getDate();
  // Bills still due before the next paycheck arrives.
  const upcomingBills = data.fixedExpenses
    .filter((f) => f.active && f.dueDay >= today)
    .reduce((t, f) => t + f.amount, 0);
  const spendable = Math.max(0, available - upcomingBills);
  const perDay = Math.floor(spendable / days);
  return {
    perDay,
    days: daysUntilPayday(DEFAULT_PAYDAYS, ref),
    upcomingBills,
    available,
    payday: nextPayday(DEFAULT_PAYDAYS, ref).toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
    }),
  };
}

// ---- "Why am I overspending?" comparison --------------------------------
export interface SpendingComparison {
  totalThis: number;
  totalLast: number;
  totalDelta: number;
  increases: {
    category: ExpenseCategory;
    thisAmt: number;
    lastAmt: number;
    delta: number;
    pctChange: number;
  }[];
  recommendation: string | null;
}

const DISCRETIONARY: ExpenseCategory[] = [
  "Food",
  "Entertainment",
  "Grocery",
  "Miscellaneous",
];

export function spendingComparison(data: BudgetData): SpendingComparison {
  const series = trailingMonths(new Date(), 2);
  const lastKey = series[0];
  const thisKey = series[1];
  const thisB = categoryBreakdown(data.expenses, thisKey);
  const lastMap = new Map(
    categoryBreakdown(data.expenses, lastKey).map((b) => [b.category, b.amount])
  );
  const increases = thisB
    .map((b) => {
      const lastAmt = lastMap.get(b.category) || 0;
      return {
        category: b.category,
        thisAmt: b.amount,
        lastAmt,
        delta: b.amount - lastAmt,
        pctChange: lastAmt > 0 ? ((b.amount - lastAmt) / lastAmt) * 100 : 100,
      };
    })
    .filter((c) => c.delta > 50)
    .sort((a, b) => b.delta - a.delta);

  const totalThis = sum(inMonth(data.expenses, thisKey));
  const totalLast = sum(inMonth(data.expenses, lastKey));

  // Recommend trimming the biggest discretionary increase.
  const target = increases.find((c) => DISCRETIONARY.includes(c.category));
  let recommendation: string | null = null;
  if (target) {
    const trim = Math.min(
      target.delta,
      Math.max(500, Math.round(target.delta / 500) * 500)
    );
    recommendation = `Reduce ${target.category.toLowerCase()} expenses by about ₱${trim.toLocaleString(
      "en-PH"
    )} this month.`;
  }

  return {
    totalThis,
    totalLast,
    totalDelta: totalThis - totalLast,
    increases: increases.slice(0, 4),
    recommendation,
  };
}

// Estimate a completion date given how much is added each month.
export function estimatedGoalDate(
  remaining: number,
  monthlyContribution: number
): string | null {
  if (remaining <= 0) return "Complete 🎉";
  if (monthlyContribution <= 0) return null;
  const months = Math.ceil(remaining / monthlyContribution);
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
}

// ---- Payday cycle analysis ----------------------------------------------
// The most recent payday on or before `ref`.
export function lastPayday(paydays = DEFAULT_PAYDAYS, ref = new Date()): Date {
  const today = ref.getDate();
  const dim = daysInMonth(ref.getFullYear(), ref.getMonth());
  const thisMonth = [...paydays]
    .map((d) => Math.min(d, dim))
    .sort((a, b) => b - a);
  for (const d of thisMonth) {
    if (d <= today) return new Date(ref.getFullYear(), ref.getMonth(), d);
  }
  // Last payday of the previous month.
  const y = ref.getMonth() === 0 ? ref.getFullYear() - 1 : ref.getFullYear();
  const m = (ref.getMonth() + 11) % 12;
  const prevDim = daysInMonth(y, m);
  const last = Math.min(Math.max(...paydays), prevDim);
  return new Date(y, m, last);
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

function spentBetween(expenses: Expense[], from: Date, to: Date): number {
  const f = from.getTime();
  const t = to.getTime();
  return expenses.reduce((sum, e) => {
    const d = new Date(e.date).getTime();
    return d >= f && d < t ? sum + e.amount : sum;
  }, 0);
}

export interface PaydayCycle {
  cycleStart: Date;
  nextPayday: Date;
  daysSince: number;
  daysUntil: number;
  spentThisCycle: number;
  spentPrevCycle: number;
  cycleDeltaPct: number;
  burnRate: number; // avg spend per day this cycle
  projectedCycleSpend: number;
  remainingBeforePayday: number;
}

export function paydayCycleAnalysis(
  data: BudgetData,
  ref = new Date()
): PaydayCycle {
  const cycleStart = lastPayday(DEFAULT_PAYDAYS, ref);
  const next = nextPayday(DEFAULT_PAYDAYS, ref);
  const daysSince = Math.max(1, daysBetween(cycleStart, ref));
  const daysUntil = daysUntilPayday(DEFAULT_PAYDAYS, ref);
  const cycleLen = Math.max(1, daysBetween(cycleStart, next));

  const spentThisCycle = spentBetween(
    data.expenses,
    cycleStart,
    new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 1)
  );
  const prevStart = lastPayday(
    DEFAULT_PAYDAYS,
    new Date(cycleStart.getTime() - 86400000)
  );
  const spentPrevCycle = spentBetween(data.expenses, prevStart, cycleStart);

  const burnRate = spentThisCycle / daysSince;
  const safe = dailySafeSpend(data, ref);

  return {
    cycleStart,
    nextPayday: next,
    daysSince,
    daysUntil,
    spentThisCycle,
    spentPrevCycle,
    cycleDeltaPct:
      spentPrevCycle > 0
        ? ((spentThisCycle - spentPrevCycle) / spentPrevCycle) * 100
        : 0,
    burnRate,
    projectedCycleSpend: Math.round(burnRate * cycleLen),
    remainingBeforePayday: Math.max(0, safe.available - safe.upcomingBills),
  };
}

// ---- Full category comparison (every category, this vs last) -------------
export interface CategoryDelta {
  category: ExpenseCategory;
  thisAmt: number;
  lastAmt: number;
  delta: number;
  pctChange: number;
}

export function categoryComparisonFull(data: BudgetData): CategoryDelta[] {
  const [lastKey, thisKey] = trailingMonths(new Date(), 2);
  const thisMap = new Map(
    categoryBreakdown(data.expenses, thisKey).map((b) => [b.category, b.amount])
  );
  const lastMap = new Map(
    categoryBreakdown(data.expenses, lastKey).map((b) => [b.category, b.amount])
  );
  const cats = new Set<ExpenseCategory>([
    ...Array.from(thisMap.keys()),
    ...Array.from(lastMap.keys()),
  ]);
  return Array.from(cats)
    .map((category) => {
      const thisAmt = thisMap.get(category) || 0;
      const lastAmt = lastMap.get(category) || 0;
      return {
        category,
        thisAmt,
        lastAmt,
        delta: thisAmt - lastAmt,
        pctChange: lastAmt > 0 ? ((thisAmt - lastAmt) / lastAmt) * 100 : thisAmt > 0 ? 100 : 0,
      };
    })
    .sort((a, b) => b.thisAmt - a.thisAmt);
}

// Monthly total for a single category (for the Parent Dashboard).
export function categoryMonthlySeries(
  data: BudgetData,
  category: ExpenseCategory,
  n = 6
): { key: string; label: string; amount: number }[] {
  return trailingMonths(new Date(), n).map((key) => ({
    key,
    label: monthLabel(key),
    amount: inMonth(data.expenses, key)
      .filter((e) => e.category === category)
      .reduce((t, e) => t + e.amount, 0),
  }));
}

// Cumulative savings (running total of monthly net) for a growth chart.
export function savingsGrowthSeries(
  data: BudgetData,
  n = 6
): { label: string; total: number }[] {
  let running = 0;
  return monthlySeries(data, n).map((p) => {
    running += p.net;
    return { label: p.label, total: Math.round(running) };
  });
}

// Projected total debt balance month-by-month (avalanche), for a payoff chart.
export function debtPayoffProjection(
  debts: Debt[],
  maxMonths = 36
): { label: string; balance: number }[] {
  const working = avalancheOrder(debts).map((d) => ({ ...d }));
  const basePayment = working.reduce((t, d) => t + d.monthlyPayment, 0);
  const series: { label: string; balance: number }[] = [];
  const now = new Date();

  series.push({
    label: now.toLocaleDateString("en-PH", { month: "short" }),
    balance: Math.round(working.reduce((t, d) => t + d.balance, 0)),
  });

  for (let m = 1; m <= maxMonths; m++) {
    for (const d of working) {
      if (d.balance > 0) d.balance += d.balance * (d.interestRate / 100);
    }
    let pool = basePayment;
    for (const d of working) {
      if (d.balance <= 0 || pool <= 0) continue;
      const pay = Math.min(pool, d.balance);
      d.balance -= pay;
      pool -= pay;
      if (d.balance < 0.5) d.balance = 0;
    }
    const total = Math.round(working.reduce((t, d) => t + d.balance, 0));
    const dt = new Date(now.getFullYear(), now.getMonth() + m, 1);
    series.push({
      label: dt.toLocaleDateString("en-PH", { month: "short" }),
      balance: total,
    });
    if (total <= 0) break;
  }
  return series;
}
