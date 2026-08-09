"use client";

import { useEffect, useState } from "react";
import { useStore } from "./store";
import { FinancialTask } from "./types";

// Creates tasks in-app and (when configured) mirrors them to Motion.
export function useMotion() {
  const { addTask } = useStore();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetch("/api/motion")
      .then((r) => r.json())
      .then((j) => setConnected(!!j.connected))
      .catch(() => {});
  }, []);

  async function createTask(
    spec: Omit<FinancialTask, "id" | "createdAt" | "status">
  ): Promise<{ syncedToMotion: boolean }> {
    let motionId: string | undefined;
    try {
      const r = await fetch("/api/motion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: spec }),
      });
      if (r.ok) motionId = (await r.json()).motionId || undefined;
    } catch {
      /* offline — keep the task in-app */
    }
    addTask({ ...spec, motionId });
    return { syncedToMotion: !!motionId };
  }

  return { connected, createTask };
}
