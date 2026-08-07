// Friendly coach logic: time-based greeting, health status with the
// 🟢🟡🟠🔴 system, dynamic AI insights, and the home Coach message.

import { peso } from "./currency";
import {
  categoryBreakdown,
  currentMonthKey,
  goalProjection,
  monthlySeries,
  savingsRate,
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
    return { emoji: "🟢", label: "Excellent", color: "#34c759", bg: "#e9faf0" };
  if (score >= 60)
    return { emoji: "🟡", label: "Stable", color: "#e0b000", bg: "#fff9e6" };
  if (score >= 40)
    return { emoji: "🟠", label: "Watch Spending", color: "#ff9500", bg: "#fff4e6" };
  return { emoji: "🔴", label: "Attention Needed", color: "#ff3b30", bg: "#ffeceb" };
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
