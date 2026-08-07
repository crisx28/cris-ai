"use client";

import Link from "next/link";
import { peso, pct } from "@/lib/currency";
import { ProgressBar } from "@/components/ui";

// A full-width, coach-style goal card: saved, remaining, progress, plus two
// actionable stats (e.g. target date + monthly required).
export function GoalProgressCard({
  href,
  emoji,
  title,
  current,
  target,
  color,
  stats,
}: {
  href: string;
  emoji: string;
  title: string;
  current: number;
  target: number;
  color: string;
  stats: { label: string; value: string }[];
}) {
  const remaining = Math.max(0, target - current);
  const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  return (
    <Link href={href} className="block">
      <div className="card-pressable p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <span className="text-xl">{emoji}</span>
            {title}
          </span>
          <span className="text-[13px] font-semibold" style={{ color }}>
            {pct(progress)}
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-[22px] font-bold tracking-tight text-ink">
            {peso(current)} <span className="text-[13px] font-medium text-subtle">saved</span>
          </span>
          <span className="text-[13px] font-medium text-subtle">
            {peso(remaining)} to go
          </span>
        </div>

        <div className="mt-2">
          <ProgressBar value={progress} color={color} height={10} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-grouped px-3 py-2.5">
              <p className="text-[11px] text-subtle">{s.label}</p>
              <p className="text-[15px] font-semibold text-ink">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}
