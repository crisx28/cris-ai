"use client";

import { useStore } from "@/lib/store";

// First-launch screen: choose Start Fresh (own profile) or Explore Demo.
export function ModeChoice() {
  const { startFresh, enterDemo } = useStore();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-[420px] animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-brand-400 to-brand-600 text-3xl font-extrabold text-white shadow-float">
            ₱
          </div>
          <h1 className="text-[24px] font-bold tracking-tight text-ink">
            Welcome to Cris Budget OS
          </h1>
          <p className="mt-1 text-[15px] text-subtle">
            Choose how you&apos;d like to start.
          </p>
        </div>

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
            onClick={enterDemo}
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

        <p className="mt-6 text-center text-[12px] leading-relaxed text-subtle">
          Demo data is kept completely separate from your own — you can switch
          anytime.
        </p>
      </div>
    </div>
  );
}
