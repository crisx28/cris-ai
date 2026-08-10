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
  Food: { emoji: "🍔", color: "#ff3b30" },
  Grocery: { emoji: "🛒", color: "#ff9500" },
  Transportation: { emoji: "⛽", color: "#ffcc00" },
  Utilities: { emoji: "💡", color: "#34c759" },
  Internet: { emoji: "🌐", color: "#00c7be" },
  Mobile: { emoji: "📱", color: "#30b0c7" },
  Rent: { emoji: "🏠", color: "#0a84ff" },
  School: { emoji: "📚", color: "#5e5ce6" },
  "Child Expenses": { emoji: "👶", color: "#af52de" },
  "Debt Payment": { emoji: "💳", color: "#ff2d55" },
  Healthcare: { emoji: "🩺", color: "#ff375f" },
  Entertainment: { emoji: "🎬", color: "#ff9500" },
  Travel: { emoji: "✈️", color: "#0a84ff" },
  Miscellaneous: { emoji: "📦", color: "#8e8e93" },
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
