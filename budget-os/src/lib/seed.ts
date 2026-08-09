// Neutral demo datasets. NO personal or developer-specific data lives here —
// only generic sample families used strictly for Demo Mode. Real users start
// from an empty profile (see Start Fresh).

import { BudgetData, Expense, ExpenseCategory, Income, IncomeSource } from "./types";

let counter = 0;
const id = (p: string) => `${p}_${Date.now().toString(36)}_${counter++}`;

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function dayInMonth(monthsAgo: number, day: number): string {
  const now = new Date();
  return iso(new Date(now.getFullYear(), now.getMonth() - monthsAgo, day));
}
const round10 = (n: number) => Math.round(n / 10) * 10;

interface DemoConfig {
  id: string;
  name: string;
  tagline: string;
  income: number; // total monthly income
  kids: boolean;
  incomeSources: { source: string; amount: number; day: number; note: string }[];
  debts: {
    name: string;
    balance: number;
    interestRate: number;
    monthlyPayment: number;
    dueDay: number;
  }[];
  goals: { name: string; target: number; current: number; months: number }[];
  travel: { destination: string; target: number; current: number; months: number }[];
}

// Generic everyday spending as a fraction of monthly income — no brand names.
const EXP: { frac: number; category: ExpenseCategory; desc: string; day: number }[] = [
  { frac: 0.25, category: "Rent", desc: "Monthly rent", day: 5 },
  { frac: 0.05, category: "Utilities", desc: "Electricity bill", day: 8 },
  { frac: 0.012, category: "Utilities", desc: "Water bill", day: 8 },
  { frac: 0.022, category: "Internet", desc: "Internet bill", day: 10 },
  { frac: 0.013, category: "Mobile", desc: "Mobile plan", day: 12 },
  { frac: 0.12, category: "Grocery", desc: "Groceries", day: 3 },
  { frac: 0.05, category: "Food", desc: "Dining out", day: 9 },
  { frac: 0.04, category: "Transportation", desc: "Transportation & fuel", day: 11 },
  { frac: 0.02, category: "Healthcare", desc: "Pharmacy", day: 14 },
  { frac: 0.015, category: "Entertainment", desc: "Streaming & subscriptions", day: 18 },
];
const KIDS_EXP: typeof EXP = [
  { frac: 0.035, category: "Child Expenses", desc: "School service", day: 15 },
  { frac: 0.02, category: "School", desc: "School supplies", day: 16 },
];

const CONFIGS: DemoConfig[] = [
  {
    id: "santos",
    name: "The Santos Family",
    tagline: "A working family of four",
    income: 75000,
    kids: true,
    incomeSources: [
      { source: "Salary", amount: 45000, day: 15, note: "Payroll" },
      { source: "Salary", amount: 22000, day: 30, note: "Payroll" },
      { source: "Freelance", amount: 8000, day: 22, note: "Side income" },
    ],
    debts: [
      { name: "Credit Card", balance: 25000, interestRate: 3, monthlyPayment: 4000, dueDay: 6 },
      { name: "Personal Loan", balance: 20000, interestRate: 1.5, monthlyPayment: 3000, dueDay: 6 },
    ],
    goals: [
      { name: "Emergency Fund", target: 150000, current: 25000, months: 14 },
      { name: "New Appliance", target: 35000, current: 9000, months: 6 },
    ],
    travel: [{ destination: "Japan Vacation", target: 180000, current: 38000, months: 8 }],
  },
  {
    id: "reyes",
    name: "Alex Reyes",
    tagline: "A solo professional",
    income: 60000,
    kids: false,
    incomeSources: [
      { source: "Salary", amount: 52000, day: 15, note: "Payroll" },
      { source: "Freelance", amount: 8000, day: 24, note: "Side project" },
    ],
    debts: [
      { name: "Credit Card", balance: 20000, interestRate: 3, monthlyPayment: 3000, dueDay: 6 },
    ],
    goals: [
      { name: "Emergency Fund", target: 90000, current: 15000, months: 12 },
      { name: "Laptop Upgrade", target: 80000, current: 22000, months: 6 },
    ],
    travel: [],
  },
  {
    id: "cruz",
    name: "The Cruz Family",
    tagline: "A dual-income couple",
    income: 90000,
    kids: true,
    incomeSources: [
      { source: "Salary", amount: 50000, day: 15, note: "Payroll" },
      { source: "Salary", amount: 40000, day: 30, note: "Payroll" },
    ],
    debts: [
      { name: "Home Loan", balance: 40000, interestRate: 1, monthlyPayment: 5000, dueDay: 6 },
      { name: "Credit Card", balance: 20000, interestRate: 3, monthlyPayment: 4000, dueDay: 10 },
    ],
    goals: [
      { name: "Emergency Fund", target: 200000, current: 40000, months: 14 },
      { name: "Home Renovation", target: 300000, current: 60000, months: 18 },
    ],
    travel: [],
  },
];

// Public metadata for the demo picker.
export interface DemoMeta {
  id: string;
  name: string;
  tagline: string;
  income: number;
}
export const DEMO_ACCOUNTS: DemoMeta[] = CONFIGS.map((c) => ({
  id: c.id,
  name: c.name,
  tagline: c.tagline,
  income: c.income,
}));

export function buildDemoAccount(accountId = "santos"): BudgetData {
  counter = 0;
  const cfg = CONFIGS.find((c) => c.id === accountId) ?? CONFIGS[0];
  const incomes: Income[] = [];
  const expenses: Expense[] = [];
  const templates = cfg.kids ? [...EXP, ...KIDS_EXP] : EXP;

  for (let m = 0; m <= 3; m++) {
    const wobble = 1 + (m === 0 ? 0 : Math.sin(m * 2.1) * 0.05);
    for (const s of cfg.incomeSources) {
      incomes.push({
        id: id("inc"),
        date: dayInMonth(m, s.day),
        source: s.source as IncomeSource,
        amount: s.source === "Salary" ? s.amount : round10(s.amount * wobble),
        notes: s.note,
      });
    }
    for (const t of templates) {
      expenses.push({
        id: id("exp"),
        date: dayInMonth(m, t.day),
        description: t.desc,
        category: t.category,
        amount: round10(cfg.income * t.frac * wobble),
      });
    }
    for (const d of cfg.debts) {
      expenses.push({
        id: id("exp"),
        date: dayInMonth(m, d.dueDay),
        description: `${d.name} payment`,
        category: "Debt Payment",
        amount: d.monthlyPayment,
      });
    }
  }

  return {
    incomes,
    expenses,
    fixedExpenses: [
      { id: id("fix"), name: "Rent", category: "Rent", amount: round10(cfg.income * 0.25), dueDay: 5, active: true },
      { id: id("fix"), name: "Electricity", category: "Utilities", amount: round10(cfg.income * 0.05), dueDay: 8, active: true },
      { id: id("fix"), name: "Internet", category: "Internet", amount: round10(cfg.income * 0.022), dueDay: 10, active: true },
      { id: id("fix"), name: "Mobile plan", category: "Mobile", amount: round10(cfg.income * 0.013), dueDay: 12, active: true },
      ...(cfg.kids
        ? [{ id: id("fix"), name: "School service", category: "Child Expenses" as ExpenseCategory, amount: round10(cfg.income * 0.035), dueDay: 15, active: true }]
        : []),
    ],
    debts: cfg.debts.map((d) => ({ id: id("debt"), ...d })),
    goals: cfg.goals.map((g) => ({
      id: id("goal"),
      name: g.name,
      target: g.target,
      current: g.current,
      deadline: dayInMonth(-g.months, 28),
    })),
    travel: cfg.travel.map((t) => ({
      id: id("trip"),
      destination: t.destination,
      target: t.target,
      current: t.current,
      travelDate: dayInMonth(-t.months, 20),
    })),
    tasks: [],
  };
}

// Default demo dataset (used by Demo Mode / reset).
export function generateSeed(): BudgetData {
  return buildDemoAccount("santos");
}
