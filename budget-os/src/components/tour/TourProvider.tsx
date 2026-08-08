"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

interface Step {
  // Try each selector; the first VISIBLE match is highlighted (handles
  // elements that differ between desktop and mobile breakpoints).
  selectors?: string[];
  title: string;
  text: string;
  final?: boolean;
}

const STEPS: Step[] = [
  {
    selectors: ["[data-tour='available-cash']"],
    title: "Available Cash",
    text: "This shows how much money you have available after expenses.",
  },
  {
    selectors: ["[data-tour='goals']"],
    title: "Goals",
    text: "Track your Emergency Fund, Travel Goals, and Savings Targets.",
  },
  {
    selectors: ["[data-tour='debt']"],
    title: "Debt",
    text: "Monitor debt and get AI payoff recommendations.",
  },
  {
    selectors: ["[data-tour='ai-coach']"],
    title: "AI Coach",
    text: "Ask questions like: Can I afford a trip? How much can I spend today? Which debt should I pay first?",
  },
  {
    selectors: ["[data-tour='nav-expenses']"],
    title: "Expenses",
    text: "Add expenses manually, with voice, or by scanning receipts.",
  },
  {
    selectors: ["[data-tour='nav-reports']"],
    title: "Reports",
    text: "Compare spending across months and download reports.",
  },
  {
    title: "🎉 You're ready!",
    text: "Start tracking your finances — your AI Coach is right beside you.",
    final: true,
  },
];

const TOUR_KEY = "cris-onboarding:tour";

interface TourCtx {
  running: boolean;
  startTour: () => void;
  hasSeenTour: boolean;
}
const Ctx = createContext<TourCtx | null>(null);

function firstVisible(selectors?: string[]): HTMLElement | null {
  if (!selectors) return null;
  for (const sel of selectors) {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(sel));
    const vis = nodes.find((n) => {
      const r = n.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && n.offsetParent !== null;
    });
    if (vis) return vis;
  }
  return null;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [hasSeenTour, setHasSeenTour] = useState(true);

  useEffect(() => {
    try {
      setHasSeenTour(!!localStorage.getItem(TOUR_KEY));
    } catch {
      /* ignore */
    }
  }, []);

  const step = STEPS[idx];

  const measure = useCallback(() => {
    if (!running) return;
    if (step.final || !step.selectors) {
      setRect(null);
      return;
    }
    const el = firstVisible(step.selectors);
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      // Measure after the scroll settles.
      window.setTimeout(() => setRect(el.getBoundingClientRect()), 260);
    } else {
      setRect(null);
    }
  }, [running, step]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (!running) return;
    const onChange = () => {
      const el = step.selectors ? firstVisible(step.selectors) : null;
      setRect(el ? el.getBoundingClientRect() : null);
    };
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [running, step]);

  const finish = useCallback(() => {
    setRunning(false);
    setIdx(0);
    try {
      localStorage.setItem(TOUR_KEY, "1");
    } catch {
      /* ignore */
    }
    setHasSeenTour(true);
  }, []);

  const startTour = useCallback(() => {
    setIdx(0);
    setRunning(true);
  }, []);

  const next = () => (idx < STEPS.length - 1 ? setIdx((i) => i + 1) : finish());
  const back = () => idx > 0 && setIdx((i) => i - 1);

  return (
    <Ctx.Provider value={{ running, startTour, hasSeenTour }}>
      {children}
      {running && (
        <TourOverlay
          step={step}
          idx={idx}
          total={STEPS.length}
          rect={rect}
          onNext={next}
          onBack={back}
          onSkip={finish}
          onGoExpenses={() => {
            finish();
            router.push("/expenses");
          }}
          onAskAI={() => {
            finish();
            router.push("/assistant");
          }}
        />
      )}
    </Ctx.Provider>
  );
}

export function useTour(): TourCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTour must be used within TourProvider");
  return c;
}

function TourOverlay({
  step,
  idx,
  total,
  rect,
  onNext,
  onBack,
  onSkip,
  onGoExpenses,
  onAskAI,
}: {
  step: Step;
  idx: number;
  total: number;
  rect: DOMRect | null;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onGoExpenses: () => void;
  onAskAI: () => void;
}) {
  const pad = 8;
  const vw = typeof window !== "undefined" ? window.innerWidth : 0;
  const vh = typeof window !== "undefined" ? window.innerHeight : 0;
  const tipW = Math.min(320, vw - 32);

  // Tooltip placement: below the target if there's room, else above; centered
  // when there's no target (final step or missing element).
  let tipTop = vh / 2 - 80;
  let tipLeft = vw / 2 - tipW / 2;
  if (rect) {
    const below = rect.bottom + 12;
    const roomBelow = vh - rect.bottom > 200;
    tipTop = roomBelow ? below : Math.max(12, rect.top - 12 - 190);
    tipLeft = Math.min(
      Math.max(12, rect.left + rect.width / 2 - tipW / 2),
      vw - tipW - 12
    );
  }

  return (
    <div className="fixed inset-0 z-[80]">
      {/* Spotlight */}
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-3xl transition-all duration-300"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(17,24,39,0.55)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-ink/55" />
      )}

      {/* Tooltip */}
      <div
        className="absolute animate-pop-in rounded-4xl bg-white p-5 shadow-float"
        style={{ top: tipTop, left: tipLeft, width: tipW }}
      >
        {!step.final && (
          <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-600">
            Step {idx + 1} of {total - 1}
          </p>
        )}
        <p className="mt-1 text-[17px] font-bold text-ink">{step.title}</p>
        <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed text-subtle">
          {step.text}
        </p>

        {/* Dots */}
        <div className="mt-4 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-5 bg-brand-500" : "w-1.5 bg-hairline"
              }`}
            />
          ))}
        </div>

        {step.final ? (
          <div className="mt-4 flex flex-col gap-2">
            <button className="btn-primary w-full" onClick={onGoExpenses}>
              Go to Expenses
            </button>
            <button
              className="w-full rounded-2xl bg-grouped py-3 text-[15px] font-semibold text-ink transition active:scale-[0.98]"
              onClick={onAskAI}
            >
              Ask AI Coach 🤖
            </button>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between">
            <button onClick={onSkip} className="text-[13px] font-medium text-subtle">
              Skip
            </button>
            <div className="flex gap-2">
              {idx > 0 && (
                <button
                  onClick={onBack}
                  className="rounded-2xl bg-grouped px-4 py-2 text-[14px] font-semibold text-ink transition active:scale-95"
                >
                  Back
                </button>
              )}
              <button
                onClick={onNext}
                className="rounded-2xl bg-brand-500 px-5 py-2 text-[14px] font-semibold text-white transition hover:bg-brand-600 active:scale-95"
              >
                {idx === total - 2 ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
