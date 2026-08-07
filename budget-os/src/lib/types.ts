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

export interface FixedExpense {
  id: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  dueDay: number; // day of month, 1-31
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

export interface BudgetData {
  incomes: Income[];
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
  debts: Debt[];
  goals: SavingsGoal[];
  travel: TravelFund[];
}

// Category → emoji + tailwind color, used everywhere for consistency.
export const CATEGORY_META: Record<
  ExpenseCategory,
  { emoji: string; color: string }
> = {
  Food: { emoji: "🍚", color: "#ef4444" },
  Grocery: { emoji: "🛒", color: "#f97316" },
  Transportation: { emoji: "🚌", color: "#eab308" },
  Utilities: { emoji: "💡", color: "#84cc16" },
  Internet: { emoji: "🌐", color: "#22c55e" },
  Mobile: { emoji: "📱", color: "#14b8a6" },
  Rent: { emoji: "🏠", color: "#06b6d4" },
  School: { emoji: "🎒", color: "#3b82f6" },
  "Child Expenses": { emoji: "🧒", color: "#6366f1" },
  "Debt Payment": { emoji: "💳", color: "#8b5cf6" },
  Healthcare: { emoji: "🩺", color: "#ec4899" },
  Entertainment: { emoji: "🎬", color: "#f43f5e" },
  Travel: { emoji: "✈️", color: "#0ea5e9" },
  Miscellaneous: { emoji: "📦", color: "#64748b" },
};
