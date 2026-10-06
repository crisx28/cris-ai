"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  Clock,
  Loader2,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui";
import {
  AutomationRun,
  PlanStep,
  RunSource,
  RunStatus,
  decideRun,
  listRuns,
} from "@/lib/automations";

// Notion structure (runs register → selected plan), Apple restraint: hairline
// tables, tabular numerals, the single brand accent only on the approve action.

const STATUS: Record<RunStatus, { label: string; tone: string; Icon: typeof Clock }> = {
  planned: { label: "Awaiting approval", tone: "text-warning", Icon: Clock },
  approved: { label: "Approved", tone: "text-ink", Icon: CheckCircle2 },
  applying: { label: "Applying", tone: "text-ink", Icon: Loader2 },
  applied: { label: "Applied", tone: "text-success", Icon: CheckCircle2 },
  partially_applied: { label: "Partially applied", tone: "text-warning", Icon: AlertTriangle },
  stale: { label: "Stale · plan again", tone: "text-warning", Icon: AlertTriangle },
  failed: { label: "Failed", tone: "text-danger", Icon: XCircle },
  rejected: { label: "Rejected", tone: "text-subtle", Icon: CircleSlash },
  no_changes: { label: "No changes", tone: "text-subtle", Icon: Minus },
};

const ACTION: Record<PlanStep["action"], { label: string; Icon: typeof Plus }> = {
  create: { label: "Add", Icon: Plus },
  update: { label: "Change", Icon: Pencil },
  delete: { label: "Remove", Icon: Minus },
};

export default function AutomationsPage() {
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [source, setSource] = useState<RunSource>("local");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listRuns();
      setRuns(result.runs);
      setSource(result.source);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load automation runs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(() => {
    if (!runs.length) return null;
    return (
      runs.find((r) => r.id === selectedId) ??
      runs.find((r) => r.status === "planned") ??
      runs[0]
    );
  }, [runs, selectedId]);

  async function decide(run: AutomationRun, decision: "approve" | "reject") {
    const question =
      decision === "approve"
        ? "Approve this plan? The listed calendar changes will be made on the next apply run."
        : "Reject this plan? Nothing will change.";
    if (!confirm(question)) return;
    setBusy(true);
    setError(null);
    try {
      await decideRun(run, decision);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record your decision.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automations"
        subtitle="Proposed changes to your bill reminders. Nothing changes until you approve a plan."
        action={
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-white px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-grouped motion-safe:active:scale-95"
          >
            <RefreshCw size={14} aria-hidden />
            Refresh
          </button>
        }
      />

      {error && (
        <div role="alert" className="rounded-xl border border-danger/30 bg-white px-4 py-3 text-[14px] text-danger">
          {error}
        </div>
      )}

      {source === "unavailable" && (
        <Notice>
          Automation runs appear here once Supabase is connected. See <code>automation/README.md</code>.
        </Notice>
      )}

      {!loading && runs.length === 0 && source !== "unavailable" && (
        <div className="rounded-xl border border-hairline bg-white px-6 py-10 text-center">
          <p className="text-[15px] font-semibold text-ink">No plans yet</p>
          <p className="mx-auto mt-1 max-w-md text-[14px] leading-relaxed text-subtle">
            Plans appear here after the planner runs. In development, run{" "}
            <code className="rounded bg-grouped px-1 py-0.5 text-[13px]">python -m agentform plan</code>{" "}
            from the <code className="rounded bg-grouped px-1 py-0.5 text-[13px]">automation</code> folder.
          </p>
        </div>
      )}

      {runs.length > 0 && (
        <section aria-labelledby="runs-heading">
          <h2 id="runs-heading" className="section-title mb-2">
            Runs
          </h2>
          <div className="overflow-x-auto rounded-xl border border-hairline bg-white">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="bg-grouped text-left text-[12px] font-semibold uppercase tracking-[0.04em] text-subtle">
                  <th className="px-4 py-2.5">Planned</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Add</th>
                  <th className="px-4 py-2.5 text-right">Change</th>
                  <th className="px-4 py-2.5 text-right">Remove</th>
                  <th className="px-4 py-2.5 text-right">Notices</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const s = run.plan.summary;
                  const isSelected = run.id === selected?.id;
                  return (
                    <tr
                      key={run.id}
                      onClick={() => setSelectedId(run.id)}
                      aria-selected={isSelected}
                      className={`cursor-pointer border-t border-hairline transition-colors ${
                        isSelected ? "bg-grouped" : "hover:bg-grouped/60"
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-ink">
                        <button
                          className="text-left focus:outline-none focus-visible:underline"
                          onClick={() => setSelectedId(run.id)}
                        >
                          {formatDateTime(run.created_at)}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <StatusLabel status={run.status} />
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{s.create}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{s.update}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{s.delete}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{s.advisories}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selected && (
        <RunDetail run={selected} busy={busy} onDecide={(d) => decide(selected, d)} />
      )}
    </div>
  );
}

function RunDetail({
  run,
  busy,
  onDecide,
}: {
  run: AutomationRun;
  busy: boolean;
  onDecide: (decision: "approve" | "reject") => void;
}) {
  const results = new Map((run.results?.steps ?? []).map((r) => [r.step_id, r]));

  return (
    <section aria-labelledby="plan-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="plan-heading" className="text-[17px] font-semibold text-ink">
            Plan from {formatDateTime(run.created_at)}
          </h2>
          <p className="mt-0.5 text-[13px] text-subtle">
            <StatusLabel status={run.status} /> · plan{" "}
            <span className="font-mono tabular-nums">{run.plan_hash.slice(0, 12)}</span>
          </p>
        </div>
        {run.status === "approved" && (
          <p className="text-[13px] text-subtle">The next apply run will make these changes.</p>
        )}
        {run.status === "planned" && (
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={() => onDecide("reject")}
              className="rounded-lg border border-hairline bg-white px-4 py-2 text-[14px] font-medium text-ink transition-colors hover:bg-grouped disabled:opacity-40 motion-safe:active:scale-95"
            >
              Reject
            </button>
            <button
              disabled={busy}
              onClick={() => onDecide("approve")}
              className="rounded-lg bg-brand-500 px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-40 motion-safe:active:scale-95"
            >
              Approve plan
            </button>
          </div>
        )}
      </div>

      {run.plan.advisories.length > 0 && (
        <div className="rounded-xl border border-hairline bg-white">
          <h3 className="border-b border-hairline px-4 py-2.5 text-[13px] font-semibold text-ink">
            From your bill emails
          </h3>
          <ul className="divide-y divide-hairline">
            {run.plan.advisories.map((a, i) => (
              <li key={i} className="flex gap-3 px-4 py-3 text-[14px]">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" aria-hidden />
                <span className="text-ink">
                  <b className="font-semibold">{a.resource_id}</b>:{" "}
                  {a.kind === "amount_differs" ? "latest statement amount is " : "latest statement due day is "}
                  <span className="tabular-nums">{adviceValue(a.kind, a.observed_value)}</span>, your plan says{" "}
                  <span className="tabular-nums">{adviceValue(a.kind, a.spec_value)}</span>.{" "}
                  <span className="text-subtle">
                    {a.confidence} confidence{a.message_date ? ` · email dated ${a.message_date}` : ""}. If
                    this is the new figure, update the spec — it is never changed automatically.
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {run.plan.steps.length === 0 ? (
        <Notice>Your calendar already matches the plan. Nothing to change.</Notice>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-hairline bg-white">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-grouped text-left text-[12px] font-semibold uppercase tracking-[0.04em] text-subtle">
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Bill</th>
                <th className="px-4 py-2.5">Details</th>
                {run.results && <th className="px-4 py-2.5">Result</th>}
              </tr>
            </thead>
            <tbody>
              {run.plan.steps.map((step) => {
                const { label, Icon } = ACTION[step.action];
                const result = results.get(step.step_id);
                return (
                  <tr key={step.step_id} className="border-t border-hairline align-top">
                    <td className="whitespace-nowrap px-4 py-2.5 text-ink">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon size={14} aria-hidden className="text-subtle" />
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-ink">{step.resource_id}</td>
                    <td className="px-4 py-2.5">
                      <StepDetails step={step} />
                    </td>
                    {run.results && (
                      <td className="px-4 py-2.5 text-[13px]">
                        {result ? (
                          <span className={result.status === "ok" ? "text-success" : "text-warning"}>
                            {result.status === "ok" ? "Done" : result.status}
                            {result.detail ? <span className="block text-subtle">{result.detail}</span> : null}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(run.plan.warnings?.length ?? 0) > 0 && (
        <ul className="space-y-1 text-[13px] text-subtle">
          {run.plan.warnings!.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
      {run.error && <p className="text-[13px] text-danger">{run.error}</p>}
    </section>
  );
}

function StepDetails({ step }: { step: PlanStep }) {
  if (step.action === "create") {
    const summary = step.changes.find((c) => c.field === "summary")?.to;
    const recurrence = step.changes.find((c) => c.field === "recurrence")?.to;
    const reminders = step.changes.find((c) => c.field === "reminders")?.to;
    return (
      <div className="space-y-0.5 text-ink">
        <div className="tabular-nums">{String(summary ?? "")}</div>
        <div className="text-[13px] text-subtle">
          {describe("recurrence", recurrence)} · {describe("reminders", reminders)} · first on{" "}
          <span className="tabular-nums">{step.start_date}</span>
        </div>
      </div>
    );
  }
  if (step.action === "delete") {
    return (
      <span className="text-subtle">
        {step.reason === "duplicate" ? "Duplicate reminder" : "No longer in the plan"}
      </span>
    );
  }
  return (
    <ul className="space-y-1">
      {step.changes
        .filter((c) => c.field !== "description")
        .map((c) => (
          <li key={c.field} className="text-[13px]">
            <span className="text-subtle">{FIELD_LABEL[c.field] ?? c.field}: </span>
            <span className="tabular-nums text-subtle line-through">{describe(c.field, c.from)}</span>{" "}
            <span className="tabular-nums text-ink">{describe(c.field, c.to)}</span>
          </li>
        ))}
      {step.changes.every((c) => c.field === "description") && (
        <li className="text-[13px] text-subtle">Restore the managed description</li>
      )}
    </ul>
  );
}

const FIELD_LABEL: Record<string, string> = {
  summary: "Title",
  recurrence: "Repeats",
  reminders: "Reminder",
};

function describe(field: string, value: unknown): string {
  if (value == null) return "—";
  if (field === "recurrence" && Array.isArray(value)) {
    const day = /BYMONTHDAY=(-?\d+)/.exec(String(value[0] ?? ""))?.[1];
    if (!day) return String(value[0] ?? "—");
    return day === "-1" ? "Monthly on the last day" : `Monthly on day ${day}`;
  }
  if (field === "reminders" && typeof value === "object") {
    const minutes = (value as { overrides?: { minutes: number }[] }).overrides?.[0]?.minutes;
    if (minutes == null) return "Default reminder";
    if (minutes === 0) return "Reminder on the day";
    const days = Math.round((minutes + 9 * 60) / (24 * 60));
    return `Reminder ${days} day${days === 1 ? "" : "s"} before`;
  }
  return String(value);
}

function StatusLabel({ status }: { status: RunStatus }) {
  const { label, tone, Icon } = STATUS[status] ?? STATUS.failed;
  return (
    <span className={`inline-flex items-center gap-1.5 ${tone}`}>
      <Icon size={14} aria-hidden className={status === "applying" ? "motion-safe:animate-spin" : ""} />
      {label}
    </span>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-hairline bg-white px-4 py-3 text-[14px] text-subtle">
      {children}
    </div>
  );
}

function adviceValue(kind: string, value: string): string {
  if (kind !== "amount_differs") return value;
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}
