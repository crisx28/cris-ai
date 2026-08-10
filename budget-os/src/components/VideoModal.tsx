"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { VideoSource } from "@/lib/media";

// Responsive video modal supporting YouTube embeds and MP4 files, with a
// graceful placeholder when no video is configured yet.
export function VideoModal({
  open,
  onClose,
  title,
  video,
  onWatched,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  video: VideoSource;
  onWatched?: () => void;
  children?: React.ReactNode; // extra content under the player (e.g. lesson text)
}) {
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    onWatched?.();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={close} />
      <div className="relative z-10 w-full max-w-2xl animate-pop-in overflow-hidden rounded-4xl bg-white shadow-float">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
          <p className="text-[15px] font-bold text-ink">{title}</p>
          <button
            onClick={close}
            aria-label="Close"
            className="rounded-full p-1.5 text-subtle transition hover:bg-grouped active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Player (16:9) */}
        <div className="relative aspect-video w-full bg-ink">
          {video.type === "youtube" && (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${video.id}?rel=0&modestbranding=1`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          {video.type === "mp4" && (
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full"
              src={video.url}
              controls
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (v.duration) setProgress((v.currentTime / v.duration) * 100);
              }}
              onEnded={() => onWatched?.()}
            />
          )}
          {video.type === "none" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-brand-600 p-6 text-center text-white">
              <span className="text-4xl">🎬</span>
              <p className="text-[16px] font-semibold">Demo video coming soon</p>
              <p className="max-w-sm text-[13px] text-white/80">
                Everything below is fully interactive — take the product tour or
                jump into Quick Start to see it live.
              </p>
            </div>
          )}
        </div>

        {/* Progress (MP4) */}
        {video.type === "mp4" && (
          <div className="h-1 w-full bg-grouped">
            <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        {children && <div className="px-5 py-4">{children}</div>}
      </div>
    </div>
  );
}
