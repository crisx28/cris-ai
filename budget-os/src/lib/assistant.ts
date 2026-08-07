// The AI money engine. It reads a plain-English question and computes a real
// answer from the household's actual data — no external API required.
//
// If ANTHROPIC_API_KEY is configured, the /api/assistant route can hand the
// same data to Claude for free-form answers; this engine is the always-on
// fallback and handles all the sample questions from the spec.

import { peso, pct } from "./currency";
import {
  avalancheOrder,
  categoryBreakdown,
  currentMonthKey,
  dailySafeSpend,
  financialHealth,
  goalProjection,
  monthLabel,
  savingsRate,
  simulatePayoff,
  snowballOrder,
  spendingComparison,
  totalExpenses,
  totalIncome,
  typicalMonthlySurplus,
} from "./finance";
import { BudgetData, EXPENSE_CATEGORIES, ExpenseCategory } from "./types";

export interface Answer {
  text: string;
}

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function findCategory(q: string): ExpenseCategory | null {
  const lower = q.toLowerCase();
  for (const c of EXPENSE_CATEGORIES) {
    if (lower.includes(c.toLowerCase())) return c;
  }
  // common synonyms
  if (lower.includes("groceries")) return "Grocery";
  if (lower.includes("transpo") || lower.includes("gas") || lower.includes("grab")) return "Transportation";
  if (lower.includes("child") || lower.includes("kid") || lower.includes("anak") || lower.includes("baby")) return "Child Expenses";
  if (lower.includes("electric") || lower.includes("meralco") || lower.includes("water")) return "Utilities";
  if (lower.includes("bill")) return "Utilities";
  return null;
}

function extractAmount(q: string): number | null {
  const kMatch = q.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);
  const m = q.replace(/,/g, "").match(/(\d{3,})/);
  return m ? parseFloat(m[1]) : null;
}

export function answerQuestion(data: BudgetData, question: string): Answer {
  const q = question.toLowerCase().trim();
  const key = currentMonthKey();
  const income = totalIncome(data.incomes, key);
  const expenses = totalExpenses(data.expenses, key);

  // --- How much can I safely spend today? ---
  if (
    (q.includes("safe") || q.includes("safely") || q.includes("today")) &&
    (q.includes("spend") || q.includes("afford"))
  ) {
    const s = dailySafeSpend(data);
    return {
      text: `You can safely spend about ${peso(
        s.perDay
      )} per day. 💡\n\nThis leaves room for ${peso(
        s.upcomingBills
      )} in upcoming bills over the ${s.days} day${
        s.days === 1 ? "" : "s"
      } until your next payday (${s.payday}). Stay under this and you'll cruise to payday with breathing room.`,
    };
  }

  // --- Why am I overspending? ---
  if (
    q.includes("overspend") ||
    (q.includes("why") && (q.includes("spend") || q.includes("spending")))
  ) {
    const c = spendingComparison(data);
    if (c.increases.length === 0) {
      return {
        text: `Good news — your spending isn't up vs last month. 🎉 You spent ${peso(
          c.totalThis
        )} this month vs ${peso(c.totalLast)} last month.`,
      };
    }
    const lines = c.increases
      .map(
        (i) =>
          `• ${i.category} is up ${Math.round(i.pctChange)}% (+${peso(i.delta)})`
      )
      .join("\n");
    return {
      text: `Here's what changed vs last month:\n${lines}\n\nOverall you're spending ${peso(
        Math.abs(c.totalDelta)
      )} ${c.totalDelta >= 0 ? "more" : "less"} than last month.${
        c.recommendation ? `\n\n👉 ${c.recommendation}` : ""
      }`,
    };
  }

  // --- Spending on a specific category ---
  if ((q.includes("spend") || q.includes("spent") || q.includes("cost")) && findCategory(q)) {
    const cat = findCategory(q)!;
    const breakdown = categoryBreakdown(data.expenses, key);
    const found = breakdown.find((b) => b.category === cat);
    const amt = found?.amount ?? 0;
    const share = expenses > 0 ? (amt / expenses) * 100 : 0;
    return {
      text: `This month you spent ${peso(amt)} on ${cat}. That's ${pct(
        share
      )} of your ${peso(expenses)} total spending for ${monthLabel(key)}.`,
    };
  }

  // --- Top spending categories ---
  if (q.includes("top") && (q.includes("categor") || q.includes("spend"))) {
    const top = categoryBreakdown(data.expenses, key).slice(0, 5);
    if (top.length === 0) return { text: "No expenses recorded yet this month." };
    const lines = top
      .map((b, i) => `${i + 1}. ${b.category} — ${peso(b.amount)}`)
      .join("\n");
    return {
      text: `Your top spending categories for ${monthLabel(key)}:\n${lines}`,
    };
  }

  // --- How much can I save monthly ---
  if (q.includes("save") && (q.includes("how much") || q.includes("monthly") || q.includes("can i"))) {
    const surplus = typicalMonthlySurplus(data);
    const rate = savingsRate(data, key);
    return {
      text: `Based on your last 3 months, you typically have about ${peso(
        surplus
      )} left over each month that can go to savings. This month your savings rate is ${pct(
        rate
      )}. Automating even ${peso(
        Math.round(surplus * 0.7)
      )}/month into a separate account is a realistic, safe target.`,
    };
  }

  // --- Which debt to pay next ---
  if (q.includes("debt") && (q.includes("which") || q.includes("next") || q.includes("first") || q.includes("pay off"))) {
    if (data.debts.length === 0) return { text: "You have no debts recorded. 🎉" };
    const snowball = snowballOrder(data.debts)[0];
    const avalanche = avalancheOrder(data.debts)[0];
    const payoff = simulatePayoff(avalancheOrder(data.debts));
    let text = `Two smart options:\n\n`;
    text += `❄️ Snowball (fastest motivation): pay off "${snowball.name}" next — it has the smallest balance at ${peso(
      snowball.balance
    )}. Clearing it quickly frees up ${peso(snowball.monthlyPayment)}/month.\n\n`;
    text += `🏔️ Avalanche (saves the most money): attack "${avalanche.name}" next — it has the highest interest at ${avalanche.interestRate}%/mo.\n\n`;
    text += `If you keep your current total payments and roll them forward, you'd be debt-free around ${payoff.debtFreeDate}.`;
    return { text };
  }

  // --- Can I afford a trip / purchase ---
  if ((q.includes("afford") || q.includes("can i")) && (q.includes("trip") || q.includes("travel") || extractAmount(q))) {
    const cost = extractAmount(q);
    const surplus = typicalMonthlySurplus(data);
    // Detect a target month for the trip.
    let monthsAway: number | null = null;
    for (let i = 0; i < MONTH_NAMES.length; i++) {
      if (q.includes(MONTH_NAMES[i])) {
        const now = new Date();
        let target = new Date(now.getFullYear(), i, 1);
        if (target < now) target = new Date(now.getFullYear() + 1, i, 1);
        monthsAway =
          (target.getFullYear() - now.getFullYear()) * 12 +
          (target.getMonth() - now.getMonth());
        break;
      }
    }
    if (!cost) {
      return {
        text: `Tell me the amount (e.g. "Can I afford a 30,000 peso trip in December?") and I'll check it against your ~${peso(
          surplus
        )}/month surplus.`,
      };
    }
    if (monthsAway && monthsAway > 0) {
      const canSaveBy = surplus * monthsAway;
      const perMonth = Math.ceil(cost / monthsAway);
      const verdict =
        perMonth <= surplus
          ? `✅ Yes — realistically doable. You'd need to set aside ${peso(
              perMonth
            )}/month, and your typical surplus is about ${peso(surplus)}/month.`
          : `⚠️ Tight. You'd need ${peso(
              perMonth
            )}/month but your typical surplus is only about ${peso(
              surplus
            )}/month. You could get most of the way there, or trim expenses / add a freelance gig to close the gap.`;
      return {
        text: `A ${peso(cost)} trip that's ${monthsAway} month${
          monthsAway === 1 ? "" : "s"
        } away:\n\n${verdict}\n\n(By then, saving your usual surplus, you'd have roughly ${peso(
          canSaveBy
        )} available.)`,
      };
    }
    const months = surplus > 0 ? Math.ceil(cost / surplus) : Infinity;
    return {
      text: isFinite(months)
        ? `At your typical surplus of ${peso(
            surplus
          )}/month, a ${peso(cost)} goal would take about ${months} month${
            months === 1 ? "" : "s"
          } to save up for.`
        : `Your spending currently uses up your income, so a ${peso(
            cost
          )} goal isn't affordable yet without trimming expenses or adding income.`,
    };
  }

  // --- On track for emergency fund / a goal ---
  if (q.includes("track") || (q.includes("emergency") && q.includes("fund")) || q.includes("goal")) {
    const goal =
      data.goals.find((g) =>
        q.includes(g.name.toLowerCase().split(" ")[0])
      ) ||
      data.goals.find((g) => g.name.toLowerCase().includes("emergency")) ||
      data.goals[0];
    if (!goal) return { text: "You haven't set any savings goals yet." };
    const p = goalProjection(goal);
    let text = `"${goal.name}": ${peso(goal.current)} of ${peso(
      goal.target
    )} saved (${pct(p.progress)}).`;
    if (p.requiredMonthly !== null && p.monthsToDeadline !== null) {
      const surplus = typicalMonthlySurplus(data);
      const ok = p.requiredMonthly <= surplus;
      text += ` To hit your deadline you'd need ${peso(
        p.requiredMonthly
      )}/month for ${p.monthsToDeadline} month${
        p.monthsToDeadline === 1 ? "" : "s"
      }. ${
        ok
          ? "✅ That's within your typical surplus — you're on track."
          : `⚠️ That's above your typical surplus of ${peso(
              surplus
            )}/month, so you may need a bit more time or income.`
      }`;
    } else {
      text += ` ${peso(p.remaining)} to go. Set a deadline and I'll tell you the monthly amount needed.`;
    }
    return { text };
  }

  // --- Overall summary / health ---
  if (q.includes("health") || q.includes("how am i") || q.includes("summary") || q.includes("doing")) {
    const h = financialHealth(data);
    return {
      text: `Your Financial Health Score is ${h.score}/100 — ${h.grade}.\n\n${h.breakdown
        .map((b) => `• ${b.label}: ${b.points}/${b.max} (${b.note})`)
        .join("\n")}`,
    };
  }

  // --- Income / expenses this month ---
  if (q.includes("income") || q.includes("earn")) {
    return {
      text: `Your total income for ${monthLabel(key)} is ${peso(
        income
      )}, against ${peso(expenses)} in expenses — leaving ${peso(
        income - expenses
      )}.`,
    };
  }
  if (q.includes("expense") || q.includes("spend") || q.includes("spent")) {
    return {
      text: `You've spent ${peso(expenses)} so far in ${monthLabel(
        key
      )} against ${peso(income)} income. Remaining: ${peso(income - expenses)}.`,
    };
  }

  // --- Fallback ---
  return {
    text:
      "I can help with your money. Try asking:\n" +
      '• "How much did I spend on food this month?"\n' +
      '• "Which debt should I pay next?"\n' +
      '• "Can I afford a 30,000 peso trip in December?"\n' +
      '• "How much can I save monthly?"\n' +
      '• "Am I on track for my emergency fund?"',
  };
}
