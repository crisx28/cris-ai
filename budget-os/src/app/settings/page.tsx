"use client";

import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { PageHeader, SectionCard } from "@/components/ui";
import { DEFAULT_PAYDAYS } from "@/lib/finance";

export default function SettingsPage() {
  const { resetToSample, clearAll } = useStore();
  const { name, email, signOut, supabaseEnabled } = useAuth();

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" emoji="⚙️" subtitle="Manage your account and data." />

      <SectionCard title="Profile" emoji="👤">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white">
            {(name || "C").charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-[15px] font-semibold text-ink">{name || "Cris"}</p>
            <p className="text-[13px] text-subtle">{email || "Demo account (this device)"}</p>
          </div>
        </div>
        <button
          onClick={() => confirm("Sign out?") && signOut()}
          className="mt-4 w-full rounded-2xl bg-grouped py-3 text-[15px] font-semibold text-danger transition active:scale-[0.98]"
        >
          Sign out
        </button>
      </SectionCard>

      <SectionCard title="Sync & security" emoji="🔐">
        <p className="text-[14px] leading-relaxed text-subtle">
          {supabaseEnabled
            ? "☁️ Cloud sync is ON. Your data is saved securely to your account and isolated to you."
            : "💾 You're in demo mode — data is saved on this device. Connect Supabase (see README) to enable secure login and sync across devices."}
        </p>
      </SectionCard>

      <SectionCard title="Payday" emoji="📅">
        <p className="text-[14px] text-subtle">
          Your Daily Safe Spend assumes paydays on the{" "}
          <b className="text-ink">
            {DEFAULT_PAYDAYS.map((d) => `${d}${d === 15 ? "th" : "th"}`).join(" & ")}
          </b>{" "}
          of each month — typical for Filipino payroll.
        </p>
      </SectionCard>

      <SectionCard title="Data" emoji="🗂️">
        <div className="space-y-2">
          <button
            onClick={() => {
              if (confirm("Reload the sample Filipino household data? This replaces current data."))
                resetToSample();
            }}
            className="w-full rounded-2xl bg-grouped py-3 text-[15px] font-semibold text-ink transition active:scale-[0.98]"
          >
            Reload sample data
          </button>
          <button
            onClick={() => {
              if (confirm("Clear ALL data? This cannot be undone.")) clearAll();
            }}
            className="w-full rounded-2xl bg-grouped py-3 text-[15px] font-semibold text-danger transition active:scale-[0.98]"
          >
            Clear all data
          </button>
        </div>
      </SectionCard>

      <SectionCard title="About" emoji="💚">
        <p className="text-[14px] leading-relaxed text-subtle">
          <b className="text-ink">Cris Budget OS</b> — an AI Financial Coach for
          working parents. Built with care to help families feel guided,
          encouraged, and in control of their money.
        </p>
      </SectionCard>
    </div>
  );
}
