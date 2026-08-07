"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { QuickAdd } from "@/components/QuickAdd";

const SHORTCUTS = [
  { href: "/expenses", emoji: "💸", label: "Add Expense", hint: "Detailed entry" },
  { href: "/income", emoji: "💵", label: "Add Income", hint: "Salary, freelance…" },
  { href: "/savings", emoji: "🎯", label: "Add to Goal", hint: "Grow your savings" },
  { href: "/travel", emoji: "✈️", label: "Travel Fund", hint: "Save for a trip" },
  { href: "/debts", emoji: "💳", label: "Add Debt", hint: "Track a balance" },
  { href: "/fixed", emoji: "🔁", label: "Fixed Bill", hint: "Recurring monthly" },
];

export default function AddPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Add" emoji="➕" subtitle="Log it in seconds." />

      <QuickAdd />

      <div className="space-y-2">
        <p className="section-title">Or add manually</p>
        <div className="grid grid-cols-2 gap-3">
          {SHORTCUTS.map((s) => (
            <Link key={s.href} href={s.href}>
              <div className="card-pressable flex items-center gap-3 p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-grouped text-2xl">
                  {s.emoji}
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-ink">{s.label}</p>
                  <p className="text-[12px] text-subtle">{s.hint}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
