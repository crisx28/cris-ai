// Turns the household's financial state into concrete recommended ACTIONS,
// each ready to become a task (in-app and/or synced to Motion).

import { peso } from "./currency";
import {
  currentMonthKey,
  goalProjection,
  spendingComparison,
  travelProjection,
  typicalMonthlySurplus,
} from "./finance";
import { BudgetData, FinancialTask } from "./types";

export interface RecommendedAction {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  task: Omit<FinancialTask, "id" | "createdAt" | "status">;
}

function nextDueDate(dueDay: number, ref = new Date()): { iso: string; days: number } {
  const today = ref.getDate();
  const dim = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  const day = Math.min(dueDay, dim);
  let d: Date;
  if (day >= today) d = new Date(ref.getFullYear(), ref.getMonth(), day);
  else d = new Date(ref.getFullYear(), ref.getMonth() + 1, Math.min(dueDay, 28));
  const days = Math.max(0, Math.round((d.getTime() - new Date(ref.getFullYear(), ref.getMonth(), today).getTime()) / 86400000));
  return { iso: d.toISOString().slice(0, 10), days };
}

export function generateActions(data: BudgetData): RecommendedAction[] {
  const actions: RecommendedAction[] = [];
  const surplus = typicalMonthlySurplus(data);

  // 1) Debts / bills due soon
  for (const d of data.debts) {
    const due = nextDueDate(d.dueDay);
    if (due.days <= 7) {
      actions.push({
        id: `debt-${d.id}`,
        emoji: "💳",
        title: `Pay ${d.name}`,
        subtitle: due.days === 0 ? "Due today" : `Due in ${due.days} day${due.days === 1 ? "" : "s"}`,
        task: {
          title: `Pay ${d.name} (${peso(d.monthlyPayment)})`,
          kind: "debt",
          amount: d.monthlyPayment,
          dueDate: due.iso,
          recurrence: "none",
          source: "ai",
        },
      });
    }
  }
  for (const f of data.fixedExpenses.filter((x) => x.active)) {
    const due = nextDueDate(f.dueDay);
    if (due.days <= 5) {
      actions.push({
        id: `bill-${f.id}`,
        emoji: "⚡",
        title: `${f.name} due soon`,
        subtitle: due.days === 0 ? "Due today" : `Due in ${due.days} day${due.days === 1 ? "" : "s"}`,
        task: {
          title: `Pay ${f.name} (${peso(f.amount)})`,
          kind: "bill",
          amount: f.amount,
          dueDate: due.iso,
          recurrence: "monthly",
          source: "ai",
        },
      });
    }
  }

  // 2) Emergency fund top-up
  const emergency = data.goals.find((g) => g.name.toLowerCase().includes("emergency"));
  if (emergency && surplus > 0) {
    const p = goalProjection(emergency);
    if (p.progress < 100) {
      const amt = Math.max(500, Math.round(Math.min(surplus * 0.4, p.requiredMonthly ?? surplus * 0.4) / 100) * 100);
      actions.push({
        id: "emergency",
        emoji: "💰",
        title: "Transfer to Emergency Fund",
        subtitle: `Suggested amount: ${peso(amt)}`,
        task: {
          title: `Transfer ${peso(amt)} to Emergency Fund`,
          kind: "savings",
          amount: amt,
          recurrence: "payday",
          source: "ai",
        },
      });
    }
  }

  // 3) Travel goal contribution
  const trip = data.travel[0];
  if (trip) {
    const p = travelProjection(trip);
    if (p.progress < 100 && p.recommendedMonthly) {
      const name = trip.destination.replace(/[^\w\s,.'-]/g, "").trim();
      actions.push({
        id: "travel",
        emoji: "✈️",
        title: `${name} contribution`,
        subtitle: `Suggested amount: ${peso(p.recommendedMonthly)}`,
        task: {
          title: `Set aside ${peso(p.recommendedMonthly)} for ${name}`,
          kind: "travel",
          amount: p.recommendedMonthly,
          recurrence: "monthly",
          source: "ai",
        },
      });
    }
  }

  // 4) Meal plan when food spending rose
  const food = spendingComparison(data).increases.find((i) => i.category === "Food");
  if (food) {
    actions.push({
      id: "mealplan",
      emoji: "🍽️",
      title: "Plan meals this week",
      subtitle: `Food is up ${Math.round(food.pctChange)}% — a meal plan helps`,
      task: {
        title: "Plan meals for the week",
        kind: "review",
        recurrence: "weekly",
        source: "ai",
      },
    });
  }

  // 5) Monthly review
  actions.push({
    id: "review",
    emoji: "📊",
    title: "Review spending",
    subtitle: "Monthly review available",
    task: {
      title: `Review ${currentMonthKey()} spending & goals`,
      kind: "review",
      recurrence: "monthly",
      source: "ai",
    },
  });

  return actions;
}
