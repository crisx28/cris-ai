// Automation runs from the agentform runner (see automation/README.md).
//
// - With Supabase configured: reads `automation_runs` under RLS and approves
//   through the `approve_automation_run` RPC, which checks the plan hash.
// - Without Supabase (local dev): talks to /api/automations, which reads the
//   runner's local JSON files. That route is disabled in production builds.

import { getSupabase } from "./supabase";

export type RunStatus =
  | "planned"
  | "no_changes"
  | "approved"
  | "rejected"
  | "applying"
  | "applied"
  | "partially_applied"
  | "stale"
  | "failed";

export interface FieldChange {
  field: string;
  from: unknown;
  to: unknown;
}

export interface PlanStep {
  step_id: string;
  action: "create" | "update" | "delete";
  resource_id: string;
  start_date?: string;
  reason?: string;
  changes: FieldChange[];
}

export interface Advisory {
  resource_id: string;
  kind: "amount_differs" | "due_day_differs";
  spec_value: string;
  observed_value: string;
  message_date: string | null;
  confidence: "medium" | "high";
}

export interface StepResult {
  step_id: string;
  status: "ok" | "stale" | "failed";
  detail?: string;
}

export interface AutomationRun {
  id: string;
  created_at: string;
  status: RunStatus;
  plan_hash: string;
  approved_at: string | null;
  applied_at: string | null;
  error: string | null;
  results: { status: string; steps: StepResult[] } | null;
  plan: {
    steps: PlanStep[];
    advisories: Advisory[];
    warnings?: string[];
    summary: { create: number; update: number; delete: number; advisories: number };
  };
}

export type RunSource = "supabase" | "local" | "unavailable";

export async function listRuns(): Promise<{ runs: AutomationRun[]; source: RunSource }> {
  const supa = getSupabase();
  if (supa) {
    const { data, error } = await supa
      .from("automation_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { runs: (data ?? []) as AutomationRun[], source: "supabase" };
  }
  const res = await fetch("/api/automations", { cache: "no-store" });
  if (res.status === 404) return { runs: [], source: "unavailable" };
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return { runs: json.runs as AutomationRun[], source: "local" };
}

export async function decideRun(run: AutomationRun, decision: "approve" | "reject"): Promise<void> {
  const supa = getSupabase();
  if (supa) {
    const { error } =
      decision === "approve"
        ? await supa.rpc("approve_automation_run", { p_id: run.id, p_plan_hash: run.plan_hash })
        : await supa.rpc("reject_automation_run", { p_id: run.id });
    if (error) throw new Error(error.message);
    return;
  }
  const res = await fetch("/api/automations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: run.id, planHash: run.plan_hash, decision }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Request failed");
}
