"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { monthlyFixedSummary } from "@/lib/calendar";
import { peso, pct } from "@/lib/currency";
import { CATEGORY_META } from "@/lib/types";

const FREQ_LABEL: Record<string, string> = {
  weekly: "wk",
  biweekly: "2wk",
  monthly: "mo",
  quarterly: "qtr",
  yearly: "yr",
};

// Dashboard card: monthly fixed expenses + % of income.
export function MonthlyFixedCard() {
  const { data } = useStore();
  const s = monthlyFixedSummary(data);
  if (s.items.length === 0) return null;

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[15px] font-semibold text-ink">🔁 Monthly Fixed Expenses</p>
        <Link href="/fixed" className="text-[13px] font-semibold text-brand-600">
          Manage
        </Link>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-[26px] font-bold tracking-tight text-ink">{peso(s.total)}</span>
        <span
          className={`chip ${
            s.pctOfIncome > 50 ? "bg-danger/10 text-danger" : s.pctOfIncome > 35 ? "bg-warning/10 text-warning" : "bg-brand-50 text-brand-600"
          }`}
        >
          {pct(s.pctOfIncome)} of income
        </span>
      </div>

      <div className="mt-3 divide-y divide-hairline">
        {s.items.slice(0, 6).map((i) => (
          <div key={i.name} className="flex items-center justify-between py-2">
            <span className="flex items-center gap-2 text-[14px] text-ink">
              <span>{CATEGORY_META[i.category as keyof typeof CATEGORY_META]?.emoji ?? "💸"}</span>
              {i.name}
              {i.frequency !== "monthly" && (
                <span className="text-[11px] text-subtle">· {FREQ_LABEL[i.frequency]}</span>
              )}
            </span>
            <span className="text-[14px] font-semibold text-ink">{peso(i.monthly)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
