"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Repeat,
  CreditCard,
  PiggyBank,
  Plane,
  FileBarChart,
  LineChart,
  Bot,
  Menu,
  X,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/income", label: "Income", icon: Wallet },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/fixed", label: "Fixed Expenses", icon: Repeat },
  { href: "/debts", label: "Debt Tracker", icon: CreditCard },
  { href: "/savings", label: "Savings Goals", icon: PiggyBank },
  { href: "/travel", label: "Travel Funds", icon: Plane },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white p-4">
        <Brand />
        <div className="mt-6 flex-1">
          <NavLinks />
        </div>
        <Footer />
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <Brand small />
        <button
          className="btn-ghost"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <Brand small />
              <button className="btn-ghost" onClick={() => setOpen(false)}>
                <X size={22} />
              </button>
            </div>
            <div className="mt-6">
              <NavLinks onClick={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-64 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function Brand({ small }: { small?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white text-lg shadow-sm">
        ₱
      </div>
      <div className="leading-tight">
        <div className={`font-bold text-slate-900 ${small ? "text-base" : "text-lg"}`}>
          Cris Budget OS
        </div>
        {!small && (
          <div className="text-xs text-slate-400">Family money, in control</div>
        )}
      </div>
    </Link>
  );
}

function Footer() {
  return (
    <div className="mt-4 rounded-xl bg-brand-50 p-3 text-xs text-brand-700">
      <p className="font-semibold">💾 Demo mode</p>
      <p className="mt-1 text-brand-600">
        Data is saved in this browser. Add Supabase to sync across devices &amp;
        log in — see the README.
      </p>
    </div>
  );
}
