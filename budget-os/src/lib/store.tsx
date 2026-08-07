"use client";

// The app's data store. It keeps everything in the browser's localStorage so
// the app works instantly with zero setup, and seeds realistic Filipino
// household data on first run. When you're ready for cloud sync + login,
// swap these functions to call Supabase (see supabase.ts + README).

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BudgetData,
  Debt,
  Expense,
  FixedExpense,
  Income,
  SavingsGoal,
  TravelFund,
} from "./types";
import { generateSeed } from "./seed";

const STORAGE_KEY = "cris-budget-os:v1";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

interface StoreContextValue {
  data: BudgetData;
  ready: boolean;
  addIncome: (i: Omit<Income, "id">) => void;
  addExpense: (e: Omit<Expense, "id">) => void;
  deleteExpense: (id: string) => void;
  deleteIncome: (id: string) => void;
  addFixedExpense: (f: Omit<FixedExpense, "id">) => void;
  toggleFixedExpense: (id: string) => void;
  deleteFixedExpense: (id: string) => void;
  addDebt: (d: Omit<Debt, "id">) => void;
  updateDebt: (id: string, patch: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  addGoal: (g: Omit<SavingsGoal, "id">) => void;
  updateGoal: (id: string, patch: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  addTravel: (t: Omit<TravelFund, "id">) => void;
  updateTravel: (id: string, patch: Partial<TravelFund>) => void;
  deleteTravel: (id: string) => void;
  resetToSample: () => void;
  clearAll: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const EMPTY: BudgetData = {
  incomes: [],
  expenses: [],
  fixedExpenses: [],
  debts: [],
  goals: [],
  travel: [],
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BudgetData>(EMPTY);
  const [ready, setReady] = useState(false);

  // Load on mount (client only).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setData(JSON.parse(raw));
      } else {
        const seeded = generateSeed();
        setData(seeded);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      }
    } catch {
      setData(generateSeed());
    } finally {
      setReady(true);
    }
  }, []);

  // Persist on every change.
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        /* storage full or unavailable — ignore */
      }
    }
  }, [data, ready]);

  const update = useCallback(
    (fn: (d: BudgetData) => BudgetData) => setData((d) => fn(d)),
    []
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      data,
      ready,
      addIncome: (i) =>
        update((d) => ({ ...d, incomes: [{ ...i, id: uid("inc") }, ...d.incomes] })),
      addExpense: (e) =>
        update((d) => ({ ...d, expenses: [{ ...e, id: uid("exp") }, ...d.expenses] })),
      deleteExpense: (id) =>
        update((d) => ({ ...d, expenses: d.expenses.filter((x) => x.id !== id) })),
      deleteIncome: (id) =>
        update((d) => ({ ...d, incomes: d.incomes.filter((x) => x.id !== id) })),
      addFixedExpense: (f) =>
        update((d) => ({
          ...d,
          fixedExpenses: [{ ...f, id: uid("fix") }, ...d.fixedExpenses],
        })),
      toggleFixedExpense: (id) =>
        update((d) => ({
          ...d,
          fixedExpenses: d.fixedExpenses.map((x) =>
            x.id === id ? { ...x, active: !x.active } : x
          ),
        })),
      deleteFixedExpense: (id) =>
        update((d) => ({
          ...d,
          fixedExpenses: d.fixedExpenses.filter((x) => x.id !== id),
        })),
      addDebt: (dbt) =>
        update((d) => ({ ...d, debts: [{ ...dbt, id: uid("debt") }, ...d.debts] })),
      updateDebt: (id, patch) =>
        update((d) => ({
          ...d,
          debts: d.debts.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteDebt: (id) =>
        update((d) => ({ ...d, debts: d.debts.filter((x) => x.id !== id) })),
      addGoal: (g) =>
        update((d) => ({ ...d, goals: [{ ...g, id: uid("goal") }, ...d.goals] })),
      updateGoal: (id, patch) =>
        update((d) => ({
          ...d,
          goals: d.goals.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteGoal: (id) =>
        update((d) => ({ ...d, goals: d.goals.filter((x) => x.id !== id) })),
      addTravel: (t) =>
        update((d) => ({ ...d, travel: [{ ...t, id: uid("trip") }, ...d.travel] })),
      updateTravel: (id, patch) =>
        update((d) => ({
          ...d,
          travel: d.travel.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteTravel: (id) =>
        update((d) => ({ ...d, travel: d.travel.filter((x) => x.id !== id) })),
      resetToSample: () => {
        const seeded = generateSeed();
        setData(seeded);
      },
      clearAll: () => setData(EMPTY),
    }),
    [data, ready, update]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
