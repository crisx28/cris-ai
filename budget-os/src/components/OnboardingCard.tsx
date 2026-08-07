"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

const KEY = "cris-budget-os:onboarded";

// Welcome card shown to new users. Dismisses permanently once acknowledged.
export function OnboardingCard() {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="animate-pop-in card overflow-hidden">
      <div className="bg-gradient-to-br from-brand-500 to-brand-600 p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[20px] font-bold">👋 Welcome to Cris Budget OS</p>
            <p className="mt-0.5 text-[14px] text-white/85">
              Your AI Financial Coach for working parents.
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="rounded-full p-1 text-white/80 transition active:scale-90 hover:bg-white/15"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="p-5">
        <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-subtle">
          Start in 3 steps
        </p>
        <ol className="space-y-2.5">
          {[
            "Add your first expense",
            "Add your income",
            "Ask the AI Coach a question",
          ].map((step, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="text-lg">{["1️⃣", "2️⃣", "3️⃣"][i]}</span>
              <span className="text-[15px] text-ink">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-4 rounded-2xl bg-grouped px-4 py-3">
          <span className="text-[13px] text-subtle">Try typing: </span>
          <span className="text-[15px] font-semibold text-ink">
            “Grocery 500” 🛒
          </span>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            className="btn-primary flex-1"
            onClick={() => {
              dismiss();
              router.push("/add");
            }}
          >
            Start Tour
          </button>
          <button
            className="flex-1 rounded-2xl bg-grouped py-3 text-[15px] font-semibold text-ink transition active:scale-[0.97]"
            onClick={dismiss}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
