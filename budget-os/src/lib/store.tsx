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

// Storage is split so demo data can NEVER mix with the user's real data.
const MODE_KEY = "cris-budget-os:mode"; // "user" | "demo"
const USER_KEY = "cris-budget-os:v1"; // the user's own financial data
const DEMO_DATA_KEY = "cris-budget-os:demo-data"; // sample data, isolated

type Mode = "user" | "demo" | null; // null = first launch, choice not made yet

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
  mode: Mode;
  demoMode: boolean;
  startFresh: () => void;
  enterDemo: () => void;
  exitDemo: () => void;
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
  const [mode, setMode] = useState<Mode>(null);

  // Load on mount (client only). Never auto-seeds into the user's data — the
  // choice screen decides between Start Fresh and Demo.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY) as Mode;
      if (saved === "demo") {
        const raw = localStorage.getItem(DEMO_DATA_KEY);
        const demo = raw ? JSON.parse(raw) : generateSeed();
        if (!raw) localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(demo));
        setData(demo);
        setMode("demo");
      } else if (saved === "user") {
        const raw = localStorage.getItem(USER_KEY);
        setData(raw ? JSON.parse(raw) : EMPTY);
        setMode("user");
      } else {
        // Migration: existing installs already have data under USER_KEY and no
        // mode flag — keep it as their own data so they skip the choice.
        const legacy = localStorage.getItem(USER_KEY);
        if (legacy) {
          setData(JSON.parse(legacy));
          setMode("user");
          localStorage.setItem(MODE_KEY, "user");
        } else {
          setMode(null); // first launch → show the choice screen
        }
      }
    } catch {
      setMode(null);
    } finally {
      setReady(true);
    }
  }, []);

  // Persist to the ACTIVE store only, so demo edits never touch user data.
  useEffect(() => {
    if (!ready || !mode) return;
    try {
      localStorage.setItem(
        mode === "demo" ? DEMO_DATA_KEY : USER_KEY,
        JSON.stringify(data)
      );
    } catch {
      /* storage full or unavailable — ignore */
    }
  }, [data, ready, mode]);

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
      resetToSample: () => setData(generateSeed()),
      clearAll: () => setData(EMPTY),
      mode,
      demoMode: mode === "demo",
      // Begin a clean, empty personal profile.
      startFresh: () => {
        try {
          localStorage.setItem(MODE_KEY, "user");
          localStorage.setItem(USER_KEY, JSON.stringify(EMPTY));
        } catch {
          /* ignore */
        }
        setData(EMPTY);
        setMode("user");
      },
      // Explore isolated sample data.
      enterDemo: () => {
        let demo: BudgetData;
        try {
          const raw = localStorage.getItem(DEMO_DATA_KEY);
          demo = raw ? JSON.parse(raw) : generateSeed();
          localStorage.setItem(MODE_KEY, "demo");
          localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(demo));
        } catch {
          demo = generateSeed();
        }
        setData(demo);
        setMode("demo");
      },
      // Leave demo and return to the user's own data (kept separate).
      exitDemo: () => {
        let own: BudgetData = EMPTY;
        try {
          const raw = localStorage.getItem(USER_KEY);
          own = raw ? JSON.parse(raw) : EMPTY;
          localStorage.setItem(MODE_KEY, "user");
        } catch {
          own = EMPTY;
        }
        setData(own);
        setMode("user");
      },
    }),
    [data, ready, update, mode]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
