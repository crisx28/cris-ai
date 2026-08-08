"use client";

import Link from "next/link";

// Feature 3 — four large "choose one" cards to get started fast.
const CARDS = [
  { href: "/add?receipt=1", emoji: "📸", title: "Upload a Receipt", hint: "Snap & save in seconds", tint: "from-brand-50 to-white" },
  { href: "/add", emoji: "➕", title: "Add an Expense", hint: "Type it like a text", tint: "from-amber-50 to-white" },
  { href: "/assistant", emoji: "🤖", title: "Ask AI Coach", hint: "Get personal advice", tint: "from-violet-50 to-white" },
  { href: "/savings", emoji: "🎯", title: "Create a Goal", hint: "Start saving today", tint: "from-emerald-50 to-white" },
];

export function QuickStart() {
  return (
    <div className="space-y-2">
      <p className="section-title">⚡ Quick Start</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href}>
            <div
              className={`card-pressable flex h-full flex-col gap-2 bg-gradient-to-br ${c.tint} p-4`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                {c.emoji}
              </span>
              <div>
                <p className="text-[15px] font-semibold text-ink">{c.title}</p>
                <p className="text-[12px] text-subtle">{c.hint}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
