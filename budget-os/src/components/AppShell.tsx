"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { CoachPanel } from "@/components/CoachPanel";

// Desktop left-sidebar navigation.
const NAV = [
  { href: "/", label: "Dashboard", emoji: "🏠", match: ["/"], tour: "" },
  { href: "/expenses", label: "Expenses", emoji: "💸", match: ["/expenses", "/income", "/fixed"], tour: "nav-expenses" },
  { href: "/savings", label: "Goals", emoji: "🎯", match: ["/savings", "/travel", "/debts"], tour: "" },
  { href: "/reports", label: "Reports", emoji: "📊", match: ["/reports", "/analytics"], tour: "nav-reports" },
  { href: "/assistant", label: "AI Coach", emoji: "🤖", match: ["/assistant"], tour: "" },
  { href: "/learn", label: "Learn", emoji: "❓", match: ["/learn"], tour: "" },
  { href: "/settings", label: "Settings", emoji: "⚙️", match: ["/settings"], tour: "" },
];

// Mobile bottom tab bar.
const TABS = [
  { href: "/", label: "Home", emoji: "🏠", match: ["/"], tour: "" },
  { href: "/add", label: "Add", emoji: "➕", center: true, match: ["/add"], tour: "nav-expenses" },
  { href: "/assistant", label: "Coach", emoji: "🤖", match: ["/assistant"], tour: "" },
  { href: "/savings", label: "Goals", emoji: "🎯", match: ["/savings", "/travel", "/debts"], tour: "" },
  { href: "/reports", label: "Reports", emoji: "📊", match: ["/reports", "/analytics"], tour: "nav-reports" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { name, signOut } = useAuth();
  const { demoMode, exitDemo } = useStore();
  const isActive = (m: string[]) =>
    m.some((x) => (x === "/" ? pathname === "/" : pathname.startsWith(x)));

  // The AI Coach screen already is the chat — don't duplicate the panel there.
  const showCoach = pathname !== "/assistant" && pathname !== "/add";

  return (
    <div className="min-h-screen">
      {/* ---------- Desktop left sidebar ---------- */}
      <aside className="z-30 hidden border-r border-hairline bg-white px-3 py-5 lg:fixed lg:inset-y-0 lg:flex lg:w-60 lg:flex-col">
        <Link href="/" className="flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-lg font-bold text-white">
            ₱
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-bold text-ink">Cris Budget OS</div>
            <div className="text-[11px] text-subtle">AI Financial Coach</div>
          </div>
        </Link>

        <nav className="mt-7 flex-1 space-y-1">
          {NAV.map((n) => {
            const active = isActive(n.match);
            return (
              <Link
                key={n.href}
                href={n.href}
                data-tour={n.tour || undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-subtle hover:bg-grouped hover:text-ink"
                }`}
              >
                <span className="text-lg">{n.emoji}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => confirm("Sign out?") && signOut()}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-grouped"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-[13px] font-bold text-white">
            {(name || "C").charAt(0).toUpperCase()}
          </span>
          <span className="leading-tight">
            <span className="block text-[13px] font-semibold text-ink">
              {name || "Cris"}
            </span>
            <span className="text-[11px] text-subtle">Sign out</span>
          </span>
        </button>
      </aside>

      {/* ---------- Desktop right coach panel ---------- */}
      {showCoach && (
        <aside
          data-tour="ai-coach"
          className="z-30 hidden border-l border-hairline bg-white px-4 py-5 xl:fixed xl:inset-y-0 xl:right-0 xl:flex xl:w-80 xl:flex-col xl:overflow-y-auto"
        >
          <CoachPanel />
        </aside>
      )}

      {/* ---------- Main content ---------- */}
      <main className={`lg:pl-60 ${showCoach ? "xl:pr-80" : ""}`}>
        {demoMode && (
          <div className="flex items-center justify-between gap-3 bg-brand-600 px-4 py-2.5 text-white lg:px-8">
            <span className="text-[13px] font-medium">
              ✨ You&apos;re exploring sample data
            </span>
            <button
              onClick={exitDemo}
              className="rounded-full bg-white/20 px-3 py-1 text-[13px] font-semibold transition hover:bg-white/30 active:scale-95"
            >
              Exit Demo Mode
            </button>
          </div>
        )}
        <div className="mx-auto max-w-[780px] px-4 py-6 pb-28 lg:px-8 lg:py-8 lg:pb-10">
          {children}
        </div>
      </main>

      {/* ---------- Mobile bottom tab bar ---------- */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 lg:hidden">
        <div className="mx-auto mb-4 flex max-w-[400px] items-center justify-around rounded-full border border-hairline bg-white/85 px-2 py-2 shadow-float backdrop-blur-xl">
          {TABS.map((tab) => {
            const active = isActive(tab.match);
            if (tab.center) {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-label="Add"
                  data-tour={tab.tour || undefined}
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
                data-tour={tab.tour || undefined}
                className="flex w-14 flex-col items-center gap-0.5 py-1 transition active:scale-90"
              >
                <span className={`text-xl transition ${active ? "scale-110" : "opacity-40 grayscale"}`}>
                  {tab.emoji}
                </span>
                <span className={`text-[10px] font-semibold ${active ? "text-ink" : "text-subtle"}`}>
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
