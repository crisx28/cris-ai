// Friendly coach logic: time-based greeting, health status with the
// 🟢🟡🟠🔴 system, dynamic AI insights, and the home Coach message.

import { peso, pct } from "./currency";
import {
  categoryBreakdown,
  categoryComparisonFull,
  currentMonthKey,
  goalProjection,
  monthLabel,
  monthlySeries,
  savingsRate,
  spendingComparison,
  totalExpenses,
  totalIncome,
  travelProjection,
  typicalMonthlySurplus,
} from "./finance";
import { BudgetData, ExpenseCategory } from "./types";

export function greeting(date = new Date()): { text: string; emoji: string } {
  const h = date.getHours();
  if (h < 12) return { text: "Good Morning", emoji: "☀️" };
  if (h < 18) return { text: "Good Afternoon", emoji: "🌤️" };
  return { text: "Good Evening", emoji: "🌙" };
}

export interface HealthStatus {
  emoji: string;
  label: string;
  color: string; // hex
  bg: string; // tailwind-ish bg tint
}

export function healthStatus(score: number): HealthStatus {
  if (score >= 80)
    return { emoji: "🟢", label: "Excellent", color: "#16a34a", bg: "#f0fdf4" };
  if (score >= 60)
    return { emoji: "🟡", label: "Stable", color: "#ca8a04", bg: "#fefce8" };
  if (score >= 40)
    return { emoji: "🟠", label: "Watch Spending", color: "#d97706", bg: "#fff7ed" };
  return { emoji: "🔴", label: "Attention Needed", color: "#dc2626", bg: "#fef2f2" };
}

export interface Insight {
  emoji: string;
  text: string;
  tone: "good" | "warn" | "info";
}

// Compare this month vs last month per category and surface the most useful
// 3–4 encouraging or cautionary insights.
export function generateInsights(data: BudgetData): Insight[] {
  const series = monthlySeries(data, 2);
  const thisMonth = series[series.length - 1]?.key ?? currentMonthKey();
  const lastMonth = series[0]?.key;
  const insights: Insight[] = [];

  const thisBreak = categoryBreakdown(data.expenses, thisMonth);
  const lastBreak = lastMonth ? categoryBreakdown(data.expenses, lastMonth) : [];
  const lastMap = new Map<ExpenseCategory, number>(
    lastBreak.map((b) => [b.category, b.amount])
  );

  // Food change
  const food = thisBreak.find((b) => b.category === "Food");
  const foodLast = lastMap.get("Food");
  if (food && foodLast && foodLast > 0) {
    const change = ((food.amount - foodLast) / foodLast) * 100;
    if (change <= -5)
      insights.push({
        emoji: "💡",
        text: `You spent ${Math.abs(Math.round(change))}% less on food this month. Nice discipline!`,
        tone: "good",
      });
    else if (change >= 15)
      insights.push({
        emoji: "🍽️",
        text: `Food spending is up ${Math.round(change)}% vs last month — worth a peek.`,
        tone: "warn",
      });
  }

  // Utilities / electricity higher than average
  const utils = thisBreak.find((b) => b.category === "Utilities");
  const utilsLast = lastMap.get("Utilities");
  if (utils && utilsLast && utils.amount > utilsLast * 1.15) {
    insights.push({
      emoji: "⚡",
      text: `Your electricity bill is higher than last month (${peso(
        utils.amount
      )}). Baka mainit lang. 😅`,
      tone: "warn",
    });
  }

  // Debt reduction (debt payments made this month)
  const debtPaid = thisBreak.find((b) => b.category === "Debt Payment");
  if (debtPaid && debtPaid.amount > 0) {
    insights.push({
      emoji: "🎉",
      text: `Great job! You put ${peso(debtPaid.amount)} toward debt this month.`,
      tone: "good",
    });
  }

  // Travel goal on track
  const trip = data.travel[0];
  if (trip) {
    const p = travelProjection(trip);
    const surplus = typicalMonthlySurplus(data);
    if (p.recommendedMonthly !== null && p.recommendedMonthly <= surplus) {
      insights.push({
        emoji: "✈️",
        text: `You're on track for your ${trip.destination.replace(
          /[🇨🇳🏝️]/g,
          ""
        ).trim()} goal. Keep it up!`,
        tone: "good",
      });
    }
  }

  // Emergency fund ahead of schedule
  const emergency = data.goals.find((g) =>
    g.name.toLowerCase().includes("emergency")
  );
  if (emergency && emergency.deadline) {
    const p = goalProjection(emergency);
    if (p.progress >= 30 && p.monthsToDeadline && p.monthsToDeadline > 6) {
      insights.push({
        emoji: "🛡️",
        text: `Emergency fund is ${Math.round(
          p.progress
        )}% funded with time to spare — ahead of schedule. 💪`,
        tone: "good",
      });
    }
  }

  // Savings rate callout
  const rate = savingsRate(data, thisMonth);
  if (rate >= 20)
    insights.push({
      emoji: "📈",
      text: `You saved ${Math.round(rate)}% of your income this month. That's excellent!`,
      tone: "good",
    });
  else if (rate < 0)
    insights.push({
      emoji: "⚠️",
      text: `You spent more than you earned this month. Let's tighten up a little.`,
      tone: "warn",
    });

  return insights.slice(0, 4);
}

// The friendly one-liner for the Coach card on the home screen.
export function coachMessage(data: BudgetData): string {
  const surplus = typicalMonthlySurplus(data);
  const rate = savingsRate(data, currentMonthKey());
  if (surplus > 0 && rate >= 15) {
    return `You're doing well this month. 👏 If you maintain your current spending, you'll save an extra ${peso(
      surplus
    )}.`;
  }
  if (surplus > 0) {
    return `Steady progress! You have about ${peso(
      surplus
    )} of breathing room this month. Sending even ${peso(
      Math.round(surplus * 0.6)
    )} to a goal builds real momentum.`;
  }
  return `Money's a little tight this month. Let's look at your top 2 spending categories together — small trims add up fast. You've got this. 💚`;
}

// ---- Report-grade natural-language insights ------------------------------
// Fuller, review-style explanations: why spending changed, biggest category,
// where to save, and positive habits to celebrate.
export interface ReviewInsight {
  emoji: string;
  title: string;
  text: string;
  tone: "good" | "warn" | "info";
}

export function reviewInsights(data: BudgetData): ReviewInsight[] {
  const key = currentMonthKey();
  const out: ReviewInsight[] = [];
  const income = totalIncome(data.incomes, key);
  const expenses = totalExpenses(data.expenses, key);
  const cmp = spendingComparison(data);
  const cats = categoryComparisonFull(data);
  const rate = savingsRate(data, key);

  // Why spending changed
  if (cmp.increases.length > 0 && cmp.totalDelta > 0) {
    const top = cmp.increases[0];
    out.push({
      emoji: "🔎",
      title: "Why your spending changed",
      text: `You spent ${peso(Math.abs(cmp.totalDelta))} more than last month. The biggest driver was ${top.category} (+${peso(
        top.delta
      )}, up ${Math.round(top.pctChange)}%).`,
      tone: "warn",
    });
  } else {
    out.push({
      emoji: "✅",
      title: "Spending is under control",
      text: `You spent ${peso(
        Math.abs(cmp.totalDelta)
      )} ${cmp.totalDelta <= 0 ? "less" : "more"} than last month. Consistency like this is exactly how families get ahead.`,
      tone: "good",
    });
  }

  // Biggest spending category
  const biggest = cats[0];
  if (biggest && biggest.thisAmt > 0) {
    out.push({
      emoji: "🏆",
      title: "Your biggest category",
      text: `${biggest.category} is your largest expense this month at ${peso(
        biggest.thisAmt
      )} — ${pct(expenses ? (biggest.thisAmt / expenses) * 100 : 0)} of your spending.`,
      tone: "info",
    });
  }

  // Areas to save
  if (cmp.recommendation) {
    out.push({
      emoji: "💡",
      title: "Where you can save",
      text: cmp.recommendation + " Redirecting that to a goal would speed things up nicely.",
      tone: "info",
    });
  }

  // Positive habits
  const habits: string[] = [];
  if (rate >= 15) habits.push(`saved ${Math.round(rate)}% of your income`);
  const debtPaid = categoryBreakdown(data.expenses, key).find(
    (b) => b.category === "Debt Payment"
  );
  if (debtPaid && debtPaid.amount > 0)
    habits.push(`paid ${peso(debtPaid.amount)} toward debt`);
  const funded = data.goals.filter((g) => g.current / (g.target || 1) >= 0.5).length;
  if (funded > 0) habits.push(`${funded} goal${funded > 1 ? "s" : ""} past the halfway mark`);
  if (habits.length > 0) {
    out.push({
      emoji: "🎉",
      title: "Positive habits this month",
      text: `Great job — this month you ${habits.join(", ")}. Keep it up!`,
      tone: "good",
    });
  }

  return out;
}

// A plain-text summary used inside exported reports (PDF/Excel/CSV).
export function reviewSummaryText(data: BudgetData): string {
  const key = currentMonthKey();
  return (
    `Financial Review — ${monthLabel(key)}\n` +
    reviewInsights(data)
      .map((i) => `- ${i.title}: ${i.text}`)
      .join("\n")
  );
}
