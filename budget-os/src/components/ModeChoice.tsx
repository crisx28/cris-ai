"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { useWorkspace } from "@/lib/workspace";
import { DEMO_ACCOUNTS } from "@/lib/seed";
import { peso } from "@/lib/currency";

// First-launch screen: Start Fresh (own profile) or Explore a demo persona.
export function ModeChoice() {
  const { startFresh, enterDemo } = useStore();
  const { name: appName } = useWorkspace();
  const [step, setStep] = useState<"root" | "demo">("root");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-[440px] animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[14px] bg-brand-500 text-3xl font-semibold text-white">
            ₱
          </div>
          <h1 className="text-[24px] font-bold tracking-tight text-ink">
            Welcome to {appName}
          </h1>
          <p className="mt-1 text-[15px] text-subtle">
            {step === "root"
              ? "Choose how you want to start."
              : "Pick a sample account to explore."}
          </p>
        </div>

        {step === "root" ? (
          <div className="space-y-3">
            <button
              onClick={startFresh}
              className="card-pressable flex w-full items-center gap-4 p-5 text-left"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
                🆕
              </span>
              <span>
                <span className="block text-[16px] font-bold text-ink">Start Fresh</span>
                <span className="text-[13px] text-subtle">
                  Create your own financial profile
                </span>
              </span>
            </button>

            <button
              onClick={() => setStep("demo")}
              className="card-pressable flex w-full items-center gap-4 p-5 text-left"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
                ✨
              </span>
              <span>
                <span className="block text-[16px] font-bold text-ink">
                  Explore Demo Account
                </span>
                <span className="text-[13px] text-subtle">
                  See how the app works using sample data
                </span>
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.id}
                onClick={() => enterDemo(a.id)}
                className="card-pressable flex w-full items-center justify-between gap-3 p-5 text-left"
              >
                <span>
                  <span className="block text-[16px] font-bold text-ink">{a.name}</span>
                  <span className="text-[13px] text-subtle">{a.tagline}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[13px] font-semibold text-ink">
                    {peso(a.income)}
                  </span>
                  <span className="text-[11px] text-subtle">/ month</span>
                </span>
              </button>
            ))}
            <button
              onClick={() => setStep("root")}
              className="flex items-center gap-1 px-1 pt-1 text-[14px] font-medium text-subtle"
            >
              <ChevronLeft size={16} /> Back
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-[12px] leading-relaxed text-subtle">
          Sample data is fictional and kept completely separate from your own —
          you can switch anytime.
        </p>
      </div>
    </div>
  );
}
