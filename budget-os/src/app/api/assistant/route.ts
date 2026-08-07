// AI Assistant endpoint.
// - Always works using the built-in money engine (answerQuestion).
// - If ANTHROPIC_API_KEY is set, it hands the household's real numbers to
//   Claude for a warmer, free-form answer, still grounded in the data.

import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/assistant";
import {
  categoryBreakdown,
  currentMonthKey,
  financialHealth,
  savingsRate,
  totalDebt,
  totalExpenses,
  totalIncome,
  typicalMonthlySurplus,
} from "@/lib/finance";
import { peso } from "@/lib/currency";
import { BudgetData } from "@/lib/types";

export const runtime = "nodejs";

function buildContext(data: BudgetData): string {
  const key = currentMonthKey();
  const breakdown = categoryBreakdown(data.expenses, key)
    .slice(0, 6)
    .map((b) => `  - ${b.category}: ${peso(b.amount)}`)
    .join("\n");
  const debts = data.debts
    .map(
      (d) =>
        `  - ${d.name}: balance ${peso(d.balance)}, ${d.interestRate}%/mo, pays ${peso(
          d.monthlyPayment
        )}/mo`
    )
    .join("\n");
  const goals = data.goals
    .map((g) => `  - ${g.name}: ${peso(g.current)} of ${peso(g.target)}`)
    .join("\n");
  const health = financialHealth(data);

  return `HOUSEHOLD FINANCIAL SNAPSHOT (${key})
Income this month: ${peso(totalIncome(data.incomes, key))}
Expenses this month: ${peso(totalExpenses(data.expenses, key))}
Savings rate: ${Math.round(savingsRate(data, key))}%
Typical monthly surplus: ${peso(typicalMonthlySurplus(data))}
Total debt: ${peso(totalDebt(data.debts))}
Financial health score: ${health.score}/100 (${health.grade})

Top spending categories:
${breakdown || "  (none)"}

Debts:
${debts || "  (none)"}

Savings goals:
${goals || "  (none)"}`;
}

export async function POST(req: NextRequest) {
  const { question, data } = (await req.json()) as {
    question: string;
    data: BudgetData;
  };

  if (!question || !data) {
    return NextResponse.json({ error: "Missing question or data" }, { status: 400 });
  }

  // Always compute a grounded answer from the real numbers.
  const local = answerQuestion(data, question);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ answer: local.text, source: "engine" });
  }

  // Upgrade: let Claude phrase the answer using the real snapshot.
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk").catch(
      () => ({ default: null as any })
    );
    if (!Anthropic) {
      return NextResponse.json({ answer: local.text, source: "engine" });
    }
    const client = new Anthropic({ apiKey });
    const model = process.env.CRIS_MODEL || "claude-sonnet-5";
    const resp = await client.messages.create({
      model,
      max_tokens: 700,
      system:
        "You are Cris, a warm, practical Filipino family budget assistant. " +
        "Answer using ONLY the household snapshot provided. Use Philippine pesos (₱). " +
        "Be concise, encouraging, and specific with numbers. The engine has already " +
        "computed a factual answer — improve its tone and add one practical tip, but " +
        "never contradict its numbers.",
      messages: [
        {
          role: "user",
          content: `${buildContext(
            data
          )}\n\nEngine's factual answer:\n${local.text}\n\nUser question: ${question}`,
        },
      ],
    });
    const text = resp.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("")
      .trim();
    return NextResponse.json({
      answer: text || local.text,
      source: text ? "claude" : "engine",
    });
  } catch {
    return NextResponse.json({ answer: local.text, source: "engine" });
  }
}
