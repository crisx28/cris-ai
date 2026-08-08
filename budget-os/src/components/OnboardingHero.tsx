"use client";

import { useEffect, useState } from "react";
import { Play, X, Check } from "lucide-react";
import { useTour } from "@/components/tour/TourProvider";
import { VideoModal } from "@/components/VideoModal";
import { DEMO_VIDEO, DEMO_FEATURES } from "@/lib/media";

const HERO_KEY = "cris-onboarding:hero";
const WATCHED_KEY = "cris-onboarding:video";

// Prominent onboarding hero: 60-second demo + product tour. Dismissible.
export function OnboardingHero() {
  const { startTour } = useTour();
  const [dismissed, setDismissed] = useState(true);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    try {
      setDismissed(!!localStorage.getItem(HERO_KEY));
    } catch {
      /* ignore */
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(HERO_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <>
      <div className="animate-pop-in overflow-hidden rounded-4xl bg-white shadow-card border border-hairline/60">
        <div className="grid md:grid-cols-2">
          {/* Left: copy */}
          <div className="p-6">
            <div className="flex items-start justify-between">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-brand-600">
                🎥 Watch a 60-second demo
              </p>
              <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="-mt-1 rounded-full p-1 text-subtle transition hover:bg-grouped active:scale-90 md:hidden"
              >
                <X size={18} />
              </button>
            </div>
            <h2 className="mt-1 text-[22px] font-bold tracking-tight text-ink">
              See how Cris Budget OS helps you
            </h2>
            <ul className="mt-3 space-y-1.5">
              {DEMO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[14px] text-ink">
                  <Check size={16} className="text-success" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => setVideoOpen(true)}>
                <Play size={16} /> Watch Demo
              </button>
              <button
                onClick={startTour}
                className="rounded-2xl bg-grouped px-4 py-3 text-[15px] font-semibold text-ink transition active:scale-[0.97]"
              >
                🚀 Take Product Tour
              </button>
            </div>
          </div>

          {/* Right: video thumbnail */}
          <button
            onClick={() => setVideoOpen(true)}
            className="group relative min-h-[180px] bg-gradient-to-br from-brand-500 to-brand-700"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-float transition group-hover:scale-105">
                <Play size={26} className="ml-1 text-brand-600" />
              </span>
            </div>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/30 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur">
              0:60
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismiss();
              }}
              aria-label="Dismiss"
              className="absolute right-3 top-3 hidden rounded-full bg-black/25 p-1 text-white transition hover:bg-black/40 md:block"
            >
              <X size={16} />
            </button>
          </button>
        </div>
      </div>

      <VideoModal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        title="Cris Budget OS — 60-second demo"
        video={DEMO_VIDEO}
        onWatched={() => {
          try {
            localStorage.setItem(WATCHED_KEY, "1");
          } catch {
            /* ignore */
          }
        }}
      />
    </>
  );
}
