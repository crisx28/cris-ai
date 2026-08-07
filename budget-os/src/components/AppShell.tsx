"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Bottom tab bar — the primary navigation, Apple-Wallet style.
// Secondary pages (income, expenses, fixed, debts, travel, analytics) are
// reached from the home cards; each maps to a sensible active tab below.
const TABS = [
  { href: "/", label: "Home", emoji: "🏠", match: ["/", "/income", "/expenses", "/fixed", "/debts"] },
  { href: "/add", label: "Add", emoji: "➕", center: true, match: ["/add"] },
  { href: "/assistant", label: "Coach", emoji: "🤖", match: ["/assistant"] },
  { href: "/savings", label: "Goals", emoji: "🎯", match: ["/savings", "/travel"] },
  { href: "/reports", label: "Reports", emoji: "📊", match: ["/reports", "/analytics"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (tab: (typeof TABS)[number]) =>
    tab.match.some((m) => (m === "/" ? pathname === "/" : pathname.startsWith(m)));

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[520px] px-4 pt-6 pb-32">{children}</div>

      {/* Floating iOS tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 safe-bottom">
        <div className="mx-auto mb-4 flex max-w-[400px] items-center justify-around rounded-full border border-white/60 bg-white/85 px-2 py-2 shadow-float backdrop-blur-xl">
          {TABS.map((tab) => {
            const active = isActive(tab);
            if (tab.center) {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-label={tab.label}
                  className="flex h-12 w-12 -translate-y-1 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition-all duration-200 active:scale-90"
                >
                  <span className="text-2xl leading-none">+</span>
                </Link>
              );
            }
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex w-14 flex-col items-center gap-0.5 py-1 transition active:scale-90"
              >
                <span
                  className={`text-xl transition ${
                    active ? "grayscale-0 scale-110" : "grayscale opacity-50"
                  }`}
                >
                  {tab.emoji}
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    active ? "text-ink" : "text-subtle"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
