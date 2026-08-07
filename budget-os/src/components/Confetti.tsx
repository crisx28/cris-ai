"use client";

import { useEffect, useState } from "react";

const COLORS = [
  "#34c759",
  "#0a84ff",
  "#ff9500",
  "#ff2d55",
  "#ffcc00",
  "#5e5ce6",
  "#00c7be",
];

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
}

// Fires a burst of confetti whenever `trigger` increments.
export function Confetti({ trigger }: { trigger: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const batch: Piece[] = Array.from({ length: 90 }).map((_, i) => ({
      id: trigger * 1000 + i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.8 + Math.random() * 1.4,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 8,
    }));
    setPieces(batch);
    const t = setTimeout(() => setPieces([]), 3600);
    return () => clearTimeout(t);
  }, [trigger]);

  if (pieces.length === 0) return null;

  return (
    <>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.3,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </>
  );
}
