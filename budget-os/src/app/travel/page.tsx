"use client";

import { useState } from "react";
import { Trash2, Plus, Plane } from "lucide-react";
import { useStore } from "@/lib/store";
import { peso, pct } from "@/lib/currency";
import { travelProjection } from "@/lib/finance";
import { useMotion } from "@/lib/motion";
import { PageHeader, StatCard, SectionCard, EmptyState, ProgressBar } from "@/components/ui";
import { Confetti } from "@/components/Confetti";

export default function TravelPage() {
  const { data, ready, addTravel, updateTravel, deleteTravel } = useStore();
  const [destination, setDestination] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [celebrate, setCelebrate] = useState(0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = parseFloat(target);
    if (!t || t <= 0 || !destination.trim()) return;
    addTravel({
      destination: destination.trim(),
      target: t,
      current: parseFloat(current) || 0,
      travelDate: travelDate || undefined,
    });
    setDestination("");
    setTarget("");
    setCurrent("");
    setTravelDate("");
  }

  const { createTask } = useMotion();
  const [planned, setPlanned] = useState<Record<string, boolean>>({});

  async function makePlan(fundId: string, destination: string, monthly: number) {
    const name = destination.replace(/[^\w\s,.'-]/g, "").trim();
    await createTask({
      title: `Set aside ${peso(monthly)} for ${name}`,
      kind: "travel",
      amount: monthly,
      recurrence: "monthly",
      source: "goal",
    });
    setPlanned((p) => ({ ...p, [fundId]: true }));
  }

  function contribute(id: string, currentAmt: number, targetAmt: number) {
    const input = prompt("How much to add to this travel fund? (₱)");
    if (!input) return;
    const amt = parseFloat(input.replace(/,/g, ""));
    if (!amt) return;
    const next = currentAmt + amt;
    updateTravel(id, { current: next });
    if (currentAmt < targetAmt && next >= targetAmt) {
      setCelebrate((c) => c + 1); // 🎉 trip fully funded!
    }
  }

  const funds = ready ? data.travel : [];
  const totalSaved = funds.reduce((t, f) => t + f.current, 0);
  const totalTarget = funds.reduce((t, f) => t + f.target, 0);

  return (
    <div className="space-y-6">
      <Confetti trigger={celebrate} />
      <PageHeader
        title="Travel Funds"
        emoji="✈️"
        subtitle="Plan the trips your family deserves — one peso at a time."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Saved for travel" value={peso(totalSaved)} tone="brand" />
        <StatCard label="Total target" value={peso(totalTarget)} />
        <StatCard
          label="Overall progress"
          value={pct(totalTarget ? (totalSaved / totalTarget) * 100 : 0)}
        />
        <StatCard label="Trips planned" value={String(funds.length)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SectionCard title="Plan a Trip">
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="label">Destination</label>
                <input
                  className="input"
                  placeholder="e.g. Japan Vacation ✈️"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Target budget (₱)</label>
                <input
                  className="input"
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Already saved (₱)</label>
                <input
                  className="input"
                  type="number"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Planned travel date</label>
                <input
                  className="input"
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                />
              </div>
              <button className="btn-primary w-full" type="submit">
                <Plus size={16} /> Add Trip
              </button>
            </form>
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          {funds.length === 0 ? (
            <SectionCard title="Your Trips">
              <EmptyState
                text="No trips planned yet"
                emoji="✈️"
                hint="Plan a getaway and I'll show you the monthly savings to make it happen. Dream big!"
              />
            </SectionCard>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {funds.map((f) => {
                const p = travelProjection(f);
                return (
                  <div key={f.id} className="card overflow-hidden">
                    <div className="bg-brand-500 px-5 py-4 text-white">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Plane size={18} />
                          <h3 className="font-semibold">{f.destination}</h3>
                        </div>
                        <button
                          onClick={() => deleteTravel(f.id)}
                          className="text-white/70 hover:text-white"
                          aria-label="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {f.travelDate && (
                        <p className="mt-1 text-xs text-sky-100">
                          {new Date(f.travelDate).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-end justify-between">
                        <div className="text-xl font-bold text-slate-900">
                          {peso(f.current)}
                        </div>
                        <div className="text-xs text-slate-400">
                          of {peso(f.target)}
                        </div>
                      </div>
                      <div className="mt-2">
                        <ProgressBar value={p.progress} color="#5fb3c9" />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg bg-slate-50 p-2">
                          <div className="text-[11px] text-slate-400">
                            Still needed
                          </div>
                          <div className="font-semibold text-slate-800">
                            {peso(p.stillNeeded)}
                          </div>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2">
                          <div className="text-[11px] text-slate-400">
                            Save / month
                          </div>
                          <div className="font-semibold text-slate-800">
                            {p.recommendedMonthly
                              ? peso(p.recommendedMonthly)
                              : "—"}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => contribute(f.id, f.current, f.target)}
                        className="btn-ghost mt-3 w-full justify-center bg-sky-50 text-sky-700"
                      >
                        <Plus size={15} /> Add to fund
                      </button>
                      {p.recommendedMonthly ? (
                        <button
                          onClick={() => makePlan(f.id, f.destination, p.recommendedMonthly!)}
                          className="mt-2 w-full rounded-2xl border border-hairline py-2.5 text-[14px] font-semibold text-ink transition active:scale-[0.98]"
                        >
                          {planned[f.id]
                            ? "✓ Action plan created"
                            : `📤 Send Plan to Motion · ${peso(p.recommendedMonthly)}/mo`}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
