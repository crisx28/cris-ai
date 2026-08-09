"use client";

import { useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { useMotion } from "@/lib/motion";
import { generateActions } from "@/lib/actions";

// ⚡ Recommended Actions — the bridge from insight to execution.
export function ActionCenter() {
  const { data } = useStore();
  const { connected, createTask } = useMotion();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const actions = useMemo(() => generateActions(data), [data]);
  if (actions.length === 0) return null;

  async function add(id: string, spec: any) {
    setBusy(id);
    await createTask(spec);
    setBusy(null);
    setDone((d) => ({ ...d, [id]: true }));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="section-title">⚡ Recommended Actions</p>
        {connected && (
          <span className="text-[11px] font-medium text-brand-600">Motion connected</span>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map((a) => (
          <div key={a.id} className="card flex flex-col justify-between p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{a.emoji}</span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-ink">{a.title}</p>
                <p className="text-[13px] text-subtle">{a.subtitle}</p>
              </div>
            </div>
            {done[a.id] ? (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-brand-50 py-2.5 text-[14px] font-semibold text-brand-600">
                <Check size={16} /> Added{connected ? " · synced to Motion" : " to your plan"}
              </div>
            ) : (
              <button
                onClick={() => add(a.id, a.task)}
                disabled={busy === a.id}
                className="btn-primary mt-3 w-full"
              >
                <Plus size={16} /> {busy === a.id ? "Adding…" : connected ? "Create Motion Task" : "Create Task"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
