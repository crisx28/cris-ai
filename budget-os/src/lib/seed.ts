// Realistic sample data for a working Filipino parent's household.
// Dates are generated relative to "today" so the dashboard, trends and
// forecasts always look alive whenever the app is opened.

import {
  BudgetData,
  Expense,
  ExpenseCategory,
  Income,
} from "./types";

let counter = 0;
const id = (p: string) => `${p}_${Date.now().toString(36)}_${counter++}`;

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// A date `monthsAgo` back, on the given day of month.
function dayInMonth(monthsAgo: number, day: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day);
  return iso(d);
}

// Monthly recurring expense templates (also mirrored in Fixed Expenses).
const MONTHLY_EXPENSES: Array<{
  day: number;
  description: string;
  category: ExpenseCategory;
  amount: number;
}> = [
  { day: 5, description: "Apartment rent", category: "Rent", amount: 12000 },
  { day: 8, description: "Meralco electricity", category: "Utilities", amount: 3800 },
  { day: 8, description: "Maynilad water", category: "Utilities", amount: 650 },
  { day: 10, description: "PLDT Home Fibr internet", category: "Internet", amount: 1699 },
  { day: 12, description: "Globe postpaid plan", category: "Mobile", amount: 999 },
  { day: 15, description: "School service (Joaquin)", category: "Child Expenses", amount: 2600 },
  { day: 20, description: "Mama allowance", category: "Miscellaneous", amount: 3000 },
];

// Variable everyday spending that differs a bit each month.
const VARIABLE_TEMPLATES: Array<{
  day: number;
  description: string;
  category: ExpenseCategory;
  base: number;
}> = [
  { day: 3, description: "SM Supermarket grocery run", category: "Grocery", base: 4200 },
  { day: 7, description: "Palengke (wet market)", category: "Grocery", base: 1250 },
  { day: 9, description: "Jollibee family dinner", category: "Food", base: 890 },
  { day: 11, description: "Grab to office", category: "Transportation", base: 620 },
  { day: 14, description: "Mercury Drug medicine", category: "Healthcare", base: 780 },
  { day: 16, description: "Joaquin school supplies", category: "School", base: 950 },
  { day: 18, description: "Netflix + Spotify", category: "Entertainment", base: 698 },
  { day: 21, description: "Puregold grocery", category: "Grocery", base: 3100 },
  { day: 23, description: "Diesel / gas", category: "Transportation", base: 1500 },
  { day: 26, description: "Lunch out with kids", category: "Food", base: 1100 },
];

export function generateSeed(): BudgetData {
  counter = 0;
  const incomes: Income[] = [];
  const expenses: Expense[] = [];

  // Build 4 months of history (current month + 3 back) for nice trends.
  for (let m = 0; m <= 3; m++) {
    const wobble = 1 + (m === 0 ? 0 : (Math.sin(m * 2.1) * 0.06)); // small variation

    // Income: salary paid twice a month + freelance side income.
    incomes.push({
      id: id("inc"),
      date: dayInMonth(m, 15),
      source: "Salary",
      amount: 22500,
      notes: "Mid-month payroll",
    });
    incomes.push({
      id: id("inc"),
      date: dayInMonth(m, 30),
      source: "Salary",
      amount: 22500,
      notes: "End-month payroll",
    });
    incomes.push({
      id: id("inc"),
      date: dayInMonth(m, 22),
      source: "Freelance",
      amount: Math.round((9000 * wobble) / 100) * 100,
      notes: "Virtual assistant / automation gig",
    });

    // Recurring monthly expenses.
    for (const e of MONTHLY_EXPENSES) {
      expenses.push({
        id: id("exp"),
        date: dayInMonth(m, e.day),
        description: e.description,
        category: e.category,
        amount: e.amount,
      });
    }

    // Variable everyday spending.
    for (const t of VARIABLE_TEMPLATES) {
      expenses.push({
        id: id("exp"),
        date: dayInMonth(m, t.day),
        description: t.description,
        category: t.category,
        amount: Math.round((t.base * wobble) / 10) * 10,
      });
    }

    // Debt payments each month.
    expenses.push({
      id: id("exp"),
      date: dayInMonth(m, 6),
      description: "Credit card payment (BPI)",
      category: "Debt Payment",
      amount: 5000,
    });
    expenses.push({
      id: id("exp"),
      date: dayInMonth(m, 6),
      description: "Personal loan payment",
      category: "Debt Payment",
      amount: 4500,
    });
  }

  // A 13th-month-style bonus in the current month to show a good month.
  incomes.push({
    id: id("inc"),
    date: dayInMonth(0, 5),
    source: "Bonus",
    amount: 8000,
    notes: "Performance incentive",
  });

  return {
    incomes,
    expenses,
    fixedExpenses: [
      { id: id("fix"), name: "Apartment rent", category: "Rent", amount: 12000, dueDay: 5, active: true },
      { id: id("fix"), name: "Meralco electricity", category: "Utilities", amount: 3800, dueDay: 8, active: true },
      { id: id("fix"), name: "PLDT internet", category: "Internet", amount: 1699, dueDay: 10, active: true },
      { id: id("fix"), name: "Globe postpaid", category: "Mobile", amount: 999, dueDay: 12, active: true },
      { id: id("fix"), name: "School service", category: "Child Expenses", amount: 2600, dueDay: 15, active: true },
      { id: id("fix"), name: "Mama allowance", category: "Miscellaneous", amount: 3000, dueDay: 20, active: true },
      { id: id("fix"), name: "Travel fund auto-save", category: "Travel", amount: 2000, dueDay: 25, active: true },
    ],
    debts: [
      { id: id("debt"), name: "BPI Credit Card", balance: 34500, interestRate: 3.5, monthlyPayment: 5000, dueDay: 6 },
      { id: id("debt"), name: "Personal Loan (SB)", balance: 78000, interestRate: 1.8, monthlyPayment: 4500, dueDay: 6 },
      { id: id("debt"), name: "Appliance Installment", balance: 14200, interestRate: 0, monthlyPayment: 2400, dueDay: 15 },
    ],
    goals: [
      { id: id("goal"), name: "Emergency Fund", target: 150000, current: 46500, deadline: dayInMonth(-14, 30) },
      { id: id("goal"), name: "China Trip", target: 120000, current: 38000, deadline: dayInMonth(-4, 20) },
      { id: id("goal"), name: "Joaquin School Fund", target: 60000, current: 22500, deadline: dayInMonth(-10, 1) },
      { id: id("goal"), name: "New Laptop", target: 55000, current: 12000, deadline: dayInMonth(-6, 15) },
    ],
    travel: [
      {
        id: id("trip"),
        destination: "Beijing, China 🇨🇳",
        target: 120000,
        current: 38000,
        travelDate: dayInMonth(-4, 20),
      },
      {
        id: id("trip"),
        destination: "Boracay Family Getaway 🏝️",
        target: 45000,
        current: 15500,
        travelDate: dayInMonth(-8, 10),
      },
    ],
  };
}
