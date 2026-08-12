// Core data model for Cris Budget OS.
// Everything is plain TypeScript so it works the same whether data lives
// in localStorage (demo mode) or in Supabase (cloud mode).

export type IncomeSource =
  | "Salary"
  | "Freelance"
  | "Bonus"
  | "Side Hustle"
  | "Other";

export const INCOME_SOURCES: IncomeSource[] = [
  "Salary",
  "Freelance",
  "Bonus",
  "Side Hustle",
  "Other",
];

export type ExpenseCategory =
  | "Food"
  | "Grocery"
  | "Transportation"
  | "Utilities"
  | "Internet"
  | "Mobile"
  | "Rent"
  | "School"
  | "Child Expenses"
  | "Debt Payment"
  | "Healthcare"
  | "Entertainment"
  | "Travel"
  | "Miscellaneous";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Food",
  "Grocery",
  "Transportation",
  "Utilities",
  "Internet",
  "Mobile",
  "Rent",
  "School",
  "Child Expenses",
  "Debt Payment",
  "Healthcare",
  "Entertainment",
  "Travel",
  "Miscellaneous",
];

export interface Income {
  id: string;
  date: string; // ISO yyyy-mm-dd
  source: IncomeSource;
  amount: number;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  category: ExpenseCategory;
  amount: number;
  notes?: string;
}

export type Frequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";

export const FREQUENCIES: Frequency[] = [
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly",
];

// How many times a year each frequency occurs (for monthly-equivalent math).
export const FREQ_PER_YEAR: Record<Frequency, number> = {
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

export interface FixedExpense {
  id: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  dueDay: number; // day of month (used for monthly anchor / back-compat)
  frequency: Frequency;
  anchorDate?: string; // ISO — first/reference occurrence (drives non-monthly)
  active: boolean;
}

export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number; // annual %, e.g. 3.5
  monthlyPayment: number;
  dueDay: number; // day of month
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string; // ISO yyyy-mm-dd
}

export interface TravelFund {
  id: string;
  destination: string;
  target: number;
  current: number;
  travelDate?: string; // ISO yyyy-mm-dd
}

export type TaskKind =
  | "debt"
  | "savings"
  | "travel"
  | "bill"
  | "review"
  | "other";

export type Recurrence = "none" | "weekly" | "monthly" | "payday";

export interface FinancialTask {
  id: string;
  title: string;
  kind: TaskKind;
  amount?: number;
  dueDate?: string; // ISO yyyy-mm-dd
  recurrence: Recurrence;
  status: "pending" | "done";
  source: "ai" | "routine" | "goal" | "manual";
  motionId?: string; // set when synced to usemotion.com
  createdAt: string;
}

export interface BudgetData {
  incomes: Income[];
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
  debts: Debt[];
  goals: SavingsGoal[];
  travel: TravelFund[];
  tasks: FinancialTask[];
}

// Category → emoji + tailwind color, used everywhere for consistency.
export const CATEGORY_META: Record<
  ExpenseCategory,
  { emoji: string; color: string }
> = {
  Food: { emoji: "🍔", color: "#c37368" },
  Grocery: { emoji: "🛒", color: "#cf9b3f" },
  Transportation: { emoji: "⛽", color: "#b8894f" },
  Utilities: { emoji: "💡", color: "#82964f" },
  Internet: { emoji: "🌐", color: "#7fa8a0" },
  Mobile: { emoji: "📱", color: "#8fb0a2" },
  Rent: { emoji: "🏠", color: "#a98b6f" },
  School: { emoji: "📚", color: "#a98bb0" },
  "Child Expenses": { emoji: "👶", color: "#c98d94" },
  "Debt Payment": { emoji: "💳", color: "#b0728a" },
  Healthcare: { emoji: "🩺", color: "#cf8f8a" },
  Entertainment: { emoji: "🎬", color: "#d0a04f" },
  Travel: { emoji: "✈️", color: "#c98d94" },
  Miscellaneous: { emoji: "📦", color: "#9a9182" },
};

// Pick a friendly emoji for a savings goal / travel fund based on its name.
export function goalEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("emergency")) return "🛡️";
  if (n.includes("school") || n.includes("educ") || n.includes("tuition")) return "🎓";
  if (n.includes("laptop") || n.includes("phone") || n.includes("gadget")) return "💻";
  if (n.includes("home") || n.includes("house") || n.includes("renovation") || n.includes("bahay")) return "🏡";
  if (n.includes("car") || n.includes("kotse")) return "🚗";
  if (n.includes("wedding")) return "💍";
  if (n.includes("appliance")) return "🧺";
  if (n.includes("baby") || n.includes("child")) return "👶";
  if (
    n.includes("trip") ||
    n.includes("travel") ||
    n.includes("vacation") ||
    n.includes("getaway") ||
    n.includes("flight")
  )
    return "✈️";
  return "🎯";
}
