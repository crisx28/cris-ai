"use client";

import React from "react";

export function PageHeader({
  title,
  subtitle,
  emoji,
  action,
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink">
          {emoji && <span className="mr-1.5">{emoji}</span>}
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-[15px] text-subtle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  emoji,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  emoji?: string;
  tone?: "default" | "positive" | "negative" | "brand";
}) {
  const toneClass =
    tone === "positive"
      ? "text-success"
      : tone === "negative"
      ? "text-danger"
      : tone === "brand"
      ? "text-brand-600"
      : "text-ink";
  return (
    <div className="card p-4">
      <div className="flex items-center gap-1.5 text-[13px] font-medium text-subtle">
        {emoji && <span className="text-base">{emoji}</span>}
        {label}
      </div>
      <div className={`mt-1.5 text-[22px] font-bold tracking-tight ${toneClass}`}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[12px] text-subtle">{hint}</div>}
    </div>
  );
}

export function ProgressBar({
  value,
  color = "#34c759",
  height = 10,
  animate = true,
}: {
  value: number; // 0-100
  color?: string;
  height?: number;
  animate?: boolean;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-grouped"
      style={{ height }}
    >
      <div
        className={`h-full rounded-full ${animate ? "bar-fill" : ""}`}
        style={{ width: `${v}%`, background: color }}
      />
    </div>
  );
}

export function SectionCard({
  title,
  emoji,
  children,
  action,
}: {
  title: string;
  emoji?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[17px] font-bold text-ink">
          {emoji && <span>{emoji}</span>}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({
  text,
  emoji = "💡",
  hint,
}: {
  text: string;
  emoji?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl bg-grouped px-6 py-10 text-center">
      <div className="text-3xl">{emoji}</div>
      <p className="mt-2 text-[15px] font-semibold text-ink">{text}</p>
      {hint && <p className="mt-1 text-[13px] leading-relaxed text-subtle">{hint}</p>}
    </div>
  );
}
