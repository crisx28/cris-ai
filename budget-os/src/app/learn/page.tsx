"use client";

import { useState } from "react";
import { Play, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { VideoModal } from "@/components/VideoModal";
import { LEARN, Lesson } from "@/lib/media";

export default function LearnPage() {
  const [active, setActive] = useState<Lesson | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learn"
        emoji="❓"
        subtitle="Short lessons to get the most out of Cris Budget OS."
      />

      {LEARN.map((group) => (
        <div key={group.group} className="space-y-2">
          <p className="section-title">
            {group.emoji} {group.group}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((lesson) => (
              <button
                key={lesson.title}
                onClick={() => setActive(lesson)}
                className="card-pressable flex items-center gap-3 p-4 text-left"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Play size={18} className="ml-0.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-ink">
                    {lesson.title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-[12px] text-subtle">
                    <Clock size={12} /> {lesson.minutes} min
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <VideoModal
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.title ?? ""}
        video={active?.video ?? { type: "none" }}
      >
        {active && (
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[12px] text-subtle">
              <Clock size={12} /> {active.minutes} min read
            </div>
            <p className="text-[14px] leading-relaxed text-ink">{active.text}</p>
          </div>
        )}
      </VideoModal>
    </div>
  );
}
