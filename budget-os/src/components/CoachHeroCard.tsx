"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

const ASKS = [
  "Can I afford a trip?",
  "Which debt should I pay first?",
  "Why am I overspending?",
  "How much can I safely spend today?",
  "Am I on track for my goals?",
];

// The AI Coach as the hero feature — makes it obvious what the AI can do.
export function CoachHeroCard({ message }: { message?: string }) {
  return (
    <div className="rounded-4xl bg-gradient-to-br from-brand-500 to-brand-600 p-[1.5px] shadow-float">
      <div className="rounded-[22px] bg-white p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-2xl">
            🤖
          </span>
          <div>
            <p className="flex items-center gap-1.5 text-[17px] font-bold text-ink">
              AI Financial Coach
              <Sparkles size={15} className="text-brand-500" />
            </p>
            <p className="text-[12px] text-subtle">Your money, explained simply</p>
          </div>
        </div>

        {message && (
          <p className="mt-3 rounded-2xl bg-grouped px-4 py-3 text-[14px] leading-relaxed text-ink">
            {message}
          </p>
        )}

        <p className="mt-4 text-[13px] font-semibold text-subtle">Ask me:</p>
        <ul className="mt-2 space-y-1.5">
          {ASKS.map((a) => (
            <li key={a} className="flex items-center gap-2 text-[14px] text-ink">
              <span className="text-brand-500">•</span>
              {a}
            </li>
          ))}
        </ul>

        <Link href="/assistant" className="btn-primary mt-4 w-full">
          Ask AI 🤖
        </Link>
      </div>
    </div>
  );
}
